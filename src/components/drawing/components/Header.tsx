interface HeaderProps {
  undo: () => void;
  redo: () => void;
  history: ImageData[];
  historyIndex: number;
}

export function Header({ undo, redo, history, historyIndex }: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium text-slate-800">Drawing Tools</h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="h-8 px-3 rounded-md border border-slate-200 text-sm disabled:opacity-50"
          title="Undo"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="h-8 px-3 rounded-md border border-slate-200 text-sm disabled:opacity-50"
          title="Redo"
        >
          Redo
        </button>
      </div>
    </div>
  );
}
