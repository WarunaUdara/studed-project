package agent

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"

	"github.com/studed/ai-service/internal/blocks"
	"github.com/studed/ai-service/internal/provider"
	"github.com/studed/ai-service/internal/tools"
)

// scriptedProvider returns a canned stream per Stream call (or, when
// alwaysToolCall is set, the same tool call on every call) and canned JSON
// for GenerateJSON. It is safe for concurrent use.
type scriptedProvider struct {
	mu             sync.Mutex
	streamCalls    int
	streams        [][]provider.StreamEvent
	alwaysToolCall *provider.ToolCall
	jsonOut        []byte
	lastMsgs       []provider.Message
}

func (s *scriptedProvider) GenerateJSON(ctx context.Context, system, user string, opts provider.Options) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.jsonOut != nil {
		return s.jsonOut, nil
	}
	return []byte(`[{"id":"l1","type":"text","content":"Hello"}]`), nil
}

func (s *scriptedProvider) Stream(ctx context.Context, msgs []provider.Message, tools []provider.Tool, opts provider.Options) (<-chan provider.StreamEvent, error) {
	s.mu.Lock()
	i := s.streamCalls
	s.streamCalls++
	s.lastMsgs = msgs
	var evs []provider.StreamEvent
	if s.alwaysToolCall != nil {
		evs = []provider.StreamEvent{{Type: "tool_call", ToolCall: s.alwaysToolCall}}
	} else if i < len(s.streams) {
		evs = s.streams[i]
	}
	s.mu.Unlock()

	ch := make(chan provider.StreamEvent)
	go func() {
		defer close(ch)
		for _, ev := range evs {
			select {
			case ch <- ev:
			case <-ctx.Done():
				return
			}
		}
	}()
	return ch, nil
}

// fakeLearnTool records invocations and returns a fixed learn block.
type fakeLearnTool struct {
	mu       sync.Mutex
	invoked  int
	lastArgs map[string]any
}

func (f *fakeLearnTool) tool() tools.Tool {
	return tools.Tool{
		Name:        "generateLearnBlocks",
		Description: "test learn block generator",
		Parameters:  map[string]any{"type": "object"},
		Execute: func(ctx context.Context, args map[string]any) (tools.Result, error) {
			f.mu.Lock()
			defer f.mu.Unlock()
			f.invoked++
			f.lastArgs = args
			return tools.Result{
				Name:   "generateLearnBlocks",
				Blocks: []blocks.LearnBlock{{ID: "l1", Type: "text", Content: "Hello"}},
			}, nil
		},
	}
}

func (f *fakeLearnTool) counts() (int, map[string]any) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.invoked, f.lastArgs
}

// runAgent drains the events channel into a slice.
func runAgent(t *testing.T, a *Agent, req Request) []Event {
	t.Helper()
	events := make(chan Event)
	go a.Run(context.Background(), req, events)
	var got []Event
	for ev := range events {
		got = append(got, ev)
	}
	return got
}

func eventTypes(evs []Event) []string {
	out := make([]string, 0, len(evs))
	for _, ev := range evs {
		out = append(out, ev.Type)
	}
	return out
}

