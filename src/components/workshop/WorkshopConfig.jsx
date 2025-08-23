import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WorkshopConfig({
  shapeType,
  baseConfig,
  setBaseConfig,
  cutConfig,
  setCutConfig,
  remainingWeight,
  onCreateBase,
  onAddCutAuto,
  onAddCutHorizontal,
  onAddCutVertical,
  onDownloadPDF,
  onSaveProgress,
  onLoadProgress,
  onShowLayers,
}) {
  const [configVisible, setConfigVisible] = useState(true);

  const handleBaseConfigChange = (e) => {
    const { name, value, type } = e.target;
    setBaseConfig({
      ...baseConfig,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  const handleCutConfigChange = (e) => {
    const { name, value, type } = e.target;
    setCutConfig({
      ...cutConfig,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  return (
    <div className={`workshop-config ${configVisible ? 'w-80' : 'w-12'} transition-all duration-300 bg-card border-r`}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2" 
        onClick={() => setConfigVisible(!configVisible)}
      >
        {configVisible ? '◀' : '▶'}
      </Button>

      {configVisible && (
        <div className="p-4">
          <Tabs defaultValue="base">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="base">Base Plate</TabsTrigger>
              <TabsTrigger value="cut">Cut Options</TabsTrigger>
            </TabsList>
            
            <TabsContent value="base" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseWidth">
                    {shapeType === "1D" ? "Base Length (cm)" : "Base Width (cm)"}
                  </Label>
                  <Input
                    id="baseWidth"
                    name="width"
                    type="number"
                    value={baseConfig.width}
                    onChange={handleBaseConfigChange}
                  />
                </div>
                
                {shapeType === "2D" && (
                  <div className="space-y-2">
                    <Label htmlFor="baseHeight">Base Height (cm)</Label>
                    <Input
                      id="baseHeight"
                      name="height"
                      type="number"
                      value={baseConfig.height}
                      onChange={handleBaseConfigChange}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="baseWeight">Base Weight (kg)</Label>
                  <Input
                    id="baseWeight"
                    name="weight"
                    type="number"
                    value={baseConfig.weight}
                    onChange={handleBaseConfigChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseColor">Base Color</Label>
                  <Input
                    id="baseColor"
                    name="color"
                    type="color"
                    value={baseConfig.color}
                    onChange={handleBaseConfigChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">Remaining Weight</span>
                  <div className="text-lg font-bold">{remainingWeight} kg</div>
                </div>
                <Button onClick={onCreateBase}>
                  Create Base {shapeType === "1D" ? "Shaft" : "Plate"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="cut" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cutWidth">
                    {shapeType === "1D" ? "Cut Length (cm)" : "Cut Width (cm)"}
                  </Label>
                  <Input
                    id="cutWidth"
                    name="width"
                    type="number"
                    value={cutConfig.width}
                    onChange={handleCutConfigChange}
                  />
                </div>
                
                {shapeType === "2D" && (
                  <div className="space-y-2">
                    <Label htmlFor="cutHeight">Cut Height (cm)</Label>
                    <Input
                      id="cutHeight"
                      name="height"
                      type="number"
                      value={cutConfig.height}
                      onChange={handleCutConfigChange}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="cutColor">Cut Color</Label>
                  <Input
                    id="cutColor"
                    name="color"
                    type="color"
                    value={cutConfig.color}
                    onChange={handleCutConfigChange}
                  />
                </div>
              </div>
              
              {shapeType === "1D" ? (
                <Button className="w-full" onClick={onAddCutAuto}>
                  Add Cut (Auto)
                </Button>
              ) : (
                <>
                  <Button 
                    className="w-full bg-[#2c3e50] text-white hover:bg-[#34495e]" 
                    onClick={onAddCutHorizontal}
                  >
                    Add Cut (Horizontal)
                  </Button>
                  <Button 
                    className="w-full bg-[#34495e] text-white hover:bg-[#2c3e50]" 
                    onClick={onAddCutVertical}
                  >
                    Add Cut (Vertical)
                  </Button>
                </>
              )}
              
              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full bg-[#555555] hover:bg-[#444444]" 
                  onClick={onDownloadPDF}
                >
                  Download PDF
                </Button>
                <Button 
                  className="w-full bg-[#2c3e50] text-white hover:bg-[#34495e]" 
                  onClick={onSaveProgress}
                >
                  Save Progress
                </Button>
                <Button 
                  className="w-full bg-[#666666] text-white hover:bg-[#555555]" 
                  onClick={onLoadProgress}
                >
                  Load Progress
                </Button>
                <Button 
                  className="w-full bg-[#444444] text-white hover:bg-[#333333]" 
                  onClick={onShowLayers}
                >
                  Show Cut Layers
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}