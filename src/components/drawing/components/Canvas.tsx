import { useEffect, useRef, type RefObject } from "react";
import type { ToolMode } from "./ToolPicker";

interface CanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  toolMode: ToolMode;
  currentColor: string;
  lineWidth: number;
  saveToHistory: () => void;
  onDrawingComplete: () => void;
  isReadOnly?: boolean;
  drawingData?: string;
}

export function Canvas({
  canvasRef,
  toolMode,
  currentColor,
  lineWidth,
  saveToHistory,
  onDrawingComplete,
  isReadOnly = false,
  drawingData,
}: CanvasProps) {
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const shapeSnapshot = useRef<ImageData | null>(null);

  useEffect(() => {
    if (!drawingData || !canvasRef.current) return;

    const image = new Image();
    image.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(image, 0, 0);
    };
    image.src = drawingData;
  }, [drawingData, canvasRef]);

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const x =
      (("touches" in e && e.touches[0]
        ? e.touches[0].clientX
        : "clientX" in e
        ? e.clientX
        : 0) -
        rect.left) *
      scaleX;
    const y =
      (("touches" in e && e.touches[0]
        ? e.touches[0].clientY
        : "clientY" in e
        ? e.clientY
        : 0) -
        rect.top) *
      scaleY;

    if (toolMode === 'circle' || toolMode === 'rectangle' || toolMode === 'line') {
      if (shapeSnapshot.current) {
        ctx.putImageData(shapeSnapshot.current, 0, 0);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      if (toolMode === 'circle') {
        const radius = Math.sqrt(
          Math.pow(x - startX.current, 2) + Math.pow(y - startY.current, 2)
        );
        ctx.beginPath();
        ctx.arc(startX.current, startY.current, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (toolMode === 'rectangle') {
        ctx.beginPath();
        ctx.rect(
          startX.current,
          startY.current,
          x - startX.current,
          y - startY.current
        );
        ctx.stroke();
      } else if (toolMode === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX.current, startY.current);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(lastX.current, lastY.current);
      ctx.lineTo(x, y);

      if (toolMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = lineWidth * 2;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = lineWidth;
      }

      ctx.lineCap = "round";
      ctx.stroke();

      lastX.current = x;
      lastY.current = y;
    }
  };

  const floodFill = (startX: number, startY: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const canvas = canvasRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const targetColor = getPixelColor(data, startX, startY, canvas.width);
    const fillColor = hexToRgb(currentColor);

    if (!fillColor || colorsMatch(targetColor, fillColor)) return;

    const pixelsToCheck = [{ x: startX, y: startY }];
    const checkedPixels = new Set<string>();

    while (pixelsToCheck.length > 0) {
      const { x, y } = pixelsToCheck.pop()!;
      const key = `${x},${y}`;

      if (checkedPixels.has(key)) continue;
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

      checkedPixels.add(key);

      const currentColor = getPixelColor(data, x, y, canvas.width);
      if (!colorsMatch(currentColor, targetColor)) continue;

      setPixelColor(data, x, y, canvas.width, fillColor);

      pixelsToCheck.push({ x: x + 1, y });
      pixelsToCheck.push({ x: x - 1, y });
      pixelsToCheck.push({ x, y: y + 1 });
      pixelsToCheck.push({ x, y: y - 1 });
    }

    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
    onDrawingComplete();
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const index = (y * width + x) * 4;
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
      a: data[index + 3],
    };
  };

  const setPixelColor = (
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    color: { r: number; g: number; b: number }
  ) => {
    const index = (y * width + x) * 4;
    data[index] = color.r;
    data[index + 1] = color.g;
    data[index + 2] = color.b;
    data[index + 3] = 255;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const colorsMatch = (
    a: { r: number; g: number; b: number; a: number },
    b: { r: number; g: number; b: number }
  ) => {
    return a.r === b.r && a.g === b.g && a.b === b.b;
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x = 0, y = 0;
    if ("touches" in e && e.touches[0]) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else if ("clientX" in e && "clientY" in e) {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    lastX.current = x;
    lastY.current = y;
    startX.current = x;
    startY.current = y;

    if (toolMode === 'circle' || toolMode === 'rectangle' || toolMode === 'line') {
      shapeSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (toolMode === 'fill') {
      floodFill(Math.floor(x), Math.floor(y));
      isDrawing.current = false;
    }
  };

  const stopDrawing = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      shapeSnapshot.current = null;
      saveToHistory();
      onDrawingComplete();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isReadOnly) return;

    const handleMouseMove = (event: MouseEvent) => draw(event);
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      draw(event);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isReadOnly, currentColor, lineWidth, toolMode]);

  return (
    <>
      <span className="sr-only">
        Drawing Canvas {isReadOnly ? "ReadOnly" : "Editable"}
      </span>
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className={`bg-white border-2 border-purple-200 rounded-lg touch-none shadow-md ${
          isReadOnly ? "cursor-default" : "cursor-crosshair"
        }`}
        style={{
          width: '100%',
          maxWidth: '1200px',
          aspectRatio: '3/2',
          display: 'block'
        }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onBlur={stopDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
      />
    </>
  );
}
