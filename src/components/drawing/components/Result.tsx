import type { DrawingResponse } from "../types";

export function Result({ apiResult }: { apiResult: DrawingResponse | null }) {
  if (!apiResult) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {apiResult.data?.data?.drawingUrl && (
        <div className="space-y-3 w-full">
          <h3 className="text-lg font-medium text-white">Your Drawing</h3>
          <div className="bg-white relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={apiResult.data.data.drawingUrl}
              alt="Your drawing"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      {apiResult.data?.data?.paintingUrl && (
        <div className="space-y-3 w-full">
          <h3 className="text-lg font-medium text-white">
            AI Generated Painting
          </h3>
          <div className="bg-white relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={apiResult.data.data.paintingUrl}
              alt="AI generated painting"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
