import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Edit3, Download, RotateCcw, Square, SquareStack, Settings, X, Scissors, Grid3X3 } from 'lucide-react';
import * as fabric from 'fabric';
import { platTypes } from '@/data/platData';
import { useAlert } from '@/hooks/useAlert';

export default function CanvasTestingPage() {
  const { showAlert } = useAlert();
  
  // Canvas State
  const canvasRef = useRef(null);
  const canvasInstanceRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [baseRect, setBaseRect] = useState(null);
  const [cuts, setCuts] = useState([]);
  
  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Mode State
  const [mode, setMode] = useState('2D'); // '1D' or '2D'
  
  // UI State
  const [showConfig, setShowConfig] = useState(true);
  const [remainingInfo, setRemainingInfo] = useState({ area: 0, weight: 0, efficiency: 0 });
  const [showGrid, setShowGrid] = useState(true); // Always show grid for booking
  const [bookingMode, setBookingMode] = useState(true); // Enable booking mode
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'cuts', 'actions'
  
  // Base plate movement tracking
  const [isBasePlateMoving, setIsBasePlateMoving] = useState(false);
  
  // Booking grid system
  const [bookingGrid, setBookingGrid] = useState([]);
  const [gridSize, setGridSize] = useState(1); // 1px = 0.2cm grid (no spacing)
  
  // Block system: 1 block = 5cm = 25px
  const blockSize = 5; // cm per block
  const blockSizePx = 25; // pixels per block (5cm * 5px/cm)
  
  // Helper functions for block system
  const cmToBlocks = (cm) => Math.round(cm / blockSize);
  const blocksToCm = (blocks) => blocks * blockSize;
  const formatDimension = (cm) => `${cm}cm (${cmToBlocks(cm)} blocks)`;
  
  // Zoom functions
  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.2, 5); // Max 5x zoom
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };
  
  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.2, 0.1); // Min 0.1x zoom
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };
  
  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    applyZoom(1);
  };
  
  const applyZoom = (zoom) => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) return;
    
    fabricCanvas.setZoom(zoom);
    fabricCanvas.renderAll();
  };
  
  // Validation functions
  const validateDimensions = (width, height) => {
    const errors = [];
    
    if (!width || width <= 0) {
      errors.push('Width must be greater than 0');
    }
    if (!height || height <= 0) {
      errors.push('Height must be greater than 0');
    }
    if (width > 1000) {
      errors.push('Width too large (max 1000cm)');
    }
    if (height > 1000) {
      errors.push('Height too large (max 1000cm)');
    }
    
    return errors;
  };
  
  const canFitInBasePlate = (cutWidth, cutHeight) => {
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) return false;
    
    const baseWidthCm = currentBaseRect.width / 5; // Convert px to cm
    const baseHeightCm = currentBaseRect.height / 5; // Convert px to cm
    
    return cutWidth <= baseWidthCm && cutHeight <= baseHeightCm;
  };
  
  // Selected object tracking
  const [selectedObject, setSelectedObject] = useState(null);
  
  // Visual feedback state
  const [showAvailableSpaces, setShowAvailableSpaces] = useState(false);
  const [availableSpaces, setAvailableSpaces] = useState([]);
  
  // Handle mode change with canvas cleanup
  const handleModeChange = (newMode) => {
    console.log('=== MODE CHANGE DEBUG ===');
    console.log('Changing from', mode, 'to', newMode);
    
    if (canvasInstanceRef.current) {
      canvasInstanceRef.current.dispose();
      canvasInstanceRef.current = null;
      setCanvas(null);
    }
    setBaseRect(null);
    setCuts([]);
    setMode(newMode);
    
    // Reset values for 1D mode
    if (newMode === '1D') {
      setBaseHeight(10); // Fixed height for 1D
      setCutHeight(10);  // Fixed height for 1D cuts
      console.log('1D mode: Set fixed height to 10cm');
    }
    
    console.log('Mode change complete');
  };
  
  // Base Plate State
  const [baseWidth, setBaseWidth] = useState(100);
  const [baseHeight, setBaseHeight] = useState(80);
  const [baseWeight, setBaseWeight] = useState(10);
  const [baseColor, setBaseColor] = useState('#e0e0e0');
  
  // Cut State
  const [cutWidth, setCutWidth] = useState(20);
  const [cutHeight, setCutHeight] = useState(30);
  const [cutColor, setCutColor] = useState('#ff6b6b');
  
  // Initialize 1D mode values
  useEffect(() => {
    if (mode === '1D') {
      setBaseHeight(10); // Fixed height for 1D
      setCutHeight(10);  // Fixed height for 1D cuts
    }
  }, [mode]);
  
  // Enhanced Work Order Items with Smart Cut Data
  const [workOrderItems] = useState([
    {
      id: 1,
      nama: 'Plat 20x30',
      panjang: 20,
      lebar: 30,
      tebal: 5,
      qty: 2,
      jenis: 'Plat Baja'
    },
    {
      id: 2,
      nama: 'Shaft 50cm',
      panjang: 50,
      lebar: 10,
      tebal: 8,
      qty: 1,
      jenis: 'Shaft Baja'
    },
    {
      id: 3,
      nama: 'Plat 15x25',
      panjang: 15,
      lebar: 25,
      tebal: 3,
      qty: 3,
      jenis: 'Plat Aluminium'
    },
    {
      id: 4,
      nama: 'Plat 10x20',
      panjang: 10,
      lebar: 20,
      tebal: 2,
      qty: 5,
      jenis: 'Plat Aluminium'
    },
    {
      id: 5,
      nama: 'Shaft 30cm',
      panjang: 30,
      lebar: 8,
      tebal: 6,
      qty: 3,
      jenis: 'Shaft Baja'
    }
  ]);

  // Initialize Canvas
  useEffect(() => {
    console.log('useEffect triggered - canvasRef.current:', canvasRef.current, 'canvasInstanceRef.current:', canvasInstanceRef.current);
    
    if (canvasRef.current && !canvasInstanceRef.current) {
      console.log('Creating new canvas...');
      
      // Dispose existing canvas if any
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.dispose();
        canvasInstanceRef.current = null;
      }
      
      // Create new canvas with full size
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: canvasRef.current.offsetWidth || 1200,
        height: canvasRef.current.offsetHeight || 800,
        backgroundColor: '#f8f9fa'
      });
      
      console.log('Canvas created:', fabricCanvas);
      
      canvasInstanceRef.current = fabricCanvas;
      setCanvas(fabricCanvas);
      
      // Add event listeners
      fabricCanvas.on('object:moving', handleObjectMoving);
      fabricCanvas.on('object:modified', handleObjectModified);
      fabricCanvas.on('object:moved', handleObjectMoved);
      
      // Track selected object
      fabricCanvas.on('selection:created', (opt) => {
        setSelectedObject(opt.selected[0]);
        console.log('Object selected:', opt.selected[0]);
      });
      
      fabricCanvas.on('selection:updated', (opt) => {
        setSelectedObject(opt.selected[0]);
        console.log('Selection updated:', opt.selected[0]);
      });
      
      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null);
        console.log('Selection cleared');
      });
      
      // Add keyboard shortcut for delete
      const handleKeyDown = (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedObject) {
            e.preventDefault();
            deleteSelectedObject();
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      // Cleanup keyboard listener
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
      
      // Add robust overlap prevention for cut rects
      fabricCanvas.on('object:moving', (opt) => {
        const target = opt.target;
        if (target && target.isCutRect) {
          // Get all cut rects from cuts array (more reliable than canvas objects)
          const otherCuts = cuts.filter(cut => cut.rect !== target);
          
          const targetRect = {
            left: target.left - target.width / 2,
            top: target.top - target.height / 2,
            right: target.left + target.width / 2,
            bottom: target.top + target.height / 2
          };
          
          // Check bounds first
          const currentBaseRect = getCurrentBaseRect();
          if (currentBaseRect) {
            const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
            const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
            const baseRight = baseLeft + currentBaseRect.width;
            const baseBottom = baseTop + currentBaseRect.height;
            
            if (targetRect.left < baseLeft || targetRect.right > baseRight ||
                targetRect.top < baseTop || targetRect.bottom > baseBottom) {
              // Out of bounds - snap back
              target.left = target.originalLeft || target.left;
              target.top = target.originalTop || target.top;
              target.setCoords();
              fabricCanvas.renderAll();
              console.log('❌ Out of bounds - snapped back');
              return;
            }
          }
          
          // Check overlap with other cuts
          for (const cut of otherCuts) {
            const otherRect = {
              left: cut.rect.left - cut.rect.width / 2,
              top: cut.rect.top - cut.rect.height / 2,
              right: cut.rect.left + cut.rect.width / 2,
              bottom: cut.rect.top + cut.rect.height / 2
            };
            
            // Strict overlap check - NO OVERLAP ALLOWED
            const overlap = !(targetRect.right <= otherRect.left ||
                             targetRect.left >= otherRect.right ||
                             targetRect.bottom <= otherRect.top ||
                             targetRect.top >= otherRect.bottom);
            
            if (overlap) {
              // Snap back to original position
              target.left = target.originalLeft || target.left;
              target.top = target.originalTop || target.top;
              target.setCoords();
              fabricCanvas.renderAll();
              console.log('❌ Overlap detected - snapped back to original position');
              return;
            }
          }
        }
      });
      
      // Add zoom and pan functionality
      setupZoomAndPan(fabricCanvas);
      
      console.log('Canvas initialization complete');
    } else {
      console.log('Canvas already exists or canvasRef not ready');
    }
    
    // Cleanup function
    return () => {
      if (canvasInstanceRef.current) {
        canvasInstanceRef.current.dispose();
        canvasInstanceRef.current = null;
        setCanvas(null);
      }
    };
  }, []);

  // Setup zoom and pan functionality
  const setupZoomAndPan = (fabricCanvas) => {
    let isPanning = false;
    let lastPanPoint = { x: 0, y: 0 };

    // Pan (geser view) dengan mouse scroll wheel - only for middle button
    fabricCanvas.upperCanvasEl.addEventListener('mousedown', function(e) {
      if (e.button === 1) { // Middle mouse button only
        isPanning = true;
        lastPanPoint = { x: e.clientX, y: e.clientY };
        fabricCanvas.selection = false;
        fabricCanvas.defaultCursor = 'grabbing';
        e.preventDefault();
        e.stopPropagation();
      }
    });

    fabricCanvas.upperCanvasEl.addEventListener('mousemove', function(e) {
      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;
        
        const vpt = fabricCanvas.viewportTransform;
        vpt[4] += deltaX;
        vpt[5] += deltaY;
        fabricCanvas.setViewportTransform(vpt);
        
        lastPanPoint = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopPropagation();
      }
    });

    fabricCanvas.upperCanvasEl.addEventListener('mouseup', function(e) {
      if (e.button === 1) { // Middle mouse button only
        isPanning = false;
        fabricCanvas.selection = true;
        fabricCanvas.defaultCursor = 'default';
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Zoom in/out dengan mouse scroll
    fabricCanvas.on('mouse:wheel', function(opt) {
      let delta = opt.e.deltaY;
      let zoom = fabricCanvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5; // Increased max zoom
      if (zoom < 0.1) zoom = 0.1; // Increased min zoom

      // Fokus zoom pada posisi kursor
      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      
      // Update zoom state
      setZoomLevel(zoom);

      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  };



  // Enhanced Handle object moving with Grouping Support
  const handleObjectMoving = (opt) => {
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) return;
    
    // Handle base plate movement with enhanced grouping
    if (opt.target === currentBaseRect) {
      console.log('🏗️ Base plate moving with grouping...', opt.target.left, opt.target.top);
      
      // Visual feedback: highlight base plate
      if (!isBasePlateMoving) {
        setIsBasePlateMoving(true);
        currentBaseRect.set({ stroke: '#007bff', strokeWidth: 3 });
        console.log('Base plate movement started');
      }
      
      // Move all cuts with the base plate using enhanced delta calculation
      const basePlate = opt.target;
      const deltaX = basePlate.left - (basePlate.originalLeft || basePlate.left);
      const deltaY = basePlate.top - (basePlate.originalTop || basePlate.top);
      
      // Store original position if not already stored
      if (!basePlate.originalLeft) {
        basePlate.originalLeft = basePlate.left;
        basePlate.originalTop = basePlate.top;
      }
      
      console.log('Base plate delta:', { deltaX, deltaY });
      
      // Move all cuts with the same delta (PROPER GROUPING BEHAVIOR)
      cuts.forEach(cut => {
        if (cut.rect && cut.rect !== currentBaseRect) {
          // Use relative positioning for proper grouping
          cut.rect.left = basePlate.left + (cut.rect.relativeLeft || 0);
          cut.rect.top = basePlate.top + (cut.rect.relativeTop || 0);
          cut.rect.setCoords();
          
          // Move all labels with grouping using relative positions
          const labels = [cut.labelW, cut.labelH, cut.cutNumberLabel].filter(Boolean);
          labels.forEach(label => {
            if (label.relativeLeft !== undefined && label.relativeTop !== undefined) {
              label.left = basePlate.left + label.relativeLeft;
              label.top = basePlate.top + label.relativeTop;
              label.setCoords();
            }
          });
        }
      });
      return;
    }
    
    // Handle cut movement (existing logic)
      const obj = opt.target;
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
      
      const objLeft = obj.left - obj.width / 2;
      const objTop = obj.top - obj.height / 2;
      const objRight = objLeft + obj.width;
      const objBottom = objTop + obj.height;
      
    // Check if object is within base rect bounds
    const isWithinBounds = objLeft >= baseLeft && objTop >= baseTop && 
                          objRight <= baseRight && objBottom <= baseBottom;
    
    // Check for collisions with other cuts
    const cutIdx = cuts.findIndex(cut => cut.rect === opt.target);
    if (cutIdx !== -1) {
      const existingRects = cuts.filter((c, i) => i !== cutIdx).map(cut => ({
        left: cut.rect.left - cut.rect.width / 2,
        top: cut.rect.top - cut.rect.height / 2,
        right: cut.rect.left + cut.rect.width / 2,
        bottom: cut.rect.top + cut.rect.height / 2
      }));
      
      const hasCollision = existingRects.some(existing => 
        !(objRight <= existing.left ||
          objLeft >= existing.right ||
          objBottom <= existing.top ||
          objTop >= existing.bottom)
      );
      
      // Visual feedback: change color based on validity
      if (isWithinBounds && !hasCollision) {
        obj.set({ fill: cutColor }); // Valid position
      } else {
        obj.set({ fill: '#ff9999' }); // Invalid position (red tint)
      }
    }
    
    // Constrain to base rect bounds
      if (objLeft < baseLeft) obj.left = baseLeft + obj.width / 2;
      if (objTop < baseTop) obj.top = baseTop + obj.height / 2;
      if (objRight > baseRight) obj.left = baseRight - obj.width / 2;
      if (objBottom > baseBottom) obj.top = baseBottom - obj.height / 2;
      
      // Snap to grid for precise placement
      const snappedX = Math.round(obj.left / gridSize) * gridSize;
      const snappedY = Math.round(obj.top / gridSize) * gridSize;
      obj.set({ left: snappedX, top: snappedY });
  };

  // Handle object modified - Auto-snap functionality
  const handleObjectModified = (opt) => {
    // Only handle cut rects, not baseRect
    const cutIdx = cuts.findIndex(cut => cut.rect === opt.target);
    if (cutIdx === -1) {
    updateRemainingWeight();
      return;
    }
    
    const cut = cuts[cutIdx];
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) {
      updateRemainingWeight();
      return;
    }
    
    // Get cut dimensions (force original size, no scaling)
    const widthPx = cut.rect.width;
    const heightPx = cut.rect.height;
    
    // Reset any scaling to maintain original size
    cut.rect.set({ scaleX: 1, scaleY: 1 });
    
    // Base rect boundaries
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
    
    // Get ALL cuts from canvas (including this one) for strict validation
    const allCuts = cuts.map(cut => ({
      left: cut.rect.left - cut.rect.width / 2,
      top: cut.rect.top - cut.rect.height / 2,
      right: cut.rect.left + cut.rect.width / 2,
      bottom: cut.rect.top + cut.rect.height / 2,
      width: cut.rect.width,
      height: cut.rect.height,
      id: cut.rect.id
    }));
    
    // Exclude this cut from overlap check
    const existingRects = allCuts.filter(cut => cut.id !== target.id);
    
    // Function to check if a position is valid using booking grid
    const isValidPosition = (x, y) => {
      const newRect = {
        left: x - widthPx / 2,
        top: y - heightPx / 2,
        right: x + widthPx / 2,
        bottom: y + heightPx / 2
      };
      
      // Check if within base rect bounds
      if (newRect.left < baseLeft || newRect.right > baseRight || 
          newRect.top < baseTop || newRect.bottom > baseBottom) {
        return false;
      }
      
      // Use booking grid system if available
      if (bookingGrid.length > 0) {
        // Temporarily remove this cut from grid for checking
        const tempGrid = [...bookingGrid];
        const cutLeft = cut.rect.left - cut.rect.width / 2;
        const cutTop = cut.rect.top - cut.rect.height / 2;
        const cutRight = cut.rect.left + cut.rect.width / 2;
        const cutBottom = cut.rect.top + cut.rect.height / 2;
        
        const startCol = Math.floor((cutLeft - baseLeft) / gridSize);
        const endCol = Math.floor((cutRight - baseLeft) / gridSize);
        const startRow = Math.floor((cutTop - baseTop) / gridSize);
        const endRow = Math.floor((cutBottom - baseTop) / gridSize);
        
        // Free up the old position
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            if (row >= 0 && row < tempGrid.length && col >= 0 && col < tempGrid[0].length) {
              tempGrid[row][col] = true;
            }
          }
        }
        
        // Check if new position is available
        const newStartCol = Math.floor((x - widthPx/2 - baseLeft) / gridSize);
        const newEndCol = Math.floor((x + widthPx/2 - baseLeft) / gridSize);
        const newStartRow = Math.floor((y - heightPx/2 - baseTop) / gridSize);
        const newEndRow = Math.floor((y + heightPx/2 - baseTop) / gridSize);
        
        for (let row = newStartRow; row <= newEndRow; row++) {
          for (let col = newStartCol; col <= newEndCol; col++) {
            if (row < 0 || row >= tempGrid.length || col < 0 || col >= tempGrid[0].length) {
              return false;
            }
            if (!tempGrid[row][col]) {
              return false;
            }
          }
        }
        
        return true;
      } else {
        // Fallback to simple collision detection
        return !existingRects.some(existing => 
          !(newRect.right <= existing.left ||
            newRect.left >= existing.right ||
            newRect.bottom <= existing.top ||
            newRect.top >= existing.bottom)
        );
      }
    };
    
    // For booking system: STRICT NO OVERLAP - snap back if invalid position
    const newX = cut.rect.left;
    const newY = cut.rect.top;
    
    console.log('🔄 Drag & Drop validation:', { newX, newY, widthPx, heightPx });
    
    // Snap to grid for precise placement
    const snappedX = Math.round(newX / gridSize) * gridSize;
    const snappedY = Math.round(newY / gridSize) * gridSize;
    
    // Simple strict collision check - NO OVERLAP ALLOWED
    const newRect = {
      left: snappedX - widthPx / 2,
      top: snappedY - heightPx / 2,
      right: snappedX + widthPx / 2,
      bottom: snappedY + heightPx / 2
    };
    
    // Check bounds first
    if (newRect.left < baseLeft || newRect.right > baseRight || 
        newRect.top < baseTop || newRect.bottom > baseBottom) {
      console.log('❌ Out of bounds, snapping back');
      cut.rect.left = cut.rect.originalLeft || cut.rect.left;
      cut.rect.top = cut.rect.originalTop || cut.rect.top;
      cut.rect.setCoords();
      canvas.requestRenderAll();
      return;
    }
    
    // Check collision with other cuts (excluding this cut)
    const hasCollision = existingRects.some(existing => {
      const overlap = !(newRect.right <= existing.left ||
                       newRect.left >= existing.right ||
                       newRect.bottom <= existing.top ||
                       newRect.top >= existing.bottom);
      if (overlap) {
        console.log('❌ Collision detected with:', existing);
      }
      return overlap;
    });
    
    if (hasCollision) {
      console.log('❌ Position has collision, snapping back to original position');
      // Snap back to original position - NO OVERLAP ALLOWED
      cut.rect.left = cut.rect.originalLeft || cut.rect.left;
      cut.rect.top = cut.rect.originalTop || cut.rect.top;
      cut.rect.setCoords();
      canvas.requestRenderAll();
    } else {
      console.log('✅ Position valid, allowing move');
      // Set final position to snapped coordinates
      cut.rect.left = snappedX;
      cut.rect.top = snappedY;
      cut.rect.setCoords();
      
      // Update original position for next drag
      cut.rect.originalLeft = snappedX;
      cut.rect.originalTop = snappedY;
      
      // Update booking grid after successful move
      if (bookingGrid.length > 0) {
        console.log('🔄 Updating booking grid after drag & drop');
        initializeBookingGrid();
      }
    }
    
    updateRemainingWeight();
  };

  // Enhanced Handle object moved with Grouping Support
  const handleObjectMoved = (opt) => {
    const currentBaseRect = getCurrentBaseRect();
    
    // Reset base plate movement state
    if (opt.target === currentBaseRect) {
      setIsBasePlateMoving(false);
      
      // Restore base plate appearance
      currentBaseRect.set({ stroke: '#333', strokeWidth: 2 });
      
      // Update relative positions for all cuts after base plate movement (PROPER GROUPING)
      cuts.forEach(cut => {
        if (cut.rect && cut.rect !== currentBaseRect) {
          // Update relative positions to new base plate position
          cut.rect.relativeLeft = cut.rect.left - currentBaseRect.left;
          cut.rect.relativeTop = cut.rect.top - currentBaseRect.top;
          
          // Update all labels with grouping
          const labels = [cut.labelW, cut.labelH, cut.cutNumberLabel].filter(Boolean);
          labels.forEach(label => {
            if (label.relativeLeft !== undefined && label.relativeTop !== undefined) {
              label.relativeLeft = label.left - currentBaseRect.left;
              label.relativeTop = label.top - currentBaseRect.top;
            }
          });
        }
      });
      
      // Update booking grid after base plate movement
      if (bookingGrid.length > 0) {
        console.log('🔄 Updating booking grid after base plate movement');
        initializeBookingGrid();
      }
      
      console.log('✅ Base plate movement completed with grouping');
      return;
    }
    
    // Handle cut movement
    const cutIdx = cuts.findIndex(cut => cut.rect === opt.target);
    if (cutIdx !== -1) {
      // Restore original color
      opt.target.set({ fill: cutColor });
      
      // Update original position for individual cut movement
      opt.target.originalLeft = opt.target.left;
      opt.target.originalTop = opt.target.top;
      
      console.log('✅ Individual cut movement completed');
    }
  };

  // Helper function to get current baseRect from canvas
  const getCurrentBaseRect = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) return null;
    
    // If state baseRect exists and is still in canvas, use it
    if (baseRect && fabricCanvas.getObjects().includes(baseRect)) {
      return baseRect;
    }
    
    // Otherwise, find any rectangle object in canvas (assume it's the baseRect)
    // BaseRect is typically the first object added and sent to back
    const objects = fabricCanvas.getObjects();
    const rectObjects = objects.filter(obj => obj.type === 'rect');
    
    // Return the first rectangle found (should be baseRect)
    return rectObjects.length > 0 ? rectObjects[0] : null;
  };


  // Create Base Plate
  const createBasePlate = () => {
    console.log('=== CREATE BASE PLATE DEBUG ===');
    console.log('canvas state:', canvas);
    console.log('canvasInstanceRef.current:', canvasInstanceRef.current);
    console.log('canvasRef.current:', canvasRef.current);
    console.log('baseWidth:', baseWidth, 'baseHeight:', baseHeight, 'mode:', mode);
    
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) {
      console.error('Canvas belum diinisialisasi!');
      alert('Canvas belum diinisialisasi!');
      return;
    }
    
    console.log('Canvas ready, proceeding with base plate creation...');
    console.log('=== CREATE BASE PLATE DEBUG ===');
    console.log('Mode:', mode);
    console.log('Base dimensions:', { baseWidth, baseHeight, baseWeight });
    
    // Store existing cuts positions before removing base rect
    const existingCutsData = cuts.map(cut => ({
      rect: cut.rect,
      labelW: cut.labelW,
      labelH: cut.labelH,
      item: cut.item,
      originalLeft: cut.rect.originalLeft,
      originalTop: cut.rect.originalTop
    }));
    
    // Remove existing base rect
    if (baseRect) {
      fabricCanvas.remove(baseRect);
    }
    
    // Clear existing cuts first
    cuts.forEach(cut => {
      if (cut.rect) fabricCanvas.remove(cut.rect);
      if (cut.labelW) fabricCanvas.remove(cut.labelW);
      if (cut.labelH) fabricCanvas.remove(cut.labelH);
    });
    setCuts([]);
    
    // Scale: 1 cm = 5 px
    const scale = 5;
    const widthPx = baseWidth * scale;
    const heightPx = mode === '1D' ? 50 : baseHeight * scale; // Fixed height for 1D
    
    // Create base rect at center of canvas
    const rect = new fabric.Rect({
      left: 600, // Center of 1200px width
      top: 400,  // Center of 800px height
      width: widthPx,
      height: heightPx,
      fill: baseColor,
      stroke: '#333',
      strokeWidth: 2,
      selectable: true,
      evented: true,       // Enable interaction
      lockScalingX: true,  // Disable horizontal scaling
      lockScalingY: true,  // Disable vertical scaling
      lockRotation: true,  // Disable rotation
      originX: 'center',
      originY: 'center'
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.sendObjectToBack(rect);
    
    // Ensure base plate is always at the back
    fabricCanvas.getObjects().forEach(obj => {
      if (obj !== rect && obj.id !== 'grid-line') {
        fabricCanvas.bringObjectToFront(obj);
      }
    });
    fabricCanvas.sendObjectToBack(rect);
    
    fabricCanvas.renderAll();
    setBaseRect(rect);
    
    console.log('Base plate created successfully:', rect);
    
    // Restore existing cuts with correct relative positions
    if (existingCutsData.length > 0) {
      existingCutsData.forEach(cutData => {
        if (cutData.originalLeft !== undefined && cutData.originalTop !== undefined) {
          // Create new cut rect with preserved relative position
          const newCutRect = new fabric.Rect({
            left: rect.left + cutData.originalLeft,
            top: rect.top + cutData.originalTop,
            width: cutData.rect.width,
            height: cutData.rect.height,
            fill: cutData.rect.fill,
            stroke: cutData.rect.stroke,
            strokeWidth: cutData.rect.strokeWidth,
            selectable: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
            originX: 'center',
            originY: 'center'
          });
          
          // Preserve relative position
          newCutRect.originalLeft = cutData.originalLeft;
          newCutRect.originalTop = cutData.originalTop;
          
          // Create labels
          let newLabelW = null;
          let newLabelH = null;
          
          if (cutData.labelW) {
            newLabelW = new fabric.Text(cutData.labelW.text, {
              left: rect.left + (cutData.labelW.originalLeft || 0),
              top: rect.top + (cutData.labelW.originalTop || 0),
              fontSize: cutData.labelW.fontSize,
              fill: cutData.labelW.fill,
              originX: cutData.labelW.originX,
              originY: cutData.labelW.originY,
              selectable: false,
              evented: false
            });
            
            if (cutData.labelW.originalLeft !== undefined) {
              newLabelW.originalLeft = cutData.labelW.originalLeft;
              newLabelW.originalTop = cutData.labelW.originalTop;
            }
          }
          
          if (cutData.labelH) {
            newLabelH = new fabric.Text(cutData.labelH.text, {
              left: rect.left + (cutData.labelH.originalLeft || 0),
              top: rect.top + (cutData.labelH.originalTop || 0),
              fontSize: cutData.labelH.fontSize,
              fill: cutData.labelH.fill,
              originX: cutData.labelH.originX,
              originY: cutData.labelH.originY,
              selectable: false,
              evented: false
            });
            
            if (cutData.labelH.originalLeft !== undefined) {
              newLabelH.originalLeft = cutData.labelH.originalLeft;
              newLabelH.originalTop = cutData.labelH.originalTop;
            }
          }
          
          // Add to canvas
          fabricCanvas.add(newCutRect);
          if (newLabelW) fabricCanvas.add(newLabelW);
          if (newLabelH) fabricCanvas.add(newLabelH);
          
          // Add to cuts array
          const newCut = { rect: newCutRect, labelW: newLabelW, labelH: newLabelH, item: cutData.item };
          setCuts(prev => [...prev, newCut]);
        }
      });
      
      // Ensure proper z-order
      fabricCanvas.getObjects().forEach(obj => {
        if (obj !== rect && obj.id !== 'grid-line') {
          fabricCanvas.bringObjectToFront(obj);
        }
      });
      fabricCanvas.sendObjectToBack(rect);
    }
    
    updateRemainingWeight();
    updateGrid();
  };

  // Smart Cut Placement Algorithm - Calculate optimal cuts from base plate
  const calculateOptimalCuts = (baseWidth, baseHeight, cutWidth, cutHeight, mode) => {
    if (mode === '1D') {
      // 1D mode: only calculate length, height is fixed
      const maxCuts = Math.floor(baseWidth / cutWidth);
      return {
        maxCuts,
        cuts: Array(maxCuts).fill().map((_, index) => ({
          x: index * cutWidth,
          y: 0,
          width: cutWidth,
          height: 10 // Fixed height for 1D
        })),
        totalArea: maxCuts * cutWidth * 10,
        efficiency: (maxCuts * cutWidth * 10) / (baseWidth * 10) * 100
      };
    } else {
      // 2D mode: calculate both width and height for area optimization
      const maxCutsX = Math.floor(baseWidth / cutWidth);
      const maxCutsY = Math.floor(baseHeight / cutHeight);
      const maxCuts = maxCutsX * maxCutsY;
      
      const cuts = [];
      for (let y = 0; y < maxCutsY; y++) {
        for (let x = 0; x < maxCutsX; x++) {
          cuts.push({
            x: x * cutWidth,
            y: y * cutHeight,
            width: cutWidth,
            height: cutHeight
          });
        }
      }
      
      return {
        maxCuts,
        cuts,
        totalArea: maxCuts * cutWidth * cutHeight,
        efficiency: (maxCuts * cutWidth * cutHeight) / (baseWidth * baseHeight) * 100
      };
    }
  };

  // Create Cut Rectangle with Proper Grouping
  const createCutRect = (posX, posY, widthPx, heightPx, item, cutNumber) => {
    const fabricCanvas = canvasInstanceRef.current;
    const currentBaseRect = getCurrentBaseRect();
    
    // Create cut rect with grouping attributes
    const cutRect = new fabric.Rect({
      left: posX,
      top: posY,
      width: widthPx,
      height: heightPx,
      fill: cutColor,
      stroke: '#666',
      strokeWidth: 1,
      selectable: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      originX: 'center',
      originY: 'center',
      // Grouping attributes
      isCutRect: true,
      cutId: `cut-${Date.now()}-${cutNumber}`,
      parentGroup: 'base-plate-group',
      snapToGrid: true,
      snapThreshold: 0,
      // Store relative position to base plate
      relativeLeft: posX - (currentBaseRect ? currentBaseRect.left : 0),
      relativeTop: posY - (currentBaseRect ? currentBaseRect.top : 0)
    });
    
    // Create labels with cut number and blocks
    const labelW = new fabric.Text(`${item.panjang}cm (${cmToBlocks(item.panjang)} blocks)`, {
      left: posX,
      top: posY - heightPx / 2 - 20,
      fontSize: 10,
      fill: '#333',
      originX: 'center',
      originY: 'middle',
      selectable: false,
      evented: false,
      parentGroup: 'base-plate-group',
      // Store relative position to base plate
      relativeLeft: posX - (currentBaseRect ? currentBaseRect.left : 0),
      relativeTop: (posY - heightPx / 2 - 20) - (currentBaseRect ? currentBaseRect.top : 0)
    });
    
    let labelH = null;
    if (mode === '2D') {
      labelH = new fabric.Text(`${item.lebar}cm (${cmToBlocks(item.lebar)} blocks)`, {
        left: posX + widthPx / 2 + 10,
        top: posY,
        fontSize: 10,
        fill: '#333',
        originX: 'left',
        originY: 'middle',
        selectable: false,
        evented: false,
        parentGroup: 'base-plate-group',
        // Store relative position to base plate
        relativeLeft: (posX + widthPx / 2 + 10) - (currentBaseRect ? currentBaseRect.left : 0),
        relativeTop: posY - (currentBaseRect ? currentBaseRect.top : 0)
      });
    }
    
    // Add cut number label
    const cutNumberLabel = new fabric.Text(`#${cutNumber}`, {
      left: posX,
      top: posY,
      fontSize: 10,
      fill: '#fff',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      parentGroup: 'base-plate-group',
      // Store relative position to base plate
      relativeLeft: posX - (currentBaseRect ? currentBaseRect.left : 0),
      relativeTop: posY - (currentBaseRect ? currentBaseRect.top : 0)
    });
    
    // Add to canvas
    fabricCanvas.add(cutRect, labelW, cutNumberLabel);
    if (labelH) fabricCanvas.add(labelH);
    
    // Ensure proper z-order
    if (currentBaseRect) {
      fabricCanvas.bringObjectToFront(cutRect);
      fabricCanvas.bringObjectToFront(labelW);
      fabricCanvas.bringObjectToFront(cutNumberLabel);
      if (labelH) fabricCanvas.bringObjectToFront(labelH);
      fabricCanvas.sendObjectToBack(currentBaseRect);
    }
    
    // Relative positions are already stored in the object properties above
    
    // Add to cuts array
    const newCut = { 
      rect: cutRect, 
      labelW, 
      labelH, 
      cutNumberLabel,
      item,
      cutNumber
    };
    setCuts(prev => [...prev, newCut]);
    
    return newCut;
  };

  // Simple Work Order Item Cut (Single Cut)
  const addCutFromItem = (item) => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) {
      showAlert('Error', 'Canvas belum diinisialisasi!', 'error');
      return;
    }
    
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) {
      showAlert('Error', 'Buat plat dasar terlebih dahulu!', 'error');
      return;
    }
    
    const scale = 5; // 1 cm = 5 px
    const widthPx = item.panjang * scale;
    const heightPx = mode === '1D' ? 50 : item.lebar * scale;
    
    // Find first available position using grid system
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
    
    let found = false;
    let posX, posY;
    
    // Grid-based search (like puzzle pieces)
    for (let y = baseTop + heightPx / 2; y <= baseBottom - heightPx / 2 && !found; y += gridSize) {
      for (let x = baseLeft + widthPx / 2; x <= baseRight - widthPx / 2 && !found; x += gridSize) {
        if (isPositionAvailable(x, y, widthPx, heightPx)) {
          posX = x;
          posY = y;
          found = true;
        }
      }
    }
    
    if (!found) {
      showAlert('Error', 'Tidak ada ruang kosong yang tersedia!', 'error');
      return;
    }
    
    // Create work order cut
    createCutRect(posX, posY, widthPx, heightPx, item, cuts.length + 1);
    bookPosition(posX, posY, widthPx, heightPx);
    
    showAlert('Sukses', `${item.nama} (${formatDimension(item.panjang)} × ${formatDimension(item.lebar)}) berhasil ditambahkan`, 'success');
    updateRemainingWeight();
  };

  // Simple Manual Cut with Grid-based Placement (Puzzle System)
  const addManualCut = () => {
    console.log('🔧 Manual Cut Debug:', { cutWidth, cutHeight, mode, baseRect: !!baseRect });
    
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) {
      showAlert('Error', 'Canvas belum diinisialisasi!', 'error');
      return;
    }
    
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) {
      showAlert('Error', 'Buat plat dasar terlebih dahulu!', 'error');
      return;
    }
    
    // Validate dimensions
    const validationErrors = validateDimensions(cutWidth, cutHeight);
    if (validationErrors.length > 0) {
      showAlert('Validation Error', validationErrors.join(', '), 'error');
      return;
    }
    
    // Check if cut can fit in base plate
    if (!canFitInBasePlate(cutWidth, cutHeight)) {
      showAlert('Error', 'Cut terlalu besar untuk base plate!', 'error');
      return;
    }
    
    const scale = 5; // 1 cm = 5 px
    const widthPx = cutWidth * scale;
    const heightPx = mode === '1D' ? 50 : cutHeight * scale;
    
    console.log('🔧 Cut dimensions:', { widthPx, heightPx, cutWidth, cutHeight });
    
    // Find first available position using grid system
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
    
    let found = false;
    let posX, posY;
    
    // Grid-based search (like puzzle pieces)
    for (let y = baseTop + heightPx / 2; y <= baseBottom - heightPx / 2 && !found; y += gridSize) {
      for (let x = baseLeft + widthPx / 2; x <= baseRight - widthPx / 2 && !found; x += gridSize) {
        if (isPositionAvailable(x, y, widthPx, heightPx)) {
          posX = x;
          posY = y;
          found = true;
        }
      }
    }
    
    if (!found) {
      console.log('❌ No position found, trying simple placement...');
      // Simple fallback - place at top-left corner
      posX = baseLeft + widthPx / 2;
      posY = baseTop + heightPx / 2;
      console.log('🔧 Using fallback position:', { posX, posY });
    }
    
    // Create manual cut
    const manualItem = {
      nama: 'Manual Cut',
      panjang: cutWidth,
      lebar: cutHeight,
      qty: 1
    };
    
    createCutRect(posX, posY, widthPx, heightPx, manualItem, cuts.length + 1);
    bookPosition(posX, posY, widthPx, heightPx);
    
    showAlert('Sukses', `Manual cut ${formatDimension(cutWidth)} × ${formatDimension(cutHeight)} berhasil ditambahkan`, 'success');
    updateRemainingWeight();
  };

  // Delete selected object with enhanced cleanup
  const deleteSelectedObject = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas || !selectedObject) return;
    
    console.log('Deleting selected object:', selectedObject);
    
    // If it's a cut rect, remove from cuts array
    if (selectedObject.isCutRect) {
      const cutToRemove = cuts.find(cut => cut.rect === selectedObject);
      if (cutToRemove) {
        // Remove all associated labels
        if (cutToRemove.labelW) {
          fabricCanvas.remove(cutToRemove.labelW);
        }
        if (cutToRemove.labelH) {
          fabricCanvas.remove(cutToRemove.labelH);
        }
        if (cutToRemove.cutNumberLabel) {
          fabricCanvas.remove(cutToRemove.cutNumberLabel);
        }
        
        // Remove from cuts array
        setCuts(prevCuts => prevCuts.filter(cut => cut.rect !== selectedObject));
        console.log('Cut removed from array');
        
        // Update booking grid
        if (bookingGrid.length > 0) {
          initializeBookingGrid();
        }
      }
    }
    
    // Remove object from canvas
    fabricCanvas.remove(selectedObject);
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    
    // Clear selection
    setSelectedObject(null);
    
    // Update remaining weight
    updateRemainingWeight();
    
    console.log('Object deleted successfully');
  };

  // Clear Canvas
  const clearCanvas = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) return;
    
    // Dispose all objects properly
    fabricCanvas.getObjects().forEach(obj => {
      fabricCanvas.remove(obj);
    });
    
    fabricCanvas.backgroundColor = '#f8f9fa';
    fabricCanvas.renderAll();
    setBaseRect(null);
    setCuts([]);
    setSelectedObject(null);
    
    console.log('Canvas cleared successfully');
  };

  // Check and fix existing overlaps
  const checkAndFixOverlaps = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) return;
    
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) return;
    
    console.log('🔍 Checking for existing overlaps...');
    
    // Get all cuts
    const allCuts = cuts.map(cut => ({
      rect: cut.rect,
      left: cut.rect.left - cut.rect.width / 2,
      top: cut.rect.top - cut.rect.height / 2,
      right: cut.rect.left + cut.rect.width / 2,
      bottom: cut.rect.top + cut.rect.height / 2,
      width: cut.rect.width,
      height: cut.rect.height,
      id: cut.rect.id
    }));
    
    // Check for overlaps
    let hasOverlaps = false;
    for (let i = 0; i < allCuts.length; i++) {
      for (let j = i + 1; j < allCuts.length; j++) {
        const cut1 = allCuts[i];
        const cut2 = allCuts[j];
        
        const overlap = !(cut1.right <= cut2.left ||
                         cut1.left >= cut2.right ||
                         cut1.bottom <= cut2.top ||
                         cut1.top >= cut2.bottom);
        
        if (overlap) {
          console.log('❌ OVERLAP DETECTED:', { cut1: cut1.id, cut2: cut2.id });
          hasOverlaps = true;
          
          // Remove the second cut (keep the first one)
          const cutToRemove = cuts.find(cut => cut.rect.id === cut2.id);
          if (cutToRemove) {
            fabricCanvas.remove(cutToRemove.rect);
            if (cutToRemove.labelW) fabricCanvas.remove(cutToRemove.labelW);
            if (cutToRemove.labelH) fabricCanvas.remove(cutToRemove.labelH);
            
            // Remove from cuts array
            setCuts(prevCuts => prevCuts.filter(cut => cut.rect.id !== cut2.id));
            console.log('🗑️ Removed overlapping cut:', cut2.id);
          }
        }
      }
    }
    
    if (hasOverlaps) {
      console.log('⚠️ Overlaps found and fixed!');
      fabricCanvas.renderAll();
    } else {
      console.log('✅ No overlaps found');
    }
  };

  // Enhanced Update Remaining Weight and Area with 2D/1D Mode Support
  const updateRemainingWeight = () => {
    if (!baseRect) return;
    
    // Check and fix overlaps first
    checkAndFixOverlaps();
    
    const scale = 5; // 1 cm = 5 px
    const baseWidthCm = baseWidth;
    const baseHeightCm = mode === '1D' ? 10 : baseHeight; // 1D: fixed height 10cm
    
    // Calculate base area based on mode
    const baseArea = baseWidthCm * baseHeightCm;
    let cutArea = 0;
    let totalCutArea = 0;
    
    cuts.forEach(cut => {
      // Enhanced calculation for both 1D and 2D modes
      const widthCm = cut.rect.width / scale;
      const heightCm = cut.rect.height / scale;
      
      if (mode === '1D') {
        // 1D mode: only calculate length (width), height is fixed
        const cutAreaCm = widthCm * 10; // Fixed height for 1D
        cutArea += cutAreaCm;
        totalCutArea += cutAreaCm;
      } else {
        // 2D mode: calculate both width and height for area
      const cutAreaCm = widthCm * heightCm;
      cutArea += cutAreaCm;
      totalCutArea += cutAreaCm;
      }
    });
    
    const remainingArea = Math.max(baseArea - cutArea, 0);
    const remainingWeight = (baseWeight * (remainingArea / baseArea)).toFixed(2);
    const efficiency = ((cutArea / baseArea) * 100).toFixed(1);
    
    // Update UI state
    setRemainingInfo({
      area: remainingArea,
      weight: parseFloat(remainingWeight),
      efficiency: parseFloat(efficiency)
    });
    
    // Enhanced booking system logging
    console.log(`📊 ENHANCED BOOKING CALCULATION (${mode} Mode):`);
    console.log(`   Base Size: ${baseWidthCm} × ${baseHeightCm} cm`);
    console.log(`   Base Area: ${baseArea.toFixed(0)} cm²`);
    console.log(`   Used Area: ${cutArea.toFixed(0)} cm²`);
    console.log(`   Remaining: ${remainingArea.toFixed(0)} cm²`);
    console.log(`   Efficiency: ${efficiency}%`);
    console.log(`   Remaining Weight: ${remainingWeight} kg`);
    console.log(`   Total Cuts: ${cuts.length}`);
  };

  // Download Canvas as Image
  const downloadCanvas = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1
    });
    
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  // Reset zoom and pan
  const resetView = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas) return;
    
    fabricCanvas.setZoom(1);
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.renderAll();
  };

  // Fit to screen
  const fitToScreen = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas || !baseRect) return;
    
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    const rectWidth = baseRect.width * baseRect.scaleX;
    const rectHeight = baseRect.height * baseRect.scaleY;
    
    const scaleX = (canvasWidth * 0.8) / rectWidth;
    const scaleY = (canvasHeight * 0.8) / rectHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    fabricCanvas.setZoom(scale);
    fabricCanvas.viewportCenterObject(baseRect);
    fabricCanvas.renderAll();
  };

  // Toggle grid visibility
  const toggleGrid = () => {
    setShowGrid(!showGrid);
    updateGrid();
  };

  // Initialize booking grid system
  const initializeBookingGrid = () => {
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) {
      console.log('❌ No base rect found for grid initialization');
      return;
    }
    
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
    
    console.log('🏗️ Initializing grid:', {
      baseRect: { left: currentBaseRect.left, top: currentBaseRect.top, width: currentBaseRect.width, height: currentBaseRect.height },
      bounds: { baseLeft, baseTop, baseRight, baseBottom },
      gridSize
    });
    
    // Calculate grid dimensions
    const gridCols = Math.floor((baseRight - baseLeft) / gridSize);
    const gridRows = Math.floor((baseBottom - baseTop) / gridSize);
    
    console.log('📐 Grid dimensions:', { gridCols, gridRows, totalCells: gridCols * gridRows });
    
    // Initialize booking grid (true = available, false = occupied)
    const newGrid = Array(gridRows).fill().map(() => Array(gridCols).fill(true));
    
    // Mark occupied cells based on existing cuts
    cuts.forEach(cut => {
      const cutLeft = cut.rect.left - cut.rect.width / 2;
      const cutTop = cut.rect.top - cut.rect.height / 2;
      const cutRight = cut.rect.left + cut.rect.width / 2;
      const cutBottom = cut.rect.top + cut.rect.height / 2;
      
      const startCol = Math.floor((cutLeft - baseLeft) / gridSize);
      const endCol = Math.floor((cutRight - baseLeft) / gridSize);
      const startRow = Math.floor((cutTop - baseTop) / gridSize);
      const endRow = Math.floor((cutBottom - baseTop) / gridSize);
      
      console.log('🔴 Marking cut as occupied:', { cutLeft, cutTop, cutRight, cutBottom, startCol, endCol, startRow, endRow });
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
            newGrid[row][col] = false;
          }
        }
      }
    });
    
    setBookingGrid(newGrid);
    const occupiedCount = newGrid.flat().filter(cell => !cell).length;
    console.log('✅ Booking grid initialized:', { gridRows, gridCols, totalCells: gridCols * gridRows, occupied: occupiedCount, available: (gridCols * gridRows) - occupiedCount });
  };

  // Update grid lines with booking system
  const updateGrid = () => {
    const fabricCanvas = canvasInstanceRef.current;
    if (!fabricCanvas || !baseRect) return;
    
    // Remove existing grid lines
    const existingGrid = fabricCanvas.getObjects().filter(obj => obj.id === 'grid-line');
    existingGrid.forEach(line => fabricCanvas.remove(line));
    
    if (!showGrid) return;
    
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) return;
    
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
    
    // Create grid lines (every 1px = 0.2cm, no spacing)
    const gridSize = 1;
    
    // Vertical lines
    for (let x = baseLeft; x <= baseRight; x += gridSize) {
      const line = new fabric.Line([x, baseTop, x, baseBottom], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        id: 'grid-line'
      });
      fabricCanvas.add(line);
    }
    
    // Horizontal lines
    for (let y = baseTop; y <= baseBottom; y += gridSize) {
      const line = new fabric.Line([baseLeft, y, baseRight, y], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        id: 'grid-line'
      });
      fabricCanvas.add(line);
    }
    
    // Send grid to back
    existingGrid.forEach(line => fabricCanvas.sendObjectToBack(line));
    fabricCanvas.sendObjectToBack(currentBaseRect);
    fabricCanvas.renderAll();
    
    // Initialize booking grid
    initializeBookingGrid();
  };

  // Check if position is available in booking grid
  const isPositionAvailable = (x, y, width, height) => {
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) {
      console.log('❌ No base rect found');
      return false;
    }
    
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
    
    // Initialize grid if not already done
    if (bookingGrid.length === 0) {
      console.log('🔄 Grid not initialized, using fallback collision detection...');
      // Fallback to simple collision detection
      const newRect = {
        left: x - width/2,
        top: y - height/2,
        right: x + width/2,
        bottom: y + height/2
      };
      
      // Check if within base rect bounds
      if (newRect.left < baseLeft || newRect.right > baseRight || 
          newRect.top < baseTop || newRect.bottom > baseBottom) {
        return false;
      }
      
      // Simple collision detection with existing cuts
      const existingRects = cuts.map(cut => ({
        left: cut.rect.left - cut.rect.width / 2,
        top: cut.rect.top - cut.rect.height / 2,
        right: cut.rect.left + cut.rect.width / 2,
        bottom: cut.rect.top + cut.rect.height / 2
      }));
      
      return !existingRects.some(existing => 
        !(newRect.right <= existing.left ||
          newRect.left >= existing.right ||
          newRect.bottom <= existing.top ||
          newRect.top >= existing.bottom)
      );
    }
    
    const startCol = Math.floor((x - width/2 - baseLeft) / gridSize);
    const endCol = Math.floor((x + width/2 - baseLeft) / gridSize);
    const startRow = Math.floor((y - height/2 - baseTop) / gridSize);
    const endRow = Math.floor((y + height/2 - baseTop) / gridSize);
    
    console.log('🔍 Checking position:', {
      x, y, width, height,
      baseLeft, baseTop,
      startCol, endCol, startRow, endRow,
      gridRows: bookingGrid.length,
      gridCols: bookingGrid[0]?.length || 0
    });
    
    // Check if all required cells are available
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row < 0 || row >= bookingGrid.length || col < 0 || col >= bookingGrid[0].length) {
          console.log('❌ Out of bounds:', { row, col, maxRow: bookingGrid.length, maxCol: bookingGrid[0].length });
          return false; // Out of bounds
        }
        if (!bookingGrid[row][col]) {
          console.log('❌ Cell occupied:', { row, col });
          return false; // Cell is occupied
        }
      }
    }
    
    console.log('✅ Position available:', { x, y, width, height });
    return true;
  };

  // Book position in grid
  const bookPosition = (x, y, width, height) => {
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect || bookingGrid.length === 0) return false;
    
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    
    const startCol = Math.floor((x - width/2 - baseLeft) / gridSize);
    const endCol = Math.floor((x + width/2 - baseLeft) / gridSize);
    const startRow = Math.floor((y - height/2 - baseTop) / gridSize);
    const endRow = Math.floor((y + height/2 - baseTop) / gridSize);
    
    // Mark cells as occupied
    const newGrid = [...bookingGrid];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row >= 0 && row < newGrid.length && col >= 0 && col < newGrid[0].length) {
          newGrid[row][col] = false;
        }
      }
    }
    
    setBookingGrid(newGrid);
    console.log('Position booked:', { x, y, width, height, startRow, endRow, startCol, endCol });
    return true;
  };

  // Calculate and display available spaces for visual feedback
  const calculateAvailableSpaces = (cutWidth, cutHeight) => {
    const currentBaseRect = getCurrentBaseRect();
    if (!currentBaseRect) return;
    
    const scale = 5;
    const widthPx = cutWidth * scale;
    const heightPx = mode === '1D' ? 50 : cutHeight * scale;
    
    const baseLeft = currentBaseRect.left - currentBaseRect.width / 2;
    const baseTop = currentBaseRect.top - currentBaseRect.height / 2;
    const baseRight = baseLeft + currentBaseRect.width;
    const baseBottom = baseTop + currentBaseRect.height;
    
    const spaces = [];
    
    // Find all available positions
    for (let y = baseTop + heightPx / 2; y <= baseBottom - heightPx / 2; y += gridSize) {
      for (let x = baseLeft + widthPx / 2; x <= baseRight - widthPx / 2; x += gridSize) {
        if (isPositionAvailable(x, y, widthPx, heightPx)) {
          spaces.push({
            x: x - widthPx / 2,
            y: y - heightPx / 2,
            width: widthPx,
            height: heightPx
          });
        }
      }
    }
    
    setAvailableSpaces(spaces);
    console.log(`Found ${spaces.length} available spaces for ${cutWidth}×${cutHeight} cm cut`);
  };

  // Toggle available spaces visualization
  const toggleAvailableSpaces = () => {
    if (!showAvailableSpaces) {
      calculateAvailableSpaces(cutWidth, cutHeight);
    }
    setShowAvailableSpaces(!showAvailableSpaces);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-white border-b">
        <h1 className="text-2xl font-bold mb-2">🎯 Smart Cut Planning System - Enhanced</h1>
        <p className="text-gray-600">Sistem perencanaan cut cerdas dengan auto-placement, grouping, dan strict no-overlap</p>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">🎯 Smart Placement</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">📐 2D/1D Area Calc</span>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">🔗 Grouping</span>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">❌ No Overlap</span>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Controls Panel */}
        {showConfig && (
          <div className="w-72 bg-gray-50 border-r overflow-y-auto">
            <div className="p-3 space-y-3">
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'create' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Create
                </button>
                <button
                  onClick={() => setActiveTab('cuts')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'cuts' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cuts
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'actions' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Actions
                </button>
              </div>

              {/* Mode Selection - Always visible */}
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="text-sm font-medium mb-2">Mode</h3>
                <div className="flex space-x-2">
                <Button
                  variant={mode === '1D' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('1D')}
                    className="flex-1 text-xs"
                >
                    1D
                </Button>
                <Button
                  variant={mode === '2D' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange('2D')}
                    className="flex-1 text-xs"
                >
                    2D
                </Button>
              </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'create' && (
                <>
                  {/* Debug Info */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                    <div>Debug: cutWidth={cutWidth}, cutHeight={cutHeight}, baseRect={baseRect ? 'exists' : 'null'}</div>
                    <div>Button disabled: {(!cutWidth || !cutHeight || !baseRect) ? 'YES' : 'NO'}</div>
                  </div>
                  
                  {/* Base Plate Controls */}
                  <div className="bg-white rounded-lg p-3 border">
                    <h3 className="text-sm font-medium mb-3">Base Plate</h3>
                    <div className="space-y-3">
              <div>
                        <label className="block text-xs font-medium mb-1">
                  {mode === '1D' ? 'Panjang (cm)' : 'Lebar (cm)'} 
                  {baseWidth > 0 && <span className="text-blue-600"> - {formatDimension(baseWidth)}</span>}
                </label>
                <Input
                  type="number"
                  value={baseWidth}
                  onChange={(e) => setBaseWidth(parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                />
              </div>
              
              {mode === '2D' && (
                <div>
                          <label className="block text-xs font-medium mb-1">
                            Tinggi (cm) {baseHeight > 0 && <span className="text-blue-600"> - {formatDimension(baseHeight)}</span>}
                          </label>
                  <Input
                    type="number"
                    value={baseHeight}
                    onChange={(e) => setBaseHeight(parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                  />
                </div>
              )}
              
              <div>
                        <label className="block text-xs font-medium mb-1">Berat (kg)</label>
                <Input
                  type="number"
                  value={baseWeight}
                  onChange={(e) => setBaseWeight(parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                />
              </div>
              
              <div>
                        <label className="block text-xs font-medium mb-1">Warna</label>
                <Input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                          className="h-8 w-full"
                />
              </div>
              
                      <Button
                        onClick={createBasePlate}
                        className="w-full h-8 text-sm"
                        disabled={!baseWidth || (mode === '2D' && !baseHeight)}
                      >
                        <Square className="w-4 h-4 mr-2" />
                Buat Base Plate
              </Button>
                    </div>
                  </div>

          {/* Manual Cut Controls */}
                  <div className="bg-white rounded-lg p-3 border">
                    <h3 className="text-sm font-medium mb-3">Manual Cut</h3>
                    <div className="space-y-3">
              <div>
                        <label className="block text-xs font-medium mb-1">
                          Lebar (cm) {cutWidth > 0 && <span className="text-blue-600">- {formatDimension(cutWidth)}</span>}
                        </label>
                <Input
                  type="number"
                  value={cutWidth}
                  onChange={(e) => setCutWidth(parseFloat(e.target.value) || 0)}
                          className={`h-8 text-sm ${
                            cutWidth > 0 && validateDimensions(cutWidth, cutHeight).length > 0 
                              ? 'border-red-300 bg-red-50' 
                              : cutWidth > 0 && canFitInBasePlate(cutWidth, cutHeight)
                              ? 'border-green-300 bg-green-50'
                              : ''
                          }`}
                />
                {cutWidth > 0 && validateDimensions(cutWidth, cutHeight).length > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    {validateDimensions(cutWidth, cutHeight).join(', ')}
                  </div>
                )}
              </div>
              
                <div>
                        <label className="block text-xs font-medium mb-1">
                          Tinggi (cm) {cutHeight > 0 && <span className="text-blue-600">- {formatDimension(cutHeight)}</span>}
                        </label>
                  <Input
                    type="number"
                    value={cutHeight}
                    onChange={(e) => setCutHeight(parseFloat(e.target.value) || 0)}
                    className={`h-8 text-sm ${
                      cutHeight > 0 && validateDimensions(cutWidth, cutHeight).length > 0 
                        ? 'border-red-300 bg-red-50' 
                        : cutHeight > 0 && canFitInBasePlate(cutWidth, cutHeight)
                        ? 'border-green-300 bg-green-50'
                        : ''
                    }`}
                  />
                  {cutHeight > 0 && validateDimensions(cutWidth, cutHeight).length > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {validateDimensions(cutWidth, cutHeight).join(', ')}
                    </div>
                  )}
                </div>
              
              <div>
                        <label className="block text-xs font-medium mb-1">Warna</label>
                <Input
                  type="color"
                  value={cutColor}
                  onChange={(e) => setCutColor(e.target.value)}
                          className="h-8 w-full"
                />
              </div>
              
                      <Button
                        onClick={() => {
                          console.log('Button clicked!', { cutWidth, cutHeight, baseRect });
                          addManualCut();
                        }}
                        className="w-full h-8 text-sm"
                        disabled={!cutWidth || !cutHeight || !baseRect}
                      >
                        <Scissors className="w-4 h-4 mr-2" />
                        Tambah Cut Manual
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'cuts' && (
                <div className="bg-white rounded-lg p-3 border">
                  <h3 className="text-sm font-medium mb-3">Work Order Cuts</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {workOrderItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <div>
                          <div className="font-medium">{item.nama}</div>
                          <div className="text-gray-600">{item.panjang} × {item.lebar} cm</div>
                          <div className="text-gray-500 text-xs">Qty: {item.qty} | {item.jenis}</div>
                        </div>
                  <Button
                    size="sm"
                    onClick={() => addCutFromItem(item)}
                          disabled={!baseRect}
                          className="h-6 px-2 text-xs"
                  >
                          Add
                  </Button>
                </div>
              ))}
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="bg-white rounded-lg p-3 border space-y-2">
                  <h3 className="text-sm font-medium mb-3">Actions</h3>
                  <Button onClick={clearCanvas} variant="outline" className="w-full h-8 text-xs">
                    <RotateCcw className="w-3 h-3 mr-2" />
                Clear Canvas
              </Button>
                  <Button onClick={checkAndFixOverlaps} variant="outline" className="w-full h-8 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100">
                    🔍 Check & Fix Overlaps
                  </Button>
                  <Button 
                    onClick={deleteSelectedObject} 
                    variant="outline" 
                    className="w-full h-8 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    disabled={!selectedObject}
                  >
                    🗑️ Delete Selected
                  </Button>
                  <Button 
                    onClick={toggleAvailableSpaces} 
                    variant="outline" 
                    className={`w-full h-8 text-xs ${showAvailableSpaces ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'} hover:bg-green-100`}
                    disabled={!baseRect || !cutWidth || !cutHeight}
                  >
                    {showAvailableSpaces ? '🟢 Hide' : '🔍 Show'} Available Spaces
                  </Button>
                  <Button onClick={resetView} variant="outline" className="w-full h-8 text-xs">
                    <Package className="w-3 h-3 mr-2" />
                Reset View
              </Button>
                  <Button onClick={fitToScreen} variant="outline" className="w-full h-8 text-xs" disabled={!baseRect}>
                    <Edit3 className="w-3 h-3 mr-2" />
                Fit to Screen
              </Button>
                  <Button onClick={toggleGrid} variant="outline" className="w-full h-8 text-xs" disabled={!baseRect}>
                    <Grid3X3 className="w-3 h-3 mr-2" />
                    {showGrid ? 'Hide' : 'Show'} Grid
              </Button>
                </div>
              )}

              {/* Remaining Info - Always visible */}
              {remainingInfo.area > 0 && (
                <div className="bg-white rounded-lg p-3 border">
                  <h3 className="text-sm font-medium mb-2">Ruang Tersisa</h3>
                  <div className="space-y-1 text-xs">
                    <div>Area: {remainingInfo.area.toFixed(0)} cm²</div>
                    <div>Berat: {remainingInfo.weight.toFixed(1)} kg</div>
                    <div className={`font-medium ${
                      remainingInfo.efficiency > 80 ? 'text-green-600' :
                      remainingInfo.efficiency > 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Efisiensi: {remainingInfo.efficiency.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}  
            </div>
          </div>
        )} 
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Header */}
          <div className="p-4 bg-white border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              <span className="font-medium">Canvas Area</span>
              <Badge variant="outline">
                {mode === '1D' ? '1D Mode' : '2D Mode'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              {showConfig ? <X className="w-4 h-4 mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
              {showConfig ? 'Hide Config' : 'Show Config'}
            </Button>
          </div>
          
          {/* Canvas Container */}
          <div className="flex-1 p-4 bg-gray-100">
            <div className="h-full border-2 border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden">
              {/* Zoom Controls */}
              <div className="p-2 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={zoomOut}
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                  >
                    −
                  </Button>
                  <span className="text-xs font-medium min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    onClick={zoomIn}
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                  >
                    +
                  </Button>
                  <Button
                    onClick={resetZoom}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    Reset
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Zoom: Scroll wheel | Pan: Middle click + drag
                </div>
              </div>
              
              <div className="p-2 text-sm text-gray-600 border-b">
                <span className="font-medium">Enhanced Canvas Controls:</span> 
                <span className="ml-2">🖱️ Scroll = Zoom | 🖱️ Middle Click + Drag = Pan | 🖱️ Click = Select</span>
                <br />
                <span className="text-xs text-blue-600">🎯 Smart Cut Analysis | 🔗 Drag Base Plate = Move all cuts together | 📐 2D/1D Area Calculation | ❌ Strict No Overlap</span>
                <br />
                <span className="text-xs text-green-600">✨ Auto-optimization | 🎫 Grid Booking System | 🏷️ Cut Numbering | 📊 Real-time Efficiency</span>
              </div>
              <div className="relative h-full">
                <canvas
                  key={`canvas-${mode}`}
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{ 
                    cursor: 'crosshair'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
