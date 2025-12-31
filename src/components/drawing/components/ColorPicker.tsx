import { COLORS } from "../constants";

interface ColorPickerProps {
  currentColor: string;
  setCurrentColor: (color: string) => void;
}

export function ColorPicker({ currentColor, setCurrentColor }: ColorPickerProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={currentColor}
          onChange={(event) => setCurrentColor(event.target.value)}
          className="w-10 h-10 rounded-md cursor-pointer border border-slate-200 bg-white"
          title="Custom Color"
        />
        <span className="text-sm text-slate-600">Custom Color</span>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setCurrentColor(color)}
            className="aspect-square rounded-md transition-transform hover:scale-105"
            style={{
              backgroundColor: color,
              outline: color === currentColor ? "2px solid #2563eb" : "none",
              outlineOffset: "2px",
              transform: color === currentColor ? "scale(1.05)" : "scale(1)",
            }}
            aria-label={`Select ${color} color`}
          />
        ))}
      </div>
    </>
  );
}
