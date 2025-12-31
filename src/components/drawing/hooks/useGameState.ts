import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GameListItem, GameState, User } from '../types';
import { DEFAULT_GAME_STATE } from '../constants';
import { config } from '../../../config';

const normalizeBaseUrl = (baseUrl: string) => {
  if (baseUrl.endsWith('/')) {
    return baseUrl.slice(0, -1);
  }
  return baseUrl;
};

const resolveWebSocketUrl = (baseUrl: string) => {
  if (baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')) {
    return normalizeBaseUrl(baseUrl);
  }

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const wsOrigin = origin.replace(/^http/, 'ws');
  const path = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return normalizeBaseUrl(`${wsOrigin}${path}`);
};

let sharedSocket: WebSocket | null = null;
let sharedSocketUrl: string | null = null;

export function useGameState(
  initialGameId: string | null,
  playerId: string,
  playerName: string,
  clearCanvas?: () => void
) {
  const [gameState, setGameState] = useState<GameState>({
    ...DEFAULT_GAME_STATE,
    gameId: initialGameId,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [availableGames, setAvailableGames] = useState<GameListItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const clearCanvasRef = useRef(clearCanvas);
  const playerNameRef = useRef(playerName);

  useEffect(() => {
    clearCanvasRef.current = clearCanvas;
  }, [clearCanvas]);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  const socketUrl = useMemo(() => {
    return resolveWebSocketUrl(config.multiplayer.wsBaseUrl);
  }, []);

  useEffect(() => {
    if (sharedSocket && sharedSocketUrl === socketUrl) {
      wsRef.current = sharedSocket;
      if (sharedSocket.readyState === WebSocket.OPEN) {
        sharedSocket.send(JSON.stringify({ action: 'getGames' }));
      }
      return;
    }

    if (sharedSocket && sharedSocketUrl !== socketUrl) {
      sharedSocket.close();
      sharedSocket = null;
      sharedSocketUrl = null;
    }

    const ws = new WebSocket(socketUrl);
    sharedSocket = ws;
    sharedSocketUrl = socketUrl;
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ action: 'getGames' }));

      if (initialGameId) {
        ws.send(
          JSON.stringify({
            action: 'join',
            gameId: initialGameId,
            playerId,
            playerName: playerNameRef.current,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'gamesList':
            setAvailableGames(data.games);
            break;
          case 'gameState': {
            const isParticipant = data.users.some(
              (user: User) => user.id === playerId
            );

            if (isParticipant) {
              setGameState((prevState) => ({
                ...prevState,
                ...data.gameState,
                gameId: data.gameId,
                gameName: data.gameName,
              }));
              setUsers(data.users);
            } else {
              setGameState({
                ...DEFAULT_GAME_STATE,
                gameId: null,
              });
              setUsers([]);
            }
            break;
          }
          case 'drawingUpdate':
            setGameState((prevState) => ({
              ...prevState,
              drawingData: data.drawingData,
            }));
            break;
          case 'gameCreated':
            if (data.users.some((user: User) => user.id === playerId)) {
              setGameState((prevState) => ({
                ...prevState,
                ...data.gameState,
                gameId: data.gameId,
                gameName: data.gameName,
              }));
              setUsers(data.users);
            }
            ws.send(JSON.stringify({ action: 'getGames' }));
            break;
          case 'gameStarted':
            clearCanvasRef.current?.();
            break;
          case 'gameEnded':
            setGameState(data.gameState);
            setUsers(data.users);
            break;
          case 'error':
            console.error('Game error:', data.message);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          wsRef.current = null;
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [socketUrl, playerId, initialGameId]);

  const createGame = useCallback(
    async (gameName: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          action: 'createGame',
          gameName,
          playerId,
          playerName,
        })
      );
    },
    [playerId, playerName]
  );

  const joinGame = useCallback(
    async (gameIdToJoin: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          action: 'join',
          gameId: gameIdToJoin,
          playerId,
          playerName,
        })
      );
    },
    [playerId, playerName]
  );

  const startGame = useCallback(async () => {
    if (
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      !gameState.gameId
    ) {
      console.error('WebSocket not connected or no gameId');
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        action: 'startGame',
        gameId: gameState.gameId,
        playerId,
      })
    );
  }, [gameState.gameId, playerId]);

  const endGame = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        action: 'leave',
        gameId: gameState.gameId,
        playerId,
      })
    );
  }, [gameState.gameId, playerId]);

  const leaveGame = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        action: 'leave',
        gameId: gameState.gameId,
        playerId,
      })
    );

    setGameState((prevState) => ({
      ...prevState,
      gameId: null,
      gameName: '',
      isActive: false,
      isLobby: true,
    }));
    setUsers([]);

    wsRef.current.send(JSON.stringify({ action: 'getGames' }));
  }, [playerId, gameState.gameId]);

  const updateDrawing = useCallback(
    async (drawingData: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          action: 'updateDrawing',
          gameId: gameState.gameId,
          drawingData,
        })
      );
    },
    [gameState.gameId]
  );

  const submitGuess = useCallback(
    async (guess: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          action: 'submitGuess',
          gameId: gameState.gameId,
          playerId,
          guess,
        })
      );
    },
    [gameState.gameId, playerId]
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
