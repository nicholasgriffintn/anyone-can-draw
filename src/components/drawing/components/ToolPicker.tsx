interface ToolPickerProps {
  isFillMode: boolean;
  setIsFillMode: (isFillMode: boolean) => void;
}

export function ToolPicker({ isFillMode, setIsFillMode }: ToolPickerProps) {
  const activeClasses =
    "bg-slate-900 text-white border-slate-900 shadow-sm";
  const inactiveClasses = "bg-white text-slate-700 border-slate-200";

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setIsFillMode(false)}
        className={`flex-1 px-3 py-2 rounded-md border text-sm ${
          !isFillMode ? activeClasses : inactiveClasses
        }`}
      >
        Brush
      </button>
      <button
        type="button"
        onClick={() => setIsFillMode(true)}
        className={`flex-1 px-3 py-2 rounded-md border text-sm ${
          isFillMode ? activeClasses : inactiveClasses
        }`}
      >
        Fill
      </button>
    </div>
  );
}
