import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, User, GameListItem } from "../types";
import { DEFAULT_GAME_STATE } from "../constants";
import {
	connectToRoom,
	disconnectFromRoom,
	updateDrawing as apiUpdateDrawing,
	submitGuess as apiSubmitGuess,
	startGame as apiStartGame,
	addEventListener,
	removeEventListener,
	isConnected as apiIsConnected,
} from "../../../lib/api-service";

export function useGameState(
	playerId: string,
	initialGameId: string | null = null,
	clearCanvas?: () => void,
) {
	const [gameState, setGameState] = useState<GameState>({
		...DEFAULT_GAME_STATE,
		gameId: initialGameId,
	});
	const [users, setUsers] = useState<Array<User>>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [availableGames, _setAvailableGames] = useState<GameListItem[]>([]);
	
	// Use a ref to track the previous isLobby state to avoid excessive clearCanvas calls
	const prevIsLobbyRef = useRef<boolean | null>(null);

	// Callback to update the game state when we receive updates from the WebSocket
	const handleGameUpdate = useCallback((data: any) => {
		// Map API data to our GameState format
		if (data) {
			setGameState((prevState) => ({
				...prevState,
				gameId: data.key,
				gameName: data.key,
				isActive: data.isActive || false,
				isLobby: data.isLobby !== false,
				targetWord: data.targetWord || "",
				timeRemaining: data.timeRemaining || 0,
				drawingData: data.drawingData || "",
				hasWon: data.hasWon || false,
				currentDrawer: data.currentDrawer || "",
			}));

			// Map users from the API format
			if (data.users) {
				const mappedUsers = data.users.map((userId: string) => ({
					id: userId,
					name: userId,
					score: data.scores?.[userId] || 0,
					isDrawing: userId === data.currentDrawer,
					isConnected: data.connectedUsers?.[userId] || false,
				}));
				setUsers(mappedUsers);
			}
		}
	}, []);

	// Connect to WebSocket when component mounts or changes
	useEffect(() => {
		if (gameState.gameId && playerId) {
			connectToRoom(gameState.gameId, playerId, handleGameUpdate);
			
			// Handle connection status
			const connectionHandler = () => {
				setIsConnected(apiIsConnected());
			};
			
			addEventListener('disconnected', connectionHandler);
			addEventListener('error', connectionHandler);
			
			// WebSocket events for game state updates
			const gameStateTypes = [
				'initialize', 
				'userJoined', 
				'userConnectionStatus',
				'gameStarted',
				'timeUpdate',
				'drawingUpdate',
				'newGuess',
				'correctGuess',
				'roundEnd',
				'youAreDrawing'
			];
			
			for (const type of gameStateTypes) {
				addEventListener(type as any, connectionHandler);
			}
			
			return () => {
				disconnectFromRoom();
				
				removeEventListener('disconnected', connectionHandler);
				removeEventListener('error', connectionHandler);
				
				for (const type of gameStateTypes) {
					removeEventListener(type as any, connectionHandler);
				}
			};
		}
	}, [gameState.gameId, playerId, handleGameUpdate]);

	// Update connection status based on API's connection state
	useEffect(() => {
		setIsConnected(apiIsConnected());
	}, []);

	// Handle game end or round end events - only clear canvas when transitioning from game to lobby
	useEffect(() => {
		// Only clear canvas when we transition from game to lobby
		// This prevents infinite re-renders and excessive memory usage
		if (clearCanvas && gameState.isLobby && prevIsLobbyRef.current === false) {
			// We're transitioning from active game to lobby, clear canvas once
			clearCanvas();
		}
		
		// Update the ref with current value
		prevIsLobbyRef.current = gameState.isLobby;
	}, [gameState.isLobby, clearCanvas]);

	const createGame = useCallback(
		async () => {
			// We'll use the room creation API from api-service.ts
			// The API will handle this when the user creates a room
		},
		[],
	);

	const joinGame = useCallback(
		async (gameIdToJoin: string) => {
			// Set the game ID in state, which will trigger the WebSocket connection in the useEffect
			setGameState(prevState => ({
				...prevState,
				gameId: gameIdToJoin,
			}));
		},
		[],
	);

	const startGame = useCallback(async () => {
		if (!gameState.gameId) return;
		
		try {
			await apiStartGame(playerId, gameState.gameId);
		} catch (error) {
			console.error("Error starting game:", error);
		}
	}, [gameState.gameId, playerId]);

	const endGame = useCallback(async () => {
		// Just disconnect from the room
		disconnectFromRoom();
		
		setGameState({
			...DEFAULT_GAME_STATE,
			gameId: null,
		});
		setUsers([]);
	}, []);

	const leaveGame = useCallback(() => {
		disconnectFromRoom();
		
		setGameState({
			...DEFAULT_GAME_STATE,
			gameId: null,
		});
		setUsers([]);
	}, []);

	const updateDrawing = useCallback(
		async (drawingData: string) => {
			if (!gameState.gameId) return;
			
			try {
				await apiUpdateDrawing(playerId, gameState.gameId, drawingData);
			} catch (error) {
				console.error("Error updating drawing:", error);
			}
		},
		[gameState.gameId, playerId],
	);

	const submitGuess = useCallback(
		async (guess: string) => {
			if (!gameState.gameId) return;
			
			try {
				await apiSubmitGuess(playerId, gameState.gameId, guess);
			} catch (error) {
				console.error("Error submitting guess:", error);
			}
		},
		[gameState.gameId, playerId],
	);

	return {
		isConnected,
		gameState,
		users,
		availableGames,
		createGame,
		joinGame,
		startGame,
		endGame,
		leaveGame,
		updateDrawing,
		submitGuess,
	};
}
