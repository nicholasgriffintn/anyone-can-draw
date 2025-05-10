"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "../ui/sheet";
import { Menu } from "lucide-react";

import type { DrawingResponse, DrawingCanvasProps } from "./types";
import { ColorPicker } from "./Components/ColorPicker";
import { LineWidthPicker } from "./Components/LineWidthPicker";
import { ToolPicker } from "./Components/ToolPicker";
import { Header } from "./Components/Header";
import { Result } from "./Components/Result";
import { Canvas } from "./Components/Canvas";
import { useGameState } from "./hooks/useGameState";
import { GameStatus } from "./Components/GameStatus";
import { Chat } from "./Components/Chat";
import { GenerateDrawing } from "./Components/GenerateDrawing";
import { DEFAULT_GAME_STATE } from "./constants";

export function DrawingCanvas({
	user,
	onSubmit,
	result,
	gameMode,
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
	const [isToolsOpen, setIsToolsOpen] = useState(false);
	const MAX_HISTORY_SIZE = 20; // Limit history to prevent memory issues

	const saveToHistory = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		try {
			// Create a scaled down version if canvas is too large
			let width = canvas.width;
			let height = canvas.height;
			
			// If canvas is very large, scale down the history storage
			const MAX_DIMENSION = 2000;
			const isLargeCanvas = width > MAX_DIMENSION || height > MAX_DIMENSION;
			
			if (isLargeCanvas) {
				const scale = MAX_DIMENSION / Math.max(width, height);
				width = Math.floor(width * scale);
				height = Math.floor(height * scale);
				
				// Create a temporary scaled canvas for storage
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = width;
				tempCanvas.height = height;
				const tempCtx = tempCanvas.getContext('2d');
				
				if (!tempCtx) return;
				
				// Draw scaled version
				tempCtx.drawImage(canvas, 0, 0, width, height);
				const imageData = tempCtx.getImageData(0, 0, width, height);
				
				// Trim history if it's too large
				const newHistory = history.slice(0, historyIndex + 1);
				newHistory.push(imageData);
				
				// Limit history size
				while (newHistory.length > MAX_HISTORY_SIZE) {
					newHistory.shift();
				}
				
				setHistory(newHistory);
				setHistoryIndex(newHistory.length - 1);
			} else {
				// Regular behavior for smaller canvases
				const imageData = ctx.getImageData(0, 0, width, height);
				
				// Trim history if it's too large
				const newHistory = history.slice(0, historyIndex + 1);
				newHistory.push(imageData);
				
				// Limit history size
				while (newHistory.length > MAX_HISTORY_SIZE) {
					newHistory.shift();
				}
				
				setHistory(newHistory);
				setHistoryIndex(newHistory.length - 1);
			}
		} catch (err) {
			console.error("Failed to save canvas history:", err);
			// Continue without saving history if we encounter memory issues
		}
	};

	const undo = () => {
		if (historyIndex <= 0) return;

		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		try {
			const newIndex = historyIndex - 1;
			const imageData = history[newIndex];
			if (!imageData) return;

			// If we stored a scaled version, we need to scale back up
			if (imageData.width !== canvas.width || imageData.height !== canvas.height) {
				// Create a temporary canvas with the scaled size
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = imageData.width;
				tempCanvas.height = imageData.height;
				const tempCtx = tempCanvas.getContext('2d');
				
				if (!tempCtx) return;
				
				// Put the image data into the temp canvas
				tempCtx.putImageData(imageData, 0, 0);
				
				// Clear the main canvas
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				
				// Draw the temp canvas onto the main canvas, scaling it up
				ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
			} else {
				// Regular behavior for same-sized images
				ctx.putImageData(imageData, 0, 0);
			}
			
			setHistoryIndex(newIndex);
		} catch (err) {
			console.error("Failed to undo:", err);
		}
	};

	const redo = () => {
		if (historyIndex >= history.length - 1) return;

		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		try {
			const newIndex = historyIndex + 1;
			const imageData = history[newIndex];
			if (!imageData) return;

			// If we stored a scaled version, we need to scale back up
			if (imageData.width !== canvas.width || imageData.height !== canvas.height) {
				// Create a temporary canvas with the scaled size
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = imageData.width;
				tempCanvas.height = imageData.height;
				const tempCtx = tempCanvas.getContext('2d');
				
				if (!tempCtx) return;
				
				// Put the image data into the temp canvas
				tempCtx.putImageData(imageData, 0, 0);
				
				// Clear the main canvas
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				
				// Draw the temp canvas onto the main canvas, scaling it up
				ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
			} else {
				// Regular behavior for same-sized images
				ctx.putImageData(imageData, 0, 0);
			}
			
			setHistoryIndex(newIndex);
		} catch (err) {
			console.error("Failed to redo:", err);
		}
	};

	const clearCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;
		
		try {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			saveToHistory();
		} catch (err) {
			console.error("Failed to clear canvas:", err);
			
			// Fallback if saveToHistory fails
			try {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			} catch (e) {
				console.error("Critical failure in clearCanvas:", e);
			}
		}
	};

	const initCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!ctx || !canvas) return;

		try {
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			setHistory([imageData]);
			setHistoryIndex(0);
		} catch (err) {
			console.error("Failed to initialize canvas:", err);
			// Initialize with empty history if we can't get image data
			setHistory([]);
			setHistoryIndex(-1);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		initCanvas();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const handleKeyboard = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "z") {
				if (e.shiftKey) {
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

	const playerId = user?.id || "";
	const playerName = user?.name || "";

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
	} = gameMode
		? useGameState(playerId, playerName, gameId, clearCanvas)
		: {
				isConnected: false,
				gameState: DEFAULT_GAME_STATE,
				users: [],
				availableGames: [],
			};

	const handleDrawingComplete = async () => {
		if (
			gameState.isActive &&
			canvasRef.current &&
			gameState.currentDrawer === playerId
		) {
			if (updateDrawing) {
				const drawingData = canvasRef.current.toDataURL("image/png");
				await updateDrawing(drawingData);
			}
		}
	};

	const isDrawer = gameState.currentDrawer === playerId;

	const displaySidebar =
		!gameState.isActive || (gameState.isActive && isDrawer);

	const DrawingTools = () => (
		<div className="flex flex-col gap-4 p-4 bg-card rounded-lg border shadow-sm">
			<Header
				undo={undo}
				redo={redo}
				history={history}
				historyIndex={historyIndex}
			/>

			<ToolPicker isFillMode={isFillMode} setIsFillMode={setIsFillMode} />

			<LineWidthPicker lineWidth={lineWidth} setLineWidth={setLineWidth} />

			<ColorPicker
				currentColor={currentColor}
				setCurrentColor={setCurrentColor}
			/>

			<Button
				onClick={clearCanvas}
				variant="outline"
				size="sm"
				className="w-full text-muted-foreground"
			>
				Clear Canvas
			</Button>
		</div>
	);

	return (
		<div className="flex flex-col gap-4 w-full mx-auto">
			<div className="flex flex-col lg:flex-row gap-4">
				{!result && (
					<div className="flex flex-col lg:flex-row gap-4 w-full">
						{displaySidebar && (
							<div className="w-full lg:w-64 hidden lg:flex flex-col gap-4">
								<DrawingTools />
							</div>
						)}

						<div className="flex-1 flex flex-col gap-4">
							{displaySidebar && (
								<div className="lg:hidden">
									<Sheet open={isToolsOpen} onOpenChange={setIsToolsOpen}>
										<SheetTrigger asChild>
											<Button variant="outline" className="w-full">
												<Menu className="mr-2 h-4 w-4" /> Drawing Tools
											</Button>
										</SheetTrigger>
										<SheetContent side="bottom" className="h-[80vh]">
											<SheetHeader>
												<SheetTitle>Drawing Tools</SheetTitle>
											</SheetHeader>
											<DrawingTools />
										</SheetContent>
									</Sheet>
								</div>
							)}

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
						</div>

						<div className="w-full lg:w-80 flex flex-col gap-4">
							{!gameState.isActive && (
								<GenerateDrawing
									handleSubmit={handleSubmit}
									loading={loading}
									gameState={gameState}
								/>
							)}

							{gameMode && (
								<>
									<div className="bg-card rounded-lg border shadow-sm">
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
										/>
									</div>

									{gameState.isActive && (
										<Chat
											gameState={gameState}
											onGuess={submitGuess}
											isDrawer={isDrawer}
										/>
									)}
								</>
							)}
						</div>
					</div>
				)}

				{result && <Result apiResult={apiResult} />}
			</div>
		</div>
	);
}
