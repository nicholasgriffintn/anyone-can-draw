import { useEffect, useRef, useState } from "react";

import type { DrawingResponse } from "./types";
import { ColorPicker } from "./components/ColorPicker";
import { LineWidthPicker } from "./components/LineWidthPicker";
import { ToolPicker } from "./components/ToolPicker";
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
  const [isFillMode, setIsFillMode] = useState(false);
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
      <ToolPicker isFillMode={isFillMode} setIsFillMode={setIsFillMode} />
      <LineWidthPicker lineWidth={lineWidth} setLineWidth={setLineWidth} />
      <ColorPicker currentColor={currentColor} setCurrentColor={setCurrentColor} />
      <button
        type="button"
        onClick={clearCanvas}
        className="w-full px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 hover:bg-red-100 transition-colors"
      >
        Clear Canvas
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {apiResult && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">AI Result</span>
          <button
            type="button"
            onClick={() => setApiResult(null)}
            className="px-3 py-1.5 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
          >
            New Drawing
          </button>
        </div>
      )}

      <div className="lg:hidden flex-shrink-0 px-4 py-2 border-b border-slate-200 bg-white flex gap-2">
        {displaySidebar && (
          <button
            type="button"
            onClick={() => {
              setShowLeftPanel(!showLeftPanel);
              setShowRightPanel(false);
            }}
            className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
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
          className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
        >
          {showRightPanel ? "Hide Panel" : "Show Panel"}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {displaySidebar && (
          <>
            <div className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
              <div className="p-3">
                <DrawingTools />
              </div>
            </div>
            {showLeftPanel && (
              <div className="lg:hidden absolute inset-y-0 left-0 w-64 z-10 border-r border-slate-200 bg-white overflow-y-auto shadow-lg">
                <div className="p-3">
                  <DrawingTools />
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto">
          {!apiResult ? (
            <Canvas
              canvasRef={canvasRef}
              isFillMode={isFillMode}
              currentColor={currentColor}
              lineWidth={lineWidth}
              saveToHistory={saveToHistory}
              onDrawingComplete={handleDrawingComplete}
              isReadOnly={gameState.isActive && !isDrawer}
              drawingData={gameState.drawingData}
            />
          ) : (
            <Result apiResult={apiResult} />
          )}
        </div>

        <div className="hidden lg:flex w-80 flex-shrink-0 border-l border-slate-200 bg-white flex-col overflow-hidden">
          {!apiResult && !gameState.isActive && (
            <div className="flex-shrink-0 border-b border-slate-200">
              <GenerateDrawing
                handleSubmit={handleSubmit}
                loading={loading}
                gameState={gameState}
              />
            </div>
          )}

          <div className="flex-shrink-0 border-b border-slate-200">
            <GameStatus
              users={users}
              gameState={gameState}
              availableGames={availableGames}
              onCreateGame={createGame}
              onJoinGame={joinGame}
              onStartGame={startGame}
              onEndGame={endGame}
              onLeaveGame={leaveGame}
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
              />
            </div>
          )}
        </div>

        {showRightPanel && (
          <div className="lg:hidden absolute inset-y-0 right-0 w-80 z-10 border-l border-slate-200 bg-white flex flex-col overflow-hidden shadow-lg">
            {!apiResult && !gameState.isActive && (
              <div className="flex-shrink-0 border-b border-slate-200">
                <GenerateDrawing
                  handleSubmit={handleSubmit}
                  loading={loading}
                  gameState={gameState}
                />
              </div>
            )}

            <div className="flex-shrink-0 border-b border-slate-200">
              <GameStatus
                users={users}
                gameState={gameState}
                availableGames={availableGames}
                onCreateGame={createGame}
                onJoinGame={joinGame}
                onStartGame={startGame}
                onEndGame={endGame}
                onLeaveGame={leaveGame}
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
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
