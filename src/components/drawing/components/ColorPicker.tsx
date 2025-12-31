import { COLORS } from "../constants";

interface ColorPickerProps {
  currentColor: string;
  setCurrentColor: (color: string) => void;
}

export function ColorPicker({ currentColor, setCurrentColor }: ColorPickerProps) {
  return (
    <>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
        <input
          type="color"
          value={currentColor}
          onChange={(event) => setCurrentColor(event.target.value)}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-500 shadow-md hover:shadow-lg transition-all"
          title="Custom Color"
        />
        <div>
          <span className="text-sm font-medium text-slate-300 block">Custom Color</span>
          <span className="text-xs text-slate-400">{currentColor}</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2.5">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setCurrentColor(color)}
            className="w-11 h-11 rounded-lg transition-all hover:scale-105 hover:shadow-md relative"
            style={{
              backgroundColor: color,
              outline: color === currentColor ? "3px solid #7c3aed" : "none",
              outlineOffset: "2px",
              transform: color === currentColor ? "scale(1.05)" : "scale(1)",
              boxShadow: color === currentColor ? "0 2px 8px rgba(124, 58, 237, 0.3)" : "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
            aria-label={`Select ${color} color`}
          >
            {color === currentColor && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
