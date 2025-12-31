export interface DrawingResponse {
  status: string;
  data: {
    status: string;
    app_data_id: string;
    completion_id: string;
    data: {
      drawingUrl: string;
      drawingKey: string;
      paintingUrl: string;
      paintingKey: string;
      description: string;
    };
  };
}

export interface User {
  id: string;
  name: string;
  score: number;
  suspicionScore?: number;
  roundStats?: {
    correctGuesses: number;
    totalRounds: number;
    instantGuesses: number;
  };
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
  drawerRotation?: string[];
  nextRoundStartTime?: number;
  roundNumber?: number;
  aiThinking?: boolean;
  difficulty?: "easy" | "medium" | "hard" | "all";
}

export interface GameListItem {
  id: string;
  name: string;
  playerCount: number;
  isLobby: boolean;
  isActive: boolean;
}
