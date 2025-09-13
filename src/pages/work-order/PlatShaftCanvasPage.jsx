import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/useAlert';

export default function PlatShaftCanvasPage({ hideTitle = false }) {
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
  
  // Work order data from sessionStorage
  const [workOrderData, setWorkOrderData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Sidebar toggle state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBoxId, setDraggedBoxId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState(null);
  const [hasCollision, setHasCollision] = useState(false);
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
  const [selectedBoxIds, setSelectedBoxIds] = useState(new Set());
  
  // Colors for boxes
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6'];
  
  // Load work order data from sessionStorage
  useEffect(() => {
    if (isInitialized) return; // Prevent multiple initializations
    
    const storedData = sessionStorage.getItem('canvasData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setWorkOrderData(data);
        
        // Update base container dimensions (Saran Plat)
        const platWidth = data.platPanjang || 20;
        const platHeight = data.platLebar || 20;
        setBaseContainer(prev => ({
          ...prev,
          width: platWidth,
          height: platHeight
        }));
        
        // Update box size (Work Order Item)
        const itemWidth = data.itemPanjang || 1;
        const itemHeight = data.itemLebar || 1;
        setNewBoxSize({
          width: itemWidth,
          height: itemHeight
        });
        
        // Don't auto-generate boxes - let user choose when to fill
        
        setIsInitialized(true);
        showAlert('Success', `Loaded work order data: ${data.itemQty} items`, 'success');
      } catch (error) {
        console.error('Error loading canvas data:', error);
        showAlert('Error', 'Failed to load work order data', 'error');
      }
    }
  }, [isInitialized, showAlert]);
  
  // Generate initial boxes based on work order quantity
  const generateInitialBoxes = useCallback((quantity, itemWidth, itemHeight) => {
    const newBoxes = [];
    const newId = 1; // Start from 1 for new boxes
    
    for (let i = 0; i < quantity; i++) {
      const boxId = newId + i;
      // Use single color for all boxes initially
      const color = '#10b981'; // Green color for all boxes
      
      // Position boxes in a grid pattern within the base container
      const colsPerRow = Math.ceil(Math.sqrt(quantity));
      const x = (i % colsPerRow) * (itemWidth + 1);
      const y = Math.floor(i / colsPerRow) * (itemHeight + 1);
      
      newBoxes.push({
        id: boxId,
        x: x,
        y: y,
        width: itemWidth,
        height: itemHeight,
        color: color,
        isDisabled: false
      });
    }
    
    setBoxes(newBoxes);
  }, []);
  
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
  
  const drawBox = useCallback((ctx, box, isPreview = false, isDragged = false, isMovingWithContainer = false, isSelected = false, hasCollision = false) => {
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
    } else if (isSelected) {
      // Add selection highlight
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 8;
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
    } else if (isSelected) {
      // Red tint for selected boxes
      ctx.fillStyle = `${box.color}CC`;
    } else if (isPreview) {
      // Show red color if there's a collision, otherwise semi-transparent
      ctx.fillStyle = hasCollision ? '#ef444440' : `${box.color}40`;
    } else if (box.isDisabled) {
      // Red color for disabled boxes
      ctx.fillStyle = '#ef4444';
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
    ctx.strokeStyle = isPreview ? (hasCollision ? '#ef4444' : box.color) : 
                      (isDragged ? '#fff' : 
                       (isMovingWithContainer ? '#3b82f6' : 
                        (isSelected ? '#ef4444' : 
                         (box.isDisabled ? '#dc2626' : '#000'))));
    ctx.lineWidth = isPreview ? 3 : 
                    (isDragged ? 3 : 
                     (isMovingWithContainer ? 2 : 
                      (isSelected ? 3 : 
                       (box.isDisabled ? 2 : 1))));
    ctx.setLineDash(isPreview ? [8, 4] : 
                    (isMovingWithContainer ? [4, 2] : 
                     (isSelected ? [6, 3] : 
                      (box.isDisabled ? [3, 3] : []))));
    
    // Draw rounded border
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw box content with better visibility
    ctx.fillStyle = isDragged ? '#000' : 
                    (isMovingWithContainer ? '#1d4ed8' : 
                     (isSelected ? '#fff' : 
                      (box.isDisabled ? '#4b5563' : '#fff')));
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
    } else if (isSelected) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }
    
    ctx.fillText(box.id.toString(), centerX, centerY - 5);
    ctx.font = `${Math.max(8, Math.min(width, height) * 0.2)}px Arial`;
    ctx.fillText(`${box.width}×${box.height}`, centerX, centerY + 8);
    
    // Draw selection indicator
    if (isSelected) {
      ctx.fillStyle = '#ef4444';
      ctx.font = `${Math.max(10, Math.min(width, height) * 0.25)}px Arial`;
      ctx.fillText('✓', x + width - 8, y + 8);
    }
    
    // Draw disabled indicator
    if (box.isDisabled) {
      ctx.fillStyle = '#6b7280';
      ctx.font = `${Math.max(8, Math.min(width, height) * 0.2)}px Arial`;
      ctx.fillText('🔒', x + width - 8, y + height - 8);
    }
    
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
    
    // Draw preview position if dragging
    if (isDragging && previewPosition && draggedBoxId) {
      const draggedBox = boxes && boxes.length > 0 ? boxes.find(box => box.id === draggedBoxId) : null;
      if (draggedBox) {
        const previewBox = {
          ...draggedBox,
          x: previewPosition.x,
          y: previewPosition.y
        };
        drawBox(ctx, previewBox, true, false, false, false, hasCollision);
      }
    }
  }, [boxes, drawGrid, drawBaseContainer, drawBox, isDragging, draggedBoxId, previewPosition, hasCollision]);
  
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
    const clickedBox = boxes && boxes.length > 0 ? boxes.find(box => {
      return isMouseOverBox(mousePos, box);
    }) : null;
    
    
    if (clickedBox) {
      // Check if box is disabled
      if (clickedBox.isDisabled) {
        showAlert('Info', 'This box is disabled and cannot be moved', 'info');
        return;
      }
      
      // Left-click: single select box and prepare for drag
      setSelectedBoxIds(new Set([clickedBox.id]));
      
      // Prepare for drag (will start dragging on mousemove)
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
    
    // If clicking on empty canvas area
    if (e.button === 0) { // Left mouse button
      // Start left-click panning
      setIsLeftClickPanning(true);
      setLeftClickPanStart(mousePos);
      setLastPanPos(mousePos);
    }
  }, [boxes, getMousePos, getGridPos, gridSize, zoom, isMouseOverBox, isMouseOverContainer, baseContainer]);

  // Right-click handler for selection
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const mousePos = getMousePos(e);
    
    // Find clicked box
    const clickedBox = boxes && boxes.length > 0 ? boxes.find(box => {
      return isMouseOverBox(mousePos, box);
    }) : null;
    
    if (clickedBox) {
      // Toggle selection on right-click
      setSelectedBoxIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(clickedBox.id)) {
          newSet.delete(clickedBox.id);
        } else {
          newSet.add(clickedBox.id);
        }
        return newSet;
      });
    } else {
      // Clear selection when right-clicking empty area
      setSelectedBoxIds(new Set());
    }
  }, [boxes, getMousePos, isMouseOverBox]);
  
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
    
    const draggedBox = boxes && boxes.length > 0 ? boxes.find(box => box.id === draggedBoxId) : null;
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
    
    // Check for collisions with other boxes
    const hasCollision = boxes && boxes.length > 0 ? boxes.some(box => 
      box.id !== draggedBoxId &&
      clampedX < box.x + box.width &&
      clampedX + draggedBox.width > box.x &&
      clampedY < box.y + box.height &&
      clampedY + draggedBox.height > box.y
    ) : false;
    
    // Always update preview position for smooth visual feedback
    setPreviewPosition({ x: clampedX, y: clampedY });
    
    // Update collision state for visual feedback
    setHasCollision(hasCollision);
    
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
    
    // Start dragging if we have a draggedBoxId but not yet dragging
    if (draggedBoxId && !isDragging && !isDraggingContainer && !isLeftClickPanning) {
      const mousePos = getMousePos(e);
      const dragDistance = Math.sqrt(
        Math.pow(mousePos.x - dragStartPos.x, 2) + 
        Math.pow(mousePos.y - dragStartPos.y, 2)
      );
      
      // Start dragging if mouse moved more than 5 pixels
      if (dragDistance > 5) {
        setIsDragging(true);
      }
    }
    
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
    
    // If we had a draggedBoxId but didn't actually drag, it was just a click
    if (draggedBoxId && !isDragging) {
      // Box was selected on click, no need to clear selection
    }
    
    setIsDragging(false);
    setDraggedBoxId(null);
    setPreviewPosition(null);
    setHasCollision(false);
    setLastUpdateTime(0);
    setDragStartPos({ x: 0, y: 0 });
    setVelocity({ x: 0, y: 0 });
    setLastMousePos({ x: 0, y: 0 });
    setIsPanning(false);
    setIsDraggingContainer(false);
    setContainerDragOffset({ x: 0, y: 0 });
    setIsLeftClickPanning(false);
    setLeftClickPanStart({ x: 0, y: 0 });
  }, [animationFrameId, draggedBoxId, isDragging]);

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
    
    setBoxes(prevBoxes => {
      const newId = prevBoxes && prevBoxes.length > 0 ? Math.max(...prevBoxes.map(b => b.id)) + 1 : 1;
      const newColor = colors[(newId - 1) % colors.length];
    
      // Find first available position
      let placed = false;
      let newBox = null;
      
      for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - newBoxSize.height && !placed; y++) {
        for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - newBoxSize.width && !placed; x++) {
          const hasCollision = prevBoxes && prevBoxes.length > 0 ? prevBoxes.some(box => 
            x < box.x + box.width &&
            x + newBoxSize.width > box.x &&
            y < box.y + box.height &&
            y + newBoxSize.height > box.y
          ) : false;
          
          if (!hasCollision) {
            newBox = {
              id: newId,
              x: x,
              y: y,
              width: newBoxSize.width,
              height: newBoxSize.height,
              color: newColor,
              isDisabled: false // Default: new boxes are enabled
            };
            placed = true;
          }
        }
      }
      
      if (!placed) {
        showAlert('Error', 'No space available for new box!', 'error');
        return prevBoxes; // Return unchanged state
      }
      
      showAlert('Success', `Box ${newId} (${newBoxSize.width}×${newBoxSize.height}) added!`, 'success');
      return [...prevBoxes, newBox];
    });
  }, [newBoxSize, baseContainer, colors, showAlert]);
  
  const clearAllBoxes = useCallback(() => {
    setBoxes([]);
    showAlert('Success', 'All boxes cleared!', 'success');
  }, [showAlert]);

  const fillAllBoxes = useCallback(() => {
    if (!workOrderData || workOrderData.itemQty <= 0) {
      showAlert('Error', 'No work order data available', 'error');
      return;
    }

    const targetQuantity = workOrderData.itemQty;
    const currentQuantity = boxes ? boxes.length : 0;
    const remainingQuantity = targetQuantity - currentQuantity;

    if (remainingQuantity <= 0) {
      showAlert('Info', 'All boxes already filled!', 'info');
      return;
    }

    // Generate remaining boxes
    const newBoxes = [];
    let newId = boxes && boxes.length > 0 ? Math.max(...boxes.map(b => b.id)) + 1 : 1;
    
    for (let i = 0; i < remainingQuantity; i++) {
      const boxId = newId + i;
      const color = colors[(boxId - 1) % colors.length];
      
      // Find available position
      let placed = false;
      for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - newBoxSize.height && !placed; y++) {
        for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - newBoxSize.width && !placed; x++) {
          const hasCollision = boxes && boxes.length > 0 ? boxes.some(box => 
            x < box.x + box.width &&
            x + newBoxSize.width > box.x &&
            y < box.y + box.height &&
            y + newBoxSize.height > box.y
          ) : false;
          
          if (!hasCollision) {
            newBoxes.push({
              id: boxId,
              x: x,
              y: y,
              width: newBoxSize.width,
              height: newBoxSize.height,
              color: color,
              isDisabled: false
            });
            placed = true;
          }
        }
      }
    }

    if (newBoxes.length > 0) {
      setBoxes(prevBoxes => [...(prevBoxes || []), ...newBoxes]);
      showAlert('Success', `Added ${newBoxes.length} boxes! Total: ${(boxes ? boxes.length : 0) + newBoxes.length}/${targetQuantity}`, 'success');
    } else {
      showAlert('Error', 'No space available for new boxes!', 'error');
    }
  }, [workOrderData, boxes, newBoxSize, baseContainer, colors, showAlert]);
  
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
        totalBoxes: boxes ? boxes.length : 0,
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
      // Ensure backward compatibility by adding isDisabled if missing
      const boxesWithDefaults = data.boxes.map(box => ({
        ...box,
        isDisabled: box.isDisabled !== undefined ? box.isDisabled : false
      }));
      setBoxes(boxesWithDefaults);
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

  // Cell occupancy calculation
  const calculateCellOccupancy = useCallback(() => {
    // Safety check for baseContainer dimensions
    if (!baseContainer || !baseContainer.width || !baseContainer.height || baseContainer.width <= 0 || baseContainer.height <= 0) {
      return {
        total: 0,
        occupied: 0,
        empty: 0,
        percentage: 0
      };
    }
    
    const totalCells = baseContainer.width * baseContainer.height;
    let occupiedCells = 0;
    
    // Create a grid to track occupied cells
    const grid = Array(baseContainer.height).fill().map(() => 
      Array(baseContainer.width).fill(false)
    );
    
    // Mark occupied cells
    if (boxes && boxes.length > 0) {
      boxes.forEach(box => {
        // Safety check for box properties
        if (box && typeof box.x === 'number' && typeof box.y === 'number' && 
            typeof box.width === 'number' && typeof box.height === 'number' &&
            box.width > 0 && box.height > 0) {
          for (let y = box.y; y < box.y + box.height; y++) {
            for (let x = box.x; x < box.x + box.width; x++) {
              if (x >= 0 && x < baseContainer.width && y >= 0 && y < baseContainer.height) {
                if (grid[y] && grid[y][x] !== undefined) {
                  if (!grid[y][x]) {
                    grid[y][x] = true;
                    occupiedCells++;
                  }
                }
              }
            }
          }
        }
      });
    }
    
    const emptyCells = totalCells - occupiedCells;
    const occupancyPercentage = totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0;
    
    return {
      total: totalCells,
      occupied: occupiedCells,
      empty: emptyCells,
      percentage: occupancyPercentage
    };
  }, [baseContainer, boxes]);

  // Selection and delete functions
  const toggleSelectedBoxesDisabled = useCallback(() => {
    if (selectedBoxIds.size === 0) {
      showAlert('Info', 'No boxes selected to toggle disable state', 'info');
      return;
    }
    
    setBoxes(prevBoxes => 
      prevBoxes.map(box => 
        selectedBoxIds.has(box.id) 
          ? { ...box, isDisabled: !box.isDisabled }
          : box
      )
    );
    
    const disabledCount = boxes && boxes.length > 0 ? boxes.filter(box => 
      selectedBoxIds.has(box.id) && !box.isDisabled
    ).length : 0;
    
    const enabledCount = boxes && boxes.length > 0 ? boxes.filter(box => 
      selectedBoxIds.has(box.id) && box.isDisabled
    ).length : 0;
    
    if (disabledCount > 0) {
      showAlert('Success', `${disabledCount} box(es) disabled`, 'success');
    } else if (enabledCount > 0) {
      showAlert('Success', `${enabledCount} box(es) enabled`, 'success');
    }
  }, [selectedBoxIds, boxes, showAlert]);

  const deleteSelectedBoxes = useCallback(() => {
    if (selectedBoxIds.size === 0) {
      showAlert('Info', 'No boxes selected for deletion', 'info');
      return;
    }
    
    setBoxes(prevBoxes => prevBoxes.filter(box => !selectedBoxIds.has(box.id)));
    setSelectedBoxIds(new Set());
    showAlert('Success', `Deleted ${selectedBoxIds.size} box(es)`, 'success');
  }, [selectedBoxIds, showAlert]);

  const selectAllBoxes = useCallback(() => {
    const allBoxIds = new Set(boxes && boxes.length > 0 ? boxes.map(box => box.id) : []);
    setSelectedBoxIds(allBoxIds);
  }, [boxes]);

  const clearSelection = useCallback(() => {
    setSelectedBoxIds(new Set());
  }, []);
  
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

  // Keyboard event handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedBoxIds.size > 0) {
        deleteSelectedBoxes();
      }
    } else if (e.key === 'Escape') {
      setSelectedBoxIds(new Set());
    } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      selectAllBoxes();
    }
  }, [selectedBoxIds, deleteSelectedBoxes, selectAllBoxes]);

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousedown', handleMouseDownPan);
    canvas.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousemove', handleMouseMovePan);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUpPan);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousedown', handleMouseDownPan);
      canvas.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousemove', handleMouseMovePan);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handleMouseUpPan);
      canvas.removeEventListener('wheel', handleWheel);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseDownPan, handleMouseMovePan, handleMouseUpPan, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown, handleRightClick]);
  
  return (
    <div className="h-screen flex flex-col">
      {!hideTitle && (
        <div className="p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back button removed - handled by parent component */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">🔧 Plat/Shaft Canvas System</h1>
                <p className="text-gray-600">Advanced canvas system for work order item visualization</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Work Order Items</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Drag & Drop</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Grid Layout</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="flex items-center gap-2"
              >
                {sidebarVisible ? 'Hide' : 'Show'} Properties
              </Button>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-green-600">
                ✅ {boxes ? boxes.length : 0}/{workOrderData ? workOrderData.itemQty : 0} Boxes Ready
              </div>
              <div className="text-xs text-gray-500">
                Canvas Performance Mode
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex">
        {/* Controls Panel */}
        {sidebarVisible && (
          <div className="w-80 bg-gray-50 border-r h-full overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Box Info */}
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="text-sm font-medium mb-3">Grid Statistics</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Total Boxes:</span> {boxes ? boxes.length : 0}/{workOrderData ? workOrderData.itemQty : 0}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Container:</span> {baseContainer.width}×{baseContainer.height}
                  </div>
                
                  {/* Cell Occupancy */}
                  {(() => {
                    const occupancy = baseContainer && baseContainer.width > 0 && baseContainer.height > 0 ? calculateCellOccupancy() : {
                      total: 0,
                      occupied: 0,
                      empty: 0,
                      percentage: 0
                    };
                    return (
                      <>
                        <div className="border-t pt-2 mt-2">
                          <div className="text-sm font-medium text-gray-700 mb-1">Cell Occupancy</div>
                          <div className="text-sm">
                            <span className="font-medium text-green-600">Occupied:</span> {occupancy.occupied} cells
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-500">Empty:</span> {occupancy.empty} cells
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Total:</span> {occupancy.total} cells
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Usage:</span> {occupancy.percentage}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${occupancy.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Base Container Controls */}
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="text-sm font-medium mb-3">Base Container</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Size:</span> {baseContainer.width}×{baseContainer.height} units
                  </div>
                  {workOrderData && (
                    <div className="text-xs text-blue-600 mt-1">
                      Saran Plat: {workOrderData.platPanjang} × {workOrderData.platLebar}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Width</label>
                      <div className="w-full h-6 text-xs border rounded px-1 bg-gray-50 flex items-center text-gray-700">
                        {baseContainer.width}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Height</label>
                      <div className="w-full h-6 text-xs border rounded px-1 bg-gray-50 flex items-center text-gray-700">
                        {baseContainer.height}
                      </div>
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
                      <div className="w-full h-6 text-xs border rounded px-1 bg-gray-50 flex items-center text-gray-700">
                        {newBoxSize.width}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Height</label>
                      <div className="w-full h-6 text-xs border rounded px-1 bg-gray-50 flex items-center text-gray-700">
                        {newBoxSize.height}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Size: {newBoxSize.width}×{newBoxSize.height} units
                  </div>
                  {workOrderData && (
                    <div className="text-xs text-green-600 mt-1">
                      WO Item: {workOrderData.itemPanjang} × {workOrderData.itemLebar}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="text-sm font-medium mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={fillAllBoxes}
                    className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                  >
                    Fill All ({workOrderData ? workOrderData.itemQty : 0} boxes)
                  </Button>
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

              {/* Selection Controls */}
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="text-sm font-medium mb-3">Selection & Delete</h3>
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-2">
                    Selected: {selectedBoxIds.size} box(es)
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      onClick={selectAllBoxes}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                      disabled={!boxes || boxes.length === 0}
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={clearSelection}
                      className="h-7 text-xs bg-gray-500 hover:bg-gray-600"
                      disabled={selectedBoxIds.size === 0}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      onClick={toggleSelectedBoxesDisabled}
                      className="h-8 text-sm bg-yellow-600 hover:bg-yellow-700"
                      disabled={selectedBoxIds.size === 0}
                    >
                      🔒 Toggle Disable
                    </Button>
                    <Button
                      onClick={deleteSelectedBoxes}
                      className="h-8 text-sm bg-red-600 hover:bg-red-700"
                      disabled={selectedBoxIds.size === 0}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Left-click: single select + drag | Right-click: multi select
                  </div>
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
                  <div>• Left-click boxes to select (single) and drag them</div>
                  <div>• Right-click boxes to toggle selection (multi)</div>
                  <div>• Toggle Disable to lock/unlock boxes</div>
                  <div>• Disabled boxes cannot be moved</div>
                  <div>• Press Delete key to remove selected boxes</div>
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
        )}

        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-gray-100 relative">
          {/* Toggle button when title is hidden */}
          {hideTitle && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="flex items-center gap-2 bg-white shadow-lg"
              >
                {sidebarVisible ? 'Hide' : 'Show'} Properties
              </Button>
            </div>
          )}
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
