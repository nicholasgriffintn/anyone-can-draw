import { config } from "../config";
import type { DrawingResponse } from "../components/drawing/types";

function normalizeBaseUrl(baseUrl: string) {
  if (baseUrl.endsWith("/")) {
    return baseUrl.slice(0, -1);
  }
  return baseUrl;
}

export async function generateDrawing(
  drawingData: string
): Promise<DrawingResponse> {
  const { baseUrl } = config.drawingApi;

  const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, "");
  const binaryData = Uint8Array.from(atob(base64Data), (char) =>
    char.charCodeAt(0)
  );
  const blob = new Blob([binaryData], { type: "image/png" });

  const formData = new FormData();
  formData.append("drawing", blob, "drawing.png");

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/drawing`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to submit drawing (${response.status}): ${errorText}`
    );
  }

  return response.json() as Promise<DrawingResponse>;
}
