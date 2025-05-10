declare const WebSocketPair: {
  new(): { 0: WebSocket; 1: WebSocket };
};

import type { DurableObjectState, WebSocket, Response as CfResponse } from '@cloudflare/workers-types';

import type { Env } from './index';
import { GAME_WORDS, AI_PLAYER_ID, AI_NAMES } from './constants';

interface RoomData {
  key: string;
  users: string[];
  moderator: string;
  connectedUsers: Record<string, boolean>;
  timerInterval: number;
  lastAIGuessTime: number;
  isActive: boolean;
  isLobby: boolean;
  targetWord: string;
  timeRemaining: number;
  guesses: {
    playerId: string;
    playerName: string;
    guess: string;
    timestamp: number;
    correct: boolean;
  }[];
  hasWon: boolean;
  currentDrawer: string;
  drawingData: string;
  settings: {
    gameDuration: number;
    minPlayers: number;
    maxPlayers: number;
    aiEnabled?: boolean;
    aiGuessCooldown?: number;
    correctGuesserScore?: number;
    correctDrawerScore?: number;
  };
  scores?: Record<string, number>;
  statusMessage?: {
    type: 'success' | 'failure';
    message: string;
  };
  endTime?: number;
}

interface BroadcastMessage {
  type: string;
  [key: string]: unknown;
}

interface SessionInfo {
  webSocket: WebSocket;
  roomKey: string;
  userName: string;
}

export class Room {
  state: DurableObjectState;
  env: Env;
  sessions: Map<WebSocket, SessionInfo>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();

