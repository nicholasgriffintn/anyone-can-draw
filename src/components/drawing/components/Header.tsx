interface HeaderProps {
  undo: () => void;
  redo: () => void;
  history: ImageData[];
  historyIndex: number;
}

export function Header({ undo, redo, history, historyIndex }: HeaderProps) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
      <h3 className="text-sm font-semibold text-slate-800">Drawing Tools</h3>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="h-7 px-2.5 rounded-md border border-slate-200 text-xs disabled:opacity-50 hover:bg-slate-50 transition-colors"
          title="Undo (Cmd+Z)"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="h-7 px-2.5 rounded-md border border-slate-200 text-xs disabled:opacity-50 hover:bg-slate-50 transition-colors"
          title="Redo (Cmd+Shift+Z)"
        >
          Redo
        </button>
      </div>
    </div>
  );
}
