interface ToolPickerProps {
  isFillMode: boolean;
  setIsFillMode: (isFillMode: boolean) => void;
}

export function ToolPicker({ isFillMode, setIsFillMode }: ToolPickerProps) {
  const activeClasses =
    "bg-purple-600 text-white border-purple-600 shadow-md";
  const inactiveClasses = "bg-slate-700 text-slate-300 border-slate-600 hover:border-purple-500 hover:bg-slate-600";

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setIsFillMode(false)}
        className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
          !isFillMode ? activeClasses : inactiveClasses
        }`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Brush
        </span>
      </button>
      <button
        type="button"
        onClick={() => setIsFillMode(true)}
        className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
          isFillMode ? activeClasses : inactiveClasses
        }`}
      >
        <span className="flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
          Fill
        </span>
      </button>
    </div>
  );
}
