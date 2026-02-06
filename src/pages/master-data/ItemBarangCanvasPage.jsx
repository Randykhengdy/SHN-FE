import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/useAlert';
import { request } from '@/lib/request';
import { ArrowLeft, Trash2, Plus, RotateCw, ZoomIn, ZoomOut, Maximize, Save, Unlock, Lock } from 'lucide-react';

const ItemBarangCanvasPage = ({ item, onClose }) => {
  const { showAlert } = useAlert();

  // Canvas refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // State
  const [boxes, setBoxes] = useState([]);
  const [baseContainer, setBaseContainer] = useState({ 
    width: parseFloat(item?.panjang) || 20, 
    height: parseFloat(item?.lebar) || 20, 
    x: 0, 
    y: 0 
  });
  const [gridSize, setGridSize] = useState(30);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 20, y: 20 });
  const [newBoxSize, setNewBoxSize] = useState({ width: 100, height: 100 }); // Default box size
  const [splitBoxSize, setSplitBoxSize] = useState({ width: 100, height: 100 }); // Default split box size
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBoxId, setDraggedBoxId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState(null);
  const [hasCollision, setHasCollision] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [selectedBoxIds, setSelectedBoxIds] = useState(new Set());
  
  // Advanced interaction state (from reference)
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [containerDragOffset, setContainerDragOffset] = useState({ x: 0, y: 0 });
  const [isLeftClickPanning, setIsLeftClickPanning] = useState(false);
  const [leftClickPanStart, setLeftClickPanStart] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [animationFrameId, setAnimationFrameId] = useState(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'se' only for now


  // Load canvas data
  const isLoadedRef = useRef(false);
  const dragStartBoxRef = useRef(null); // Store initial box state for resizing


  const loadCanvasFromAPI = useCallback(async (itemBarangId, defaultWidth, defaultHeight) => {
    // Prevent double loading
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    try {
      console.log('Fetching canvas data for item:', itemBarangId);
      const result = await request(`/item-barang/${itemBarangId}/canvas`, {
        method: 'GET'
      });
      console.log('Canvas API Response:', result);

      // Check for various response formats
      let canvasData = null;
      
      if (result.success && result.data) {
        // Standard API response with data wrapper
        canvasData = result.data.canvas_data || result.data;
      } else if (result.boxes && Array.isArray(result.boxes)) {
        // Direct response format (root object is the data)
        canvasData = result;
      } else if (result.canvas_data) {
         // Direct response with canvas_data property
         canvasData = result.canvas_data;
      }

      console.log('Parsed Canvas Data:', canvasData);

      if (canvasData) {
        if (canvasData.boxes && Array.isArray(canvasData.boxes)) {
            // Mark loaded boxes as locked
            const lockedBoxes = canvasData.boxes.map(b => ({ ...b, isLocked: true }));
            setBoxes(lockedBoxes);
        }
        
        if (canvasData.baseContainer) {
          setBaseContainer(canvasData.baseContainer);
        } else {
             // If no container in data, use item dimensions
             setBaseContainer({
                width: defaultWidth || 20,
                height: defaultHeight || 20,
                x: 0, y: 0
             });
        }
        
        if (canvasData.gridSize) setGridSize(canvasData.gridSize);
        if (canvasData.zoom) setZoom(canvasData.zoom);
        if (canvasData.panOffset) setPanOffset(canvasData.panOffset);

        showAlert('Success', 'Canvas data loaded!', 'success');
      } else {
         console.warn('Canvas data not found or invalid structure');
         // Fallback default
         setBaseContainer({
            width: defaultWidth || 20,
            height: defaultHeight || 20,
            x: 0, y: 0
         });
      }
    } catch (error) {
      console.error('Error loading canvas from API:', error);
      // Don't show error alert to user, just log it - canvas will use default state
      isLoadedRef.current = false; // Allow retry on error
    }
  }, [showAlert]);

  useEffect(() => {
    // Reset loaded state when item ID changes
    return () => {
        isLoadedRef.current = false;
    };
  }, [item?.id]);

  useEffect(() => {
    if (item?.id) {
      loadCanvasFromAPI(
        item.id, 
        parseFloat(item?.panjang), 
        parseFloat(item?.lebar)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);




  // Debug / Simulation functions
  const handleSimulateSplit = () => {
    // Get boxes to split (either selected ones or all if none selected)
    const targetBoxes = selectedBoxIds.size > 0 
        ? boxes.filter(b => selectedBoxIds.has(b.id))
        : boxes;
    
    if (targetBoxes.length === 0) {
        showAlert('Warning', 'No boxes to split', 'warning');
        return;
    }

    // Map to a clean JSON structure for "children"
    const childrenJson = targetBoxes.map(box => ({
        id: box.id,
        width: box.width,
        height: box.height,
        x: box.x,
        y: box.y,
        type: box.type || 'Saved',
        rotation: box.isRotated ? 90 : 0
    }));

    console.log('--- SIMULATE SPLIT JSON ---');
    console.log(JSON.stringify(childrenJson, null, 2));
    showAlert('Success', `Generated JSON for ${targetBoxes.length} items (Check Console)`, 'success');
  };

  // Canvas drawing functions
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const scaledGridSize = gridSize * zoom;

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    for (let x = 0; x <= width + Math.abs(panOffset.x); x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height + Math.abs(panOffset.y));
      ctx.stroke();
    }

    for (let y = 0; y <= height + Math.abs(panOffset.y); y += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width + Math.abs(panOffset.x), y);
      ctx.stroke();
    }

    ctx.restore();
  }, [gridSize, zoom, panOffset]);

  const drawBaseContainer = useCallback((ctx) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    const x = baseContainer.x * gridSize * zoom;
    const y = baseContainer.y * gridSize * zoom;
    const width = baseContainer.width * gridSize * zoom;
    const height = baseContainer.height * gridSize * zoom;

    // Draw container background with enhanced styling when dragging
    if (isDraggingContainer) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Blue tint when dragging
      ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    } else {
      ctx.fillStyle = 'rgba(243, 244, 246, 0.3)';
    }
    ctx.fillRect(x, y, width, height);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw drag handle indicator
    if (isDraggingContainer) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = `${10 * zoom}px Arial`;
      ctx.fillText('🔄 Dragging...', x + 5, y + 15);
    }

    ctx.restore();
  }, [baseContainer, gridSize, zoom, panOffset, isDraggingContainer]);

  const drawBox = useCallback((ctx, box, isPreview = false, isDragged = false, isMovingWithContainer = false, isSelected = false, hasCollision = false) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);

    const isRotated = box.isRotated || false;
    const boxWidth = isRotated ? box.height : box.width;
    const boxHeight = isRotated ? box.width : box.height;

    const x = box.x * gridSize * zoom;
    const y = box.y * gridSize * zoom;
    const width = boxWidth * gridSize * zoom;
    const height = boxHeight * gridSize * zoom;

    ctx.save();

    // Determine Pattern Style based on type
    let hatchConfig = null;
    
    // Default to 'Saved' (Red Arsir) if type is missing or not recognized
    // This ensures no solid background is used, as requested ("jangan pakai background warna gini")
    const boxType = box.type || 'Saved';

    if (!isPreview && !isDragged && !isMovingWithContainer) {
        if (boxType === 'Saved') {
            hatchConfig = { color: '#ef4444', type: 'diagonal' }; // Used (Red)
        } else if (boxType === 'UsedByOther') {
            hatchConfig = { color: '#eab308', type: 'diagonal' }; // Used By Other (Yellow)
        } else if (boxType === 'Existing') {
            hatchConfig = { color: '#10b981', type: 'diagonal' }; // In Used (Green)
        } else if (boxType === 'Split') {
            hatchConfig = { color: '#3b82f6', type: 'diagonal' }; // Split (Blue)
        } else if (boxType === 'SplitProcessed') {
            hatchConfig = { color: '#000000', type: 'reverse-diagonal' }; // Done Split (Black)
        } else {
             // Fallback for any other type to Green (In Used)
             hatchConfig = { color: '#10b981', type: 'diagonal' };
        }
    }

    if (hatchConfig) {
        // 1. Draw White Background (Printer friendly)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, width, height);

        // 2. Draw Hatch Pattern
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        
        ctx.strokeStyle = hatchConfig.color;
        ctx.lineWidth = 2; // Thicker lines for visibility with low density
        const spacing = 60 * zoom; // Very wide spacing (aiming for ~5-10 lines max)
        
        if (hatchConfig.type === 'diagonal') {
            // \ Shape
            for (let i = x - height; i < x + width; i += spacing) {
                ctx.moveTo(i, y);
                ctx.lineTo(i + height, y + height);
            }
        } else if (hatchConfig.type === 'reverse-diagonal') {
            // / Shape
            for (let i = x; i < x + width + height; i += spacing) {
                ctx.moveTo(i, y);
                ctx.lineTo(i - height, y + height);
            }
        } else if (hatchConfig.type === 'vertical') {
            // | Shape
            for (let i = x; i <= x + width; i += spacing) {
                ctx.moveTo(i, y);
                ctx.lineTo(i, y + height);
            }
        }
        
        ctx.stroke();
        ctx.restore();
        
        // Restore context for border drawing
        ctx.restore();

    } else {
        // This block should theoretically not be reached for normal static boxes 
        // because we force hatchConfig for them above.
        // It is still used for Dragged / Moving / Preview states if needed, 
        // but current logic above excludes them from hatchConfig.
        // Let's keep it for interaction states (Dragged/Preview) which might look better solid or transparent.

        // Draw box background with enhanced visual feedback
        if (isDragged) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(0.05); // Small rotation
            ctx.translate(-centerX, -centerY);
        } else if (isMovingWithContainer) {
            ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        } else if (isSelected) {
            ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        // Colors
        if (isPreview) {
            ctx.fillStyle = hasCollision ? '#ef444440' : `${box.color || '#10b981'}40`;
        } else if (isDragged) {
            const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
            const color = box.color || '#10b981';
            gradient.addColorStop(0, `${color}FF`);
            gradient.addColorStop(1, `${color}CC`);
            ctx.fillStyle = gradient;
        } else if (isMovingWithContainer) {
            ctx.fillStyle = `${box.color || '#10b981'}E0`;
        } else if (isSelected) {
            ctx.fillStyle = `${box.color || '#10b981'}CC`;
        } else {
            // Fallback solid (shouldn't happen for static boxes)
            ctx.fillStyle = box.color || '#10b981';
        }

        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }

    // Border
    ctx.strokeStyle = isPreview ? (hasCollision ? '#ef4444' : (box.color || '#10b981')) :
      (isDragged ? '#fff' :
        (isMovingWithContainer ? '#3b82f6' :
          (isSelected ? '#ef4444' : '#000')));
    ctx.lineWidth = isPreview ? 3 :
      (isDragged ? 3 :
        (isMovingWithContainer ? 2 :
          (isSelected ? 3 : 1)));
    ctx.setLineDash(isPreview ? [8, 4] :
      (isMovingWithContainer ? [4, 2] :
        (isSelected ? [6, 3] : [])));
    
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    
    // Draw text
    ctx.fillStyle = isDragged ? '#000' :
      (isMovingWithContainer ? '#1d4ed8' :
        (isSelected ? '#fff' : 
            (hatchConfig ? '#000' : '#fff') // Black text for hatched (white bg)
        ));
        
    if (!isPreview) {
        ctx.font = `bold ${Math.max(10, Math.min(width, height) * 0.2)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Show custom text if available, otherwise show dimensions
        const labelText = box.text ? box.text : `${box.width}×${box.height}`;
        ctx.fillText(labelText, centerX, centerY);
        
        if (isRotated) {
            ctx.fillStyle = '#3b82f6';
            ctx.fillText('↻', x + 4, y + height - 4);
        }

        // Draw Lock Icon if locked
        if (box.isLocked) {
            ctx.fillStyle = isSelected ? '#f97316' : (hatchConfig ? '#f97316' : '#fff');
            const iconSize = Math.max(12, Math.min(width, height) * 0.25);
            ctx.font = `${iconSize}px Arial`;
            // Draw top-right corner
            ctx.fillText('🔒', x + width - (iconSize/2) - 2, y + (iconSize/2) + 2);
        }

        // Draw Resize Handle (Bottom-Right) if selected and not locked
        // Enable for 'Split' type or any selected box that is not locked
        // Disable for SplitProcessed
        if (isSelected && !box.isLocked && !isPreview && !isDragged && box.type !== 'SplitProcessed') {
             ctx.fillStyle = '#3b82f6'; // Blue fill
             ctx.strokeStyle = '#fff';   // White border
             ctx.lineWidth = 2;
             
             // Draw handles on all corners and edges
             const handleSize = 8;
             
             // Positions
             const left = x;
             const center = x + width / 2;
             const right = x + width;
             const top = y;
             const middle = y + height / 2;
             const bottom = y + height;

             const handles = [
                { x: left, y: top },       // nw
                { x: center, y: top },     // n
                { x: right, y: top },      // ne
                { x: right, y: middle },   // e
                { x: right, y: bottom },   // se
                { x: center, y: bottom },  // s
                { x: left, y: bottom },    // sw
                { x: left, y: middle }     // w
             ];

             handles.forEach(h => {
                ctx.beginPath();
                ctx.arc(h.x, h.y, handleSize / 1.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
             });
        }
    }

    ctx.restore();
  }, [gridSize, zoom, panOffset]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Clip to container
    ctx.save();
    const containerPixelX = (baseContainer.x * gridSize * zoom) + panOffset.x;
    const containerPixelY = (baseContainer.y * gridSize * zoom) + panOffset.y;
    const containerPixelWidth = baseContainer.width * gridSize * zoom;
    const containerPixelHeight = baseContainer.height * gridSize * zoom;

    ctx.beginPath();
    ctx.rect(containerPixelX, containerPixelY, containerPixelWidth, containerPixelHeight);
    ctx.clip();

    drawGrid(ctx, canvas.width, canvas.height);
    drawBaseContainer(ctx);

    if (boxes && boxes.length > 0) {
      boxes.forEach(box => {
        const isDragged = isDragging && box.id === draggedBoxId;
        const isMovingWithContainer = isDraggingContainer &&
          box.x >= baseContainer.x &&
          box.x < baseContainer.x + baseContainer.width &&
          box.y >= baseContainer.y &&
          box.y < baseContainer.y + baseContainer.height;
        const isSelected = selectedBoxIds.has(box.id);
        drawBox(ctx, box, false, isDragged, isMovingWithContainer, isSelected);
      });
    }

    if (isDragging && previewPosition && draggedBoxId) {
      const draggedBox = boxes.find(box => box.id === draggedBoxId);
      if (draggedBox) {
        const previewBox = { ...draggedBox, x: previewPosition.x, y: previewPosition.y };
        drawBox(ctx, previewBox, true, false, false, false, hasCollision);
      }
    }

    ctx.restore();

    // Draw container border
    ctx.strokeStyle = isDraggingContainer ? '#3b82f6' : '#9ca3af';
    ctx.lineWidth = isDraggingContainer ? 4 : 3;
    ctx.setLineDash(isDraggingContainer ? [8, 4] : []);
    ctx.strokeRect(containerPixelX, containerPixelY, containerPixelWidth, containerPixelHeight);
    ctx.setLineDash([]);
    
    ctx.fillStyle = isDraggingContainer ? '#1d4ed8' : '#6b7280';
    ctx.font = `bold ${12 * zoom}px Arial`;
    ctx.fillText(`Base: ${baseContainer.width}×${baseContainer.height}`, containerPixelX + 5, containerPixelY - 5);

  }, [boxes, drawGrid, drawBaseContainer, drawBox, isDragging, draggedBoxId, previewPosition, hasCollision, baseContainer, gridSize, zoom, panOffset, isDraggingContainer]);

  // Helpers
  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const getGridPos = useCallback((mousePos) => {
    const gridX = Math.round(mousePos.x / (gridSize * zoom));
    const gridY = Math.round(mousePos.y / (gridSize * zoom));
    return { x: gridX, y: gridY };
  }, [gridSize, zoom]);

  const isMouseOverBox = useCallback((mousePos, box) => {
    const boxPixelX = (box.x * gridSize * zoom) + panOffset.x;
    const boxPixelY = (box.y * gridSize * zoom) + panOffset.y;
    const isRotated = box.isRotated || false;
    const boxWidth = isRotated ? box.height : box.width;
    const boxHeight = isRotated ? box.width : box.height;
    const boxPixelWidth = boxWidth * gridSize * zoom;
    const boxPixelHeight = boxHeight * gridSize * zoom;

    return mousePos.x >= boxPixelX &&
      mousePos.x <= boxPixelX + boxPixelWidth &&
      mousePos.y >= boxPixelY &&
      mousePos.y <= boxPixelY + boxPixelHeight;
  }, [gridSize, zoom, panOffset]);

  const isMouseOverContainer = useCallback((mousePos) => {
    const containerPixelX = (baseContainer.x * gridSize * zoom) + panOffset.x;
    const containerPixelY = (baseContainer.y * gridSize * zoom) + panOffset.y;
    const containerPixelWidth = baseContainer.width * gridSize * zoom;
    const containerPixelHeight = baseContainer.height * gridSize * zoom;

    const borderThickness = 8;
    return (
      (mousePos.x >= containerPixelX - borderThickness && mousePos.x <= containerPixelX + containerPixelWidth + borderThickness &&
        mousePos.y >= containerPixelY - borderThickness && mousePos.y <= containerPixelY + borderThickness) ||
      (mousePos.x >= containerPixelX - borderThickness && mousePos.x <= containerPixelX + containerPixelWidth + borderThickness &&
        mousePos.y >= containerPixelY + containerPixelHeight - borderThickness && mousePos.y <= containerPixelY + containerPixelHeight + borderThickness) ||
      (mousePos.x >= containerPixelX - borderThickness && mousePos.x <= containerPixelX + borderThickness &&
        mousePos.y >= containerPixelY - borderThickness && mousePos.y <= containerPixelY + containerPixelHeight + borderThickness) ||
      (mousePos.x >= containerPixelX + containerPixelWidth - borderThickness && mousePos.x <= containerPixelX + containerPixelWidth + borderThickness &&
        mousePos.y >= containerPixelY - borderThickness && mousePos.y <= containerPixelY + containerPixelHeight + borderThickness)
    );
  }, [baseContainer, gridSize, zoom, panOffset]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const mousePos = getMousePos(e);
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.005, Math.min(3, zoom + delta)); // Minimum 0.5% (0.005x) matching button

    if (newZoom !== zoom) {
      // Zoom towards mouse cursor
      const zoomFactor = newZoom / zoom;
      const newPanX = mousePos.x - (mousePos.x - panOffset.x) * zoomFactor;
      const newPanY = mousePos.y - (mousePos.y - panOffset.y) * zoomFactor;

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    }
  }, [zoom, panOffset, getMousePos]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.2, 3);
    if (newZoom !== zoom) {
      setZoom(newZoom);
    }
  }, [zoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.2, 0.005); // Minimum 0.5% (0.005x)
    if (newZoom !== zoom) {
      setZoom(newZoom);
    }
  }, [zoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    // Position at top-left with small margin
    const margin = 20;
    setPanOffset({ x: margin, y: margin });
  }, []);

  const zoomFit = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    // Get canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Get base container dimensions in grid units
    const containerWidth = baseContainer.width;
    const containerHeight = baseContainer.height;

    // Calculate scale factors for both dimensions
    const scaleX = canvasWidth / (containerWidth * gridSize);
    const scaleY = canvasHeight / (containerHeight * gridSize);

    // Choose the smaller scale and apply slight padding so edges are visible
    const fitZoom = Math.min(scaleX, scaleY);
    const paddingFactor = 0.95;
    const newZoom = Math.max(fitZoom * paddingFactor, 0.005);

    // Apply the new zoom
    setZoom(newZoom);

    // Position container at top-left corner
    const containerPixelWidth = containerWidth * gridSize * newZoom;
    const containerPixelHeight = containerHeight * gridSize * newZoom;

    // Set position to top-left (0, 0) with small margin
    const margin = 20; // Small margin from edge
    let topLeftX = margin;
    let topLeftY = margin;

    setPanOffset({ x: topLeftX, y: topLeftY });
  }, [baseContainer, gridSize]);



  // Save canvas data (and process split if applicable)
  const handleSaveCanvas = useCallback(async () => {
    // Check for split boxes
    const splitBoxes = boxes.filter(b => b.type === 'Split');
    let doSplit = false;

    if (splitBoxes.length > 0) {
        if (!window.confirm(`Found ${splitBoxes.length} Split Area(s). This will Process Split and Save. Continue?`)) {
            return;
        }
        doSplit = true;
    }

    // 1. Auto zoom fit for optimal preview
    if (typeof zoomFit === 'function') {
      zoomFit();
    }

    // 2. Wait for zoom animation/render
    setTimeout(async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Generate preview image (screenshot)
        const canvasImage = canvas.toDataURL('image/jpeg', 0.8);

        // Calculate metadata for area
        const containerArea = baseContainer.width * baseContainer.height;
        const totalBoxArea = boxes.reduce((acc, box) => acc + (box.width * box.height), 0);

        // Prepare boxes for saving (mark Split as SplitProcessed if splitting)
        const boxesToSave = doSplit 
            ? boxes.map(b => b.type === 'Split' ? { ...b, type: 'SplitProcessed' } : b)
            : boxes;

        // Prepare canvas data object
        const canvasDataObj = {
          baseContainer,
          boxes: boxesToSave,
          gridSize,
          zoom, // Note: This might be pre-zoomFit value, but acceptable for data restoration
          panOffset,
          metadata: {
            containerArea,
            totalArea: totalBoxArea,
            savedAt: new Date().toISOString()
          }
        };

        // Calculate splits if needed
        let splits = undefined;
        if (doSplit) {
            // Ambil hanya box yang berada di dalam Split
            const insideBoxes = boxes.filter(b => {
                if (b.type === 'Split') return false;
                const bw = b.isRotated ? b.height : b.width;
                const bh = b.isRotated ? b.width : b.height;
                const br = b.x + bw;
                const bb = b.y + bh;
                return splitBoxes.some(s => {
                    const sw = s.isRotated ? s.height : s.width;
                    const sh = s.isRotated ? s.width : s.height;
                    const sr = s.x + sw;
                    const sb = s.y + sh;
                    return b.x >= s.x && br <= sr && b.y >= s.y && bb <= sb;
                });
            });

            const children = insideBoxes.map(b => {
                const w = b.isRotated ? b.height : b.width;
                const h = b.isRotated ? b.width : b.height;
                return {
                    id: b.id,
                    width: w,
                    height: h
                };
            });
            
            splits = children.map(c => ({
                panjang: c.width,
                lebar: c.height
            }));

            // Fallback: if no inside boxes found, use Split boxes themselves
            if (splits.length === 0) {
                splits = splitBoxes.map(s => ({
                    panjang: s.isRotated ? s.height : s.width,
                    lebar: s.isRotated ? s.width : s.height
                }));
            }
            
            console.log('Including splits in save:', splits);
        }

        const payload = {
          item_barang_id: item.id,
          canvas_data: JSON.stringify(canvasDataObj), // Send as JSON String per API docs
          canvas_image: canvasImage,
          splits
        };

        // Use new endpoint for direct canvas save
        const response = await request('/api/item-barang/save-canvas', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        console.log('SAVE RESPONSE:', response);

        if (doSplit) {
             setBoxes(boxesToSave);
             showAlert('Success', `Canvas saved & Split processed (${splits.length} items)!`, 'success');
        } else {
             showAlert('Success', 'Canvas saved successfully!', 'success');
        }
        
        if (onClose) onClose();
      } catch (error) {
        console.error('Error saving canvas:', error);
        showAlert('Error', 'Failed to save canvas.', 'error');
      }
    }, 500); // 500ms delay to allow zoomFit to render
  }, [baseContainer, boxes, gridSize, zoom, panOffset, item.id, zoomFit, onClose, showAlert]);


  const unlockSelected = useCallback(() => {
    if (selectedBoxIds.size === 0) return;
    setBoxes(prev => prev.map(b => selectedBoxIds.has(b.id) ? { ...b, isLocked: false } : b));
    showAlert('Success', 'Selected boxes unlocked', 'success');
  }, [selectedBoxIds, showAlert]);

  const lockSelected = useCallback(() => {
    if (selectedBoxIds.size === 0) return;
    setBoxes(prev => prev.map(b => selectedBoxIds.has(b.id) ? { ...b, isLocked: true } : b));
    showAlert('Success', 'Selected boxes locked', 'success');
  }, [selectedBoxIds, showAlert]);

  // Interaction handlers
  const getResizeHandle = useCallback((mousePos, box) => {
    const boxPixelX = (box.x * gridSize * zoom) + panOffset.x;
    const boxPixelY = (box.y * gridSize * zoom) + panOffset.y;
    const isRotated = box.isRotated || false;
    const boxWidth = isRotated ? box.height : box.width;
    const boxHeight = isRotated ? box.width : box.height;
    const boxPixelWidth = boxWidth * gridSize * zoom;
    const boxPixelHeight = boxHeight * gridSize * zoom;

    const margin = 8; // Detection margin in pixels

    const onLeft = Math.abs(mousePos.x - boxPixelX) <= margin;
    const onRight = Math.abs(mousePos.x - (boxPixelX + boxPixelWidth)) <= margin;
    const onTop = Math.abs(mousePos.y - boxPixelY) <= margin;
    const onBottom = Math.abs(mousePos.y - (boxPixelY + boxPixelHeight)) <= margin;

    if (onLeft && onTop) return 'nw';
    if (onRight && onTop) return 'ne';
    if (onLeft && onBottom) return 'sw';
    if (onRight && onBottom) return 'se';
    if (onLeft) return 'w';
    if (onRight) return 'e';
    if (onTop) return 'n';
    if (onBottom) return 's';

    return null;
  }, [gridSize, zoom, panOffset]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const mousePos = getMousePos(e);

    // Pan canvas
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setLastPanPos(mousePos);
      return;
    }

    // Check Resize Handle First
    const resizingBox = boxes.find(box => {
        if (!selectedBoxIds.has(box.id)) return false;
        if (box.isLocked) return false;
        if (box.type === 'SplitProcessed') return false; // Disable resize for processed split
        return getResizeHandle(mousePos, box) !== null;
    });

    if (resizingBox) {
        const handle = getResizeHandle(mousePos, resizingBox);
        setIsResizing(true);
        setResizeHandle(handle);
        setDraggedBoxId(resizingBox.id);
        setDragStartPos(mousePos);
        dragStartBoxRef.current = { ...resizingBox }; // Store initial state
        return;
    }

    // Drag container - DISABLED
    /*
    if (isMouseOverContainer(mousePos)) {
      setIsDraggingContainer(true);
      setContainerDragOffset({
        x: mousePos.x - (baseContainer.x * gridSize * zoom),
        y: mousePos.y - (baseContainer.y * gridSize * zoom)
      });
      setDragStartPos(mousePos);
      setLastMousePos(mousePos);
      setVelocity({ x: 0, y: 0 });
      return;
    }
    */

    // Drag box
    const clickedBox = boxes && boxes.length > 0 ? boxes.find(box => isMouseOverBox(mousePos, box)) : null;

    if (clickedBox) {
      setSelectedBoxIds(new Set([clickedBox.id]));

      if (clickedBox.isLocked) {
        // showAlert('Info', 'Item terkunci. Unlock untuk memindahkan.', 'info');
        return;
      }

      setDraggedBoxId(clickedBox.id);
      setDragOffset({
        x: mousePos.x - (clickedBox.x * gridSize * zoom),
        y: mousePos.y - (clickedBox.y * gridSize * zoom)
      });
      setDragStartPos(mousePos);
      setLastMousePos(mousePos);
      setVelocity({ x: 0, y: 0 });
      return;
    }

    // Pan (Left Click Empty)
    if (e.button === 0) {
      setIsLeftClickPanning(true);
      setLeftClickPanStart(mousePos);
      setLastPanPos(mousePos);
    }
  }, [boxes, getMousePos, gridSize, zoom, isMouseOverBox, isMouseOverContainer, baseContainer, showAlert]);

  const updateDragPosition = useCallback((mousePos) => {
    // Resize Logic
    if (isResizing && draggedBoxId && resizeHandle && dragStartBoxRef.current) {
        const draggedBox = boxes.find(box => box.id === draggedBoxId);
        if (!draggedBox) return;

        const startBox = dragStartBoxRef.current;
        
        // Calculate Delta in Grid Units
        const deltaX = Math.round((mousePos.x - dragStartPos.x) / (gridSize * zoom));
        const deltaY = Math.round((mousePos.y - dragStartPos.y) / (gridSize * zoom));

        let newX = startBox.x;
        let newY = startBox.y;
        let newWidth = startBox.width;
        let newHeight = startBox.height;

        // Apply Delta based on Handle
        if (resizeHandle.includes('e')) {
            newWidth = startBox.width + deltaX;
        }
        if (resizeHandle.includes('w')) {
            newX = startBox.x + deltaX;
            newWidth = startBox.width - deltaX;
        }
        if (resizeHandle.includes('s')) {
            newHeight = startBox.height + deltaY;
        }
        if (resizeHandle.includes('n')) {
            newY = startBox.y + deltaY;
            newHeight = startBox.height - deltaY;
        }

        // Enforce minimum size (1x1)
        if (newWidth < 1) {
            // Prevent flipping
            if (resizeHandle.includes('w')) newX = startBox.x + startBox.width - 1;
            newWidth = 1;
        }
        if (newHeight < 1) {
            if (resizeHandle.includes('n')) newY = startBox.y + startBox.height - 1;
            newHeight = 1;
        }

        // Check bounds (Container)
        if (newX < baseContainer.x) {
             const diff = baseContainer.x - newX;
             newX = baseContainer.x;
             newWidth -= diff; 
        }
        if (newY < baseContainer.y) {
             const diff = baseContainer.y - newY;
             newY = baseContainer.y;
             newHeight -= diff;
        }
        if (newX + newWidth > baseContainer.x + baseContainer.width) {
             newWidth = baseContainer.x + baseContainer.width - newX;
        }
        if (newY + newHeight > baseContainer.y + baseContainer.height) {
             newHeight = baseContainer.y + baseContainer.height - newY;
        }

        // Check collision with other boxes
        // We use a temporary object for collision check
        const tempBox = { ...draggedBox, x: newX, y: newY, width: newWidth, height: newHeight };
        
        const hasCollision = boxes.some(box => {
            if (box.id === draggedBoxId) return false;
            
            const isDraggedSplit = draggedBox.type === 'Split' || draggedBox.type === 'SplitProcessed';
            const isTargetSplit = box.type === 'Split' || box.type === 'SplitProcessed';
            if (isDraggedSplit !== isTargetSplit) return false;

            const otherBoxWidth = box.isRotated ? box.height : box.width;
            const otherBoxHeight = box.isRotated ? box.width : box.height;
            return !(tempBox.x >= box.x + otherBoxWidth ||
                     tempBox.x + tempBox.width <= box.x ||
                     tempBox.y >= box.y + otherBoxHeight ||
                     tempBox.y + tempBox.height <= box.y);
        });

        if (!hasCollision) {
             setBoxes(prevBoxes =>
                prevBoxes.map(box =>
                    box.id === draggedBoxId ? { ...box, x: newX, y: newY, width: newWidth, height: newHeight } : box
                )
             );
        }
        return;
    }

    if (isDraggingContainer) {
      const newX = Math.round((mousePos.x - containerDragOffset.x) / (gridSize * zoom));
      const newY = Math.round((mousePos.y - containerDragOffset.y) / (gridSize * zoom));
      
      const clampedX = Math.max(0, newX); // Simplify clamp for now
      const clampedY = Math.max(0, newY);

      const deltaX = clampedX - baseContainer.x;
      const deltaY = clampedY - baseContainer.y;

      setBaseContainer(prev => ({ ...prev, x: clampedX, y: clampedY }));

      if (deltaX !== 0 || deltaY !== 0) {
        setBoxes(prevBoxes =>
          prevBoxes.map(box => {
            const isInsideContainer =
              box.x >= baseContainer.x &&
              box.x < baseContainer.x + baseContainer.width &&
              box.y >= baseContainer.y &&
              box.y < baseContainer.y + baseContainer.height;

            if (isInsideContainer) {
              return { ...box, x: box.x + deltaX, y: box.y + deltaY };
            }
            return box;
          })
        );
      }
      return;
    }

    if (!isDragging || !draggedBoxId) return;

    const draggedBox = boxes.find(box => box.id === draggedBoxId);
    if (!draggedBox) return;

    // Velocity
    const deltaTime = 16;
    setVelocity({
      x: (mousePos.x - lastMousePos.x) / deltaTime,
      y: (mousePos.y - lastMousePos.y) / deltaTime
    });
    setLastMousePos(mousePos);

    const newX = Math.round((mousePos.x - dragOffset.x) / (gridSize * zoom));
    const newY = Math.round((mousePos.y - dragOffset.y) / (gridSize * zoom));

    const draggedBoxWidth = draggedBox.isRotated ? draggedBox.height : draggedBox.width;
    const draggedBoxHeight = draggedBox.isRotated ? draggedBox.width : draggedBox.height;

    const clampedX = Math.max(baseContainer.x, Math.min(newX, baseContainer.x + baseContainer.width - draggedBoxWidth));
    const clampedY = Math.max(baseContainer.y, Math.min(newY, baseContainer.y + baseContainer.height - draggedBoxHeight));

    const hasCollision = boxes.some(box => {
      if (box.id === draggedBoxId) return false;

      const isDraggedSplit = draggedBox.type === 'Split' || draggedBox.type === 'SplitProcessed';
      const isTargetSplit = box.type === 'Split' || box.type === 'SplitProcessed';
      if (isDraggedSplit !== isTargetSplit) return false;

      const otherBoxWidth = box.isRotated ? box.height : box.width;
      const otherBoxHeight = box.isRotated ? box.width : box.height;
      return !(clampedX >= box.x + otherBoxWidth ||
        clampedX + draggedBoxWidth <= box.x ||
        clampedY >= box.y + otherBoxHeight ||
        clampedY + draggedBoxHeight <= box.y);
    });

    setPreviewPosition({ x: clampedX, y: clampedY });
    setHasCollision(hasCollision);

    if (!hasCollision) {
      setBoxes(prevBoxes =>
        prevBoxes.map(box =>
          box.id === draggedBoxId ? { ...box, x: clampedX, y: clampedY } : box
        )
      );
    }
  }, [isDragging, isDraggingContainer, draggedBoxId, boxes, dragOffset, containerDragOffset, gridSize, zoom, baseContainer, lastMousePos, isResizing, resizeHandle]);

  const handleMouseMove = useCallback((e) => {
    const mousePos = getMousePos(e);

    // Cursor Update Logic
    let newCursor = 'default';
    if (isPanning || isLeftClickPanning) {
        newCursor = 'grabbing';
    } else if (isDragging) {
        newCursor = 'grabbing';
    } else if (isResizing) {
        newCursor = 'se-resize';
    } else {
        // Check hover
        // We need to check in reverse order (topmost first) if we had z-index, but here simple find is ok
        // Actually we should check resize handle first if selected
        const hoveredBox = boxes.slice().reverse().find(b => isMouseOverBox(mousePos, b));
        
        if (hoveredBox) {
             if (selectedBoxIds.has(hoveredBox.id) && !hoveredBox.isLocked) {
                  const handle = getResizeHandle(mousePos, hoveredBox);
                  if (handle) {
                      if (handle === 'nw' || handle === 'se') newCursor = 'nwse-resize';
                      else if (handle === 'ne' || handle === 'sw') newCursor = 'nesw-resize';
                      else if (handle === 'n' || handle === 's') newCursor = 'ns-resize';
                      else if (handle === 'e' || handle === 'w') newCursor = 'ew-resize';
                  }
                  else newCursor = 'move';
             } else {
                  newCursor = 'pointer';
             }
         }
    }
    
    if (canvasRef.current && canvasRef.current.style.cursor !== newCursor) {
        canvasRef.current.style.cursor = newCursor;
    }

    if (draggedBoxId && !isDragging && !isResizing && !isDraggingContainer && !isLeftClickPanning && !isPanning) {
      const dragDistance = Math.sqrt(
        Math.pow(mousePos.x - dragStartPos.x, 2) +
        Math.pow(mousePos.y - dragStartPos.y, 2)
      );
      if (dragDistance > 5) setIsDragging(true);
    }

    if (!isDragging && !isResizing && !isDraggingContainer && !isLeftClickPanning && !isPanning) return;

    e.preventDefault();
    e.stopPropagation();

    if (isLeftClickPanning || isPanning) {
      const deltaX = mousePos.x - lastPanPos.x;
      const deltaY = mousePos.y - lastPanPos.y;
      setPanOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPos(mousePos);
      return;
    }

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    const frameId = requestAnimationFrame(() => updateDragPosition(mousePos));
    setAnimationFrameId(frameId);
  }, [isDragging, isDraggingContainer, isLeftClickPanning, isPanning, draggedBoxId, getMousePos, updateDragPosition, animationFrameId, lastPanPos, dragStartPos, isResizing]);

  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setDraggedBoxId(null);
    setPreviewPosition(null);
    setHasCollision(false);
    setIsPanning(false);
    setIsDraggingContainer(false);
    setIsLeftClickPanning(false);
  }, [animationFrameId]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const mousePos = getMousePos(e);

    // Find if a resize handle was clicked
    const box = boxes.find(b => {
        if (!selectedBoxIds.has(b.id)) return false;
        if (b.isLocked) return false;
        return getResizeHandle(mousePos, b) !== null;
    });

    if (box) {
        const handle = getResizeHandle(mousePos, box);
        if (!handle) return;

        // Determine directions to expand
        const expandW = handle.includes('w');
        const expandE = handle.includes('e');
        const expandN = handle.includes('n');
        const expandS = handle.includes('s');

        let newX = box.x;
        let newY = box.y;
        let newWidth = box.width;
        let newHeight = box.height;

        // Helper to check collision for a hypothetical box
        const checkCollision = (bx, by, bw, bh) => {
             // Container Bounds
             if (bx < baseContainer.x || by < baseContainer.y || 
                 bx + bw > baseContainer.x + baseContainer.width || 
                 by + bh > baseContainer.y + baseContainer.height) return true;
             
             // Other Boxes
             return boxes.some(other => {
                 if (other.id === box.id) return false;

                 const isBoxSplit = box.type === 'Split' || box.type === 'SplitProcessed';
                 const isOtherSplit = other.type === 'Split' || other.type === 'SplitProcessed';
                 if (isBoxSplit !== isOtherSplit) return false;

                 const ow = other.isRotated ? other.height : other.width;
                 const oh = other.isRotated ? other.width : other.height;
                 return !(bx >= other.x + ow || bx + bw <= other.x || by >= other.y + oh || by + bh <= other.y);
             });
        };

        // Expand East (Right)
        if (expandE) {
            // Find nearest obstacle to the right
            let maxRight = baseContainer.x + baseContainer.width;
            
            // Check other boxes
            boxes.forEach(other => {
                if (other.id === box.id) return;

                const isBoxSplit = box.type === 'Split' || box.type === 'SplitProcessed';
                const isOtherSplit = other.type === 'Split' || other.type === 'SplitProcessed';
                if (isBoxSplit !== isOtherSplit) return;
                const ow = other.isRotated ? other.height : other.width;
                const oh = other.isRotated ? other.width : other.height;
                
                // Check vertical overlap
                if (box.y < other.y + oh && box.y + box.height > other.y) {
                    if (other.x >= box.x + box.width) {
                        maxRight = Math.min(maxRight, other.x);
                    }
                }
            });
            newWidth = maxRight - box.x;
        }

        // Expand West (Left)
        if (expandW) {
            let minLeft = baseContainer.x;
            
            boxes.forEach(other => {
                if (other.id === box.id) return;

                const isBoxSplit = box.type === 'Split' || box.type === 'SplitProcessed';
                const isOtherSplit = other.type === 'Split' || other.type === 'SplitProcessed';
                if (isBoxSplit !== isOtherSplit) return;

                const ow = other.isRotated ? other.height : other.width;
                const oh = other.isRotated ? other.width : other.height;
                
                if (box.y < other.y + oh && box.y + box.height > other.y) {
                    if (other.x + ow <= box.x) {
                        minLeft = Math.max(minLeft, other.x + ow);
                    }
                }
            });
            const rightEdge = box.x + box.width;
            newX = minLeft;
            newWidth = rightEdge - minLeft;
        }

        // Expand South (Bottom)
        if (expandS) {
            let maxBottom = baseContainer.y + baseContainer.height;
            
            boxes.forEach(other => {
                if (other.id === box.id) return;

                const isBoxSplit = box.type === 'Split' || box.type === 'SplitProcessed';
                const isOtherSplit = other.type === 'Split' || other.type === 'SplitProcessed';
                if (isBoxSplit !== isOtherSplit) return;

                const ow = other.isRotated ? other.height : other.width;
                const oh = other.isRotated ? other.width : other.height;
                
                // Check horizontal overlap (using newWidth if it changed)
                if (newX < other.x + ow && newX + newWidth > other.x) {
                    if (other.y >= box.y + box.height) {
                        maxBottom = Math.min(maxBottom, other.y);
                    }
                }
            });
            newHeight = maxBottom - box.y;
        }

        // Expand North (Top)
        if (expandN) {
            let minTop = baseContainer.y;
            
            boxes.forEach(other => {
                if (other.id === box.id) return;

                const isBoxSplit = box.type === 'Split' || box.type === 'SplitProcessed';
                const isOtherSplit = other.type === 'Split' || other.type === 'SplitProcessed';
                if (isBoxSplit !== isOtherSplit) return;

                const ow = other.isRotated ? other.height : other.width;
                const oh = other.isRotated ? other.width : other.height;
                
                // Check horizontal overlap (using newWidth if it changed)
                if (newX < other.x + ow && newX + newWidth > other.x) {
                    if (other.y + oh <= box.y) {
                        minTop = Math.max(minTop, other.y + oh);
                    }
                }
            });
            const bottomEdge = box.y + box.height;
            newY = minTop;
            newHeight = bottomEdge - minTop;
        }

        // Final Verification (Double Check)
        if (!checkCollision(newX, newY, newWidth, newHeight)) {
            setBoxes(prev => prev.map(b => b.id === box.id ? { ...b, x: newX, y: newY, width: newWidth, height: newHeight } : b));
        }
    }
  }, [boxes, baseContainer, getResizeHandle, getMousePos, selectedBoxIds]);

  // Box operations
  const addBox = () => {
    const w = newBoxSize.width;
    const h = newBoxSize.height;
    
    // Find free space
    const checkCollision = (cx, cy, cw, ch) => {
      if (cx < baseContainer.x || cy < baseContainer.y || 
          cx + cw > baseContainer.x + baseContainer.width || 
          cy + ch > baseContainer.y + baseContainer.height) return true;
      for (const other of boxes) {
        if (other.type === 'Split' || other.type === 'SplitProcessed') continue;
        const ow = other.isRotated ? other.height : other.width;
        const oh = other.isRotated ? other.width : other.height;
        if (!(cx >= other.x + ow || cx + cw <= other.x || cy >= other.y + oh || cy + ch <= other.y)) return true;
      }
      return false;
    };

    for(let y=0; y<=baseContainer.height - h + 0.1; y++) {
      for(let x=0; x<=baseContainer.width - w + 0.1; x++) {
        if (!checkCollision(x + baseContainer.x, y + baseContainer.y, w, h)) {
          const newBox = { 
            id: Date.now(), 
            x: x + baseContainer.x, 
            y: y + baseContainer.y, 
            width: w, 
            height: h, 
            color: '#10b981', // Green
            type: 'Existing', // Default to In Used (Green)
            isRotated: false,
            isLocked: false
          };
          setBoxes(prev => [...prev, newBox]);
          setSelectedBoxIds(new Set([newBox.id]));
          return;
        }
      }
    }
    showAlert('Warning', 'No space for new box', 'warning');
  };

  const addSplitBox = () => {
    const w = splitBoxSize.width;
    const h = splitBoxSize.height;

    // Find free space logic (Same as addBox)
    const checkCollision = (cx, cy, cw, ch) => {
        if (cx < baseContainer.x || cy < baseContainer.y || 
            cx + cw > baseContainer.x + baseContainer.width || 
            cy + ch > baseContainer.y + baseContainer.height) return true;
        for (const other of boxes) {
            if (other.type !== 'Split' && other.type !== 'SplitProcessed') continue;
            const ow = other.isRotated ? other.height : other.width;
            const oh = other.isRotated ? other.width : other.height;
            if (!(cx >= other.x + ow || cx + cw <= other.x || cy >= other.y + oh || cy + ch <= other.y)) return true;
        }
        return false;
    };

    for(let y=0; y<=baseContainer.height - h + 0.1; y++) {
        for(let x=0; x<=baseContainer.width - w + 0.1; x++) {
            if (!checkCollision(x + baseContainer.x, y + baseContainer.y, w, h)) {
                const newBox = {
                    id: Date.now(),
                    x: x + baseContainer.x,
                    y: y + baseContainer.y,
                    width: w,
                    height: h,
                    color: '#3b82f6', // Blue
                    type: 'Split', // Special type for split areas
                    isRotated: false,
                    isLocked: false
                };
                
                setBoxes(prev => [...prev, newBox]);
                setSelectedBoxIds(new Set([newBox.id]));
                return;
            }
        }
    }
    showAlert('Warning', 'No space for new split box', 'warning');
  };

  const rotateSelected = () => {
    if (selectedBoxIds.size === 0) return;
    const boxId = Array.from(selectedBoxIds)[0];
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    const newIsRotated = !box.isRotated;
    const newWidth = newIsRotated ? box.height : box.width;
    const newHeight = newIsRotated ? box.width : box.height;

    // Check bounds
    if (box.x + newWidth > baseContainer.x + baseContainer.width || 
        box.y + newHeight > baseContainer.y + baseContainer.height) {
        showAlert('Warning', 'Cannot rotate: out of bounds', 'warning');
        return;
    }

    // Check collision
    const hasCollision = boxes.some(other => {
        if (other.id === boxId) return false;

        const isBoxSplit = box.type === 'Split' || box.type === 'SplitProcessed';
        const isOtherSplit = other.type === 'Split' || other.type === 'SplitProcessed';
        if (isBoxSplit !== isOtherSplit) return false;

        const ow = other.isRotated ? other.height : other.width;
        const oh = other.isRotated ? other.width : other.height;
        return !(box.x >= other.x + ow || box.x + newWidth <= other.x || box.y >= other.y + oh || box.y + newHeight <= other.y);
    });

    if (hasCollision) {
        showAlert('Warning', 'Cannot rotate: collision detected', 'warning');
        return;
    }

    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, isRotated: newIsRotated } : b));
  };

  const deleteSelected = () => {
    if (selectedBoxIds.size === 0) return;
    setBoxes(prev => prev.filter(b => !selectedBoxIds.has(b.id)));
    setSelectedBoxIds(new Set());
  };

  const updateSelectedText = useCallback((text) => {
    if (selectedBoxIds.size === 0) return;
    setBoxes(prev => prev.map(b => selectedBoxIds.has(b.id) ? { ...b, text: text } : b));
  }, [selectedBoxIds]);

  const updateSelectedType = useCallback((type) => {
    if (selectedBoxIds.size === 0) return;
    setBoxes(prev => prev.map(b => selectedBoxIds.has(b.id) ? { ...b, type: type } : b));
  }, [selectedBoxIds]);

  // Attach wheel event listener with passive: false
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Render loop
  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm z-10 shrink-0 h-14">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Canvas Editor: {item?.nama_barang}</h1>
            <p className="text-xs text-gray-500">ID: {item?.id} • {boxes.length} Boxes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={handleSaveCanvas} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Layout
            </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Controls */}
        <div className="w-64 bg-white border-r shadow-sm p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10">
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Add Box</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-gray-500">Width</label>
                        <input 
                            type="number" 
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={newBoxSize.width}
                            onChange={e => setNewBoxSize(p => ({ ...p, width: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Height</label>
                        <input 
                            type="number" 
                            className="w-full border rounded px-2 py-1 text-sm"
                            value={newBoxSize.height}
                            onChange={e => setNewBoxSize(p => ({ ...p, height: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                </div>
                <Button onClick={addBox} className="w-full" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Box
                </Button>
            </div>

            <div className="space-y-2 border-t pt-2 mt-2">
                <h3 className="text-sm font-medium text-blue-700">Add Split Area</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-gray-500">Width</label>
                        <input 
                            type="number" 
                            className="w-full border rounded px-2 py-1 text-sm border-blue-200 focus:border-blue-500"
                            value={splitBoxSize.width}
                            onChange={e => setSplitBoxSize(p => ({ ...p, width: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Height</label>
                        <input 
                            type="number" 
                            className="w-full border rounded px-2 py-1 text-sm border-blue-200 focus:border-blue-500"
                            value={splitBoxSize.height}
                            onChange={e => setSplitBoxSize(p => ({ ...p, height: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                </div>
                <Button onClick={addSplitBox} className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Split Area
                </Button>
            </div>



            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Selection</h3>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1" 
                            onClick={rotateSelected}
                            disabled={selectedBoxIds.size === 0}
                        >
                            <RotateCw className="h-4 w-4 mr-1" /> Rotate
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="flex-1" 
                            onClick={deleteSelected}
                            disabled={selectedBoxIds.size === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1" 
                            onClick={unlockSelected}
                            disabled={selectedBoxIds.size === 0}
                        >
                            <Unlock className="h-4 w-4 mr-2" /> Unlock
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1" 
                            onClick={lockSelected}
                            disabled={selectedBoxIds.size === 0}
                        >
                            <Lock className="h-4 w-4 mr-2" /> Lock
                        </Button>
                    </div>

                    {/* Text Edit Input */}
                    {selectedBoxIds.size === 1 && (
                        <div className="mt-2 pt-2 border-t">
                            <label className="text-xs text-gray-500">Label Text</label>
                            <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-sm mt-1"
                                placeholder="Default: WxH"
                                value={boxes.find(b => b.id === Array.from(selectedBoxIds)[0])?.text || ''}
                                onChange={(e) => updateSelectedText(e.target.value)}
                            />
                            
                            <label className="text-xs text-gray-500 mt-2 block">Type / Status</label>
                            <select 
                                className="w-full border rounded px-2 py-1 text-sm mt-1"
                                value={boxes.find(b => b.id === Array.from(selectedBoxIds)[0])?.type || 'Existing'}
                                onChange={(e) => updateSelectedType(e.target.value)}
                            >
                                <option value="Saved">Used (Red)</option>
                                <option value="UsedByOther">Used By Other (Yellow)</option>
                                <option value="Existing">In Used (Green)</option>
                                <option value="Split">Split (Blue)</option>
                                <option value="SplitProcessed">Done Split (Black)</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Canvas View</h3>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={zoomOut}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="flex-1 text-center py-2 text-sm bg-gray-100 rounded">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button variant="outline" size="icon" onClick={zoomIn}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={resetZoom}
                    >
                        <Maximize className="h-4 w-4 mr-2" /> Reset
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={zoomFit}
                    >
                        <Maximize className="h-4 w-4 mr-2" /> Fit
                    </Button>
                </div>
            </div>

            <div className="space-y-2 border-t pt-2 mt-2">
                <h3 className="text-sm font-medium text-gray-700">Legend / Keterangan</h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-4 border bg-white" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 2px, transparent 2px, transparent 6px)' }}></div>
                        <span>Used (Red)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-4 border bg-white" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #eab308, #eab308 2px, transparent 2px, transparent 6px)' }}></div>
                        <span>Used By Other (Yellow)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-4 border bg-white" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #10b981, #10b981 2px, transparent 2px, transparent 6px)' }}></div>
                        <span>In Used (Green)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-4 border bg-white" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #3b82f6, #3b82f6 2px, transparent 2px, transparent 6px)' }}></div>
                        <span>Split (Blue)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-4 border bg-white" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #000000, #000000 2px, transparent 2px, transparent 6px)' }}></div>
                        <span>Done Split (Black)</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-auto pt-4 border-t text-xs text-gray-400">
                <p>• Drag box to move</p>
                <p>• Click empty space to pan</p>
                <p>• Drag container border to move base</p>
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-50 overflow-hidden cursor-crosshair" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={2000}
            height={2000}
            className="touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
};

export default ItemBarangCanvasPage;
