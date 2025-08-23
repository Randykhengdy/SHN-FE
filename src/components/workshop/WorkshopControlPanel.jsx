import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WorkshopControlPanel({
  basePlate, setBasePlate,
  onCreateBase, onAddCut,
  onSaveProgress, onLoadProgress,
  onDownloadPDF, onShowLayers,
  hasBase,                          // ⬅️ terima prop
  remainingWeight,                  // ⬅️ sudah ada di page
}) {
  const [cutConfig, setCutConfig] = useState({
    width: 20,
    height: 30,
    color: "#ff9900",
  });

  const handleBaseChange = (e) => {
    const { name, value } = e.target;
    setBasePlate((prev) => ({ ...prev, [name]: name === "color" ? value : parseFloat(value) || 0 }));
  };

  const handleCutChange = (e) => {
    const { name, value } = e.target;
    setCutConfig((prev) => ({ ...prev, [name]: name === "color" ? value : parseFloat(value) || 0 }));
  };

  return (
    <div className="w-[300px] shrink-0 bg-white shadow-md p-4 rounded-lg border space-y-6">
      <div>
        <h2 className="font-semibold mb-3">Base Plate</h2>
        <Label>Width (cm)</Label>
        <Input name="width" type="number" value={basePlate.width} onChange={handleBaseChange} />
        <Label className="mt-2">Height (cm)</Label>
        <Input name="height" type="number" value={basePlate.height} onChange={handleBaseChange} />
        <Label className="mt-2">Weight (kg)</Label>
        <Input name="weight" type="number" step="any" value={basePlate.weight} onChange={handleBaseChange} />
        <Label className="mt-2">Color</Label>
        <Input name="color" type="color" value={basePlate.color} onChange={handleBaseChange} />
        {hasBase && (
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">Remaining Weight:</div>
          <div className="font-bold text-blue-600 text-sm">{remainingWeight} kg</div>
        </div>
      )}
        <Button className="w-full mt-3" onClick={onCreateBase}>
          Create Base
        </Button>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Add Cut</h2>
        <Label>Width (cm)</Label>
        <Input name="width" type="number" value={cutConfig.width} onChange={handleCutChange} />
        <Label className="mt-2">Height (cm)</Label>
        <Input name="height" type="number" value={cutConfig.height} onChange={handleCutChange} />
        <Label className="mt-2">Color</Label>
        <Input name="color" type="color" value={cutConfig.color} onChange={handleCutChange} />
        <Button
          className="w-full mt-3"
          onClick={() => onAddCut(cutConfig)}
          disabled={!hasBase}          // ⬅️ cegah add sebelum base ada
        >
          Add Cut
        </Button>
      </div>

      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={onDownloadPDF}>
          Download PDF
        </Button>
        <Button className="w-full bg-gray-800" onClick={onSaveProgress}>
          Save Progress
        </Button>
        <Button className="w-full bg-gray-600" onClick={onLoadProgress}>
          Load Progress
        </Button>
        <Button className="w-full bg-gray-700" onClick={onShowLayers}>
          Show Cut Layers
        </Button>
      </div>
    </div>
  );
}
