import { BaseMultiplayerGame } from "./base";
import { WORDS_BY_DIFFICULTY } from "../constants";
import { onAIGuessDrawing, generateWordList } from "../utils/ai-utils";
import type { Env } from "../types/app";
import type {
	DrawingGameConfig,
	DrawingRuntimeGameData,
	DrawingGameState,
} from "../types/drawing-game";

export class DrawingGame extends BaseMultiplayerGame {
	public static readonly AI_PLAYER_ID = "ai-player";
	protected readonly config: DrawingGameConfig;
	private aiGuessHistory: Map<string, Set<string>> = new Map();

	constructor(state: DurableObjectState, env: Env, config: DrawingGameConfig) {
		super(state, env, {
			gameDuration: config.gameDuration,
			minPlayers: config.minPlayers,
			maxPlayers: config.maxPlayers,
		});
		this.config = config;
	}

	protected deserializeGames(
		storedGames: unknown,
	): [string, DrawingRuntimeGameData][] {
		return (storedGames as [string, DrawingRuntimeGameData][]).map(
			([id, game]) => [
				id,
				{
					...game,
					id,
					users: new Map(game.users),
					timerInterval: null,
					lastAIGuessTime: game.lastAIGuessTime || 0,
				},
			],
		);
	}

	protected initializeGameState(
		gameName: string,
		creator: string,
	): DrawingGameState {
		const gameState: DrawingGameState = {
			isActive: false,
			isLobby: true,
			targetWord: "",
			timeRemaining: this.config.gameDuration,
			guesses: [],
			hasWon: false,
			currentDrawer: undefined,
			drawingData: undefined,
			drawerRotation: [],
			roundNumber: 0,
			difficulty: "all",
		};

		if (this.config.aiEnabled) {
			const randomAiName =
				this.config.aiNames[
					Math.floor(Math.random() * this.config.aiNames.length)
				];

			const game = this.games.get(creator);
			if (game) {
				game.name = gameName;
				game.users.set(DrawingGame.AI_PLAYER_ID, {
					name: randomAiName,
					score: 0,
				});
			}
		}

		return gameState;
	}

	protected async handleCreateGame(data: {
		gameName: string;
		playerId: string;
		playerName: string;
	}): Promise<`${string}-${string}-${string}-${string}-${string}`> {
		const gameId = await super.handleCreateGame(data);

		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (game) {
			const aiWordList = await generateWordList(this.env);
			if (aiWordList) {
				game.gameState.wordList = aiWordList;
				await this.saveGames();
			}
		}

		return gameId;
	}

	protected async handleJoin({
		gameId,
		playerId,
		playerName,
	}: {
		gameId: string;
		playerId: string;
		playerName: string;
	}) {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game) throw new Error("Game not found");

		const isNewPlayer = !game.users.has(playerId);

