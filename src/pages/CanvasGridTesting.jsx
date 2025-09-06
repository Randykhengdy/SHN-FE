import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/useAlert';

export default function CanvasGridTestingPage() {
  const { showAlert } = useAlert();
  
  // Canvas refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [boxes, setBoxes] = useState([]);
  const [baseContainer, setBaseContainer] = useState({ width: 20, height: 20, x: 0, y: 0 });
  const [gridSize, setGridSize] = useState(30);
  const [zoom, setZoom] = useState(1);
  const [newBoxSize, setNewBoxSize] = useState({ width: 1, height: 1 });
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBoxId, setDraggedBoxId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  const [animationFrameId, setAnimationFrameId] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [containerDragOffset, setContainerDragOffset] = useState({ x: 0, y: 0 });
  const [isLeftClickPanning, setIsLeftClickPanning] = useState(false);
  const [leftClickPanStart, setLeftClickPanStart] = useState({ x: 0, y: 0 });
  
  // Colors for boxes
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6'];
  
  // Canvas drawing functions
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    const scaledGridSize = gridSize * zoom;
    
    // Apply pan offset
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    // Draw vertical lines
    for (let x = 0; x <= width + Math.abs(panOffset.x); x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height + Math.abs(panOffset.y));
      ctx.stroke();
    }
    
    // Draw horizontal lines
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
    
    // Draw container border with enhanced styling
    ctx.strokeStyle = isDraggingContainer ? '#3b82f6' : '#9ca3af';
    ctx.lineWidth = isDraggingContainer ? 4 : 3;
    ctx.setLineDash(isDraggingContainer ? [8, 4] : []);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    
    // Draw container label with enhanced styling
    ctx.fillStyle = isDraggingContainer ? '#1d4ed8' : '#6b7280';
    ctx.font = `bold ${12 * zoom}px Arial`;
    ctx.fillText(`Base: ${baseContainer.width}×${baseContainer.height}`, x + 5, y - 5);
    
    // Draw drag handle indicator
    if (isDraggingContainer) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = `${10 * zoom}px Arial`;
      ctx.fillText('🔄 Dragging...', x + 5, y + 15);
    }
    
    ctx.restore();
  }, [baseContainer, gridSize, zoom, panOffset, isDraggingContainer]);
  
  const drawBox = useCallback((ctx, box, isPreview = false, isDragged = false, isMovingWithContainer = false) => {
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    const x = box.x * gridSize * zoom;
    const y = box.y * gridSize * zoom;
    const width = box.width * gridSize * zoom;
    const height = box.height * gridSize * zoom;
    
    // Save context state
    ctx.save();
    
    // Draw box background with enhanced visual feedback
    if (isDragged) {
      // Add shadow for dragged box with more dramatic effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      
      // Add slight rotation for more dynamic feel
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(0.05); // Small rotation
      ctx.translate(-centerX, -centerY);
    } else if (isMovingWithContainer) {
      // Add subtle shadow for boxes moving with container
      ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    // Create gradient for more modern look
    if (isDragged) {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, `${box.color}FF`);
      gradient.addColorStop(1, `${box.color}CC`);
      ctx.fillStyle = gradient;
    } else if (isMovingWithContainer) {
      // Slightly more transparent for boxes moving with container
      ctx.fillStyle = `${box.color}E0`;
    } else if (isPreview) {
      ctx.fillStyle = `${box.color}40`;
    } else {
      ctx.fillStyle = box.color;
    }
    
    // Add rounded corners for modern look
    const radius = Math.min(width, height) * 0.1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    // Reset shadow and rotation
    ctx.restore();
    ctx.save();
    
    // Draw box border with enhanced styling
    ctx.strokeStyle = isPreview ? box.color : 
                      (isDragged ? '#fff' : 
                       (isMovingWithContainer ? '#3b82f6' : '#000'));
    ctx.lineWidth = isPreview ? 3 : 
                    (isDragged ? 3 : 
                     (isMovingWithContainer ? 2 : 1));
    ctx.setLineDash(isPreview ? [8, 4] : 
                    (isMovingWithContainer ? [4, 2] : []));
    
    // Draw rounded border
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw box content with better visibility
    ctx.fillStyle = isDragged ? '#000' : 
                    (isMovingWithContainer ? '#1d4ed8' : '#fff');
    ctx.font = `bold ${Math.max(12, Math.min(width, height) * 0.3)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Add text shadow for better readability
    if (isDragged) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    } else if (isMovingWithContainer) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 1;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    
    ctx.fillText(box.id.toString(), centerX, centerY - 5);
    ctx.font = `${Math.max(8, Math.min(width, height) * 0.2)}px Arial`;
    ctx.fillText(`${box.width}×${box.height}`, centerX, centerY + 8);
    
    // Restore context
    ctx.restore();
    ctx.restore(); // Restore pan offset
  }, [gridSize, zoom, panOffset, isDraggingContainer]);
  
  // Removed preview system for better performance
  
  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw base container
    drawBaseContainer(ctx);
    
    // Draw all boxes
    boxes.forEach(box => {
      const isDragged = isDragging && box.id === draggedBoxId;
      const isMovingWithContainer = isDraggingContainer && 
        box.x >= baseContainer.x && 
        box.x < baseContainer.x + baseContainer.width &&
        box.y >= baseContainer.y && 
        box.y < baseContainer.y + baseContainer.height;
      
      drawBox(ctx, box, false, isDragged, isMovingWithContainer);
    });
    
    // Draw preview position if dragging
    if (isDragging && previewPosition && draggedBoxId) {
      const draggedBox = boxes.find(box => box.id === draggedBoxId);
      if (draggedBox) {
        const previewBox = {
          ...draggedBox,
          x: previewPosition.x,
          y: previewPosition.y
        };
        drawBox(ctx, previewBox, true, false);
      }
    }
  }, [boxes, drawGrid, drawBaseContainer, drawBox, isDragging, draggedBoxId, previewPosition]);
  
  // Mouse event handlers
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
  
  // Alternative method to check if mouse is over a box using pixel coordinates
  const isMouseOverBox = useCallback((mousePos, box) => {
    const boxPixelX = (box.x * gridSize * zoom) + panOffset.x;
    const boxPixelY = (box.y * gridSize * zoom) + panOffset.y;
    const boxPixelWidth = box.width * gridSize * zoom;
    const boxPixelHeight = box.height * gridSize * zoom;
    
    return mousePos.x >= boxPixelX && 
           mousePos.x <= boxPixelX + boxPixelWidth &&
           mousePos.y >= boxPixelY && 
           mousePos.y <= boxPixelY + boxPixelHeight;
  }, [gridSize, zoom, panOffset]);

  // Check if mouse is over container boundary
  const isMouseOverContainer = useCallback((mousePos) => {
    const containerPixelX = (baseContainer.x * gridSize * zoom) + panOffset.x;
    const containerPixelY = (baseContainer.y * gridSize * zoom) + panOffset.y;
    const containerPixelWidth = baseContainer.width * gridSize * zoom;
    const containerPixelHeight = baseContainer.height * gridSize * zoom;
    
    // Check if mouse is on the border (not inside)
    const borderThickness = 8; // pixels
    const isOnBorder = (
      (mousePos.x >= containerPixelX - borderThickness && mousePos.x <= containerPixelX + containerPixelWidth + borderThickness &&
       mousePos.y >= containerPixelY - borderThickness && mousePos.y <= containerPixelY + borderThickness) || // Top border
      (mousePos.x >= containerPixelX - borderThickness && mousePos.x <= containerPixelX + containerPixelWidth + borderThickness &&
       mousePos.y >= containerPixelY + containerPixelHeight - borderThickness && mousePos.y <= containerPixelY + containerPixelHeight + borderThickness) || // Bottom border
      (mousePos.x >= containerPixelX - borderThickness && mousePos.x <= containerPixelX + borderThickness &&
       mousePos.y >= containerPixelY - borderThickness && mousePos.y <= containerPixelY + containerPixelHeight + borderThickness) || // Left border
      (mousePos.x >= containerPixelX + containerPixelWidth - borderThickness && mousePos.x <= containerPixelX + containerPixelWidth + borderThickness &&
       mousePos.y >= containerPixelY - borderThickness && mousePos.y <= containerPixelY + containerPixelHeight + borderThickness) // Right border
    );
    
    return isOnBorder;
  }, [baseContainer, gridSize, zoom, panOffset]);
  
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const mousePos = getMousePos(e);
    const gridPos = getGridPos(mousePos);
    
    // Check if clicking on container boundary first
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
    
    // Find clicked box using pixel-based detection (more accurate)
    const clickedBox = boxes.find(box => {
      return isMouseOverBox(mousePos, box);
    });
    
    if (clickedBox) {
      setIsDragging(true);
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
    
    // If clicking on empty canvas area, start left-click panning
    if (e.button === 0) { // Left mouse button
      setIsLeftClickPanning(true);
      setLeftClickPanStart(mousePos);
      setLastPanPos(mousePos);
    }
  }, [boxes, getMousePos, getGridPos, gridSize, zoom, isMouseOverBox, isMouseOverContainer, baseContainer]);
  
  // Smooth drag update using requestAnimationFrame with momentum
  const updateDragPosition = useCallback((mousePos) => {
    if (isDraggingContainer) {
      // Handle container dragging
      const newX = Math.round((mousePos.x - containerDragOffset.x) / (gridSize * zoom));
      const newY = Math.round((mousePos.y - containerDragOffset.y) / (gridSize * zoom));
      
      // Clamp container position to reasonable bounds
      const clampedX = Math.max(0, Math.min(newX, 50 - baseContainer.width));
      const clampedY = Math.max(0, Math.min(newY, 50 - baseContainer.height));
      
      // Calculate the movement delta
      const deltaX = clampedX - baseContainer.x;
      const deltaY = clampedY - baseContainer.y;
      
      // Update container position
      setBaseContainer(prev => ({ ...prev, x: clampedX, y: clampedY }));
      
      // Move all boxes inside container by the same delta
      if (deltaX !== 0 || deltaY !== 0) {
        setBoxes(prevBoxes => 
          prevBoxes.map(box => {
            // Check if box is inside the container
            const isInsideContainer = 
              box.x >= baseContainer.x && 
              box.x < baseContainer.x + baseContainer.width &&
              box.y >= baseContainer.y && 
              box.y < baseContainer.y + baseContainer.height;
            
            if (isInsideContainer) {
              // Move box by the same delta as container
              const newBoxX = box.x + deltaX;
              const newBoxY = box.y + deltaY;
              
              // Ensure box stays within reasonable bounds
              const clampedBoxX = Math.max(0, Math.min(newBoxX, 50 - box.width));
              const clampedBoxY = Math.max(0, Math.min(newBoxY, 50 - box.height));
              
              return { ...box, x: clampedBoxX, y: clampedBoxY };
            }
            
            return box; // Don't move boxes outside container
          })
        );
      }
      
      return;
    }
    
    if (!isDragging || !draggedBoxId) return;
    
    const draggedBox = boxes.find(box => box.id === draggedBoxId);
    if (!draggedBox) return;
    
    // Calculate velocity for momentum
    const deltaTime = 16; // ~60fps
    const newVelocity = {
      x: (mousePos.x - lastMousePos.x) / deltaTime,
      y: (mousePos.y - lastMousePos.y) / deltaTime
    };
    setVelocity(newVelocity);
    setLastMousePos(mousePos);
    
    // Calculate new position with better precision
    const newX = Math.round((mousePos.x - dragOffset.x) / (gridSize * zoom));
    const newY = Math.round((mousePos.y - dragOffset.y) / (gridSize * zoom));
    
    // Clamp to container bounds
    const clampedX = Math.max(baseContainer.x, 
      Math.min(newX, baseContainer.x + baseContainer.width - draggedBox.width));
    const clampedY = Math.max(baseContainer.y, 
      Math.min(newY, baseContainer.y + baseContainer.height - draggedBox.height));
    
    // Always update preview position for smooth visual feedback
    setPreviewPosition({ x: clampedX, y: clampedY });
    
    // Check for collisions with other boxes
    const hasCollision = boxes.some(box => 
      box.id !== draggedBoxId &&
      clampedX < box.x + box.width &&
      clampedX + draggedBox.width > box.x &&
      clampedY < box.y + box.height &&
      clampedY + draggedBox.height > box.y
    );
    
    // Only update actual position if no collision
    if (!hasCollision) {
      setBoxes(prevBoxes => 
        prevBoxes.map(box => 
          box.id === draggedBoxId 
            ? { ...box, x: clampedX, y: clampedY }
            : box
        )
      );
    }
  }, [isDragging, isDraggingContainer, draggedBoxId, boxes, dragOffset, containerDragOffset, gridSize, zoom, baseContainer, lastMousePos]);

  const handleMouseMove = useCallback((e) => {
    if ((!isDragging && !isDraggingContainer && !isLeftClickPanning) || 
        (!draggedBoxId && !isDraggingContainer && !isLeftClickPanning)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const mousePos = getMousePos(e);
    
    // Handle left-click panning
    if (isLeftClickPanning) {
      const deltaX = mousePos.x - lastPanPos.x;
      const deltaY = mousePos.y - lastPanPos.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPos(mousePos);
      return;
    }
    
    // Cancel previous animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Use requestAnimationFrame for smooth updates
    const frameId = requestAnimationFrame(() => {
      updateDragPosition(mousePos);
    });
    
    setAnimationFrameId(frameId);
  }, [isDragging, isDraggingContainer, isLeftClickPanning, draggedBoxId, getMousePos, updateDragPosition, animationFrameId, lastPanPos]);
  
  const handleMouseUp = useCallback((e) => {
    e.preventDefault();
    
    // Cancel any pending animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }
    
    setIsDragging(false);
    setDraggedBoxId(null);
    setPreviewPosition(null);
    setLastUpdateTime(0);
    setDragStartPos({ x: 0, y: 0 });
    setVelocity({ x: 0, y: 0 });
    setLastMousePos({ x: 0, y: 0 });
    setIsPanning(false);
    setIsDraggingContainer(false);
    setContainerDragOffset({ x: 0, y: 0 });
    setIsLeftClickPanning(false);
    setLeftClickPanStart({ x: 0, y: 0 });
  }, [animationFrameId]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const mousePos = getMousePos(e);
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.2, Math.min(3, zoom + delta));
    
    if (newZoom !== zoom) {
      // Zoom towards mouse cursor
      const zoomFactor = newZoom / zoom;
      const newPanX = mousePos.x - (mousePos.x - panOffset.x) * zoomFactor;
      const newPanY = mousePos.y - (mousePos.y - panOffset.y) * zoomFactor;
      
      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    }
  }, [zoom, panOffset, getMousePos]);

  // Pan functionality
  const handleMouseDownPan = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left
      e.preventDefault();
      e.stopPropagation();
      
      const mousePos = getMousePos(e);
      setIsPanning(true);
      setLastPanPos(mousePos);
    }
  }, [getMousePos]);

  const handleMouseMovePan = useCallback((e) => {
    if (isPanning) {
      e.preventDefault();
      e.stopPropagation();
      
      const mousePos = getMousePos(e);
      const deltaX = mousePos.x - lastPanPos.x;
      const deltaY = mousePos.y - lastPanPos.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPos(mousePos);
    }
  }, [isPanning, lastPanPos, getMousePos]);

  const handleMouseUpPan = useCallback((e) => {
    if (isPanning) {
      e.preventDefault();
      setIsPanning(false);
    }
  }, [isPanning]);
  
  // Box management functions
  const addBox = useCallback(() => {
    if (newBoxSize.width > baseContainer.width || newBoxSize.height > baseContainer.height) {
      showAlert('Error', `Box size (${newBoxSize.width}×${newBoxSize.height}) is too big for container (${baseContainer.width}×${baseContainer.height})`, 'error');
      return;
    }
    
    const newId = boxes.length > 0 ? Math.max(...boxes.map(b => b.id)) + 1 : 1;
    const newColor = colors[(newId - 1) % colors.length];
    
    // Find first available position
    let placed = false;
    for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - newBoxSize.height && !placed; y++) {
      for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - newBoxSize.width && !placed; x++) {
        const hasCollision = boxes.some(box => 
          x < box.x + box.width &&
          x + newBoxSize.width > box.x &&
          y < box.y + box.height &&
          y + newBoxSize.height > box.y
        );
        
        if (!hasCollision) {
          setBoxes(prevBoxes => [...prevBoxes, {
            id: newId,
            x: x,
            y: y,
            width: newBoxSize.width,
            height: newBoxSize.height,
            color: newColor
          }]);
          placed = true;
        }
      }
    }
    
    if (!placed) {
      showAlert('Error', 'No space available for new box!', 'error');
      return;
    }
    
    showAlert('Success', `Box ${newId} (${newBoxSize.width}×${newBoxSize.height}) added!`, 'success');
  }, [boxes, newBoxSize, baseContainer, colors, showAlert]);
  
  const clearAllBoxes = useCallback(() => {
    setBoxes([]);
    showAlert('Success', 'All boxes cleared!', 'success');
  }, [showAlert]);
  
  const updateBaseContainer = useCallback((width, height) => {
    setBaseContainer(prev => ({ ...prev, width, height }));
  }, []);
  
  // Zoom functions
  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 0.2, 3);
    if (newZoom !== zoom) {
      setZoom(newZoom);
    }
  }, [zoom]);
  
  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 0.2, 0.2);
    if (newZoom !== zoom) {
      setZoom(newZoom);
    }
  }, [zoom]);
  
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Data export/import functions
  const exportToJSON = useCallback(() => {
    const gridData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      baseContainer: baseContainer,
      boxes: boxes,
      gridSize: gridSize,
      zoom: zoom,
      panOffset: panOffset,
      metadata: {
        totalBoxes: boxes.length,
        containerSize: `${baseContainer.width}×${baseContainer.height}`,
        gridCellSize: `${gridSize}px`,
        zoomLevel: `${Math.round(zoom * 100)}%`
      }
    };
    
    return JSON.stringify(gridData, null, 2);
  }, [baseContainer, boxes, gridSize, zoom, panOffset]);

  const downloadJSON = useCallback(() => {
    const jsonData = exportToJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grid-layout-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('Success', 'Grid layout exported successfully!', 'success');
  }, [exportToJSON, showAlert]);

  const importFromJSON = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.baseContainer || !data.boxes || !Array.isArray(data.boxes)) {
        throw new Error('Invalid data format');
      }
      
      // Update state with imported data
      setBaseContainer(data.baseContainer);
      setBoxes(data.boxes);
      if (data.gridSize) setGridSize(data.gridSize);
      if (data.zoom) setZoom(data.zoom);
      if (data.panOffset) setPanOffset(data.panOffset);
      
      showAlert('Success', `Grid layout imported successfully! Loaded ${data.boxes.length} boxes.`, 'success');
    } catch (error) {
      showAlert('Error', 'Failed to import grid layout. Please check the file format.', 'error');
      console.error('Import error:', error);
    }
  }, [showAlert]);

  const handleFileImport = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      importFromJSON(e.target.result);
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }, [importFromJSON]);

  const copyToClipboard = useCallback(async () => {
    try {
      const jsonData = exportToJSON();
      await navigator.clipboard.writeText(jsonData);
      showAlert('Success', 'Grid layout copied to clipboard!', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to copy to clipboard', 'error');
      console.error('Clipboard error:', error);
    }
  }, [exportToJSON, showAlert]);
  
  // Canvas setup and resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      // Cleanup animation frame on unmount
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [draw, animationFrameId]);
  
  // Redraw when state changes
  useEffect(() => {
    draw();
  }, [draw, boxes, baseContainer, isDragging, previewPosition]);
  
  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    handleMouseUp(mouseEvent);
  }, [handleMouseUp]);

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousedown', handleMouseDownPan);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousemove', handleMouseMovePan);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUpPan);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousedown', handleMouseDownPan);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousemove', handleMouseMovePan);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handleMouseUpPan);
      canvas.removeEventListener('wheel', handleWheel);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseDownPan, handleMouseMovePan, handleMouseUpPan, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🎨 Canvas Grid System</h1>
            <p className="text-gray-600">High-performance grid system for 500+ boxes</p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Canvas Rendering</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">500+ Boxes</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Smooth Zoom</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600">
              ✅ {boxes.length} Boxes Ready
            </div>
            <div className="text-xs text-gray-500">
              Canvas Performance Mode
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Controls Panel */}
        <div className="w-80 bg-gray-50 border-r overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Box Info */}
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">Performance Info</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Total Boxes:</span> {boxes.length}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Container:</span> {baseContainer.width}×{baseContainer.height}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Position:</span> ({baseContainer.x}, {baseContainer.y})
                </div>
                <div className="text-sm">
                  <span className="font-medium">Rendering:</span> Canvas
                </div>
                <div className="text-sm">
                  <span className="font-medium">Zoom:</span> {Math.round(zoom * 100)}%
                </div>
                <div className="text-sm">
                  <span className="font-medium">Grid Size:</span> {gridSize}px
                </div>
                <div className="text-sm">
                  <span className="font-medium">Pan Offset:</span> ({Math.round(panOffset.x)}, {Math.round(panOffset.y)})
                </div>
              </div>
            </div>

            {/* Base Container Controls */}
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">Base Container</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Size:</span> {baseContainer.width}×{baseContainer.height} grid cells
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Width</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={baseContainer.width}
                      onChange={(e) => updateBaseContainer(parseInt(e.target.value) || 1, baseContainer.height)}
                      className="w-full h-6 text-xs border rounded px-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Height</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={baseContainer.height}
                      onChange={(e) => updateBaseContainer(baseContainer.width, parseInt(e.target.value) || 1)}
                      className="w-full h-6 text-xs border rounded px-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Box Size Controls */}
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">New Box Size</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Width</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newBoxSize.width}
                      onChange={(e) => setNewBoxSize(prev => ({ ...prev, width: parseInt(e.target.value) || 1 }))}
                      className="w-full h-6 text-xs border rounded px-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Height</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newBoxSize.height}
                      onChange={(e) => setNewBoxSize(prev => ({ ...prev, height: parseInt(e.target.value) || 1 }))}
                      className="w-full h-6 text-xs border rounded px-1"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Size: {newBoxSize.width}×{newBoxSize.height} ({newBoxSize.width * newBoxSize.height} cells)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={addBox}
                  className="w-full h-8 text-sm bg-green-600 hover:bg-green-700"
                >
                  Add New Box
                </Button>
                <Button
                  onClick={clearAllBoxes}
                  className="w-full h-8 text-sm bg-red-600 hover:bg-red-700"
                >
                  Clear All Boxes
                </Button>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">Data Management</h3>
              <div className="space-y-2">
                <Button
                  onClick={downloadJSON}
                  className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                >
                  📥 Download JSON
                </Button>
                <Button
                  onClick={copyToClipboard}
                  className="w-full h-8 text-sm bg-green-600 hover:bg-green-700"
                >
                  📋 Copy to Clipboard
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-import"
                  />
                  <Button
                    className="w-full h-8 text-sm bg-purple-600 hover:bg-purple-700"
                    asChild
                  >
                    <label htmlFor="file-import" className="cursor-pointer">
                      📤 Import JSON
                    </label>
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Export/Import grid layout data for database storage
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">Zoom Controls</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Zoom:</span> {Math.round(zoom * 100)}%
                </div>
                <div className="flex space-x-1">
                  <Button
                    onClick={zoomOut}
                    className="flex-1 h-8 text-sm bg-gray-600 hover:bg-gray-700"
                  >
                    Zoom Out
                  </Button>
                  <Button
                    onClick={resetZoom}
                    className="flex-1 h-8 text-sm bg-gray-500 hover:bg-gray-600"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={zoomIn}
                    className="flex-1 h-8 text-sm bg-gray-600 hover:bg-gray-700"
                  >
                    Zoom In
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h3 className="text-sm font-medium mb-2 text-blue-800">How to Use</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Click and drag any box to move it</div>
                <div>• Click and drag container border to move it</div>
                <div>• Boxes inside container move together</div>
                <div>• Click and drag empty area to pan</div>
                <div>• Mouse wheel to zoom in/out</div>
                <div>• Ctrl+Click or Middle mouse to pan</div>
                <div>• Boxes snap to grid positions</div>
                <div>• Each grid cell is {gridSize}px × {gridSize}px</div>
                <div>• Canvas rendering for smooth performance</div>
                <div>• Supports 500+ boxes without lag</div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-gray-100">
          <div 
            ref={containerRef}
            className="h-full border-2 border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ 
                background: '#f9fafb',
                cursor: isDragging ? 'grabbing' : 
                        (isPanning ? 'grabbing' : 
                         (isDraggingContainer ? 'move' : 
                          (isLeftClickPanning ? 'grabbing' : 'grab'))),
                touchAction: 'none' // Prevent scrolling on touch devices
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
