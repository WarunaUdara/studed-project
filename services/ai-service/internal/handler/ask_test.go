package handler

import (
	"strings"
	"testing"

	"github.com/studed/ai-service/internal/provider"
)

func TestBuildAskMessagesKeepsTheTutorInsideTheLesson(t *testing.T) {
	msgs := buildAskMessages(askRequest{
		Grade:       "G4",
		WaveContext: "Lesson: Make the Bulb Glow\n\nElectricity travels in a full circle.",
	}, "Why is my bulb dark?")

	if len(msgs) != 2 {
		t.Fatalf("expected system + question, got %d messages", len(msgs))
	}
	if msgs[0].Role != "system" {
		t.Fatalf("first message must be the system prompt, got %q", msgs[0].Role)
	}
	if !strings.Contains(msgs[0].Content, "grade G4") {
		t.Error("the grade must reach the model so the answer is pitched for a child")
	}
	if !strings.Contains(msgs[0].Content, "Make the Bulb Glow") {
		t.Error("the lesson context must reach the model")
	}
	if msgs[1].Role != "user" || msgs[1].Content != "Why is my bulb dark?" {
		t.Errorf("the question must be the last message, got %+v", msgs[1])
	}
}

func TestBuildAskMessagesBoundsHistoryAndDropsNonChatTurns(t *testing.T) {
	var history []provider.Message
	for i := 0; i < 20; i++ {
		history = append(history, provider.Message{Role: "user", Content: "q"})
	}
	history = append(history, provider.Message{Role: "tool", Content: "tool output"})

	msgs := buildAskMessages(askRequest{History: history}, "one more")

	// system + at most maxAskHistoryTurns + the question.
	if len(msgs) > maxAskHistoryTurns+2 {
		t.Fatalf("history is unbounded: %d messages", len(msgs))
	}
	for _, msg := range msgs {
		if msg.Role == "tool" {
			t.Error("tool turns must not be replayed to the student tutor")
		}
	}
}

func TestBuildAskMessagesTruncatesAnOversizedLesson(t *testing.T) {
	msgs := buildAskMessages(askRequest{WaveContext: strings.Repeat("x", maxAskContextChars*2)}, "hi")
	if len(msgs[0].Content) > maxAskContextChars+len(studentTutorSystem)+200 {
		t.Errorf("lesson context was not truncated: %d chars", len(msgs[0].Content))
	}
}

func TestTruncate(t *testing.T) {
	if got := truncate("  hello  ", 100); got != "hello" {
		t.Errorf("expected trimmed text, got %q", got)
	}
	if got := truncate("abcdef", 3); got != "abc..." {
		t.Errorf("expected truncation marker, got %q", got)
	}
}
