package provider

// DefaultOptions returns the baseline generation options used when a caller
// does not specify any: a conservative temperature and a 2048-token cap.
func DefaultOptions() Options {
	return Options{Temperature: 0.4, MaxTokens: 2048}
}

// JSONOptions returns generation options with JSON mode enabled, which makes
// the backend constrain the model output to a single valid JSON object. The
// token budget is generous (8192) because reasoning models count their
// reasoning_content toward max_tokens: with the old 2048 cap a deep-thinking
// model burned the whole budget on reasoning and returned empty content
// (the "opencode returned empty content" failure seen on matterjs requests).
func JSONOptions() Options {
	opts := DefaultOptions()
	opts.JSONMode = true
	opts.MaxTokens = 8192
	return opts
}
