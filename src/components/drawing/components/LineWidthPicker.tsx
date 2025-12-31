import { LINE_WIDTHS } from "../constants";

interface LineWidthPickerProps {
  lineWidth: number;
  setLineWidth: (width: number) => void;
}

export function LineWidthPicker({
  lineWidth,
  setLineWidth,
}: LineWidthPickerProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-300">
            Line Width
          </label>
          <span className="text-sm font-medium text-purple-400 bg-purple-900/50 px-2 py-0.5 rounded-full">
            {lineWidth}px
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LINE_WIDTHS.map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => setLineWidth(width)}
              className={`p-2 h-14 rounded-lg flex items-center justify-center border-2 transition-all ${
                lineWidth === width
                  ? 'border-purple-500 bg-purple-900/50 shadow-md'
                  : 'border-slate-600 hover:border-purple-500 hover:bg-slate-700'
              }`}
              title={`${width}px`}
            >
              <div className="w-full flex items-center justify-center">
                <div
                  className={`rounded-full transition-all ${
                    lineWidth === width ? 'bg-purple-500' : 'bg-slate-400'
                  }`}
                  style={{
                    width: `${width}px`,
                    height: `${width}px`,
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-2 border-slate-700 rounded-xl bg-slate-700/50">
        <div className="text-xs font-medium text-slate-400 mb-2">Preview</div>
        <div
          className="w-full rounded-full bg-purple-500 transition-all duration-300"
          style={{
            height: `${lineWidth}px`,
            marginTop: '12px',
          }}
        />
      </div>
    </>
  );
}
