import type { Env } from "../types/app";

export interface AIGuessContext {
	usedGuesses: Set<string>;
	recentGuesses: string[];
	timeElapsed: number;
	roundDuration: number;
}

export async function onAIGuessDrawing(
	drawingData: string,
	env: Env,
	context: AIGuessContext,
) {
	if (!env.AI) {
		console.warn("AI environment not configured.");
		return { guess: null };
	}
	const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, "");
	const binaryData = new Uint8Array(
		atob(base64Data)
			.split("")
			.map((char) => char.charCodeAt(0)),
	);

	const progressHint =
		context.timeElapsed < 30
			? "The drawing is likely incomplete or just starting."
			: context.timeElapsed < 60
				? "The drawing is partially complete."
				: "The drawing should be mostly finished.";

	const guessContext =
		context.recentGuesses.length > 0
			? `Other players recently guessed: ${context.recentGuesses.slice(-8).join(", ")}`
			: "No other guesses yet.";

	const guessRequest = await env.AI.run(
		"@cf/meta/llama-3.2-11b-vision-instruct",
		{
			prompt: `You are an AI player in a Pictionary-style drawing game. Analyze this hand-drawn sketch and guess what is being drawn.

GAME CONTEXT:
- This is a SKETCH (simple hand-drawn lines), not a photograph
- ${progressHint}
- ${guessContext}

Hard rules:
- Output exactly one lowercase word (a–z only). No other characters or text.
- Do not output any of these words you already tried: ${Array.from(context.usedGuesses).join(", ") || "none"}

Quality rules:
- Look for key shapes, lines, and distinctive features in the sketch
- Consider what other players guessed as hints to refine your guess
- Prefer specific, concrete nouns (objects, animals, places, food, etc.)
- Think about what someone might be trying to draw in a drawing game
- If uncertain, make your best guess based on the visible shapes

Return only one word that best describes what is being drawn.`,
			image: [...binaryData],
			temperature: 0,
			top_k: 1,
			top_p: 1,
			max_tokens: 8,
		},
		{},
	);

	if (!guessRequest.response) {
		return { guess: null };
	}

	const formattedGuess = guessRequest.response.trim().toLowerCase();

	if (context.usedGuesses.has(formattedGuess)) {
		return { guess: null };
	}

	context.usedGuesses.add(formattedGuess);
	const guess = formattedGuess;

	return { guess };
}
