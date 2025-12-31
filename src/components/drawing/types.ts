export interface DrawingResponse {
  response: {
    status: string;
    content: string;
    data: {
      drawingUrl: {
        key: string;
      };
      paintingUrl: {
        key: string;
      };
    };
  };
}

export interface User {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  isActive: boolean;
  isLobby: boolean;
  gameId?: string | null;
  gameName?: string;
  targetWord: string;
  timeRemaining: number;
  guesses: Array<{
    playerId: string;
    playerName: string;
    guess: string;
    timestamp: number;
    correct: boolean;
  }>;
  hasWon: boolean;
  currentDrawer?: string;
  endTime?: number;
  statusMessage?: {
    type: "success" | "failure";
    message: string;
  };
  drawingData?: string;
}

export interface GameListItem {
  id: string;
  name: string;
  playerCount: number;
  isLobby: boolean;
  isActive: boolean;
}
