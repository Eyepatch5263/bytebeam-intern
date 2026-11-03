import type { FleetVehicle } from "@/app/hooks/useFleetVehicle";

export function renderVehiclePopupHTML(vehicle: FleetVehicle): string {
  const isMoving = vehicle.status === "moving";
  const isIdle = vehicle.status === "idle";
  const statusColor = isMoving
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isIdle
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-red-50 text-red-700 border-red-200";

  return `
    <div style="font-family: inherit; min-width: 200px; padding: 2px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 6px;">
        <span style="font-weight: 700; font-size: 13px; color: #111827;">${vehicle.registration_number}</span>
        <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 9999px; border: 1px solid #e5e7eb;" class="${statusColor}">
          ${vehicle.status}
        </span>
      </div>
      <div style="font-size: 11px; color: #4b5563; font-weight: 500;">${vehicle.manufacturer} ${vehicle.model}</div>
      <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">Driver: <strong>${vehicle.driver?.full_name || "Unassigned"}</strong></div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid #f3f4f6; font-size: 10px; font-family: monospace; color: #374151;">
        <span>Speed: <strong>${vehicle.current_speed || 0} km/h</strong></span>
        <span>Fuel: <strong>${vehicle.fuel_level ? vehicle.fuel_level + "%" : vehicle.battery_level ? vehicle.battery_level + "% (EV)" : "N/A"}</strong></span>
      </div>
      <button 
        type="button" 
        class="vehicle-inspect-btn" 
        data-vehicle-id="${vehicle.id}" 
        style="width: 100%; margin-top: 8px; padding: 5px 8px; font-size: 10px; font-weight: 600; color: #ffffff; background-color: #11382b; border: none; border-radius: 6px; cursor: pointer; text-align: center;"
      >
        View Operations Details →
      </button>
    </div>
  `;
}