func TestRunToolCallThenFinalPayload(t *testing.T) {
	fake := &fakeLearnTool{}
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "text_delta", Delta: "Let me draft this for you. "},
				{Type: "tool_call", ToolCall: &provider.ToolCall{ID: "call_1", Name: "generateLearnBlocks", Arguments: `{"prompt":"pythagoras","language":"en","grade":"8"}`}},
				{Type: "done", Content: "Let me draft this for you. "},
			},
			{
				{Type: "text_delta", Delta: `[{"id":"l1","type":"text","content":"Intro"},{"id":"l2","type":"callout","content":"Note"}]`},
				{Type: "done", Content: `[{"id":"l1","type":"text","content":"Intro"},{"id":"l2","type":"callout","content":"Note"}]`},
			},
		},
	}
	a := New(s, []tools.Tool{fake.tool()}, 6)

	got := runAgent(t, a, Request{Prompt: "Teach pythagoras", Language: "en", Grade: "8"})

	wantTypes := []string{"plan", "delta", "tool_start", "tool_end", "delta", "done"}
	if types := eventTypes(got); !equalStrings(types, wantTypes) {
		t.Fatalf("event types = %v, want %v", types, wantTypes)
	}
	if got[0].Type != "plan" || got[0].Message != "Planning generation for: Teach pythagoras" {
		t.Errorf("plan event = %+v", got[0])
	}
	if got[2].Tool != "generateLearnBlocks" || got[3].Tool != "generateLearnBlocks" {
		t.Errorf("tool events = %+v, %+v", got[2], got[3])
	}
	if got[3].Message != "generated 1 learn blocks" {
		t.Errorf("tool_end message = %q", got[3].Message)
	}
	done := got[5]
	if done.Message != `[{"id":"l1","type":"text","content":"Intro"},{"id":"l2","type":"callout","content":"Note"}]` {
		t.Errorf("done message = %q", done.Message)
	}
	if len(done.LearnBlocks) != 2 {
		t.Fatalf("done learn blocks = %d, want 2", len(done.LearnBlocks))
	}
	if done.LearnBlocks[0].Content != "Intro" || done.LearnBlocks[1].Type != "callout" {
		t.Errorf("done learn blocks = %+v", done.LearnBlocks)
	}
	if len(done.EvaluateBlocks) != 0 {
		t.Errorf("done eval blocks = %+v, want none", done.EvaluateBlocks)
	}

	invoked, args := fake.counts()
	if invoked != 1 {
		t.Errorf("tool invoked %d times, want 1", invoked)
	}
	if args["prompt"] != "pythagoras" || args["language"] != "en" || args["grade"] != "8" {
		t.Errorf("tool args = %+v", args)
	}
}

func TestRunToolCallArgumentsSplitAcrossChunks(t *testing.T) {
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "tool_call", ToolCall: &provider.ToolCall{ID: "call_1", Name: "generateLearnBlocks", Arguments: `{"prompt":"py`}},
				{Type: "tool_call", ToolCall: &provider.ToolCall{ID: "call_1", Name: "generateLearnBlocks", Arguments: `thagoras"}`}},
				{Type: "done", Content: ""},
			},
			{
				{Type: "text_delta", Delta: `[{"id":"l1","type":"text","content":"Intro"}]`},
				{Type: "done", Content: `[{"id":"l1","type":"text","content":"Intro"}]`},
			},
		},
	}
	fake := &fakeLearnTool{}
	a := New(s, []tools.Tool{fake.tool()}, 6)

	got := runAgent(t, a, Request{Prompt: "p"})
	if len(got) == 0 || got[len(got)-1].Type != "done" {
		t.Fatalf("last event = %+v, want done", got[len(got)-1])
	}
	_, args := fake.counts()
	if args["prompt"] != "pythagoras" {
		t.Errorf("tool args = %+v, want accumulated arguments", args)
	}
}

func TestRunFinalAnswerDirectly(t *testing.T) {
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "text_delta", Delta: "Here is the lesson plan in plain text."},
				{Type: "done", Content: "Here is the lesson plan in plain text."},
			},
		},
	}
	a := New(s, nil, 6)

	got := runAgent(t, a, Request{Prompt: "Draft a plan"})

	wantTypes := []string{"plan", "delta", "done"}
	if types := eventTypes(got); !equalStrings(types, wantTypes) {
		t.Fatalf("event types = %v, want %v", types, wantTypes)
	}
	done := got[len(got)-1]
	if done.Message != "Here is the lesson plan in plain text." {
		t.Errorf("done message = %q", done.Message)
	}
	if len(done.LearnBlocks) != 0 || len(done.EvaluateBlocks) != 0 {
		t.Errorf("done blocks = %+v, want none for plain text", done)
	}
	if done.Error != "" {
		t.Errorf("done error = %q", done.Error)
	}
}

