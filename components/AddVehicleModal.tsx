"use client";

import { useState } from "react";

interface DriverOption {
  id: string;
  full_name: string;
  license_number: string;
}

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded: () => void;
  drivers?: DriverOption[];
}

export default function AddVehicleModal({
  isOpen,
  onClose,
  onVehicleAdded,
  drivers = [],
}: AddVehicleModalProps) {
  const [registration, setRegistration] = useState("");
  const [manufacturer, setManufacturer] = useState("Tata Motors");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState("Light Commercial Vehicle");
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState<"idle" | "moving" | "offline">("idle");
  const [fuelLevel, setFuelLevel] = useState("85");
  const [batteryLevel, setBatteryLevel] = useState("90");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_number: registration,
          manufacturer,
          model,
          vehicle_type: vehicleType,
          driver_id: driverId || null,
          status,
          fuel_level: vehicleType.includes("Electric") ? null : Number(fuelLevel),
          battery_level: Number(batteryLevel),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create vehicle.");
      }

      onVehicleAdded();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating vehicle";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Add New Vehicle</h3>
            <p className="text-xs text-gray-500">Register a commercial asset to your Northstar fleet</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KA 03 MN 4821"
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 uppercase placeholder:normal-case focus:outline-none focus:border-[#11382b]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Manufacturer *
              </label>
              <select
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#11382b] bg-white cursor-pointer"
              >
                <option value="Tata Motors">Tata Motors</option>
                <option value="Mahindra">Mahindra</option>
                <option value="Ashok Leyland">Ashok Leyland</option>
                <option value="Eicher Motors">Eicher Motors</option>
                <option value="BharatBenz">BharatBenz</option>
                <option value="Volvo Trucks">Volvo Trucks</option>
                <option value="Force Motors">Force Motors</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ace Gold / Bolero"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#11382b]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Vehicle Type *
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#11382b] bg-white cursor-pointer"
              >
                <option value="Light Commercial Vehicle">Light Commercial Vehicle</option>
                <option value="Delivery Van">Delivery Van</option>
                <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                <option value="Electric Commercial Vehicle">Electric Commercial Vehicle (EV)</option>
                <option value="Refrigerated Reefer">Refrigerated Reefer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Assign Driver
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#11382b] bg-white cursor-pointer"
              >
                <option value="">No driver assigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.license_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "idle" | "moving" | "offline")}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#11382b] bg-white cursor-pointer"
              >
                <option value="idle">Parked / Idle</option>
                <option value="moving">In trip / Moving</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Fuel Level (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#11382b]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Battery Level (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#11382b]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-[#11382b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c2a20] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {isLoading ? "Saving Vehicle..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
