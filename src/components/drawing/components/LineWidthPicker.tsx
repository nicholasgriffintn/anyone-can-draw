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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Line Width
          </label>
          <span className="text-sm text-slate-500">{lineWidth}px</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LINE_WIDTHS.map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => setLineWidth(width)}
              className={`p-2 h-12 rounded-md flex items-center justify-center border transition ${
                lineWidth === width
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
              title={`${width}px`}
            >
              <div className="w-full flex items-center justify-center">
                <div
                  className="rounded-full bg-slate-800"
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

      <div className="p-3 border border-slate-200 rounded-md bg-white">
        <div className="w-full h-[2px] bg-slate-100" />
        <div
          className="w-full rounded-full bg-slate-800 transition-all"
          style={{
            height: `${lineWidth}px`,
            marginTop: "8px",
          }}
        />
      </div>
    </>
  );
}
