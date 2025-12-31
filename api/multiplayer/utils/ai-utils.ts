import type { Env } from "../types/app";

const usedGuesses = new Set<string>();

export async function onAIGuessDrawing(drawingData: string, env: Env) {
	if (!env.AI) {
		console.warn('AI environment not configured.');
		return { guess: null };
	}
	const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, "");
	const binaryData = new Uint8Array(
		atob(base64Data)
			.split("")
			.map((char) => char.charCodeAt(0)),
	);

	const guessRequest = await env.AI.run(
    '@cf/meta/llama-3.2-11b-vision-instruct',
    {
      prompt: `You are shown a simple drawing. Choose the best ONE-WORD guess.

Hard rules:
- Output exactly one lowercase word (a–z only). No other characters or text.
- Do not output any banned words: ${Array.from(usedGuesses).join(', ')}

Quality rules:
- Prefer specific nouns over broad categories.
- If uncertain, still choose the closest likely noun.

Return only the one word.`,
      image: [...binaryData],
      temperature: 0,
      top_k: 1,
      top_p: 1,
      max_tokens: 8,
    },
    {}
  );

  if (!guessRequest.response) {
    return { guess: null };
  }

  const formattedGuess = guessRequest.response.trim().toLowerCase();

  if (usedGuesses.has(formattedGuess)) {
    return { guess: null };
  }

  usedGuesses.add(formattedGuess);
  const guess = formattedGuess;

	return { guess };
}