func TestRunFinalObjectPayload(t *testing.T) {
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "text_delta", Delta: `{"learnBlocks":[{"id":"l1","type":"text","content":"Intro"}],"evaluateBlocks":[{"id":"e1","type":"mcq","question":"Q","options":["A","B"],"correctAnswer":"A"}]}`},
				{Type: "done", Content: ""},
			},
		},
	}
	a := New(s, nil, 6)

	got := runAgent(t, a, Request{Prompt: "p"})
	done := got[len(got)-1]
	if done.Type != "done" {
		t.Fatalf("last event = %+v", done)
	}
	if len(done.LearnBlocks) != 1 || done.LearnBlocks[0].Content != "Intro" {
		t.Errorf("learn blocks = %+v", done.LearnBlocks)
	}
	if len(done.EvaluateBlocks) != 1 || done.EvaluateBlocks[0].Type != "mcq" {
		t.Errorf("eval blocks = %+v", done.EvaluateBlocks)
	}
}

func TestRunStreamErrorEvent(t *testing.T) {
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "text_delta", Delta: "partial"},
				{Type: "error", Error: errors.New("upstream exploded")},
			},
		},
	}
	a := New(s, nil, 6)

	got := runAgent(t, a, Request{Prompt: "p"})

	wantTypes := []string{"plan", "delta", "error"}
	if types := eventTypes(got); !equalStrings(types, wantTypes) {
		t.Fatalf("event types = %v, want %v", types, wantTypes)
	}
	if got[2].Error != "upstream exploded" {
		t.Errorf("error event = %+v", got[2])
	}
}

func TestRunStreamStartError(t *testing.T) {
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{},
		},
	}
	// wrap the scripted provider so the first Stream call fails outright
	failing := &failingStreamProvider{inner: s, err: errors.New("stream setup failed")}
	a := New(failing, nil, 6)

	got := runAgent(t, a, Request{Prompt: "p"})

	wantTypes := []string{"plan", "error"}
	if types := eventTypes(got); !equalStrings(types, wantTypes) {
		t.Fatalf("event types = %v, want %v", types, wantTypes)
	}
	if got[1].Error != "stream setup failed" {
		t.Errorf("error event = %+v", got[1])
	}
}

func TestRunMaxIterationsGuard(t *testing.T) {
	s := &scriptedProvider{
		alwaysToolCall: &provider.ToolCall{ID: "call_1", Name: "generateLearnBlocks", Arguments: `{"prompt":"p"}`},
	}
	fake := &fakeLearnTool{}
	a := New(s, []tools.Tool{fake.tool()}, 3)

	got := runAgent(t, a, Request{Prompt: "p"})

	last := got[len(got)-1]
	if last.Type != "error" || last.Error != "agent exceeded max iterations" {
		t.Fatalf("last event = %+v, want max iterations error", last)
	}
	toolStarts := 0
	for _, ev := range got {
		if ev.Type == "tool_start" {
			toolStarts++
		}
	}
	if toolStarts != 3 {
		t.Errorf("tool_start count = %d, want 3", toolStarts)
	}
	invoked, _ := fake.counts()
	if invoked != 3 {
		t.Errorf("tool invoked %d times, want 3", invoked)
	}
}

func TestRunContextCancellation(t *testing.T) {
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "tool_call", ToolCall: &provider.ToolCall{ID: "call_1", Name: "generateLearnBlocks", Arguments: `{}`}},
			},
		},
	}
	fake := &fakeLearnTool{}
	a := New(s, []tools.Tool{fake.tool()}, 6)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	events := make(chan Event)
	go a.Run(ctx, Request{Prompt: "p"}, events)

	var got []Event
	for ev := range events {
		got = append(got, ev)
		if ev.Type == "tool_start" {
			cancel()
		}
	}
	// cancellation must stop the loop without a done event
	if len(got) == 0 || got[len(got)-1].Type == "done" {
		t.Fatalf("events = %+v, want run to stop on cancellation", got)
	}
}

