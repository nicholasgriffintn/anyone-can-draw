export type ToolMode = 'brush' | 'fill' | 'eraser' | 'circle' | 'rectangle' | 'line';

interface ToolPickerProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
}

export function ToolPicker({ toolMode, setToolMode }: ToolPickerProps) {
  const activeClasses =
    "bg-purple-600 text-white border-purple-600 shadow-md";
  const inactiveClasses = "bg-slate-700 text-slate-300 border-slate-600 hover:border-purple-500 hover:bg-slate-600";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setToolMode('brush')}
          title="Brush"
          className={`flex-1 p-2.5 rounded-lg border transition-all ${
            toolMode === 'brush' ? activeClasses : inactiveClasses
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setToolMode('eraser')}
          title="Eraser"
          className={`flex-1 p-2.5 rounded-lg border transition-all ${
            toolMode === 'eraser' ? activeClasses : inactiveClasses
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5H9.75v-1.5h2.25v1.5h2.625c.621 0 1.125.504 1.125 1.125m1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5m1.5-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M6.75 18.375v-1.5m11.25 1.5v-1.5m-9 1.5v-1.5m6.75 1.5v-1.5" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setToolMode('fill')}
          title="Fill"
          className={`flex-1 p-2.5 rounded-lg border transition-all ${
            toolMode === 'fill' ? activeClasses : inactiveClasses
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setToolMode('circle')}
          title="Circle"
          className={`flex-1 p-2.5 rounded-lg border transition-all ${
            toolMode === 'circle' ? activeClasses : inactiveClasses
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setToolMode('rectangle')}
          title="Rectangle"
          className={`flex-1 p-2.5 rounded-lg border transition-all ${
            toolMode === 'rectangle' ? activeClasses : inactiveClasses
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <rect x="3" y="6" width="18" height="12" rx="2" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setToolMode('line')}
          title="Straight Line"
          className={`flex-1 p-2.5 rounded-lg border transition-all ${
            toolMode === 'line' ? activeClasses : inactiveClasses
          }`}
        >
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" d="M5 19L19 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
