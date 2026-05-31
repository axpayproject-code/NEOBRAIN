import { useState } from "react";
import { PH_REGIONS } from "@/lib/philippineRegions";

interface RegionSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function RegionSelect({ value, onChange, className = "", placeholder = "Select region", required, id }: RegionSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30 ${className}`}
    >
      <option value="">{placeholder}</option>
      {PH_REGIONS.map(r => (
        <option key={r.id} value={r.id}>{r.name}</option>
      ))}
    </select>
  );
}

interface RegionProvinceSelectProps {
  regionValue: string;
  provinceValue: string;
  onRegionChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

export function RegionProvinceSelect({ regionValue, provinceValue, onRegionChange, onProvinceChange, className = "", required }: RegionProvinceSelectProps) {
  const selectedRegion = PH_REGIONS.find(r => r.id === regionValue);

  return (
    <div className={`space-y-2 ${className}`}>
      <select
        value={regionValue}
        onChange={e => { onRegionChange(e.target.value); onProvinceChange(""); }}
        required={required}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
      >
        <option value="">Select region</option>
        {PH_REGIONS.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      {selectedRegion && selectedRegion.provinces.length > 0 && (
        <select
          value={provinceValue}
          onChange={e => onProvinceChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0038A8]/30"
        >
          <option value="">Select province / city</option>
          {selectedRegion.provinces.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export function regionName(regionId: string): string {
  return PH_REGIONS.find(r => r.id === regionId)?.name ?? regionId;
}
