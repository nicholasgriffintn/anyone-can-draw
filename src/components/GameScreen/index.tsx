"use client";

import { useState } from "react";

import { DrawingCanvas } from "../DrawingCanvas";

export function GameScreen({
	user,
	onGenerateDrawing,
}: {
	user: {
		id: string;
		name: string;
		email: string;
		image: string;
	};
	onGenerateDrawing: (drawingData: string) => Promise<any>;
}) {
	const [result, setResult] = useState<string | null>(null);

	const handleSubmit = async (drawingData: string): Promise<any> => {
		try {
			const data = await onGenerateDrawing(drawingData);
			setResult(data as string);
			return data as any;
		} catch (error) {
			console.error("Error submitting drawing:", error);
			throw error;
		}
	};

	return (
		<DrawingCanvas user={user} onSubmit={handleSubmit} result={result} gameMode={true} />
	);
}