		if (isNewPlayer) {
			game.users.set(playerId, { name: playerName, score: 0 });

			if (game.gameState.isActive && game.gameState.drawerRotation) {
				if (!game.gameState.drawerRotation.includes(playerId)) {
					game.gameState.drawerRotation.push(playerId);
				}
			}

			await this.saveGames();

			this.broadcast(gameId, {
				type: "playerJoined",
				playerId,
				playerName,
			});
		}
	}

	protected validateGameStart(game: DrawingRuntimeGameData): boolean {
		return game.users.size >= this.config.minPlayers;
	}

	public async handleGameStart({
		gameId,
		playerId,
	}: {
		gameId: string;
		playerId: string;
	}): Promise<void> {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game) throw new Error("Game not found");

		if (game.gameState.isActive || !this.validateGameStart(game)) {
			return;
		}

		const currentPlayers = Array.from(game.users.keys()).filter(
			(id) => id !== DrawingGame.AI_PLAYER_ID
		);

		if (!game.gameState.drawerRotation || game.gameState.drawerRotation.length === 0) {
			game.gameState.drawerRotation = [...currentPlayers];
			game.gameState.roundNumber = 0;
		}

		const drawerIndex = (game.gameState.roundNumber || 0) % game.gameState.drawerRotation.length;
		const nextDrawer = game.gameState.drawerRotation[drawerIndex];

		const difficulty = game.gameState.difficulty || "all";
		const wordList = game.gameState.wordList
			? game.gameState.wordList[difficulty]
			: WORDS_BY_DIFFICULTY[difficulty];
		const randomWord = wordList[Math.floor(Math.random() * wordList.length)];

		game.gameState = {
			...game.gameState,
			isActive: true,
			isLobby: false,
			targetWord: randomWord,
			timeRemaining: this.config.gameDuration,
			guesses: [],
			hasWon: false,
			currentDrawer: nextDrawer,
			endTime: Date.now() + this.config.gameDuration * 1000,
			drawingData: undefined,
			roundNumber: (game.gameState.roundNumber || 0) + 1,
			nextRoundStartTime: undefined,
		};

		if (this.aiGuessHistory.has(gameId)) {
			this.aiGuessHistory.get(gameId)!.clear();
		}

		for (const [id, user] of game.users.entries()) {
			if (id !== DrawingGame.AI_PLAYER_ID) {
				if (!user.roundStats) {
					user.roundStats = { correctGuesses: 0, totalRounds: 0, instantGuesses: 0 };
				}
				user.roundStats.totalRounds++;
			}
		}

		this.startGameTimer(gameId);

		if (game.gameState.endTime) {
			await this.state.storage.setAlarm(game.gameState.endTime);
		}

		await this.saveGames();

		this.broadcast(gameId, {
			type: "gameStarted",
			gameState: {
				...game.gameState,
				targetWord:
					game.gameState.currentDrawer === playerId
						? game.gameState.targetWord
						: "",
			},
		});
	}

	protected async handleGameAction(
		action: string,
		data: any,
		game: DrawingRuntimeGameData | undefined,
	): Promise<void> {
		if (!game) return;

		switch (action) {
			case "submitGuess":
				await this.handleGuess(data);
				break;
			case "updateDrawing":
				await this.handleDrawingUpdate(data);
				break;
			case "setDifficulty":
				await this.handleSetDifficulty(data, game);
				break;
		}
	}

	protected async handlePlayerLeave(
		gameId: string,
		playerId: string,
	): Promise<void> {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game) return;

		if (game.gameState.currentDrawer === playerId) {
			game.gameState.isActive = false;
			game.gameState.isLobby = true;
			game.gameState.currentDrawer = undefined;
			game.gameState.statusMessage = {
				type: "failure",
				message: "Game ended - drawer left the game"
			};
			await this.saveGames();
		}
	}

	private async handleSetDifficulty(
		{ gameId, difficulty }: { gameId: string; difficulty: "easy" | "medium" | "hard" | "all" },
		game: DrawingRuntimeGameData
	) {
		if (!game.gameState.isLobby || game.gameState.isActive) return;

		game.gameState.difficulty = difficulty;
		await this.saveGames();
		await this.broadcastGameState(gameId);
	}

	private async handleGuess({
		gameId,
		playerId,
		guess,
	}: {
		gameId: string;
		playerId: string;
		guess: string;
	}) {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game || !game.gameState.isActive) return;

		if (playerId === game.gameState.currentDrawer) return;

		const normalizedGuess = guess.trim().toLowerCase();
		const normalizedTarget = game.gameState.targetWord.toLowerCase();
		const isCorrect = normalizedGuess === normalizedTarget;
		const now = Date.now();

		const user = game.users.get(playerId);
		if (user && playerId !== DrawingGame.AI_PLAYER_ID) {
			if (!user.suspicionScore) user.suspicionScore = 0;
			if (!user.roundStats) {
				user.roundStats = { correctGuesses: 0, totalRounds: 0, instantGuesses: 0 };
			}

			const roundStartTime = game.gameState.endTime
				? game.gameState.endTime - this.config.gameDuration * 1000
				: now;
			const timeSinceRoundStart = (now - roundStartTime) / 1000;

			if (isCorrect) {
				const hasNoPreviousGuesses = !game.gameState.guesses.some(
					(g) => g.playerId === playerId
				);

				if (timeSinceRoundStart < 3 && hasNoPreviousGuesses) {
					user.suspicionScore += 5;
					user.roundStats.instantGuesses++;
					console.warn(
						`Suspicious: ${user.name} guessed correctly in ${timeSinceRoundStart.toFixed(1)}s with no prior guesses`
					);
				}

				if (hasNoPreviousGuesses && game.gameState.guesses.length === 0) {
					user.suspicionScore += 3;
					console.warn(
						`Suspicious: ${user.name} first guess was correct with no context`
					);
				}

				user.roundStats.correctGuesses++;
			}

			user.lastGuessTime = now;
		}

		game.gameState.guesses.push({
			playerId,
			playerName: game.users.get(playerId)?.name || "Unknown Player",
			guess,
			timestamp: now,
			correct: isCorrect,
		});

		if (isCorrect) {
			await this.handleCorrectGuess(game, playerId);
		}

		await this.saveGames();
	}

	private async handleCorrectGuess(
		game: DrawingRuntimeGameData,
		playerId: string,
	) {
		const correctGuessesBeforeThis = game.gameState.guesses.filter(
			(g) => g.correct && g.playerId !== playerId
		).length;

		const pointsForPosition = [5, 3, 1];
		const pointsEarned = pointsForPosition[correctGuessesBeforeThis] || 0;

		const guesser = game.users.get(playerId);
		if (guesser && pointsEarned > 0) {
			guesser.score = Math.round((guesser.score + pointsEarned) * 10) / 10;
		}

		const nonDrawerPlayers = Array.from(game.users.entries()).filter(
			([id]) =>
				id !== game.gameState.currentDrawer && id !== DrawingGame.AI_PLAYER_ID,
		);

		const drawer = game.gameState.currentDrawer
			? game.users.get(game.gameState.currentDrawer)
			: undefined;

		if (drawer && pointsEarned > 0) {
			const drawerBonus = pointsEarned * 0.5;
			drawer.score = Math.round((drawer.score + drawerBonus) * 10) / 10;
		}

		const correctGuesses = new Set(
			game.gameState.guesses.filter((g) => g.correct).map((g) => g.playerId),
		);

		const allPlayersGuessedCorrectly = nonDrawerPlayers.every(([playerId]) =>
			correctGuesses.has(playerId),
		);

		if (allPlayersGuessedCorrectly) {
			await this.handleRoundEnd(game, true);
		} else {
			const positionText = correctGuessesBeforeThis === 0 ? "1st" : correctGuessesBeforeThis === 1 ? "2nd" : correctGuessesBeforeThis === 2 ? "3rd" : "";
			const pointsText = pointsEarned > 0 ? ` (+${pointsEarned} pts)` : "";
			game.gameState.statusMessage = {
				type: "success",
				message: `${game.users.get(playerId)?.name || "Unknown Player"} guessed correctly! ${positionText}${pointsText}`,
			};
		}
	}

	private async handleDrawingUpdate({
		gameId,
		drawingData,
	}: {
		gameId: string;
		drawingData: any;
	}) {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game || !game.gameState.isActive) return;

		if (
			this.config.aiEnabled &&
			(!game.lastAIGuessTime ||
				Date.now() - game.lastAIGuessTime >= this.config.aiGuessCooldown)
		) {
			await this.processAIGuess(game, drawingData);
		}

		this.broadcast(gameId, {
			type: "drawingUpdate",
			drawingData,
		});
	}

	private async processAIGuess(
		game: DrawingRuntimeGameData,
		drawingData: string,
	) {
		try {
			const aiHasGuessedCorrectly = game.gameState.guesses.some(
				(guess) => guess.playerId === DrawingGame.AI_PLAYER_ID && guess.correct,
			);

			if (!aiHasGuessedCorrectly) {
				if (!this.aiGuessHistory.has(game.id)) {
					this.aiGuessHistory.set(game.id, new Set());
				}

				const usedGuesses = this.aiGuessHistory.get(game.id)!;

				const recentGuesses = game.gameState.guesses
					.filter((g) => !g.correct && g.playerId !== DrawingGame.AI_PLAYER_ID)
					.slice(-10)
					.map((g) => g.guess);

				const timeElapsed = game.gameState.endTime
					? Math.floor((Date.now() - (game.gameState.endTime - this.config.gameDuration * 1000)) / 1000)
					: 0;

				game.gameState.aiThinking = true;
				await this.broadcastGameState(game.id);

				const aiGuess = await onAIGuessDrawing(drawingData, this.env, {
					usedGuesses,
					recentGuesses,
					timeElapsed,
					roundDuration: this.config.gameDuration,
				});

				game.gameState.aiThinking = false;

				if (aiGuess.guess) {
					game.lastAIGuessTime = Date.now();
					await this.handleGuess({
						gameId: game.id,
						playerId: DrawingGame.AI_PLAYER_ID,
						guess: aiGuess.guess,
					});
				} else {
					await this.broadcastGameState(game.id);
				}
			}
		} catch (error) {
			console.error("Error processing AI guess:", error);
			game.gameState.aiThinking = false;
			await this.broadcastGameState(game.id);
		}
	}

	protected async handleGameTimeout(gameId: string): Promise<void> {
		const game = this.games.get(gameId) as DrawingRuntimeGameData;
		if (!game) return;

		await this.handleRoundEnd(game, false);
	}

	private async handleRoundEnd(game: DrawingRuntimeGameData, success: boolean) {
		const oldWord = game.gameState.targetWord;
		const nextRoundDelay = 5000;
		const nextRoundStartTime = Date.now() + nextRoundDelay;

		game.gameState = {
			...game.gameState,
			isActive: false,
			isLobby: false,
			targetWord: "",
			timeRemaining: this.config.gameDuration,
			currentDrawer: undefined,
			endTime: undefined,
			hasWon: success,
			nextRoundStartTime,
			statusMessage: {
				type: success ? "success" : "failure",
				message: success
					? `Everyone guessed correctly! The word was "${oldWord}". Next round starting...`
					: `Time's up! The word was "${oldWord}". Next round starting...`,
			},
		};

		if (game.timerInterval) {
			clearInterval(game.timerInterval);
			game.timerInterval = null;
		}

		await this.saveGames();
		await this.broadcastGameState(game.id);

		setTimeout(async () => {
			const currentGame = this.games.get(game.id) as DrawingRuntimeGameData;
			if (currentGame && !currentGame.gameState.isActive) {
				await this.handleGameStart({
					gameId: game.id,
					playerId: currentGame.gameState.drawerRotation?.[0] || "",
				});
			}
		}, nextRoundDelay);
	}
}