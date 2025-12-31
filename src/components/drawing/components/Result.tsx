import { getImageUrl } from "../utils";
import type { DrawingResponse } from "../types";

export function Result({ apiResult }: { apiResult: DrawingResponse | null }) {
  if (!apiResult) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {apiResult.response?.data?.drawingUrl?.key && (
        <div className="space-y-3 w-full">
          <h3 className="text-lg font-medium text-slate-800">Your Drawing</h3>
          <div className="bg-white relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={getImageUrl(apiResult.response.data.drawingUrl.key)}
              alt="Your drawing"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      {apiResult.response?.data?.paintingUrl?.key && (
        <div className="space-y-3 w-full">
          <h3 className="text-lg font-medium text-slate-800">
            AI Generated Painting
          </h3>
          <div className="bg-white relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={getImageUrl(apiResult.response.data.paintingUrl.key)}
              alt="AI generated painting"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