func TestRunConcurrentSafe(t *testing.T) {
	var wg sync.WaitGroup
	errs := make(chan error, 2)
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s := &scriptedProvider{
				streams: [][]provider.StreamEvent{
					{{Type: "text_delta", Delta: "direct answer"}, {Type: "done", Content: "direct answer"}},
				},
			}
			a := New(s, nil, 6)
			events := make(chan Event)
			go a.Run(context.Background(), Request{Prompt: "p"}, events)
			var done Event
			for ev := range events {
				if ev.Type == "done" {
					done = ev
				}
			}
			if done.Message != "direct answer" {
				errs <- errors.New("missing done event")
			}
		}()
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Error(err)
	}
}

func TestRunUnknownTool(t *testing.T) {
	s := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "tool_call", ToolCall: &provider.ToolCall{ID: "call_1", Name: "nope", Arguments: `{}`}},
			},
			{
				{Type: "text_delta", Delta: `[{"id":"l1","type":"text","content":"Recovered"}]`},
				{Type: "done", Content: ""},
			},
		},
	}
	a := New(s, nil, 6)

	got := runAgent(t, a, Request{Prompt: "p"})
	done := got[len(got)-1]
	if done.Type != "done" {
		t.Fatalf("last event = %+v", done)
	}
	if len(done.LearnBlocks) != 1 {
		t.Errorf("learn blocks = %+v, want recovery after unknown tool", done.LearnBlocks)
	}
}

func equalStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// failingStreamProvider delegates to inner but fails the first Stream call.
type failingStreamProvider struct {
	inner *scriptedProvider
	err   error
}

func (f *failingStreamProvider) GenerateJSON(ctx context.Context, system, user string, opts provider.Options) ([]byte, error) {
	return f.inner.GenerateJSON(ctx, system, user, opts)
}

func (f *failingStreamProvider) Stream(ctx context.Context, msgs []provider.Message, tools []provider.Tool, opts provider.Options) (<-chan provider.StreamEvent, error) {
	return nil, f.err
}

func TestBuildMessages_IncludesHistory(t *testing.T) {
	msgs := buildMessages(Request{
		Prompt: "make it easier",
		History: []ChatTurn{
			{Role: "user", Content: "add a text block about gravity"},
			{Role: "assistant", Content: "Added 1 Learn block."},
		},
	})
	// system + 2 history turns + current user
	if len(msgs) != 4 {
		t.Fatalf("messages = %d, want 4 (system + 2 history + user)", len(msgs))
	}
	if msgs[1].Role != "user" || msgs[1].Content != "add a text block about gravity" {
		t.Errorf("history[0] = %+v", msgs[1])
	}
	if msgs[2].Role != "assistant" || msgs[2].Content != "Added 1 Learn block." {
		t.Errorf("history[1] = %+v", msgs[2])
	}
	if msgs[3].Role != "user" || !strings.Contains(msgs[3].Content, "make it easier") {
		t.Errorf("current user message = %+v", msgs[3])
	}
}

func TestBuildMessages_CapsHistory(t *testing.T) {
	hist := make([]ChatTurn, 0, 20)
	for i := 0; i < 20; i++ {
		hist = append(hist, ChatTurn{Role: "user", Content: "turn"})
	}
	msgs := buildMessages(Request{Prompt: "next", History: hist})
	// system + capped 8 history turns + current user
	if len(msgs) != 10 {
		t.Fatalf("messages = %d, want 10 (capped history)", len(msgs))
	}
}

func TestRunStreamsThinkingEvent(t *testing.T) {
	// Reasoning content on the done event must be forwarded as a thinking
	// event so the chat can show collapsible thoughts.
	sp := &scriptedProvider{
		streams: [][]provider.StreamEvent{
			{
				{Type: "text_delta", Delta: "Here is the block."},
				{Type: "done", Content: "Here is the block.", Reasoning: "First think about gravity, then about motion."},
			},
		},
	}
	a := New(sp, tools.DefaultSet(sp), 2)
	events := make(chan Event)
	go a.Run(context.Background(), Request{Prompt: "explain gravity"}, events)

	var gotThinking string
	for ev := range events {
		if ev.Type == "thinking" {
			gotThinking = ev.Message
		}
	}
	if !strings.Contains(gotThinking, "gravity") {
		t.Errorf("thinking event = %q, want reasoning content", gotThinking)
	}
}
