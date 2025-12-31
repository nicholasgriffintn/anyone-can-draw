import { useEffect, useRef, useState } from "react";

import type { DrawingResponse } from "./types";
import { ColorPicker } from "./components/ColorPicker";
import { LineWidthPicker } from "./components/LineWidthPicker";
import { ToolPicker, type ToolMode } from "./components/ToolPicker";
import { Header } from "./components/Header";
import { Result } from "./components/Result";
import { Canvas } from "./components/Canvas";
import { useGameState } from "./hooks/useGameState";
import { GameStatus } from "./components/GameStatus";
import { Chat } from "./components/Chat";
import { GenerateDrawing } from "./components/GenerateDrawing";

interface DrawingCanvasProps {
  playerId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onSubmit: (drawingData: string) => Promise<DrawingResponse>;
  gameId?: string;
}

export function DrawingCanvas({
  playerId,
  playerName,
  onPlayerNameChange,
  onSubmit,
  gameId,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState<DrawingResponse | null>(null);
  const [currentColor, setCurrentColor] = useState("#030712");
  const [lineWidth, setLineWidth] = useState(3);
  const [toolMode, setToolMode] = useState<ToolMode>('brush');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const newIndex = historyIndex - 1;
    const imageData = history[newIndex];
    if (!imageData) return;

    ctx.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const newIndex = historyIndex + 1;
    const imageData = history[newIndex];
    if (!imageData) return;

    ctx.putImageData(imageData, 0, 0);
    setHistoryIndex(newIndex);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([imageData]);
    setHistoryIndex(0);
  };

  useEffect(() => {
    initCanvas();
  }, []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [historyIndex, history]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const drawingData = canvas.toDataURL("image/png");
      const response = await onSubmit(drawingData);
      setApiResult(response);
    } catch (error) {
      console.error("Error submitting drawing:", error);
    } finally {
      setLoading(false);
    }
  };

  const {
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
    setDifficulty,
  } = useGameState(gameId ?? null, playerId, playerName, clearCanvas);

  const handleDrawingComplete = async () => {
    if (
      gameState.isActive &&
      canvasRef.current &&
      gameState.currentDrawer === playerId
    ) {
      const drawingData = canvasRef.current.toDataURL("image/png");
      await updateDrawing?.(drawingData);
    }
  };

  const isDrawer = gameState.currentDrawer === playerId;
  const displaySidebar = !gameState.isActive || isDrawer;

  const DrawingTools = () => (
    <div className="flex flex-col gap-3">
      <Header undo={undo} redo={redo} history={history} historyIndex={historyIndex} />
      <ToolPicker toolMode={toolMode} setToolMode={setToolMode} />
      <LineWidthPicker lineWidth={lineWidth} setLineWidth={setLineWidth} />
      <ColorPicker currentColor={currentColor} setCurrentColor={setCurrentColor} />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {apiResult && (
        <div className="flex-shrink-0 px-4 py-3 border-b-2 border-slate-700 bg-slate-800 flex items-center justify-between animate-fade-in">
          <span className="text-sm font-bold text-white">AI Result</span>
          <button
            type="button"
            onClick={() => setApiResult(null)}
            className="px-4 py-2 rounded-lg border-2 border-purple-600 bg-purple-700 text-sm font-medium text-white hover:bg-purple-600 hover:border-purple-500 transition-all"
          >
            New Drawing
          </button>
        </div>
      )}

      <div className="lg:hidden flex-shrink-0 px-4 py-2.5 border-b-2 border-slate-700 bg-slate-800 flex gap-2">
        {displaySidebar && (
          <button
            type="button"
            onClick={() => {
              setShowLeftPanel(!showLeftPanel);
              setShowRightPanel(false);
            }}
            className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-all"
          >
            {showLeftPanel ? "Hide Tools" : "Show Tools"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setShowRightPanel(!showRightPanel);
            setShowLeftPanel(false);
          }}
          className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-600 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:border-slate-500 transition-all"
        >
          {showRightPanel ? "Hide Panel" : "Show Panel"}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {displaySidebar && (
          <>
            <div className="hidden lg:block w-64 flex-shrink-0 border-r-2 border-slate-700 bg-slate-800 overflow-y-auto shadow-sm">
              <div className="p-4">
                <DrawingTools />
              </div>
            </div>
            {showLeftPanel && (
              <div className="lg:hidden absolute inset-y-0 left-0 w-64 z-10 border-r-2 border-slate-700 bg-slate-800 overflow-y-auto shadow-2xl animate-slide-in">
                <div className="p-4">
                  <DrawingTools />
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto relative">
          {!apiResult ? (
            <>
              <Canvas
                canvasRef={canvasRef}
                toolMode={toolMode}
                currentColor={currentColor}
                lineWidth={lineWidth}
                saveToHistory={saveToHistory}
                onDrawingComplete={handleDrawingComplete}
                isReadOnly={gameState.isActive && !isDrawer}
                drawingData={gameState.drawingData}
              />
              {displaySidebar && (
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute top-4 right-4 px-4 py-2.5 rounded-lg bg-red-900/90 border-2 border-red-700 text-sm font-semibold text-red-200 hover:bg-red-900 hover:border-red-600 transition-all shadow-lg backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Canvas
                  </span>
                </button>
              )}
            </>
          ) : (
            <Result apiResult={apiResult} />
          )}
        </div>

        <div className="hidden lg:flex w-80 flex-shrink-0 border-l-2 border-slate-700 bg-slate-800 flex-col overflow-hidden shadow-sm">
          {!apiResult && !gameState.isActive && (
            <div className="flex-shrink-0 border-b-2 border-slate-700">
              <GenerateDrawing
                handleSubmit={handleSubmit}
                loading={loading}
                gameState={gameState}
              />
            </div>
          )}

          <div className="flex-shrink-0 border-b-2 border-slate-700">
            <GameStatus
              users={users}
              gameState={gameState}
              availableGames={availableGames}
              onCreateGame={createGame}
              onJoinGame={joinGame}
              onStartGame={startGame}
              onEndGame={endGame}
              onLeaveGame={leaveGame}
              onSetDifficulty={setDifficulty}
              isConnected={isConnected}
              isDrawer={isDrawer}
              playerName={playerName}
              onPlayerNameChange={onPlayerNameChange}
            />
          </div>

          {gameState.isActive && (
            <div className="flex-1 overflow-hidden">
              <Chat
                gameState={gameState}
                onGuess={submitGuess}
                isDrawer={isDrawer}
                playerId={playerId}
              />
            </div>
          )}
        </div>

        {showRightPanel && (
          <div className="lg:hidden absolute inset-y-0 right-0 w-80 z-10 border-l-2 border-slate-700 bg-slate-800 flex flex-col overflow-hidden shadow-2xl animate-slide-in">
            {!apiResult && !gameState.isActive && (
              <div className="flex-shrink-0 border-b-2 border-slate-700">
                <GenerateDrawing
                  handleSubmit={handleSubmit}
                  loading={loading}
                  gameState={gameState}
                />
              </div>
            )}

            <div className="flex-shrink-0 border-b-2 border-slate-700">
              <GameStatus
                users={users}
                gameState={gameState}
                availableGames={availableGames}
                onCreateGame={createGame}
                onJoinGame={joinGame}
                onStartGame={startGame}
                onEndGame={endGame}
                onLeaveGame={leaveGame}
                onSetDifficulty={setDifficulty}
                isConnected={isConnected}
                isDrawer={isDrawer}
                playerName={playerName}
                onPlayerNameChange={onPlayerNameChange}
              />
            </div>

            {gameState.isActive && (
              <div className="flex-1 overflow-hidden">
                <Chat
                  gameState={gameState}
                  onGuess={submitGuess}
                  isDrawer={isDrawer}
                  playerId={playerId}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
