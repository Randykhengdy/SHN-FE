import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/useAlert';
import { request } from '@/lib/request';

const PlatShaftCanvasPage = React.forwardRef(({ hideTitle = false, onClose, onCanvasSaved }, ref) => {
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
  
  // Quantity tracking
  const [totalQuantity, setTotalQuantity] = useState(0);
  
  
  
  // Sidebar toggle state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  
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
  
  // Debug function to show all canvas layouts in localStorage
  const debugCanvasLayouts = useCallback(() => {
    const allKeys = Object.keys(localStorage);
    const canvasKeys = allKeys.filter(key => key.startsWith('WO_canvas_layout_'));
    
    console.log('=== ALL CANVAS LAYOUTS IN LOCALSTORAGE ===');
    console.log('Total canvas keys found:', canvasKeys.length);
    
    canvasKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log(`Key: ${key}`, {
            hasBoxes: parsed.boxes && parsed.boxes.length > 0,
            boxCount: parsed.boxes ? parsed.boxes.length : 0,
            version: parsed.version || '1.0',
            timestamp: parsed.timestamp
          });
        }
      } catch (error) {
        console.error(`Error parsing key ${key}:`, error);
      }
    });
    console.log('=== END CANVAS LAYOUTS DEBUG ===');
  }, []);
  
  // Load canvas data from API
  const loadCanvasFromAPI = useCallback(async (itemBarangId) => {
    try {
      console.log('Loading canvas data from API for item barang ID:', itemBarangId);
      const result = await request(`/item-barang/${itemBarangId}/canvas`, {
        method: 'GET'
      });
      
      console.log('Canvas data loaded from API:', result);
      
      if (result.success && result.data && result.data.canvas_data) {
        const canvasData = result.data.canvas_data;
        
        // Load canvas data
        if (canvasData.boxes && Array.isArray(canvasData.boxes)) {
          setBoxes(canvasData.boxes);
          console.log('Loaded boxes from API:', canvasData.boxes.length);
        }
        
        if (canvasData.baseContainer) {
          setBaseContainer(canvasData.baseContainer);
          console.log('Loaded base container from API:', canvasData.baseContainer);
        }
        
        if (canvasData.gridSize) {
          setGridSize(canvasData.gridSize);
        }
        
        if (canvasData.zoom) {
          setZoom(canvasData.zoom);
        }
        
        if (canvasData.panOffset) {
          setPanOffset(canvasData.panOffset);
        }
        
        showAlert('Success', 'Canvas data loaded from server!', 'success');
      } else if (result.boxes && Array.isArray(result.boxes)) {
        // Handle direct response format (without success wrapper)
        console.log('Loading canvas data from direct response format');
        
        if (result.boxes) {
          setBoxes(result.boxes);
          console.log('Loaded boxes from API:', result.boxes.length);
        }
        
        if (result.baseContainer) {
          setBaseContainer(result.baseContainer);
          console.log('Loaded base container from API:', result.baseContainer);
        }
        
        if (result.gridSize) {
          setGridSize(result.gridSize);
        }
        
        if (result.zoom) {
          setZoom(result.zoom);
        }
        
        if (result.panOffset) {
          setPanOffset(result.panOffset);
        }
        
        showAlert('Success', 'Canvas data loaded from server!', 'success');
      } else {
        console.log('No canvas data found in API response');
      }
    } catch (error) {
      console.error('Error loading canvas from API:', error);
      // Don't show error alert, just log it - canvas will use default state
    }
  }, [showAlert]);

  // Load work order data from sessionStorage
  useEffect(() => {
    if (isInitialized) return; // Prevent multiple initializations
    
    const storedData = sessionStorage.getItem('WO_canvasData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        console.log('Loaded workOrderData from sessionStorage:', data);
        setWorkOrderData(data);
        
        // Debug: Show all canvas layouts in localStorage
        debugCanvasLayouts();
        
        // Check if canvas data exists in localStorage first
        if (data.selectedItem && data.selectedItem.id) {
          const itemBarangId = data.selectedItem.id;
          
          // Check if this saran plat is in WO_used_saran_plats
          const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
          const isSaranPlatUsed = usedSaranPlats.includes(itemBarangId.toString()) || usedSaranPlats.includes(parseInt(itemBarangId));
          
          console.log('Canvas load check:', {
            itemBarangId,
            isSaranPlatUsed,
            usedSaranPlats
          });
          
          if (isSaranPlatUsed) {
            // If saran plat is used, search for existing canvas layout
            const allKeys = Object.keys(localStorage);
            
            // Search for canvas keys that start with WO_canvas_layout_{itemBarangId}_
            const canvasKeys = allKeys.filter(key => 
              key.startsWith(`WO_canvas_layout_${itemBarangId}_`)
            );
            
            console.log('Searching for canvas keys:', {
              itemBarangId,
              searchPattern: `WO_canvas_layout_${itemBarangId}_`,
              allKeys: allKeys.filter(key => key.startsWith('WO_canvas_layout_')),
              foundKeys: canvasKeys
            });
            
            if (canvasKeys.length > 0) {
              // Use the first found key (or could be the latest one)
              const canvasKey = canvasKeys[0];
              const existingCanvasData = localStorage.getItem(canvasKey);
              
              console.log('Using canvas key:', canvasKey, 'hasData:', !!existingCanvasData);
              
              if (existingCanvasData) {
                console.log('Found existing canvas data for used saran plat, loading from localStorage');
                // Canvas data will be loaded by existing localStorage logic below
              } else {
                console.log('Canvas key found but no data, loading from API');
                loadCanvasFromAPI(itemBarangId);
              }
            } else {
              console.log('No canvas keys found for used saran plat, loading from API');
              loadCanvasFromAPI(itemBarangId);
            }
          } else {
            // If saran plat is not used, try normal flow
            const workOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id');
            const canvasKey = workOrderUniqueId ? `WO_canvas_layout_${itemBarangId}_${workOrderUniqueId}` : `WO_canvas_layout_${itemBarangId}`;
            const existingCanvasData = localStorage.getItem(canvasKey);
            
            if (existingCanvasData) {
              console.log('Canvas data found in localStorage, using cached data');
              // Canvas data will be loaded by existing localStorage logic below
            } else {
              console.log('No canvas data in localStorage, loading from API');
              loadCanvasFromAPI(itemBarangId);
            }
          }
        }
        
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
        
        // Sync quantity tracking - totalQuantity should be the number of boxes in canvas
        const totalQty = data.itemQty || 0;
        setTotalQuantity(0); // Start with 0, will be updated when boxes are added
        
        // Check if there's cached data for this work order item
        const workOrderId = data.workOrderId || 'unknown';
        const saranId = data.selectedItem?.id || 'unknown';
        const cacheKey = `WO_canvas_layout_${saranId}_${workOrderId}`;
        
        // Check if current work order ID matches stored ID
        const storedWorkOrderId = localStorage.getItem('WO_current_work_order_id');
        const isCurrentWorkOrder = storedWorkOrderId === workOrderId;
        
        console.log('Work Order ID Comparison:', {
          current: workOrderId,
          stored: storedWorkOrderId,
          isCurrent: isCurrentWorkOrder,
          cacheKey: cacheKey,
          totalQty: totalQty
        });
        
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            
            // Check if it's new format (canvas data only) or old format (with workOrderData)
            let cachedBoxes = [];
            if (parsedCache.version === "2.0" && !parsedCache.workOrderData) {
              // New format - canvas data only
              cachedBoxes = parsedCache.boxes || [];
            } else if (parsedCache.canvasData && parsedCache.canvasData.boxes) {
              // Old format - with workOrderData wrapper
              cachedBoxes = parsedCache.canvasData.boxes;
            }
            
            if (cachedBoxes.length > 0) {
              const usedQuantity = cachedBoxes.length;
              const remainingQty = Math.max(0, totalQty - usedQuantity);
              
              console.log('Loading cached layout:', {
                totalQty: totalQty,
                usedQuantity: usedQuantity,
                remainingQty: remainingQty,
                boxes: cachedBoxes.length,
                format: parsedCache.version === "2.0" ? "new" : "old"
              });
              
              
              // Process boxes with color logic
              const currentWoItemId = data.workOrderItem?.id || data.itemId;
              const currentWorkOrderId = data.workOrderId;
              const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId;
              
              const processedBoxes = cachedBoxes.map(box => {
                const boxWoItemId = box.woItemId || 'unknown';
                const workItemUniqueId = box.workItemUniqueId || 'unknown';
                const isFromDifferentWO = boxWoItemId !== currentWoItemId;
                
                // Determine color based on workItemUniqueId comparison
                let boxColor = '#10b981'; // Default green
                if (box.isSave === true) {
                  boxColor = '#ef4444'; // Red for saved boxes
                } else if (workItemUniqueId && workItemUniqueId !== '' && workItemUniqueId !== currentWorkOrderUniqueId) {
                  boxColor = '#f59e0b'; // Yellow for different workOrderUniqueId
                }
                
                return {
                  ...box,
                  woItemId: boxWoItemId,
                  isSave: box.isSave || false,
                  workItemUniqueId: workItemUniqueId,
                  isDisabled: box.isDisabled !== undefined ? box.isDisabled : false,
                  isFromDifferentWO: isFromDifferentWO,
                  color: boxColor
                };
              });
              
              setBoxes(processedBoxes);
              
              console.log('Processed cached boxes:', {
                totalBoxes: processedBoxes.length,
                currentWoItemBoxes: processedBoxes.filter(box => box.woItemId === currentWoItemId).length,
                otherWoItemBoxes: processedBoxes.filter(box => box.woItemId !== currentWoItemId).length
              });
              
              const idStatus = isCurrentWorkOrder ? 'Current Work Order' : 'Different Work Order';
              showAlert('Info', `Loaded cached layout: ${usedQuantity} boxes used, ${remainingQty} remaining\n\nID Status: ${idStatus}`, 'info');
            } else {
              console.log('No cached boxes found, setting remaining to total:', totalQty);
            }
          } else {
            console.log('No cached data found, setting remaining to total:', totalQty);
            if (!isCurrentWorkOrder) {
              showAlert('Info', `No cached layout found for this work order item.\n\nCurrent ID: ${workOrderId}\nStored ID: ${storedWorkOrderId || 'None'}`, 'info');
            }
          }
        } catch (error) {
          console.error('Error loading cache:', error);
          console.log('Error occurred, setting remaining to total:', totalQty);
        }
        
        
        // Don't auto-generate boxes - let user choose when to fill
        
        setIsInitialized(true);
        showAlert('Success', `Loaded work order data: ${totalQty} items`, 'success');
      } catch (error) {
        console.error('Error loading canvas data:', error);
        showAlert('Error', 'Failed to load work order data', 'error');
      }
    }
  }, [isInitialized, showAlert, loadCanvasFromAPI]);

  // Sync totalQuantity with workOrderData.itemQty (target quantity for current WO item)
  useEffect(() => {
    if (workOrderData?.itemQty) {
      const targetQuantity = parseInt(workOrderData.itemQty) || 0;
      const woItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
      setTotalQuantity(targetQuantity);
      console.log('Updated totalQuantity:', {
        targetQuantity,
        woItemId,
        workOrderItem: workOrderData?.workOrderItem,
        itemId: workOrderData?.itemId,
        fullWorkOrderData: workOrderData
      });
    }
  }, [workOrderData?.itemQty, workOrderData?.workOrderItem?.id, workOrderData?.itemId, workOrderData]);


  
  // Generate initial boxes based on work order quantity
  const generateInitialBoxes = useCallback((quantity, itemWidth, itemHeight) => {
    const newBoxes = [];
    const newId = 1; // Start from 1 for new boxes
    
    // Use single color for all boxes
    const singleColor = '#10b981'; // Green color for all boxes
    
    // Calculate optimal grid layout
    const maxBoxesPerRow = Math.floor(baseContainer.width / itemWidth);
    const maxBoxesPerCol = Math.floor(baseContainer.height / itemHeight);
    const maxBoxesInContainer = maxBoxesPerRow * maxBoxesPerCol;
    
    // Only generate boxes that can fit
    const boxesToGenerate = Math.min(quantity, maxBoxesInContainer);
    
    // Create a grid to track occupied positions
    const grid = Array(baseContainer.height).fill().map(() => 
      Array(baseContainer.width).fill(false)
    );
    
    // Place boxes in perfect grid layout (no gaps)
    for (let i = 0; i < boxesToGenerate; i++) {
      const boxId = newId + i;
      
      // Calculate position in perfect grid (no spacing) - use exact grid positioning
      const row = Math.floor(i / maxBoxesPerRow);
      const col = i % maxBoxesPerRow;
      
      const x = baseContainer.x + (col * itemWidth);
      const y = baseContainer.y + (row * itemHeight);
      
      // Check if this position is completely available
      let canPlace = true;
      for (let checkY = y; checkY < y + itemHeight && canPlace; checkY++) {
        for (let checkX = x; checkX < x + itemWidth && canPlace; checkX++) {
          if (checkX >= baseContainer.width || checkY >= baseContainer.height || grid[checkY][checkX]) {
            canPlace = false;
          }
        }
      }
      
      if (canPlace) {
        // Mark this position as occupied
        for (let markY = y; markY < y + itemHeight; markY++) {
          for (let markX = x; markX < x + itemWidth; markX++) {
            if (markX >= 0 && markX < baseContainer.width && markY >= 0 && markY < baseContainer.height) {
              grid[markY][markX] = true;
            }
          }
        }
        
        newBoxes.push({
          id: boxId,
          x: x,
          y: y,
          width: itemWidth,
          height: itemHeight,
          color: singleColor,
          isDisabled: false
        });
      }
    }
    
    setBoxes(newBoxes);
  }, [baseContainer]);
  
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
      // Red color for disabled boxes (from API/cache)
      ctx.fillStyle = '#ef4444';
    } else if (box.isSave === true) {
      // Red color for boxes that are saved
      ctx.fillStyle = '#ef4444';
      console.log('Box color: RED - Saved box', { 
        boxId: box.id, 
        isSave: box.isSave,
        workItemUniqueId: box.workItemUniqueId
      });
    } else if (box.color && box.color !== '#10b981') {
      // Use box color if it's explicitly set (for loaded boxes)
      ctx.fillStyle = box.color;
      console.log('Box color: USING BOX COLOR', { 
        boxId: box.id, 
        color: box.color
      });
    } else {
      // Determine color based on workItemUniqueId comparison
      const currentWorkOrderId = workOrderData?.workOrderId; // This is the current workOrderId
      const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId; // Get workOrderUniqueId from storage
      const boxWorkItemUniqueId = box.workItemUniqueId;
      
      console.log('Box color decision:', {
        boxId: box.id,
        currentWorkOrderId: currentWorkOrderId,
        currentWorkOrderUniqueId: currentWorkOrderUniqueId,
        boxWorkItemUniqueId: boxWorkItemUniqueId,
        isSave: box.isSave,
        hasWorkItemUniqueId: !!boxWorkItemUniqueId,
        isSameWorkOrderUniqueId: boxWorkItemUniqueId === currentWorkOrderUniqueId,
        isDifferentWorkOrderUniqueId: boxWorkItemUniqueId && currentWorkOrderUniqueId && boxWorkItemUniqueId !== currentWorkOrderUniqueId,
        woItemId: box.woItemId,
        workOrderData: workOrderData
      });
      
      if (!boxWorkItemUniqueId || boxWorkItemUniqueId === '' || boxWorkItemUniqueId === currentWorkOrderUniqueId) {
        // Green for boxes without workItemUniqueId or from current workOrderUniqueId (default hijau)
        ctx.fillStyle = '#10b981';
        console.log('Box color: GREEN - Default/Current workOrderUniqueId', { 
          boxWorkItemUniqueId, 
          currentWorkOrderUniqueId, 
          boxId: box.id,
          reason: !boxWorkItemUniqueId ? 'No workItemUniqueId' : 'Same workOrderUniqueId'
        });
      } else {
        // Yellow for boxes from different workOrderUniqueId (workItemUniqueId beda + isSave false)
        ctx.fillStyle = '#f59e0b';
        console.log('Box color: YELLOW - Different workOrderUniqueId', { 
          boxWorkItemUniqueId, 
          currentWorkOrderUniqueId, 
          boxId: box.id 
        });
      }
    }
    
    // Draw perfect rectangles (no rounded corners)
    ctx.fillRect(x, y, width, height);
    
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
    
    // Draw perfect rectangle border
    ctx.strokeRect(x, y, width, height);
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
    
    // Display box size only
    ctx.font = `${Math.max(10, Math.min(width, height) * 0.22)}px Arial`;
    ctx.fillText(`${box.width}×${box.height}`, centerX, centerY);
    
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
    
    // Handle panning for middle mouse or Ctrl+Left
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsPanning(true);
      setLastPanPos(mousePos);
      return;
    }
    
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
      
      // Check if box belongs to the same WO item - STRICT RESTRICTION
      const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
      const boxWoItemId = clickedBox.woItemId;
      
      // If box has woItemId and it's different from current WO item, block all interaction
      if (boxWoItemId && currentWoItemId && currentWoItemId !== boxWoItemId) {
        showAlert('Info', `This box belongs to a different Work Order item (ID: ${boxWoItemId}). You cannot edit it.`, 'info');
        return;
      }
      
      // If current WO item has ID but box doesn't, also block (backward compatibility protection)
      if (currentWoItemId && !boxWoItemId) {
        showAlert('Info', 'This box is from a previous session and cannot be edited. Please create new boxes.', 'info');
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
  }, [boxes, getMousePos, getGridPos, gridSize, zoom, isMouseOverBox, isMouseOverContainer, baseContainer, workOrderData, showAlert]);

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
    const newZoom = Math.max(0.05, Math.min(3, zoom + delta)); // Minimum 5% (0.05x)
    
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
    // Calculate current boxes for current WO item only
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const currentWoItemBoxes = boxes ? boxes.filter(box => 
      box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
    ) : [];
    const currentQuantity = currentWoItemBoxes.length;
    
    // Check if already reached target quantity
    const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
    if (currentQuantity >= targetQuantity) {
      showAlert('Warning', `Maximum quantity reached! (${currentQuantity}/${targetQuantity})`, 'warning');
      return;
    }
    
    if (newBoxSize.width > baseContainer.width || newBoxSize.height > baseContainer.height) {
      showAlert('Error', `Box size (${newBoxSize.width}×${newBoxSize.height}) is too big for container (${baseContainer.width}×${baseContainer.height})`, 'error');
      return;
    }
    
    setBoxes(prevBoxes => {
      const newId = prevBoxes && prevBoxes.length > 0 ? Math.max(...prevBoxes.map(b => b.id)) + 1 : 1;
      const singleColor = '#10b981'; // Use same color as other boxes
    
      // Create a grid to track occupied positions
      const grid = Array(baseContainer.height).fill().map(() => 
        Array(baseContainer.width).fill(false)
      );
      
      // Mark existing boxes as occupied
      if (prevBoxes && prevBoxes.length > 0) {
        prevBoxes.forEach(box => {
          for (let y = box.y; y < box.y + box.height; y++) {
            for (let x = box.x; x < box.x + box.width; x++) {
              if (x >= 0 && x < baseContainer.width && y >= 0 && y < baseContainer.height) {
                grid[y][x] = true;
              }
            }
          }
        });
      }
      
      // Find first available position in perfect grid
      let placed = false;
      let newBox = null;
      
      for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - newBoxSize.height && !placed; y += newBoxSize.height) {
        for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - newBoxSize.width && !placed; x += newBoxSize.width) {
          // Check if this position is completely available
          let canPlace = true;
          for (let checkY = y; checkY < y + newBoxSize.height && canPlace; checkY++) {
            for (let checkX = x; checkX < x + newBoxSize.width && canPlace; checkX++) {
              if (checkX >= baseContainer.width || checkY >= baseContainer.height || grid[checkY][checkX]) {
                canPlace = false;
              }
            }
          }
          
          if (canPlace) {
            const woItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId || 'unknown';
            const workItemUniqueId = localStorage.getItem('WO_current_work_order_item_id') || workOrderData?.workOrderId || 'unknown';
            const workOrderId = workOrderData?.workOrderId || 'unknown';
            const saranId = workOrderData?.selectedItem?.id || 'unknown';
            
            console.log('Creating new box - workOrderData check:', {
              workOrderData: workOrderData,
              workOrderId: workOrderId,
              workItemUniqueId: workItemUniqueId,
              woItemId: woItemId,
              saranId: saranId
            });
            
            newBox = {
              id: newId,
              x: x,
              y: y,
              width: newBoxSize.width,
              height: newBoxSize.height,
              color: '#10b981', // Always green for new boxes
              isDisabled: false, // Default: new boxes are enabled
              woItemId: woItemId,
              workOrderId: workOrderId,
              saranId: saranId,
              isSave: false, // Will be true when saving
              workItemUniqueId: workItemUniqueId // Set workItemUniqueId to storage
            };
            console.log('Created new box with isSave and workItemUniqueId:', {
              boxId: newId,
              woItemId: woItemId,
              isSave: false,
              workItemUniqueId: workItemUniqueId,
              workOrderItem: workOrderData?.workOrderItem,
              itemId: workOrderData?.itemId,
              workOrderData: workOrderData
            });
            placed = true;
          }
        }
      }
      
      if (!placed) {
        showAlert('Error', 'No space available for new box!', 'error');
        return prevBoxes; // Return unchanged state
      }
      
      // Calculate remaining quantity correctly (only for current WO item)
      const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
      const currentWoItemBoxes = prevBoxes ? prevBoxes.filter(box => 
        box.woItemId === currentWoItemId || !box.woItemId
      ) : [];
      const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
      const totalBoxes = currentWoItemBoxes.length + 1;
      showAlert('Success', `Box ${newId} (${newBoxSize.width}×${newBoxSize.height}) added!`, 'success');
      return [...prevBoxes, newBox];
    });
  }, [newBoxSize, baseContainer, showAlert, workOrderData?.itemQty, workOrderData?.workOrderItem?.id, workOrderData?.itemId, boxes]);
  
  const clearAllBoxes = useCallback(() => {
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    
    setBoxes(prevBoxes => {
      // Only remove boxes from current WO item, keep others
      const otherWoItemBoxes = prevBoxes.filter(box => {
        const boxWoItemId = box.woItemId;
        return (boxWoItemId && currentWoItemId && currentWoItemId !== boxWoItemId) ||
               (!currentWoItemId && boxWoItemId);
      });
      
      // Reset remaining quantity for current WO item
      const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
      
      return otherWoItemBoxes;
    });
    
    showAlert('Success', 'All boxes from current Work Order item cleared!', 'success');
  }, [showAlert, totalQuantity, workOrderData?.workOrderItem?.id, workOrderData?.itemId]);

  const fillAllBoxes = useCallback(() => {
    // Get current work order unique ID
    const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || workOrderData?.workOrderId;
    
    // Count boxes with same workItemUniqueId (same color)
    const currentWoItemBoxes = boxes ? boxes.filter(box => 
      box.workItemUniqueId === currentWorkOrderUniqueId
    ) : [];
    const currentQuantity = currentWoItemBoxes.length;
    
    // Get target quantity from workOrderData
    const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
    
    console.log('Fill All Boxes - Current State:', {
      targetQuantity: targetQuantity,
      currentQuantity: currentQuantity,
      currentWorkOrderUniqueId: currentWorkOrderUniqueId,
      totalBoxesInCanvas: boxes ? boxes.length : 0,
      workOrderData: workOrderData,
      boxes: boxes?.map(box => ({ id: box.id, workItemUniqueId: box.workItemUniqueId, woItemId: box.woItemId }))
    });

    // Check if already reached target quantity
    if (currentQuantity >= targetQuantity) {
      showAlert('Warning', `Maximum quantity already reached! (${currentQuantity}/${targetQuantity})`, 'warning');
      return;
    }

    // Calculate how many boxes to add
    const boxesToFill = targetQuantity - currentQuantity;

    if (boxesToFill <= 0) {
      showAlert('Info', 'All boxes already filled!', 'info');
      return;
    }

    // Use single color for all boxes
    const singleColor = '#10b981'; // Green color for all boxes
    
    // Calculate how many boxes can fit in the container
    const maxBoxesPerRow = Math.floor(baseContainer.width / newBoxSize.width);
    const maxBoxesPerCol = Math.floor(baseContainer.height / newBoxSize.height);
    const maxBoxesInContainer = maxBoxesPerRow * maxBoxesPerCol;
    
    // Check if we have enough space
    const availableSpace = maxBoxesInContainer - (boxes ? boxes.length : 0);
    const boxesToAdd = Math.min(boxesToFill, availableSpace);

    console.log('Fill All Boxes - Space Calculation:', {
      maxBoxesInContainer: maxBoxesInContainer,
      currentBoxes: boxes ? boxes.length : 0,
      availableSpace: availableSpace,
      boxesToFill: boxesToFill,
      boxesToAdd: boxesToAdd
    });

    if (boxesToAdd <= 0) {
      showAlert('Error', 'No space available for new boxes!', 'error');
      return;
    }

    // Generate boxes with perfect grid layout (no gaps)
    const newBoxes = [];
    let newId = boxes && boxes.length > 0 ? Math.max(...boxes.map(b => b.id)) + 1 : 1;
    
    // Create a grid to track occupied positions
    const grid = Array(baseContainer.height).fill().map(() => 
      Array(baseContainer.width).fill(false)
    );
    
    // Mark existing boxes as occupied
    if (boxes && boxes.length > 0) {
      boxes.forEach(box => {
        for (let y = box.y; y < box.y + box.height; y++) {
          for (let x = box.x; x < box.x + box.width; x++) {
            if (x >= 0 && x < baseContainer.width && y >= 0 && y < baseContainer.height) {
              grid[y][x] = true;
            }
          }
        }
      });
    }
    
    // Place new boxes with collision detection and position finding (optimized for speed)
    const placeBoxesWithDelay = async () => {
      console.log(`Starting to place ${boxesToAdd} boxes...`);
      
      for (let i = 0; i < boxesToAdd; i++) {
        const boxId = newId + i;
        let placed = false;
        
        // Try to find a position for this box (optimized with step size)
        const stepSize = Math.max(1, Math.floor(newBoxSize.width / 2)); // Skip some positions for speed
        for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - newBoxSize.height && !placed; y += stepSize) {
          for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - newBoxSize.width && !placed; x += stepSize) {
            // Quick check first - if any corner is occupied, skip this position
            if (grid[y][x] || grid[y + newBoxSize.height - 1][x] || 
                grid[y][x + newBoxSize.width - 1] || grid[y + newBoxSize.height - 1][x + newBoxSize.width - 1]) {
              continue; // Skip this position immediately
            }
            
            // Check if this position is completely available (only if corners are free)
            let canPlace = true;
            for (let checkY = y; checkY < y + newBoxSize.height && canPlace; checkY++) {
              for (let checkX = x; checkX < x + newBoxSize.width && canPlace; checkX++) {
                if (checkX >= baseContainer.width || checkY >= baseContainer.height || grid[checkY][checkX]) {
                  canPlace = false;
                }
              }
            }
            
            if (canPlace) {
              // Mark this position as occupied
              for (let markY = y; markY < y + newBoxSize.height; markY++) {
                for (let markX = x; markX < x + newBoxSize.width; markX++) {
                  if (markX >= 0 && markX < baseContainer.width && markY >= 0 && markY < baseContainer.height) {
                    grid[markY][markX] = true;
                  }
                }
              }
              
              const woItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId || 'unknown';
              const workItemUniqueId = localStorage.getItem('WO_current_work_order_item_id') || workOrderData?.workOrderId || 'unknown';
              const workOrderId = workOrderData?.workOrderId || 'unknown';
              const saranId = workOrderData?.selectedItem?.id || 'unknown';
              
              newBoxes.push({
                id: boxId,
                x: x,
                y: y,
                width: newBoxSize.width,
                height: newBoxSize.height,
                color: '#10b981', // Always green for new boxes
                isDisabled: false,
                woItemId: woItemId,
                workOrderId: workOrderId,
                saranId: saranId,
                isSave: false, // Will be true when saving
                workItemUniqueId: workItemUniqueId // Set workItemUniqueId to storage
              });
              
              placed = true; // Mark as placed and break out of loops
            }
          }
        }
        
        // If couldn't place this box, log it
        if (!placed) {
          console.warn(`Could not place box ${boxId} - no available space`);
        }
        
        // Add small delay every 20 boxes to prevent UI freezing (minimal delay)
        if ((i + 1) % 20 === 0) {
          console.log(`Placed ${i + 1}/${boxesToAdd} boxes...`);
          await new Promise(resolve => setTimeout(resolve, 2)); // 2ms delay (minimal)
        }
      }
      
      // Update boxes after all are placed
      if (newBoxes.length > 0) {
        setBoxes(prevBoxes => {
          const updatedBoxes = [...(prevBoxes || []), ...newBoxes];
          return updatedBoxes;
        });
        
        // Calculate remaining quantity correctly
        const totalBoxes = (boxes ? boxes.length : 0) + newBoxes.length;
        const newRemaining = Math.max(0, totalQuantity - totalBoxes);
        
        console.log('Fill All - Final Calculation:', {
          totalQuantity: totalQuantity,
          currentBoxes: boxes ? boxes.length : 0,
          newBoxes: newBoxes.length,
          totalBoxes: totalBoxes,
          newRemaining: newRemaining
        });
        
        const message = newBoxes.length < boxesToFill 
          ? `Added ${newBoxes.length} boxes! Total: ${totalBoxes}/${targetQuantity} (${newRemaining} remaining - not enough space)`
          : `Added ${newBoxes.length} boxes! Total: ${totalBoxes}/${targetQuantity} (${newRemaining} remaining)`;
        showAlert('Success', message, 'success');
      } else {
        showAlert('Error', 'No space available for new boxes!', 'error');
      }
    };
    
    // Start placing boxes with delay
    placeBoxesWithDelay();
  }, [boxes, newBoxSize, baseContainer, showAlert, workOrderData?.itemQty, workOrderData?.workOrderItem?.id, workOrderData?.itemId]);
  
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
    const newZoom = Math.max(zoom - 0.2, 0.05); // Minimum 5% (0.05x)
    if (newZoom !== zoom) {
      setZoom(newZoom);
    }
  }, [zoom]);
  
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Enhanced save system - only save canvas data with required info
  const generateSaveData = useCallback(() => {
    // Get current work order info for reference
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const currentWorkOrderId = workOrderData?.workOrderId;
    const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId;
    
    console.log('Generating canvas save data:', {
      currentWoItemId,
      currentWorkOrderId,
      currentWorkOrderUniqueId,
      totalBoxes: boxes?.length || 0,
      allBoxes: boxes?.map(box => ({ id: box.id, woItemId: box.woItemId, workItemUniqueId: box.workItemUniqueId })) || []
    });
    
    // Only save canvas layout data - no work order data
    const canvasData = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      
      // Canvas layout data only
      baseContainer: baseContainer,
      boxes: boxes || [], // All boxes from all work orders
      gridSize: gridSize,
      zoom: zoom,
      panOffset: panOffset,
      
      // Canvas metadata only
      metadata: {
        containerSize: `${baseContainer.width}×${baseContainer.height}`,
        gridCellSize: `${gridSize}px`,
        zoomLevel: `${Math.round(zoom * 100)}%`,
        totalBoxes: boxes?.length || 0,
        totalArea: boxes ? boxes.reduce((total, box) => total + (box.width * box.height), 0) : 0,
        savedBy: 'user', // TODO: Get from auth context
        saveType: 'canvas_layout'
      }
    };
    
    return canvasData;
  }, [workOrderData, baseContainer, boxes, gridSize, zoom, panOffset]);

  // Legacy export function for backward compatibility
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

  // Save to localStorage (draft save)
  const saveCanvasLayout = useCallback(() => {
    const saveData = generateSaveData();
    
    // Generate unique key for localStorage
    const workOrderId = workOrderData?.workOrderId || 'unknown';
    const saranId = workOrderData?.selectedItem?.id || 'unknown';
    const storageKey = `WO_canvas_layout_${saranId}_${workOrderId}`;
    
    // Check if current work order ID matches stored ID
    const storedWorkOrderId = localStorage.getItem('WO_current_work_order_id');
    const isCurrentWorkOrder = storedWorkOrderId === workOrderId;
    
    console.log('Saving Canvas Layout:', {
      current: workOrderId,
      stored: storedWorkOrderId,
      isCurrent: isCurrentWorkOrder,
      storageKey: storageKey
    });
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(saveData));
      
      // Update saran plat usage tracking
      const saranId = workOrderData?.selectedItem?.id || 'unknown';
      const workOrderId = workOrderData?.workOrderId || 'unknown';
      const itemName = workOrderData?.itemName || workOrderData?.workOrderItem?.nama_item_barang || workOrderData?.selectedItem?.nama || 'Unknown Item';
      
      // Save total quantity with new format for multiple saran plats per WO item
      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
      const woItemId = workOrderData?.workOrderItem?.id || 'unknown';
      
      // Calculate actual quantity arranged in canvas for this WO item
      const currentWoItemBoxes = boxes ? boxes.filter(box => 
        box.woItemId === woItemId || box.woItemId === parseInt(woItemId)
      ) : [];
      const arrangedQuantity = currentWoItemBoxes.length;
      
      // Don't update totalQuantity state - it should remain as target quantity
      // setTotalQuantity(arrangedQuantity);
      
      console.log('Calculating arranged quantity for save:', {
        woItemId: woItemId,
        totalBoxes: boxes ? boxes.length : 0,
        currentWoItemBoxes: currentWoItemBoxes.length,
        arrangedQuantity: arrangedQuantity,
        saranId: saranId
      });
      
      // Get target quantity from WO item
      const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
      
      // Find existing WO item or add new one
      let existingWoItemIndex = totalQuantityData.findIndex(item => 
        item.WoItemID === woItemId || item.WoItemID === parseInt(woItemId)
      );
      
      if (existingWoItemIndex >= 0) {
        // Update existing WO item
        const woItemData = totalQuantityData[existingWoItemIndex];
        
        // Update target quantity
        woItemData.TargetQuantity = targetQuantity;
        
        // Find existing saran item or add new one
        const existingSaranIndex = woItemData.WOQuantity.findIndex(saranItem => 
          saranItem.ItemId === saranId || saranItem.ItemId === parseInt(saranId)
        );
        
        if (existingSaranIndex >= 0) {
          // Update existing saran item quantity
          woItemData.WOQuantity[existingSaranIndex].Quantity = arrangedQuantity;
        } else {
          // Add new saran item
          woItemData.WOQuantity.push({
            ItemId: saranId,
            Quantity: arrangedQuantity
          });
        }
      } else {
        // Add new WO item with saran item
        totalQuantityData.push({
          WoItemID: woItemId,
          TargetQuantity: targetQuantity,
          WOQuantity: [{
            ItemId: saranId,
            Quantity: arrangedQuantity
          }]
        });
      }
      
      localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
      
      // Handle saran item ID in used saran plats when canvas is saved
      if (isCurrentWorkOrder && saranId && saranId !== 'unknown') {
        if (arrangedQuantity > 0) {
          // Add saran item ID if there are boxes
          addSaranItemIdToUsedSaranPlats(saranId);
        } else {
          // Remove saran item ID if no boxes
          removeSaranItemIdFromUsedSaranPlats(saranId);
        }
      }
      
      const idStatus = isCurrentWorkOrder ? 'Current Work Order' : 'Different Work Order';
      showAlert('Success', `Canvas saved for ${itemName}!\n\nID Status: ${idStatus}\nStorage Key: ${storageKey}`, 'success');
      
      // Call onCanvasSaved callback if provided
      if (onCanvasSaved && workOrderData?.selectedItem) {
        onCanvasSaved(workOrderData.selectedItem);
      }
      
      // Close canvas and return to work order modal
      if (onClose) {
        onClose();
      }
    } catch (error) {
      showAlert('Error', 'Failed to save canvas.', 'error');
      console.error('LocalStorage save error:', error);
    }
  }, [generateSaveData, workOrderData, showAlert, onClose]);

  // Function to add saran item ID to used saran plats (simple format)
  const addSaranItemIdToUsedSaranPlats = useCallback((saranItemId) => {
    try {
      console.log('=== ADDING SARAN ITEM ID TO USED SARAN PLATS ===');
      console.log('Saran Item ID:', saranItemId);
      
      // Get current used saran plats array (simple format: ["1","2"])
      const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
      
      // Check if saran item ID already exists
      const saranId = saranItemId.toString();
      const alreadyExists = usedSaranPlats.includes(saranId) || usedSaranPlats.includes(parseInt(saranId));
      
      if (alreadyExists) {
        console.log('✅ Saran item ID already exists in used saran plats');
        return;
      }
      
      // Add new saran item ID
      usedSaranPlats.push(saranId);
      
      // Update localStorage
      localStorage.setItem('WO_used_saran_plats', JSON.stringify(usedSaranPlats));
      console.log('✅ Added saran item ID to used saran plats');
      console.log('📦 Total used saran plats:', usedSaranPlats.length);
      
      // Trigger custom event to notify other components
      window.dispatchEvent(new CustomEvent('usedSaranPlatsChanged'));
      
    } catch (error) {
      console.error('❌ Error adding saran item ID to used saran plats:', error);
    }
  }, []);

  // Function to remove saran item ID from used saran plats (simple format)
  const removeSaranItemIdFromUsedSaranPlats = useCallback((saranItemId) => {
    try {
      console.log('=== REMOVING SARAN ITEM ID FROM USED SARAN PLATS ===');
      console.log('Saran Item ID:', saranItemId);
      
      // Get current used saran plats array (simple format: ["1","2"])
      const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
      
      if (!Array.isArray(usedSaranPlats)) {
        console.log('❌ Used saran plats is not an array');
        return;
      }
      
      // Filter out saran item ID
      const saranId = saranItemId.toString();
      const filteredUsedSaranPlats = usedSaranPlats.filter(item => 
        item !== saranId && item !== parseInt(saranId)
      );
      
      console.log('📦 Original array length:', usedSaranPlats.length);
      console.log('📦 Filtered array length:', filteredUsedSaranPlats.length);
      
      // Update localStorage with filtered array
      localStorage.setItem('WO_used_saran_plats', JSON.stringify(filteredUsedSaranPlats));
      console.log('✅ Updated used saran plats array, removed saran item ID');
      
      // Trigger custom event to notify other components
      window.dispatchEvent(new CustomEvent('usedSaranPlatsChanged'));
      
    } catch (error) {
      console.error('❌ Error removing saran item ID from used saran plats:', error);
    }
  }, []);

  // Get used saran plats for this work order
  const getUsedSaranPlats = useCallback(() => {
    const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
    return usedSaranPlats;
  }, []);

  // Function removed - logic moved to saveCanvasLayout for better reliability

   

  // Check if saran plat is used
  const isSaranPlatUsed = useCallback((saranId) => {
    const usedSaranPlats = getUsedSaranPlats();
    return usedSaranPlats.includes(saranId);
  }, [getUsedSaranPlats]);

  // Load additional boxes from other WO items (without overwriting current boxes)
  const loadAdditionalBoxesFromOtherWOItems = useCallback(() => {
    const saranId = workOrderData?.selectedItem?.id || 'unknown';
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const currentWorkOrderId = workOrderData?.workOrderId;
    const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId;
    
    // Get all canvas layouts for this saran plat
    const keys = Object.keys(localStorage);
    const canvasKeys = keys.filter(key => key.startsWith(`WO_canvas_layout_${saranId}_`));
    
    console.log('Loading additional boxes from other WO items:', {
      saranId,
      currentWoItemId,
      currentWorkOrderId,
      currentWorkOrderUniqueId,
      canvasKeys
    });
    
    const additionalBoxes = [];
    
    canvasKeys.forEach(key => {
      try {
        const savedData = localStorage.getItem(key);
        if (savedData) {
          const data = JSON.parse(savedData);
          
          // Check if it's new format (canvas data only) or old format (with workOrderData)
          let boxes = [];
          
          if (data.version === "2.0" && !data.workOrderData) {
            // New format - canvas data only, data WO ada di box attributes
            boxes = data.boxes || [];
          } else if (data.canvasData && data.canvasData.boxes) {
            // Old format - with workOrderData wrapper
            boxes = data.canvasData.boxes;
          }
          
          if (boxes.length > 0) {
            boxes.forEach(box => {
              // Data WO sekarang ada di box attributes
              const boxWoItemId = box.woItemId || 'unknown';
              const workItemUniqueId = box.workItemUniqueId || 'unknown';
              const boxWorkOrderId = box.workOrderId || 'unknown';
              const boxSaranId = box.saranId || 'unknown';
              const isFromDifferentWO = boxWoItemId !== currentWoItemId;
              
              // Determine color based on workItemUniqueId comparison
              let boxColor = '#10b981'; // Default green
              if (box.isSave === true) {
                boxColor = '#ef4444'; // Red for saved boxes
              } else if (workItemUniqueId && workItemUniqueId !== '' && workItemUniqueId !== currentWorkOrderUniqueId) {
                boxColor = '#f59e0b'; // Yellow for different workOrderUniqueId
              }
              
              console.log('Additional box color decision:', {
                boxId: box.id,
                boxWoItemId: boxWoItemId,
                boxWorkOrderId: boxWorkOrderId,
                boxSaranId: boxSaranId,
                workItemUniqueId: workItemUniqueId,
                currentWorkOrderId: currentWorkOrderId,
                currentWorkOrderUniqueId: currentWorkOrderUniqueId,
                isSave: box.isSave,
                boxColor: boxColor,
                isSameWorkOrderUniqueId: workItemUniqueId === currentWorkOrderUniqueId
              });
              
              additionalBoxes.push({
                ...box,
                woItemId: boxWoItemId,
                workOrderId: boxWorkOrderId,
                saranId: boxSaranId,
                isSave: box.isSave || false,
                workItemUniqueId: workItemUniqueId,
                isDisabled: box.isDisabled !== undefined ? box.isDisabled : false,
                isFromDifferentWO: isFromDifferentWO,
                color: boxColor
              });
            });
          }
        }
      } catch (error) {
        console.error('Error loading additional canvas from key:', key, error);
      }
    });
    
    console.log('Loaded additional boxes:', {
      totalAdditionalBoxes: additionalBoxes.length,
      currentWoItemBoxes: additionalBoxes.filter(box => box.woItemId === currentWoItemId).length,
      otherWoItemBoxes: additionalBoxes.filter(box => box.woItemId !== currentWoItemId).length,
      allAdditionalBoxes: additionalBoxes.map(box => ({ 
        id: box.id, 
        woItemId: box.woItemId, 
        workOrderId: box.workOrderId,
        saranId: box.saranId,
        workItemUniqueId: box.workItemUniqueId,
        color: box.color,
        isFromDifferentWO: box.isFromDifferentWO 
      }))
    });
    
    // Merge with existing boxes (don't overwrite)
    setBoxes(prevBoxes => {
      const existingBoxIds = new Set(prevBoxes.map(box => box.id));
      const newBoxes = additionalBoxes.filter(box => !existingBoxIds.has(box.id));
      return [...prevBoxes, ...newBoxes];
    });
  }, [workOrderData]);

  // Load all boxes from all WO items for this saran plat
  const loadAllBoxesForSaranPlat = useCallback(() => {
    const saranId = workOrderData?.selectedItem?.id || 'unknown';
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const currentWorkOrderId = workOrderData?.workOrderId; // This is the current workOrderId
    const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId; // Get workOrderUniqueId from storage
    
    // Get all canvas layouts for this saran plat
    const allBoxes = [];
    const keys = Object.keys(localStorage);
    const canvasKeys = keys.filter(key => key.startsWith(`WO_canvas_layout_${saranId}_`));
    
    console.log('Loading all boxes for saran plat:', {
      saranId,
      currentWoItemId,
      currentWorkOrderId,
      currentWorkOrderUniqueId,
      canvasKeys
    });
    
    canvasKeys.forEach(key => {
      try {
        const savedData = localStorage.getItem(key);
        if (savedData) {
          const data = JSON.parse(savedData);
          
          // Check if it's new format (canvas data only) or old format (with workOrderData)
          let boxes = [];
          
          if (data.version === "2.0" && !data.workOrderData) {
            // New format - canvas data only, data WO ada di box attributes
            boxes = data.boxes || [];
          } else if (data.canvasData && data.canvasData.boxes) {
            // Old format - with workOrderData wrapper
            boxes = data.canvasData.boxes;
          }
          
          if (boxes.length > 0) {
            boxes.forEach(box => {
              // Data WO sekarang ada di box attributes
              const boxWoItemId = box.woItemId || 'unknown';
              const workItemUniqueId = box.workItemUniqueId || 'unknown';
              const boxWorkOrderId = box.workOrderId || 'unknown';
              const boxSaranId = box.saranId || 'unknown';
              const isFromDifferentWO = boxWoItemId !== currentWoItemId;
              
              // Determine color based on workItemUniqueId comparison
              let boxColor = '#10b981'; // Default green
              if (box.isSave === true) {
                boxColor = '#ef4444'; // Red for saved boxes
              } else if (workItemUniqueId && workItemUniqueId !== '' && workItemUniqueId !== currentWorkOrderUniqueId) {
                boxColor = '#f59e0b'; // Yellow for different workOrderUniqueId
              }
              
              console.log('Box color decision during load:', {
                boxId: box.id,
                boxWoItemId: boxWoItemId,
                boxWorkOrderId: boxWorkOrderId,
                boxSaranId: boxSaranId,
                workItemUniqueId: workItemUniqueId,
                currentWorkOrderId: currentWorkOrderId,
                currentWorkOrderUniqueId: currentWorkOrderUniqueId,
                isSave: box.isSave,
                boxColor: boxColor,
                isSameWorkOrderUniqueId: workItemUniqueId === currentWorkOrderUniqueId
              });
              
              allBoxes.push({
                ...box,
                woItemId: boxWoItemId,
                isSave: box.isSave || false, // Will be true when saving
                workItemUniqueId: workItemUniqueId, // Set workItemUniqueId from storage
                isDisabled: box.isDisabled !== undefined ? box.isDisabled : false, // Don't disable, let color logic handle it
                isFromDifferentWO: isFromDifferentWO,
                color: boxColor // Set color based on workItemUniqueId comparison
              });
            });
          }
        }
      } catch (error) {
        console.error('Error loading canvas from key:', key, error);
      }
    });
    
        console.log('Loaded all boxes:', {
          totalBoxes: allBoxes.length,
          currentWoItemBoxes: allBoxes.filter(box => box.woItemId === currentWoItemId).length,
          otherWoItemBoxes: allBoxes.filter(box => box.woItemId !== currentWoItemId).length,
          allBoxes: allBoxes.map(box => ({ 
            id: box.id, 
            woItemId: box.woItemId, 
            workOrderId: box.workOrderId,
            saranId: box.saranId,
            workItemUniqueId: box.workItemUniqueId,
            color: box.color,
            isFromDifferentWO: box.isFromDifferentWO 
          }))
        });
    
    setBoxes(allBoxes);
  }, [workOrderData]);

  // Load from localStorage
  const loadCanvasLayout = useCallback(() => {
    // Load base container and boxes from current WO item
    const workOrderId = workOrderData?.workOrderId || 'unknown';
    const saranId = workOrderData?.selectedItem?.id || 'unknown';
    const storageKey = `WO_canvas_layout_${saranId}_${workOrderId}`;
    
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Check if it's new format (canvas data only) or old format (with workOrderData)
        if (data.version === "2.0" && !data.workOrderData) {
          // New format - canvas data only
          setBaseContainer(data.baseContainer);
          if (data.gridSize) setGridSize(data.gridSize);
          if (data.zoom) setZoom(data.zoom);
          if (data.panOffset) setPanOffset(data.panOffset);
          
          // Load boxes from new format
          if (data.boxes && data.boxes.length > 0) {
            const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
            const currentWorkOrderId = workOrderData?.workOrderId;
            const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId;
            
            const processedBoxes = data.boxes.map(box => {
              const boxWoItemId = box.woItemId || 'unknown';
              const workItemUniqueId = box.workItemUniqueId || 'unknown';
              const isFromDifferentWO = boxWoItemId !== currentWoItemId;
              
              // Determine color based on workItemUniqueId comparison
              let boxColor = '#10b981'; // Default green
              if (box.isSave === true) {
                boxColor = '#ef4444'; // Red for saved boxes
              } else if (workItemUniqueId && workItemUniqueId !== '' && workItemUniqueId !== currentWorkOrderUniqueId) {
                boxColor = '#f59e0b'; // Yellow for different workOrderUniqueId
              }
              
              return {
                ...box,
                woItemId: boxWoItemId,
                isSave: box.isSave || false,
                workItemUniqueId: workItemUniqueId,
                isDisabled: box.isDisabled !== undefined ? box.isDisabled : false,
                isFromDifferentWO: isFromDifferentWO,
                color: boxColor
              };
            });
            
            setBoxes(processedBoxes);
            console.log('Loaded boxes from new format:', {
              totalBoxes: processedBoxes.length,
              currentWoItemBoxes: processedBoxes.filter(box => box.woItemId === currentWoItemId).length,
              otherWoItemBoxes: processedBoxes.filter(box => box.woItemId !== currentWoItemId).length
            });
          }
          
          console.log('Loaded canvas from new format:', {
            totalBoxes: data.boxes?.length || 0,
            containerSize: data.metadata?.containerSize
          });
        } else if (data.canvasData) {
          // Old format - with workOrderData wrapper
          setBaseContainer(data.canvasData.baseContainer);
          if (data.canvasData.gridSize) setGridSize(data.canvasData.gridSize);
          if (data.canvasData.zoom) setZoom(data.canvasData.zoom);
          if (data.canvasData.panOffset) setPanOffset(data.canvasData.panOffset);
          
          console.log('Loaded canvas from old format:', {
            totalBoxes: data.canvasData.boxes?.length || 0,
            containerSize: data.canvasData.baseContainer
          });
        }
        
        // Load additional boxes from other WO items (but don't overwrite current ones)
        loadAdditionalBoxesFromOtherWOItems();
        
        showAlert('Success', `Canvas loaded with all WO items!`, 'success');
      } else {
        // If no saved layout found, still load all boxes from all WO items
        loadAllBoxesForSaranPlat();
        showAlert('Info', 'No saved layout found for this work order item.', 'info');
      }
    } catch (error) {
      showAlert('Error', 'Failed to load canvas.', 'error');
      console.error('LocalStorage load error:', error);
    }
  }, [workOrderData, showAlert, loadAllBoxesForSaranPlat, loadAdditionalBoxesFromOtherWOItems]);


  // Get JSON data for API submission (ready to send to server)
  const getCanvasDataForAPI = useCallback(() => {
    return generateSaveData();
  }, [generateSaveData]);

  // Expose function to parent component for API submission
  React.useImperativeHandle(ref, () => ({
    getCanvasDataForAPI,
    getUsedSaranPlats,
    isSaranPlatUsed
  }));


  const importFromJSON = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      
      // Check if it's new format (v2.0) or legacy format (v1.0)
      if (data.version === "2.0" && data.canvasData) {
        // New format with work order data
        const canvasData = data.canvasData;
        
        // Validate data structure
        if (!canvasData.baseContainer || !canvasData.boxes || !Array.isArray(canvasData.boxes)) {
          throw new Error('Invalid canvas data format');
        }
        
        // Update work order data if available
        if (data.workOrderData) {
          setWorkOrderData(data.workOrderData);
        }
        
        // Update canvas state
        setBaseContainer(canvasData.baseContainer);
        const boxesWithDefaults = canvasData.boxes.map(box => ({
          ...box,
          isDisabled: box.isDisabled !== undefined ? box.isDisabled : true, // Default: boxes from cache are disabled
          woItemId: box.woItemId || workOrderData?.workOrderItem?.id || workOrderData?.itemId || 'unknown'
        }));
        setBoxes(boxesWithDefaults);
        if (canvasData.gridSize) setGridSize(canvasData.gridSize);
        if (canvasData.zoom) setZoom(canvasData.zoom);
        if (canvasData.panOffset) setPanOffset(canvasData.panOffset);
        
        showAlert('Success', `Canvas layout imported successfully! Loaded ${canvasData.boxes.length} boxes.`, 'success');
      } else {
        // Legacy format (v1.0) - backward compatibility
        if (!data.baseContainer || !data.boxes || !Array.isArray(data.boxes)) {
          throw new Error('Invalid data format');
        }
        
        // Update state with imported data
        setBaseContainer(data.baseContainer);
        const boxesWithDefaults = data.boxes.map(box => ({
          ...box,
          isDisabled: box.isDisabled !== undefined ? box.isDisabled : true, // Default: boxes from cache are disabled
          woItemId: box.woItemId || workOrderData?.workOrderItem?.id || workOrderData?.itemId || 'unknown'
        }));
        setBoxes(boxesWithDefaults);
        if (data.gridSize) setGridSize(data.gridSize);
        if (data.zoom) setZoom(data.zoom);
        if (data.panOffset) setPanOffset(data.panOffset);
        
        showAlert('Success', `Legacy layout imported successfully! Loaded ${data.boxes.length} boxes.`, 'success');
      }
    } catch (error) {
      showAlert('Error', 'Failed to import layout. Please check the file format.', 'error');
      console.error('Import error:', error);
    }
  }, [showAlert]);



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
    
    // Check if any selected box belongs to different WO item
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const selectedBoxes = boxes.filter(box => selectedBoxIds.has(box.id));
    const invalidBoxes = selectedBoxes.filter(box => {
      const boxWoItemId = box.woItemId;
      return (boxWoItemId && currentWoItemId && currentWoItemId !== boxWoItemId) ||
             (currentWoItemId && !boxWoItemId);
    });
    
    if (invalidBoxes.length > 0) {
      showAlert('Error', 'Cannot delete boxes from different Work Order items or previous sessions', 'error');
      return;
    }
    
    const deletedCount = selectedBoxIds.size;
    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.filter(box => !selectedBoxIds.has(box.id));
      // Calculate remaining quantity correctly (only for current WO item)
      const currentWoItemBoxes = updatedBoxes.filter(box => 
        box.woItemId === currentWoItemId || !box.woItemId
      );
      const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
      const totalBoxes = currentWoItemBoxes.length;
      const newRemaining = Math.max(0, targetQuantity - totalBoxes);
      return updatedBoxes;
    });
    setSelectedBoxIds(new Set());
    showAlert('Success', `Deleted ${deletedCount} box(es)`, 'success');
  }, [selectedBoxIds, totalQuantity, showAlert, boxes, workOrderData?.workOrderItem?.id, workOrderData?.itemId]);

  const selectAllBoxes = useCallback(() => {
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const currentWoItemBoxes = boxes ? boxes.filter(box => 
      box.woItemId === currentWoItemId || !box.woItemId
    ) : [];
    const currentWoItemBoxIds = new Set(currentWoItemBoxes.map(box => box.id));
    setSelectedBoxIds(currentWoItemBoxIds);
    
    if (currentWoItemBoxes.length === 0) {
      showAlert('Info', 'No boxes available for current Work Order item', 'info');
    } else {
      showAlert('Success', `Selected ${currentWoItemBoxes.length} box(es) from current Work Order item`, 'success');
    }
  }, [boxes, workOrderData?.workOrderItem?.id, workOrderData?.itemId, showAlert]);

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
  
  // Update remainingQuantity when totalQuantity changes and no boxes exist

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
    // Canvas panning controls (always active when canvas exists)
    if (canvasRef.current) {
      const panSpeed = 20; // pixels per key press
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          console.log('Arrow Left pressed - panning left');
          setPanOffset(prev => ({ ...prev, x: prev.x + panSpeed }));
          return;
        case 'ArrowRight':
          e.preventDefault();
          console.log('Arrow Right pressed - panning right');
          setPanOffset(prev => ({ ...prev, x: prev.x - panSpeed }));
          return;
        case 'ArrowUp':
          e.preventDefault();
          console.log('Arrow Up pressed - panning up');
          setPanOffset(prev => ({ ...prev, y: prev.y + panSpeed }));
          return;
        case 'ArrowDown':
          e.preventDefault();
          console.log('Arrow Down pressed - panning down');
          setPanOffset(prev => ({ ...prev, y: prev.y - panSpeed }));
          return;
        case 'Home':
          e.preventDefault();
          console.log('Home pressed - reset position');
          setPanOffset({ x: 0, y: 0 });
          return;
        case 'End':
          e.preventDefault();
          console.log('End pressed - reset zoom');
          resetZoom();
          return;
      }
    }
    
    // General keyboard shortcuts
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
  }, [selectedBoxIds, deleteSelectedBoxes, selectAllBoxes, resetZoom]);

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
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
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleMouseMovePan, handleMouseUpPan, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown, handleRightClick]);
  
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
          <div className="w-80 bg-gray-50 border-r h-full flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-white border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 px-3 py-2 text-xs font-medium ${
                    activeTab === 'stats'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📊 Stats
                </button>
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`flex-1 px-3 py-2 text-xs font-medium ${
                    activeTab === 'actions'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ⚡ Actions
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="p-3 space-y-3">
                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <>
                    {/* Save & Back to Modal Buttons */}
                    <div className="bg-white rounded-lg p-2 border">
                      <Button
                        onClick={saveCanvasLayout}
                        className="w-full h-10 text-sm bg-blue-600 hover:bg-blue-700 font-medium mb-2"
                      >
                        💾 Save
                      </Button>
                      <Button
                        onClick={onClose}
                        className="w-full h-10 text-sm bg-gray-600 hover:bg-gray-700"
                      >
                        ← Back to Modal
                      </Button>
                    </div>

                    {/* Grid Statistics */}
                    <div className="bg-white rounded-lg p-2 border">
                      <h3 className="text-sm font-medium mb-2">Grid Statistics</h3>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Total Boxes:</span> {(() => {
                            const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
                            
                            // Count actual boxes in canvas for current work item
                            const currentWoItemBoxes = boxes ? boxes.filter(box => 
                              box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
                            ) : [];
                            const actualBoxCount = currentWoItemBoxes.length;
                            
                            // Get target quantity from workOrderData
                            const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
                            
                            console.log('Total Boxes Display:', {
                              currentWoItemId,
                              actualBoxCount: actualBoxCount,
                              targetQuantity,
                              totalBoxesInCanvas: boxes ? boxes.length : 0
                            });
                            return `${actualBoxCount}/${targetQuantity}`;
                          })()}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Progress:</span> {(() => {
                            const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
                            const currentWoItemBoxes = boxes ? boxes.filter(box => 
                              box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
                            ) : [];
                            const currentQuantity = currentWoItemBoxes.length;
                            
                            // Calculate total used quantity across all saran plats for this WO item
                            const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
                            const woItemData = totalQuantityData.find(item => 
                              item.WoItemID === currentWoItemId || item.WoItemID === parseInt(currentWoItemId)
                            );
                            
                            let totalUsedQuantity = 0;
                            if (woItemData && woItemData.WOQuantity && Array.isArray(woItemData.WOQuantity)) {
                              totalUsedQuantity = woItemData.WOQuantity.reduce((total, saranItem) => {
                                return total + (parseInt(saranItem.Quantity) || 0);
                              }, 0);
                            }
                            
                            const targetQuantity = woItemData?.TargetQuantity || parseInt(workOrderData?.itemQty) || 0;
                            return targetQuantity > 0 ? Math.round((totalUsedQuantity / targetQuantity) * 100) : 0;
                          })()}%
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Container:</span> {baseContainer.width}×{baseContainer.height}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Luas:</span> {(() => {
                            const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
                            const currentWoItemBoxes = boxes ? boxes.filter(box => 
                              box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
                            ) : [];
                            
                            const totalArea = currentWoItemBoxes.reduce((total, box) => {
                              return total + (box.width * box.height);
                            }, 0);
                            
                            return `${totalArea} px²`;
                          })()}
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


                    {/* Base Container Info */}
                    <div className="bg-white rounded-lg p-2 border">
                      <h3 className="text-sm font-medium mb-2">Base Container</h3>
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

                    {/* Box Size Info */}
                    <div className="bg-white rounded-lg p-2 border">
                      <h3 className="text-sm font-medium mb-2">Box Size</h3>
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
                  </>
                )}

                {/* Actions Tab */}
                {activeTab === 'actions' && (
                  <>
                    {/* Box Actions */}
                    <div className="bg-white rounded-lg p-2 border">
                      <h3 className="text-sm font-medium mb-2">Box Actions</h3>
                      <div className="space-y-2">
                        <Button
                          onClick={fillAllBoxes}
                          className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          Fill All
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

                    {/* Zoom Controls */}
                    <div className="bg-white rounded-lg p-2 border">
                      <h3 className="text-sm font-medium mb-2">Zoom Controls</h3>
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

                  </>
                )}

                {/* Tools Tab */}
                {activeTab === 'tools' && (
                  <>
                    {/* Zoom Controls */}
                    <div className="bg-white rounded-lg p-2 border">
                      <h3 className="text-sm font-medium mb-2">Zoom Controls</h3>
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

                    {/* Keyboard Controls Info */}
                    <div className="bg-white rounded-lg p-2 border">
                      <h3 className="text-sm font-medium mb-2">Keyboard Controls</h3>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>• <span className="font-medium">Arrow Keys:</span> Pan canvas</div>
                        <div>• <span className="font-medium">Home:</span> Reset position</div>
                        <div>• <span className="font-medium">End:</span> Reset zoom</div>
                        <div>• <span className="font-medium">Delete:</span> Delete selected</div>
                        <div>• <span className="font-medium">Ctrl+A:</span> Select all</div>
                        <div>• <span className="font-medium">Escape:</span> Deselect all</div>
                        <div className="text-xs text-blue-600 mt-1">
                          💡 Arrow keys work anywhere on the page
                        </div>
                      </div>
                    </div>

                  </>
                )}
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
              tabIndex={0}
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
});

PlatShaftCanvasPage.displayName = 'PlatShaftCanvasPage';

export default PlatShaftCanvasPage;
