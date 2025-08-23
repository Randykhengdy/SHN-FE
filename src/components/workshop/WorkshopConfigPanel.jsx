// src/components/workshop/WorkshopControlPanel.jsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WorkshopControlPanel({
  baseConfig,
  onBaseConfigChange,
  onCreateBase,
  onAddCut,
  onSaveProgress,
  onLoadProgress,
  onShowLayers,
  onDownloadPDF,
  cutListLength,
  remainingWeight,
}) {
  const [cutConfig, setCutConfig] = useState({
    width: 20,
    height: 20,
    color: "#ff9900",
  });

  const handleCutChange = (e) => {
    const { name, value } = e.target;
    setCutConfig((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card className="w-[320px] p-4 space-y-6">
      <div>
        <h3 className="font-bold text-gray-700 mb-2">Plat Dasar</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="width">Lebar (cm)</Label>
            <Input
              id="width"
              name="width"
              type="number"
              value={baseConfig.width}
              onChange={onBaseConfigChange}
            />
          </div>
          <div>
            <Label htmlFor="height">Tinggi (cm)</Label>
            <Input
              id="height"
              name="height"
              type="number"
              value={baseConfig.height}
              onChange={onBaseConfigChange}
            />
          </div>
          <div>
            <Label htmlFor="weight">Berat (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="any"
              value={baseConfig.weight}
              onChange={onBaseConfigChange}
            />
          </div>
          <div>
            <Label htmlFor="color">Warna</Label>
            <Input
              id="color"
              name="color"
              type="color"
              value={baseConfig.color}
              onChange={onBaseConfigChange}
              className="h-10"
            />
          </div>
        </div>
        <Button className="w-full mt-4" onClick={onCreateBase}>
          Buat Plat Dasar
        </Button>
      </div>

      <div>
        <h3 className="font-bold text-gray-700 mb-2">Potongan</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cutWidth">Lebar (cm)</Label>
            <Input
              id="cutWidth"
              name="width"
              type="number"
              value={cutConfig.width}
              onChange={handleCutChange}
            />
          </div>
          <div>
            <Label htmlFor="cutHeight">Tinggi (cm)</Label>
            <Input
              id="cutHeight"
              name="height"
              type="number"
              value={cutConfig.height}
              onChange={handleCutChange}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="cutColor">Warna</Label>
            <Input
              id="cutColor"
              name="color"
              type="color"
              value={cutConfig.color}
              onChange={handleCutChange}
              className="h-10"
            />
          </div>
        </div>
        <Button className="w-full mt-3 bg-gray-800" onClick={() => onAddCut(cutConfig)}>
          Tambah Potongan
        </Button>
      </div>

      <div>
        <div className="text-sm text-gray-600 mb-1">Berat Sisa:</div>
        <div className="font-bold text-blue-700 text-lg">{remainingWeight.toFixed(2)} kg</div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <Button variant="outline" className="w-full" onClick={onDownloadPDF}>
          Download PDF
        </Button>
        <Button className="w-full bg-gray-700" onClick={onSaveProgress}>
          Simpan Progress
        </Button>
        <Button className="w-full bg-gray-600" onClick={onLoadProgress}>
          Muat Progress
        </Button>
        <Button className="w-full bg-gray-800" onClick={onShowLayers}>
          Tampilkan Layer Potongan ({cutListLength})
        </Button>
      </div>
    </Card>
  );
}
