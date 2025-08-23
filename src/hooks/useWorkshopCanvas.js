import { useCallback } from "react";
import { getFabric } from "@/lib/fabricWrapper";

export default function useWorkshopCanvas(fabricCanvasRef, canvasRef, containerRef) {
  // Initialize canvas
  const initCanvas = useCallback(async () => {
    try {
      // Dispose existing canvas if it exists
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      
      const fabric = await getFabric();
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        selection: true,
        preserveObjectStacking: true,
      });
      
      return canvas;
    } catch (error) {
      console.error("Error initializing canvas:", error);
      throw error;
    }
  }, [canvasRef, containerRef, fabricCanvasRef]);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    fabricCanvasRef.current.setDimensions({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    
    fabricCanvasRef.current.renderAll();
  }, [fabricCanvasRef, containerRef]);

  // Create base plate
  const createBasePlate = useCallback(async (config, shapeType) => {
    if (!fabricCanvasRef.current) return;
    
    const fabric = await getFabric();
    const canvas = fabricCanvasRef.current;
    
    // Clear existing objects
    canvas.clear();
    
    // Create base plate rectangle
    const rect = new fabric.Rect({
      width: config.width,
      height: config.height,
      fill: config.color || '#555555',
      originX: 'center',
      originY: 'center',
      left: canvas.width / 2,
      top: canvas.height / 2,
      selectable: false,
      id: 'basePlate',
      weight: config.weight || 0,
    });
    
    canvas.add(rect);
    canvas.renderAll();
    
    return rect;
  }, [fabricCanvasRef]);

  // Add cut
  const addCut = useCallback(async (cutConfig) => {
    if (!fabricCanvasRef.current) return;
    
    const fabric = await getFabric();
    const canvas = fabricCanvasRef.current;
    
    const rect = new fabric.Rect({
      width: cutConfig.width,
      height: cutConfig.height,
      fill: cutConfig.color || '#ff9900',
      originX: 'center',
      originY: 'center',
      left: canvas.width / 2,
      top: canvas.height / 2,
      id: 'cut_' + Date.now(),
      weight: cutConfig.weight || 0,
    });
    
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    
    return rect;
  }, [fabricCanvasRef]);

  // Add horizontal cut
  const addCutHorizontal = useCallback(async (cutConfig) => {
    // Implementasi untuk potongan horizontal
    return addCut({
      ...cutConfig,
      // Tambahkan properti khusus untuk potongan horizontal jika diperlukan
    });
  }, [addCut]);

  // Add vertical cut
  const addCutVertical = useCallback(async (cutConfig) => {
    // Implementasi untuk potongan vertikal
    return addCut({
      ...cutConfig,
      // Tambahkan properti khusus untuk potongan vertikal jika diperlukan
    });
  }, [addCut]);

  // Update remaining weight
  const updateRemainingWeight = useCallback(() => {
    // Logika untuk menghitung berat yang tersisa
    return 0; // Placeholder
  }, []);

  // Minimap functions
  const showMinimap = useCallback(() => {
    // Logika untuk menampilkan minimap
  }, []);

  const hideMinimap = useCallback(() => {
    // Logika untuk menyembunyikan minimap
  }, []);

  const updateMinimap = useCallback(() => {
    // Logika untuk memperbarui minimap
  }, []);

  return {
    initCanvas,
    resizeCanvas,
    createBasePlate,
    addCut,
    addCutHorizontal,
    addCutVertical,
    updateRemainingWeight,
    showMinimap,
    hideMinimap,
    updateMinimap,
  };
}