    this.state.blockConcurrencyWhile(async () => {
      let roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) {
        roomData = {
          key: '',
          users: [],
          moderator: '',
          connectedUsers: {},
          timerInterval: 0,
          lastAIGuessTime: 0,
          isActive: false,
          isLobby: true,
          targetWord: '',
          timeRemaining: 0,
          guesses: [],
          hasWon: false,
          currentDrawer: '',
          drawingData: '',
          settings: {
            gameDuration: 60,
            minPlayers: 2,
            maxPlayers: 10,
            aiEnabled: false,
            aiGuessCooldown: 5000,
            correctGuesserScore: 10,
            correctDrawerScore: 5
          }
        };
        await this.state.storage.put('roomData', roomData);
      } else if (!roomData.connectedUsers) {
        roomData.connectedUsers = {};
        for (const user of roomData.users) {
          roomData.connectedUsers[user] = false;
        }
        await this.state.storage.put('roomData', roomData);
      }
    });
  }

  async fetch(request: Request): Promise<CfResponse> {
    const url = new URL(request.url);

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
      const roomKey = url.searchParams.get('room');
      const userName = url.searchParams.get('name');

      if (!roomKey || !userName) {
        return new Response('Missing room key or user name', { status: 400 }) as unknown as CfResponse;
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

      await this.handleSession(server, roomKey, userName);

      return new Response(null, { status: 101, webSocket: client } as unknown as CfResponse) as unknown as CfResponse;
    }

    if (url.pathname === '/initialize' && request.method === 'POST') {
      const { roomKey, moderator } = await request.json() as { roomKey: string; moderator: string };

      return await this.state.blockConcurrencyWhile(async () => {
        let roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData) {
          // TODO: Handle case where roomData is not found during initialization attempt
          // This scenario might need specific logic depending on requirements,
          // maybe return an error or proceed with initialization.
          // For now, let's assume initialization proceeds if roomData is null/undefined.
        } else if (roomData.key) {
          return new Response(
            JSON.stringify({ error: 'Room already exists' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        roomData = {
          key: roomKey,
          users: [moderator],
          moderator,
          connectedUsers: { [moderator]: true },
          timerInterval: 0,
          lastAIGuessTime: 0,
          isActive: false,
          isLobby: true,
          targetWord: '',
          timeRemaining: 60,
          guesses: [],
          hasWon: false,
          currentDrawer: '',
          drawingData: '',
          settings: {
            gameDuration: 60,
            minPlayers: 2,
            maxPlayers: 10,
            aiEnabled: false,
            aiGuessCooldown: 5000,
            correctGuesserScore: 10,
            correctDrawerScore: 5
          }
        };

        await this.state.storage.put('roomData', roomData);

        return new Response(
          JSON.stringify({
            success: true,
            room: roomData,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/join' && request.method === 'POST') {
      const { name } = await request.json() as { name: string };

      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        if (!roomData.connectedUsers) {
          roomData.connectedUsers = {};
          for (const user of roomData.users) {
            roomData.connectedUsers[user] = false;
          }
        }

        if (!roomData.users.includes(name)) {
          roomData.users.push(name);
        }
        
        roomData.connectedUsers[name] = true;
        
        await this.state.storage.put('roomData', roomData);

        this.broadcast({
          type: 'userJoined',
          name,
          roomData,
        });

        return new Response(
          JSON.stringify({
            success: true,
            room: roomData,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/settings' && request.method === 'GET') {
      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        return new Response(
          JSON.stringify({
            success: true,
            settings: roomData.settings,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/settings' && request.method === 'PUT') {
      const { name, settings } = await request.json() as { 
        name: string; 
        settings: RoomData['settings']
      };

      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        if (roomData.moderator !== name) {
          return new Response(
            JSON.stringify({ error: 'Only the moderator can update settings' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        roomData.settings = {
          ...roomData.settings,
          ...settings
        };
        await this.state.storage.put('roomData', roomData);

        this.broadcast({
          type: 'settingsUpdated',
          settings: roomData.settings,
          roomData,
        });

        return new Response(
          JSON.stringify({
            success: true,
            settings: roomData.settings,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/start-game' && request.method === 'POST') {
      const { name } = await request.json() as { name: string };

      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        if (roomData.moderator !== name) {
          return new Response(
            JSON.stringify({ error: 'Only the moderator can start the game' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        await this.handleStartGame(name);

        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/submit-guess' && request.method === 'POST') {
      const { name, guess } = await request.json() as { name: string; guess: string };

      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        if (!roomData.isActive) {
          return new Response(
            JSON.stringify({ error: 'Game is not active' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        if (name === roomData.currentDrawer) {
          return new Response(
            JSON.stringify({ error: 'The drawer cannot submit guesses' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        await this.handleGuess(name, guess);

        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/update-drawing' && request.method === 'POST') {
      const { name, drawingData } = await request.json() as { name: string; drawingData: string };

      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        if (!roomData.isActive) {
          return new Response(
            JSON.stringify({ error: 'Game is not active' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        if (name !== roomData.currentDrawer) {
          return new Response(
            JSON.stringify({ error: 'Only the current drawer can update the drawing' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          ) as unknown as CfResponse;
        }

        await this.handleDrawingUpdate(name, drawingData);

        return new Response(
          JSON.stringify({
            success: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    if (url.pathname === '/game-state' && request.method === 'GET') {
      return await this.state.blockConcurrencyWhile(async () => {
        const roomData = await this.state.storage.get<RoomData>('roomData');

        if (!roomData || !roomData.key) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as CfResponse;
        }

        const name = url.searchParams.get('name');
        const hideTargetWord = !name || name !== roomData.currentDrawer;

        return new Response(
          JSON.stringify({
            success: true,
            gameState: {
              ...roomData,
              targetWord: hideTargetWord ? undefined : roomData.targetWord
            },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        ) as unknown as CfResponse;
      });
    }

    return new Response('Not found', { status: 404 }) as unknown as CfResponse;
  }

  async handleSession(webSocket: WebSocket, roomKey: string, userName: string) {
    const session = { webSocket, roomKey, userName };
    this.sessions.set(webSocket, session);

    webSocket.accept();

    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (roomData) {
        if (!roomData.connectedUsers) {
          roomData.connectedUsers = {};
          for (const user of roomData.users) {
            roomData.connectedUsers[user] = false;
          }
        }
        
        if (!roomData.users.includes(userName)) {
          roomData.users.push(userName);
        }
        
        roomData.connectedUsers[userName] = true;
        
        await this.state.storage.put('roomData', roomData);
        
        this.broadcast({
          type: 'userConnectionStatus',
          user: userName,
          isConnected: true,
          roomData,
        });
      }
    });

    const roomData = await this.state.storage.get<RoomData>('roomData');
    webSocket.send(
      JSON.stringify({
        type: 'initialize',
        roomData,
      })
    );

    webSocket.addEventListener('message', async (msg) => {
      try {
        const messageData = typeof msg.data === 'string' ? msg.data : new TextDecoder().decode(msg.data);
        const data = JSON.parse(messageData);
        
        if (data.type === 'updateSettings') {
          await this.handleUpdateSettings(userName, data.settings);
        } else if (data.type === 'startGame') {
          await this.handleStartGame(userName);
        } else if (data.type === 'submitGuess') {
          await this.handleGuess(userName, data.guess);
        } else if (data.type === 'updateDrawing') {
          await this.handleDrawingUpdate(userName, data.drawingData);
        }
      } catch (err: unknown) {
        webSocket.send(
          JSON.stringify({
            type: 'error',
            error: err instanceof Error ? err.message : String(err),
          })
        );
      }
    });

    webSocket.addEventListener('close', async () => {
      this.sessions.delete(webSocket);

      const stillConnected = Array.from(this.sessions.values()).some(
        (s: SessionInfo) => s.userName === userName
      );

      if (!stillConnected) {
        await this.state.blockConcurrencyWhile(async () => {
          const roomData = await this.state.storage.get<RoomData>('roomData');

          if (roomData) {
            if (!roomData.connectedUsers) {
              roomData.connectedUsers = {};
              for (const user of roomData.users) {
                roomData.connectedUsers[user] = false;
              }
            }
            
            roomData.connectedUsers[userName] = false;
            
            await this.state.storage.put('roomData', roomData);

            this.broadcast({
              type: 'userConnectionStatus',
              user: userName,
              isConnected: false,
              roomData,
            });

            if (userName === roomData.moderator) {
              const connectedUsers = roomData.users.filter(user => roomData.connectedUsers[user]);
              
              if (connectedUsers.length > 0) {
                roomData.moderator = connectedUsers[0];
                await this.state.storage.put('roomData', roomData);

                this.broadcast({
                  type: 'newModerator',
                  name: roomData.moderator,
                  roomData,
                });
              }
            }
          }
        });
      }
    });
  }

  async handleUpdateSettings(userName: string, settings: Partial<RoomData['settings']>) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) return;

      if (roomData.moderator !== userName) {
        return;
      }

      roomData.settings = {
        ...roomData.settings,
        ...settings
      };
      await this.state.storage.put('roomData', roomData);

      this.broadcast({
        type: 'settingsUpdated',
        settings: roomData.settings,
        roomData,
      });
    });
  }

  async handleStartGame(userName: string) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) return;

      // Only the moderator can start the game
      if (roomData.moderator !== userName) {
        return;
      }

      // Check if we have enough players
      const connectedUsers = Object.entries(roomData.connectedUsers)
        .filter(([_, isConnected]) => isConnected)
        .map(([user]) => user);
      
      if (connectedUsers.length < roomData.settings.minPlayers) {
        return;
      }

      // Initialize game state
      const randomWord = GAME_WORDS[Math.floor(Math.random() * GAME_WORDS.length)];
      const randomDrawer = connectedUsers[Math.floor(Math.random() * connectedUsers.length)];
      
      roomData.isActive = true;
      roomData.isLobby = false;
      roomData.targetWord = randomWord;
      roomData.timeRemaining = roomData.settings.gameDuration;
      roomData.guesses = [];
      roomData.hasWon = false;
      roomData.currentDrawer = randomDrawer;
      roomData.endTime = Date.now() + roomData.settings.gameDuration * 1000;
      roomData.drawingData = '';
      roomData.scores = {};

      // Initialize scores
      for (const user of roomData.users) {
        roomData.scores[user] = 0;
      }

      // Add AI player if enabled
      if (roomData.settings.aiEnabled) {
        const randomAiName = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
        if (!roomData.users.includes(AI_PLAYER_ID)) {
          roomData.users.push(AI_PLAYER_ID);
          roomData.connectedUsers[AI_PLAYER_ID] = true;
        }
        roomData.scores[AI_PLAYER_ID] = 0;
      }

      await this.state.storage.put('roomData', roomData);

      // Start game timer
      this.startGameTimer();

      // Broadcast game start to all clients
      this.broadcast({
        type: 'gameStarted',
        gameState: {
          ...roomData,
          targetWord: undefined // Don't send the target word to everyone
        }
      });

      // Send the target word only to the drawer
      for (const session of this.sessions.values()) {
        if (session.userName === roomData.currentDrawer) {
          session.webSocket.send(JSON.stringify({
            type: 'youAreDrawing',
            targetWord: roomData.targetWord
          }));
          break;
        }
      }
    });
  }

  startGameTimer() {
    if (typeof setInterval === 'undefined') return; // May not be available in some Cloudflare Workers environments

    // Clear any existing interval
    this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData) return;

      // Setup a new timer if we're in an active game
      if (roomData.isActive && roomData.timeRemaining > 0) {
        const intervalId = setInterval(async () => {
          await this.updateGameTimer();
        }, 1000) as unknown as number;
        
        roomData.timerInterval = intervalId;
        await this.state.storage.put('roomData', roomData);
      }
    });
  }

  async updateGameTimer() {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData || !roomData.isActive) return;

      roomData.timeRemaining = Math.max(0, roomData.timeRemaining - 1);

      if (roomData.timeRemaining <= 0) {
        await this.handleRoundEnd(roomData, false);
      } else {
        await this.state.storage.put('roomData', roomData);
        
        this.broadcast({
          type: 'timeUpdate',
          timeRemaining: roomData.timeRemaining
        });
      }
    });
  }

  async handleGuess(userName: string, guess: string) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData || !roomData.isActive) return;

      // The drawer can't guess
      if (userName === roomData.currentDrawer) return;

      const normalizedGuess = guess.trim().toLowerCase();
      const normalizedTarget = roomData.targetWord.toLowerCase();

      // Add the guess to the list
      roomData.guesses.push({
        playerId: userName,
        playerName: userName,
        guess,
        timestamp: Date.now(),
        correct: normalizedGuess === normalizedTarget
      });

      // Check if the guess is correct
      if (normalizedGuess === normalizedTarget) {
        await this.handleCorrectGuess(roomData, userName);
      } else {
        await this.state.storage.put('roomData', roomData);
        
        // Broadcast the new guess to all players
        this.broadcast({
          type: 'newGuess',
          guess: {
            playerName: userName,
            guess,
            timestamp: Date.now(),
            correct: false
          }
        });
      }
    });
  }

  async handleCorrectGuess(roomData: RoomData, userName: string) {
    // Calculate score based on time remaining
    const timeBasedMultiplier = roomData.timeRemaining / roomData.settings.gameDuration;
    
    // Award points to the guesser
    const guesserScore = roomData.settings.correctGuesserScore || 10;
    if (!roomData.scores) {
      roomData.scores = {};
    }
    roomData.scores[userName] = (roomData.scores[userName] || 0) + 
      Math.round((guesserScore * timeBasedMultiplier) * 10) / 10;
    
    // Award points to the drawer
    const nonDrawerPlayers = roomData.users.filter(
      user => user !== roomData.currentDrawer && user !== AI_PLAYER_ID
    );
    
    const drawerScore = roomData.settings.correctDrawerScore || 5;
    if (nonDrawerPlayers.length > 0 && roomData.currentDrawer) {
      if (!roomData.scores) {
        roomData.scores = {};
      }
      roomData.scores[roomData.currentDrawer] = (roomData.scores[roomData.currentDrawer] || 0) + 
        Math.round((drawerScore * timeBasedMultiplier) / nonDrawerPlayers.length * 10) / 10;
    }

    // Check if all players have guessed correctly
    const playerGuesses = roomData.guesses.filter(guess => guess.correct).map(guess => guess.playerId);
    const uniqueCorrectPlayers = new Set(playerGuesses);
    
    const allNonDrawersGuessedCorrectly = nonDrawerPlayers.every(
      player => uniqueCorrectPlayers.has(player)
    );

    if (allNonDrawersGuessedCorrectly) {
      await this.handleRoundEnd(roomData, true);
    } else {
      roomData.statusMessage = {
        type: 'success',
        message: `${userName} guessed correctly!`
      };
      
      await this.state.storage.put('roomData', roomData);
      
      // Broadcast the new guess and updated scores
      this.broadcast({
        type: 'correctGuess',
        playerName: userName,
        scores: roomData.scores,
        statusMessage: roomData.statusMessage
      });
    }
  }

  async handleDrawingUpdate(userName: string, drawingData: string) {
    await this.state.blockConcurrencyWhile(async () => {
      const roomData = await this.state.storage.get<RoomData>('roomData');
      if (!roomData || !roomData.isActive) return;

      // Only the current drawer can update the drawing
      if (userName !== roomData.currentDrawer) return;

      roomData.drawingData = drawingData;
      await this.state.storage.put('roomData', roomData);

      // Check if AI should make a guess
      if (
        roomData.settings.aiEnabled &&
        roomData.connectedUsers[AI_PLAYER_ID] &&
        (!roomData.lastAIGuessTime || 
          Date.now() - roomData.lastAIGuessTime >= (roomData.settings.aiGuessCooldown || 5000))
      ) {
        await this.processAIGuess(roomData, drawingData);
      }

      // Broadcast the drawing update to all clients
      this.broadcast({
        type: 'drawingUpdate',
        drawingData
      });
    });
  }

  async processAIGuess(roomData: RoomData, drawingData: string) {
    try {
      // Check if AI has already guessed correctly
      const aiHasGuessedCorrectly = roomData.guesses.some(
        guess => guess.playerId === AI_PLAYER_ID && guess.correct
      );

      if (aiHasGuessedCorrectly) return;

      // In a real implementation, this would call an actual AI service
      // For this example, we'll use a simplified approach
      const aiGuessAccuracy = Math.random(); 
      
      // 10% chance the AI will guess correctly
      if (aiGuessAccuracy > 0.9) {
        roomData.lastAIGuessTime = Date.now();
        await this.handleGuess(AI_PLAYER_ID, roomData.targetWord);
      } else if (aiGuessAccuracy > 0.7) {
        // 20% chance AI makes a related but wrong guess
        const wrongGuesses = GAME_WORDS.filter(word => 
          word !== roomData.targetWord && 
          !roomData.guesses.some(g => g.playerId === AI_PLAYER_ID && g.guess === word)
        );
        
        if (wrongGuesses.length > 0) {
          const randomWrongGuess = wrongGuesses[Math.floor(Math.random() * wrongGuesses.length)];
          roomData.lastAIGuessTime = Date.now();
          await this.handleGuess(AI_PLAYER_ID, randomWrongGuess);
        }
      }
    } catch (error) {
      console.error("Error processing AI guess:", error);
    }
  }

  async handleRoundEnd(roomData: RoomData, success: boolean) {
    const oldWord = roomData.targetWord;

    // Reset game state
    roomData.isActive = false;
    roomData.isLobby = true;
    roomData.targetWord = '';
    roomData.timeRemaining = roomData.settings.gameDuration;
    roomData.hasWon = success;
    roomData.currentDrawer = '';
    roomData.endTime = undefined;
    roomData.statusMessage = {
      type: success ? 'success' : 'failure',
      message: success 
        ? `Everyone guessed correctly! The word was "${oldWord}"`
        : `Time's up! The word was "${oldWord}"`
    };

    // Clear timer if it exists
    if (typeof clearInterval !== 'undefined' && roomData.timerInterval) {
      clearInterval(roomData.timerInterval);
      roomData.timerInterval = 0;
    }

    await this.state.storage.put('roomData', roomData);

    // Broadcast round end to all clients
    this.broadcast({
      type: 'roundEnd',
      success,
      word: oldWord,
      scores: roomData.scores,
      statusMessage: roomData.statusMessage
    });
  }

  broadcast(message: BroadcastMessage) {
    const json = JSON.stringify(message);
    for (const session of this.sessions.values()) {
      try {
        session.webSocket.send(json);
      } catch (err) {
        // Ignore errors (the WebSocket might already be closed)
      }
    }
  }
}
