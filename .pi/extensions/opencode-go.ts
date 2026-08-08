import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Registers the StudEd AI provider: OpenCode Go (OpenAI-compatible endpoint).
// The API key is resolved from the OPENCODE_API_KEY environment variable at
// runtime; it is never stored in this file or in the repository.
export default function (pi: ExtensionAPI) {
  pi.registerProvider("opencode-go", {
    name: "OpenCode Go (StudEd)",
    baseUrl: "https://opencode.ai/zen/go/v1",
    apiKey: "$OPENCODE_API_KEY",
    api: "openai-completions",
    models: [
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        reasoning: true,
        input: ["text"],
        output: ["text"],
        toolCall: true,
        cost: { input: 0.5, output: 1.5, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 1000000,
        maxTokens: 384000,
      },
    ],
  });
}
