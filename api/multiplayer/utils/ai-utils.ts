import type { Env } from "../types/app";
import { WORDS_BY_DIFFICULTY } from '../constants';

export interface AIGuessContext {
  usedGuesses: Set<string>;
  recentGuesses: string[];
  timeElapsed: number;
  roundDuration: number;
}

export async function onAIGuessDrawing(
  drawingData: string,
  env: Env,
  context: AIGuessContext
) {
  if (!env.AI) {
    console.warn('AI environment not configured.');
    return { guess: null };
  }
  const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, '');
  const binaryData = new Uint8Array(
    atob(base64Data)
      .split('')
      .map((char) => char.charCodeAt(0))
  );

  const progressHint =
    context.timeElapsed < 30
      ? 'The drawing is likely incomplete or just starting.'
      : context.timeElapsed < 60
      ? 'The drawing is partially complete.'
      : 'The drawing should be mostly finished.';

  const guessContext =
    context.recentGuesses.length > 0
      ? `Other players recently guessed: ${context.recentGuesses
          .slice(-8)
          .join(', ')}`
      : 'No other guesses yet.';

  const guessRequest = await env.AI.run(
    '@cf/meta/llama-3.2-11b-vision-instruct',
    {
      prompt: `You are an AI player in a Pictionary-style drawing game. Analyze this hand-drawn sketch and guess what is being drawn.

GAME CONTEXT:
- This is a SKETCH (simple hand-drawn lines), not a photograph
- ${progressHint}
- ${guessContext}

Hard rules:
- Output exactly one lowercase word (a–z only). No other characters or text.
- Do not output any of these words you already tried: ${
        Array.from(context.usedGuesses).join(', ') || 'none'
      }

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
    {
      gateway: {
        id: 'llm-assistant',
        skipCache: false,
        cacheTtl: 3360,
      },
    }
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

export async function generateWordList(env: Env): Promise<{
  easy: string[];
  medium: string[];
  hard: string[];
  all: string[];
} | null> {
  if (!env.AI) {
    console.warn(
      'AI environment not configured. Falling back to default word list.'
    );
    return null;
  }

  try {
    const response = await env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: [
          {
            role: 'system',
            content:
              'You are helping create word lists for a Pictionary-style drawing game. Generate creative, drawable words at three difficulty levels.',
          },
          {
            role: 'user',
            content: `Generate word lists for a drawing game based on these examples:

Easy examples: ${WORDS_BY_DIFFICULTY.easy.slice(0, 10).join(', ')}
Medium examples: ${WORDS_BY_DIFFICULTY.medium.slice(0, 10).join(', ')}
Hard examples: ${WORDS_BY_DIFFICULTY.hard.slice(0, 10).join(', ')}

Generate 25 easy words (simple, common objects), 30 medium words (more specific items, activities), and 25 hard words (abstract concepts, complex objects). All words must be drawable and suitable for a drawing game. Include variety: animals, objects, places, food, activities, nature, etc.`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            type: 'object',
            properties: {
              easy: {
                type: 'array',
                items: { type: 'string' },
                minItems: 25,
                maxItems: 25,
              },
              medium: {
                type: 'array',
                items: { type: 'string' },
                minItems: 30,
                maxItems: 30,
              },
              hard: {
                type: 'array',
                items: { type: 'string' },
                minItems: 25,
                maxItems: 25,
              },
            },
            required: ['easy', 'medium', 'hard'],
          },
        },
        max_tokens: 1500,
        temperature: 0.9,
      },
      {
        gateway: {
          id: 'llm-assistant',
          skipCache: false,
          cacheTtl: 3360,
        },
      }
    );

    if (!response || !response.response) {
      console.warn('AI did not return a response for word list generation.');
      return null;
    }

    const responseData = (
      typeof response.response === 'string'
        ? JSON.parse(response.response)
        : response.response
    ) as { properties: { easy: string[]; medium: string[]; hard: string[] } };

    const parsed = responseData.properties;

    const easy = parsed.easy
      .map((w: string) => w.toLowerCase().trim())
      .filter((w: string) => w.length > 0);
    const medium = parsed.medium
      .map((w: string) => w.toLowerCase().trim())
      .filter((w: string) => w.length > 0);
    const hard = parsed.hard
      .map((w: string) => w.toLowerCase().trim())
      .filter((w: string) => w.length > 0);

    if (easy.length < 15 || medium.length < 15 || hard.length < 15) {
      console.warn(
        'AI generated insufficient words, falling back to defaults.'
      );
      return null;
    }

    const all = [...easy, ...medium, ...hard];

    return { easy, medium, hard, all };
  } catch (error) {
    console.error('Error generating word list with AI:', error);
    return null;
  }
}
