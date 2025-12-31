interface HeaderProps {
  undo: () => void;
  redo: () => void;
  history: ImageData[];
  historyIndex: number;
}

export function Header({ undo, redo, history, historyIndex }: HeaderProps) {
  return (
    <div className="pb-4 border-b-2 border-slate-700">
      <h3 className="text-base font-bold text-white mb-3">
        Drawing Tools
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="h-8 px-3 rounded-lg border-2 border-slate-600 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 hover:border-slate-500 transition-all hover:shadow-md disabled:hover:bg-transparent disabled:hover:border-slate-600 disabled:hover:shadow-none"
          title="Undo (Cmd+Z)"
        >
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </span>
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="h-8 px-3 rounded-lg border-2 border-slate-600 text-xs font-medium text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 hover:border-slate-500 transition-all hover:shadow-md disabled:hover:bg-transparent disabled:hover:border-slate-600 disabled:hover:shadow-none"
          title="Redo (Cmd+Shift+Z)"
        >
          <span className="flex items-center justify-end gap-1">
            Redo
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
