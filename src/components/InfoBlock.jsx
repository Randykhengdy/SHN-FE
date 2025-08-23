import React from "react";

export default function InfoBlock({ label, value, unit }) {
  return (
    <span className="info-block bg-gray-100 px-3 py-2 rounded-md inline-flex flex-col">
      <span className="info-label text-xs text-gray-500">{label}</span>
      <span className="info-value-unit font-medium">
        {value}
        {unit && <span className="info-unit text-xs ml-1">{unit}</span>}
      </span>
    </span>
  );
}