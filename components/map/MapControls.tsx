"use client";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut }: MapControlsProps) {
  return (
    <>
      {/* Top Right Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur-xs rounded-lg border border-gray-200/80 shadow-xs overflow-hidden">
        <button
          onClick={onZoomIn}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 text-sm font-semibold transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="w-full h-px bg-gray-200" />
        <button
          onClick={onZoomOut}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 text-sm font-semibold transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Bottom Left Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-gray-200/80 shadow-xs flex items-center gap-3 text-[11px] font-medium text-gray-700">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Moving</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span>Parked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span>Needs attention</span>
        </div>
      </div>

      {/* Bottom Right Illustrative Map Label */}
      <div className="absolute bottom-3 right-3 z-10 text-[9.5px] font-mono text-gray-500/80 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded border border-gray-200/60 pointer-events-none">
        Illustrative map · Bengaluru
      </div>
    </>
  );
}
