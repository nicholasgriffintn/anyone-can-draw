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
          <label className="text-sm font-semibold text-slate-700">
            Line Width
          </label>
          <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">{lineWidth}px</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LINE_WIDTHS.map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => setLineWidth(width)}
              className={`p-2 h-14 rounded-lg flex items-center justify-center border-2 transition-all ${
                lineWidth === width
                  ? "border-purple-500 bg-purple-50 shadow-md"
                  : "border-slate-200 hover:border-purple-300 hover:bg-purple-50"
              }`}
              title={`${width}px`}
            >
              <div className="w-full flex items-center justify-center">
                <div
                  className={`rounded-full transition-all ${
                    lineWidth === width ? "bg-purple-600" : "bg-slate-700"
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

      <div className="p-4 border-2 border-purple-200 rounded-xl bg-purple-50">
        <div className="text-xs font-medium text-slate-600 mb-2">Preview</div>
        <div className="w-full h-[2px] bg-slate-200 rounded-full" />
        <div
          className="w-full rounded-full bg-purple-600 transition-all duration-300"
          style={{
            height: `${lineWidth}px`,
            marginTop: "12px",
          }}
        />
      </div>
    </>
  );
}
