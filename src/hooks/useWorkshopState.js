import { useState, useEffect, useCallback } from "react";

export default function useWorkshopState() {
  // Shape type state
  const [shapeType, setShapeType] = useState(localStorage.getItem("workshopShapeType") || "2D");
  
  // Base configuration
  const [baseConfig, setBaseConfig] = useState({
    width: shapeType === "1D" ? 100 : 300,
    height: 150,
    weight: 0,
    color: "#555555",
  });
  
  // Cut configuration
  const [cutConfig, setCutConfig] = useState({
    width: shapeType === "1D" ? 20 : 20,
    height: 30,
    color: "#ff9900",
  });
  
  // Cuts list
  const [cuts, setCuts] = useState([]);
  
  // Remaining weight
  const [remainingWeight, setRemainingWeight] = useState(0);
  
  // Modal states
  const [showShapeTypeModal, setShowShapeTypeModal] = useState(false);
  const [showCutLayersModal, setShowCutLayersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmCallback, setConfirmCallback] = useState(null);
  
  // Selected object
  const [selectedObject, setSelectedObject] = useState(null);
  
  // Save progress
  const saveProgress = useCallback(() => {
    const data = {
      shapeType,
      baseConfig,
      cuts,
      remainingWeight,
    };
    localStorage.setItem("workshopProgress", JSON.stringify(data));
    
    // Show confirmation
    setConfirmMessage("Progress berhasil disimpan!");
    setConfirmCallback(() => () => {});
    setShowConfirmDialog(true);
  }, [shapeType, baseConfig, cuts, remainingWeight]);
  
  // Load progress
  const loadProgress = useCallback(() => {
    const savedData = localStorage.getItem("workshopProgress");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setShapeType(data.shapeType || "2D");
        setBaseConfig(data.baseConfig || baseConfig);
        setCuts(data.cuts || []);
        setRemainingWeight(data.remainingWeight || 0);
        
        // Show confirmation
        setConfirmMessage("Progress berhasil dimuat!");
        setConfirmCallback(() => () => {});
        setShowConfirmDialog(true);
      } catch (error) {
        console.error("Error loading progress:", error);
        
        // Show error
        setConfirmMessage("Gagal memuat progress!");
        setConfirmCallback(() => () => {});
        setShowConfirmDialog(true);
      }
    } else {
      // Show message
      setConfirmMessage("Tidak ada progress tersimpan!");
      setConfirmCallback(() => () => {});
      setShowConfirmDialog(true);
    }
  }, [baseConfig]);
  
  // Download PDF
  const downloadPDF = useCallback(() => {
    // PDF generation logic would go here
    // This would use jsPDF and html2canvas as in the original code
  }, []);
  
  // Update shape type in localStorage when it changes
  useEffect(() => {
    localStorage.setItem("workshopShapeType", shapeType);
  }, [shapeType]);
  
  return {
    shapeType,
    setShapeType,
    baseConfig,
    setBaseConfig,
    cutConfig,
    setCutConfig,
    cuts,
    setCuts,
    remainingWeight,
    setRemainingWeight,
    showShapeTypeModal,
    setShowShapeTypeModal,
    showCutLayersModal,
    setShowCutLayersModal,
    showEditModal,
    setShowEditModal,
    showConfirmDialog,
    setShowConfirmDialog,
    confirmMessage,
    setConfirmMessage,
    confirmCallback,
    setConfirmCallback,
    selectedObject,
    setSelectedObject,
    saveProgress,
    loadProgress,
    downloadPDF,
  };
}