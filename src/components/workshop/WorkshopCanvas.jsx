import React from "react";
import { Stage, Layer, Rect, Text } from "react-konva";

export default function WorkshopCanvas({ shapeType, basePlate, cuts, hasBase }) {
  const SCALE = 5, PAD = 10;
  const baseWidthPx  = (basePlate?.width  || 0) * SCALE;
  const baseHeightPx = (shapeType === "1D" ? (basePlate?.height || 10) : (basePlate?.height || 0)) * SCALE;

  return (
    <div className="border rounded overflow-auto bg-gray-50 w-full h-full">
      <Stage width={baseWidthPx + PAD * 2} height={baseHeightPx + PAD * 2}>
        <Layer>
          {hasBase ? (
            <>
              <Rect
                x={PAD} y={PAD}
                width={baseWidthPx} height={baseHeightPx}
                fill={basePlate?.color || "#b0bec5"}
                stroke="black" strokeWidth={1}
              />
              {cuts.map((c, i) => {
                const w = (c.width || 0) * SCALE;
                const h = ((shapeType === "1D" ? basePlate.height : c.height) || 0) * SCALE;
                const x = c.x ?? PAD;
                const y = c.y ?? PAD;
                return (
                  <Rect key={i} x={x} y={y} width={w} height={h}
                        fill={c.color || "#ff9900"} stroke="black" strokeWidth={0.5}/>
                );
              })}
            </>
          ) : (
            <>
              <Rect
                x={PAD} y={PAD}
                width={baseWidthPx} height={baseHeightPx}
                dash={[6, 6]} stroke="#bbb" strokeWidth={1}
              />
              <Text
                x={PAD} y={PAD + 8}
                text="Klik 'Create Base' untuk mulai"
                fill="#888"
              />
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
}
