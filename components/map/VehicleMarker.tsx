export function createMarkerElement(
  type: "origin" | "midpoint" | "destination" | "moving" | "parked" | "offline",
  label?: string
): HTMLElement {
  const el = document.createElement("div");
  el.className = "flex items-center justify-center cursor-pointer transition-transform hover:scale-110";

  if (type === "origin") {
    el.innerHTML = `
      <div class="w-5 h-5 rounded-full bg-white border-[3px] border-[#107557] shadow-md flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-[#107557]"></div>
      </div>
    `;
  } else if (type === "midpoint") {
    el.innerHTML = `
      <div class="w-4 h-4 rounded-full bg-white border-[2.5px] border-amber-500 shadow-md flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
      </div>
    `;
  } else if (type === "destination") {
    el.innerHTML = `
      <div class="relative flex items-center justify-center w-7 h-7">
        <div class="absolute w-7 h-7 rounded-full bg-emerald-400 opacity-40 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-white border-[3px] border-emerald-600 shadow-md flex items-center justify-center z-10">
          <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
        </div>
      </div>
    `;
  } else {
    const color = type === "moving" ? "#10b981" : type === "parked" ? "#f59e0b" : "#ef4444";
    el.innerHTML = `
      <div class="flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-md border border-gray-200/80 text-[10px] font-semibold text-gray-800">
        <span class="w-2 h-2 rounded-full" style="background-color: ${color};"></span>
        <span>${label || "Vehicle"}</span>
      </div>
    `;
  }

  return el;
}
