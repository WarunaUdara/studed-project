package provider

// DefaultOptions returns the baseline generation options used when a caller
// does not specify any: a conservative temperature and a 2048-token cap.
func DefaultOptions() Options {
	return Options{Temperature: 0.4, MaxTokens: 2048}
}

// JSONOptions returns generation options with JSON mode enabled, which makes
// the backend constrain the model output to a single valid JSON object.
func JSONOptions() Options {
	opts := DefaultOptions()
	opts.JSONMode = true
	return opts
}
