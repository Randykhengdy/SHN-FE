import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAlert } from '@/hooks/useAlert';
import { request } from '@/lib/request';
import { Camera, Image, ArrowLeft } from 'lucide-react';

const PlatShaftCanvasPage = React.forwardRef(({ hideTitle = false, onClose, onCanvasSaved }, ref) => {
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  
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
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Function to update WO_total_quantity in localStorage
  const updateWOQuantity = useCallback((woItemId, saranItemId, quantity) => {
    const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
    
    // Find or create WO item
    let woItemData = totalQuantityData.find(item => 
      item.WoItemID === woItemId || item.WoItemID === parseInt(woItemId)
    );
    
    if (!woItemData) {
      woItemData = {
        WoItemID: woItemId,
        TargetQuantity: parseInt(workOrderData?.itemQty) || 0,
        WOQuantity: []
      };
      totalQuantityData.push(woItemData);
    }
    
    // Find or create saran item
    let saranItem = woItemData.WOQuantity.find(item => 
      item.ItemId === saranItemId || item.ItemId === parseInt(saranItemId)
    );
    
    if (!saranItem) {
      saranItem = {
        ItemId: saranItemId,
        Quantity: 0
      };
      woItemData.WOQuantity.push(saranItem);
    }
    
    // Update quantity
    saranItem.Quantity = quantity;
    
    // Validate total quantity doesn't exceed TargetQuantity (only for current WO item)
    const totalUsedQuantity = woItemData.WOQuantity.reduce((total, item) => total + (parseInt(item.Quantity) || 0), 0);
    const targetQuantity = woItemData.TargetQuantity || 0;
    
    if (totalUsedQuantity > targetQuantity) {
      console.warn(`Total quantity (${totalUsedQuantity}) exceeds TargetQuantity (${targetQuantity}) for WO Item ${woItemId}. Adjusting...`);
      
      // Adjust current saran item quantity to fit within target
      const otherQuantity = woItemData.WOQuantity
        .filter(item => item.ItemId !== saranItemId && item.ItemId !== parseInt(saranItemId))
        .reduce((total, item) => total + (parseInt(item.Quantity) || 0), 0);
      
      const maxAllowedQuantity = Math.max(0, targetQuantity - otherQuantity);
      saranItem.Quantity = Math.min(quantity, maxAllowedQuantity);
      
      console.log(`Adjusted quantity to ${saranItem.Quantity} (max allowed: ${maxAllowedQuantity}) for saran item ${saranItemId}`);
    }
    
    // Remove saran items with 0 quantity
    woItemData.WOQuantity = woItemData.WOQuantity.filter(item => item.Quantity > 0);
    
    // Save back to localStorage
    localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
    
    // Force UI re-render to update Quantity Remaining
    setForceUpdate(prev => prev + 1);
    
    console.log('Updated WO_total_quantity:', {
      woItemId,
      saranItemId,
      quantity,
      totalQuantityData
    });
  }, [workOrderData?.itemQty]);

  // Function to update TargetQuantity in WO_total_quantity
  const updateTargetQuantity = useCallback((woItemId, targetQuantity) => {
    const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
    
    // Find existing WO item
    let woItemData = totalQuantityData.find(item => 
      item.WoItemID === woItemId || item.WoItemID === parseInt(woItemId)
    );
    
    if (woItemData) {
      // Update existing WO item target quantity
      woItemData.TargetQuantity = parseInt(targetQuantity) || 0;
      
      // Save back to localStorage
      localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
      
      // Force UI re-render to update Quantity Remaining
      setForceUpdate(prev => prev + 1);
      
      console.log('Updated TargetQuantity in WO_total_quantity:', {
        woItemId,
        targetQuantity,
        woItemData
      });
    } else {
      console.log('WO item not found in WO_total_quantity, creating new entry:', {
        woItemId,
        targetQuantity
      });
      
      // Create new WO item if not exists
      const newWoItem = {
        WoItemID: woItemId,
        TargetQuantity: parseInt(targetQuantity) || 0,
        WOQuantity: []
      };
      
      totalQuantityData.push(newWoItem);
      localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
      
      // Force UI re-render
      setForceUpdate(prev => prev + 1);
    }
  }, []);

  // Function to remove WO item from WO_total_quantity
  const removeWOItem = useCallback((woItemId) => {
    const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
    
    // Filter out the WO item
    const filteredData = totalQuantityData.filter(item => 
      item.WoItemID !== woItemId && item.WoItemID !== parseInt(woItemId)
    );
    
    // Save back to localStorage
    localStorage.setItem('WO_total_quantity', JSON.stringify(filteredData));
    
    // Force UI re-render to update Quantity Remaining
    setForceUpdate(prev => prev + 1);
    
    console.log('Removed WO item from WO_total_quantity:', {
      woItemId,
      remainingItems: filteredData.length
    });
  }, []);
  
  // Sync target quantity when workOrderData changes
  useEffect(() => {
    if (workOrderData?.workOrderItem?.id || workOrderData?.itemId) {
      const woItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
      const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
      
      // Always update target quantity (even if 0, to sync with workOrderData)
      updateTargetQuantity(woItemId, targetQuantity);
      
      console.log('Syncing target quantity from workOrderData:', {
        woItemId,
        targetQuantity,
        workOrderData: workOrderData
      });
    }
  }, [workOrderData?.workOrderItem?.id, workOrderData?.itemId, workOrderData?.itemQty, updateTargetQuantity]);

  // Sidebar toggle state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  
  // JPG generation state
  const [isGeneratingJPG, setIsGeneratingJPG] = useState(false);
  const [jpgProgress, setJpgProgress] = useState(0);
  const [jpgStatus, setJpgStatus] = useState('');
  const [usePNG, setUsePNG] = useState(false); // Option to use PNG for smaller files
  
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
  const [panOffset, setPanOffset] = useState({ x: 20, y: 20 });
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
  
  // Load canvas data from API (for loading data only, not saving)
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
        console.log('Selected item data:', data.selectedItem);
        console.log('Work order item data:', data.workOrderItem);
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
        const platWidth = data.selectedItem?.platPanjang || data.platPanjang ;
        const platHeight = data.selectedItem?.platLebar || data.platLebar || data.platPanjang/10;
        setBaseContainer(prev => ({
          ...prev,
          width: platWidth,
          height: platHeight
        }));
        
        // Update box size (Work Order Item)
        const itemWidth = data.workOrderItem?.width || data.itemPanjang;
        const itemHeight = data.workOrderItem?.height || data.itemLebar || data.platPanjang/10;
        setNewBoxSize({
          width: itemWidth,
          height: itemHeight
        });
        
        // Sync quantity tracking - totalQuantity should be the number of boxes in canvas
        const totalQty = data.itemQty || 0;
        setTotalQuantity(0); // Start with 0, will be updated when boxes are added
        
        // Check if there's cached data for this work order item
        const workOrderUniqueId = localStorage.getItem('WO_current_work_order_id') || 'unknown';
        const saranId = data.selectedItem?.id || 'unknown';
        const cacheKey = `WO_canvas_layout_${saranId}_${workOrderUniqueId}`;
        
        // Check if current work order ID matches stored ID
        const storedWorkOrderId = localStorage.getItem('WO_current_work_order_id');
        const isCurrentWorkOrder = storedWorkOrderId === workOrderUniqueId;
        
        console.log('Work Order ID Comparison:', {
          current: workOrderUniqueId,
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
                // const workItemUniqueId = box.workItemUniqueId || 'unknown';
                const isFromDifferentWO = boxWoItemId !== currentWoItemId;
                
              // Determine color based on woItemId array check (simpler) - memoized to avoid repeated parsing
              
              
              let boxColor = '#10b981'; // Default green
              if (box.isSave === true) {
                boxColor = '#ef4444'; // Red for saved boxes
              } else if (boxWoItemId && boxWoItemId !== currentWoItemId && boxWoItemId !== parseInt(currentWoItemId)) {
                boxColor = '#f59e0b'; // Yellow for different WO item
              } else {
                console.log('🟢 Box set to GREEN - in current WO items');
              }
                
                return {
                  ...box,
                  woItemId: boxWoItemId,
                  isSave: box.isSave || false,
                  // workItemUniqueId: workItemUniqueId,
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

  // Sync totalQuantity with WO_total_quantity data (shared quantity across canvases)
  useEffect(() => {
    if (workOrderData?.itemQty) {
      const targetQuantity = parseInt(workOrderData.itemQty) || 0;
      const woItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
      
      // Read from WO_total_quantity to get shared quantity data
      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
      let woItemData = totalQuantityData.find(item => 
        item.WoItemID === woItemId || item.WoItemID === parseInt(woItemId)
      );
      
      // If WO item doesn't exist, create it with PreviousQuantity
      if (!woItemData) {
        woItemData = {
          WoItemID: woItemId,
          TargetQuantity: targetQuantity,
          PreviousQuantity: 0,
          WOQuantity: []
        };
        totalQuantityData.push(woItemData);
        localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
      }
      
      // Save PreviousQuantity for rollback (current saran plat only)
      const currentSaranId = workOrderData?.selectedItem?.id;
      if (currentSaranId) {
        const currentSaranItem = woItemData.WOQuantity.find(item => 
          item.ItemId === currentSaranId || item.ItemId === parseInt(currentSaranId)
        );
        woItemData.PreviousQuantity = currentSaranItem ? (parseInt(currentSaranItem.Quantity) || 0) : 0;
        localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
        console.log('Saved PreviousQuantity (current saran plat):', woItemData.PreviousQuantity);
      }
      
      // Calculate total used quantity across all saran plats for this WO item
      let totalUsedQuantity = 0;
      if (woItemData && woItemData.WOQuantity && Array.isArray(woItemData.WOQuantity)) {
        totalUsedQuantity = woItemData.WOQuantity.reduce((total, saranItem) => {
          return total + (parseInt(saranItem.Quantity) || 0);
        }, 0);
      }
      
      // Set totalQuantity to remaining quantity (target - used from other saran plats)
      const remainingQuantity = Math.max(0, targetQuantity - totalUsedQuantity);
      setTotalQuantity(remainingQuantity);
      
      console.log('Updated totalQuantity from WO_total_quantity:', {
        woItemId,
        targetQuantity,
        totalUsedQuantity,
        remainingQuantity,
        woItemData,
        totalQuantityData,
        explanation: `Target: ${targetQuantity}, Used: ${totalUsedQuantity}, Remaining: ${remainingQuantity}`
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
    
    // Handle rotation - swap width and height if rotated
    const isRotated = box.isRotated || false;
    const boxWidth = isRotated ? box.height : box.width;
    const boxHeight = isRotated ? box.width : box.height;
    
    const x = box.x * gridSize * zoom;
    const y = box.y * gridSize * zoom;
    const width = boxWidth * gridSize * zoom;
    const height = boxHeight * gridSize * zoom;
    
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
        // workItemUniqueId: box.workItemUniqueId
      });
    } else if (box.color && box.color !== '#10b981') {
      // Use box color if it's explicitly set (for loaded boxes)
      ctx.fillStyle = box.color;
      console.log('Box color: USING BOX COLOR', { 
        boxId: box.id, 
        color: box.color
      });
    } else {
      // Determine color based on woItemId comparison (simple logic)
      const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
      const boxWoItemId = box.woItemId;
      
      if (!boxWoItemId || boxWoItemId === currentWoItemId || boxWoItemId === parseInt(currentWoItemId)) {
        // Green for boxes from current WO item or no woItemId
        ctx.fillStyle = '#10b981';
      } else {
        // Yellow for boxes from different WO item
        ctx.fillStyle = '#f59e0b';
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
    
    // Draw rotation indicator
    if (isRotated) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = `${Math.max(8, Math.min(width, height) * 0.2)}px Arial`;
      ctx.fillText('↻', x + 4, y + height - 4);
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
    
    // Set up clipping area for container border
    ctx.save();
    
    // Calculate container bounds in pixel coordinates
    const containerPixelX = (baseContainer.x * gridSize * zoom) + panOffset.x;
    const containerPixelY = (baseContainer.y * gridSize * zoom) + panOffset.y;
    const containerPixelWidth = baseContainer.width * gridSize * zoom;
    const containerPixelHeight = baseContainer.height * gridSize * zoom;
    
    // Create clipping path for container area
    ctx.beginPath();
    ctx.rect(containerPixelX, containerPixelY, containerPixelWidth, containerPixelHeight);
    ctx.clip();
    
    // Draw grid only within container bounds
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
    
    // Restore clipping area
    ctx.restore();
    
    // Draw container border outline (outside clipping area)
    ctx.save();
    ctx.strokeStyle = isDraggingContainer ? '#3b82f6' : '#9ca3af';
    ctx.lineWidth = isDraggingContainer ? 4 : 3;
    ctx.setLineDash(isDraggingContainer ? [8, 4] : []);
    ctx.strokeRect(containerPixelX, containerPixelY, containerPixelWidth, containerPixelHeight);
    ctx.setLineDash([]);
    
    // Draw container label
    ctx.fillStyle = isDraggingContainer ? '#1d4ed8' : '#6b7280';
    ctx.font = `bold ${12 * zoom}px Arial`;
    ctx.fillText(`Base: ${baseContainer.width}×${baseContainer.height}`, containerPixelX + 5, containerPixelY - 5);
    ctx.restore();
  }, [boxes, drawGrid, drawBaseContainer, drawBox, isDragging, draggedBoxId, previewPosition, hasCollision, baseContainer, gridSize, zoom, panOffset, isDraggingContainer]);
  
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
    
    // Handle rotation - use actual dimensions
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
    // Get actual dimensions for dragged box (considering rotation)
    const draggedBoxWidth = draggedBox.isRotated ? draggedBox.height : draggedBox.width;
    const draggedBoxHeight = draggedBox.isRotated ? draggedBox.width : draggedBox.height;
    
    const clampedX = Math.max(baseContainer.x, 
      Math.min(newX, baseContainer.x + baseContainer.width - draggedBoxWidth));
    const clampedY = Math.max(baseContainer.y, 
      Math.min(newY, baseContainer.y + baseContainer.height - draggedBoxHeight));
    
    // Check for collisions with other boxes (handle rotation)
    const hasCollision = boxes && boxes.length > 0 ? boxes.some(box => {
      if (box.id === draggedBoxId) return false;
      
      // Get actual dimensions for both boxes (considering rotation)
      const draggedBoxWidth = draggedBox.isRotated ? draggedBox.height : draggedBox.width;
      const draggedBoxHeight = draggedBox.isRotated ? draggedBox.width : draggedBox.height;
      const otherBoxWidth = box.isRotated ? box.height : box.width;
      const otherBoxHeight = box.isRotated ? box.width : box.height;
      
      return !(clampedX >= box.x + otherBoxWidth || 
               clampedX + draggedBoxWidth <= box.x || 
               clampedY >= box.y + otherBoxHeight || 
               clampedY + draggedBoxHeight <= box.y);
    }) : false;
    
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

  // Double-click handler for rotating boxes
  const rotateBoxById = useCallback((boxId) => {
    const target = boxes && boxes.length > 0 ? boxes.find(b => b.id === boxId) : null;
    if (!target) return;
    if (target.isDisabled) {
      showAlert('Info', 'This box is disabled and cannot be rotated', 'info');
      return;
    }
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const boxWoItemId = target.woItemId;
    if (boxWoItemId && currentWoItemId && currentWoItemId !== boxWoItemId) {
      showAlert('Info', `This box belongs to a different Work Order item (ID: ${boxWoItemId}). You cannot rotate it.`, 'info');
      return;
    }
    setBoxes(prevBoxes => {
      return prevBoxes.map(box => {
        if (box.id !== boxId) return box;
        const newBox = { ...box, isRotated: !box.isRotated };
        const rotatedWidth = newBox.isRotated ? box.height : box.width;
        const rotatedHeight = newBox.isRotated ? box.width : box.height;
        const inside = (x, y, w, h) => (
          x >= baseContainer.x && y >= baseContainer.y &&
          x + w <= baseContainer.x + baseContainer.width &&
          y + h <= baseContainer.y + baseContainer.height
        );
        const collide = (x, y, w, h) => {
          return prevBoxes.some(otherBox => {
            if (otherBox.id === boxId) return false;
            const ow = otherBox.isRotated ? otherBox.height : otherBox.width;
            const oh = otherBox.isRotated ? otherBox.width : otherBox.height;
            return !(x >= otherBox.x + ow || x + w <= otherBox.x || y >= otherBox.y + oh || y + h <= otherBox.y);
          });
        };
        const cluster = prevBoxes.filter(b => (b.id !== boxId) && (b.woItemId === currentWoItemId || b.woItemId === parseInt(currentWoItemId)));
        const centroid = cluster.length > 0 ? {
          x: Math.round(cluster.reduce((s, b) => s + (b.x + (b.isRotated ? b.height : b.width) / 2), 0) / cluster.length),
          y: Math.round(cluster.reduce((s, b) => s + (b.y + (b.isRotated ? b.width : b.height) / 2), 0) / cluster.length)
        } : { x: baseContainer.x, y: baseContainer.y };
        if (box.x + rotatedWidth > baseContainer.width || box.y + rotatedHeight > baseContainer.height) {
          const order = ['below', 'right', 'left', 'above'];
          let chosen = null;
          for (const side of order) {
            for (const b of cluster) {
              const bw = b.isRotated ? b.height : b.width;
              const bh = b.isRotated ? b.width : b.height;
              if (side === 'below') {
                const y = b.y + bh;
                for (let x = b.x; x <= b.x + bw - rotatedWidth; x += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              } else if (side === 'right') {
                const x = b.x + bw;
                for (let y = b.y; y <= b.y + bh - rotatedHeight; y += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              } else if (side === 'left') {
                const x = b.x - rotatedWidth;
                for (let y = b.y; y <= b.y + bh - rotatedHeight; y += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              } else if (side === 'above') {
                const y = b.y - rotatedHeight;
                for (let x = b.x; x <= b.x + bw - rotatedWidth; x += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              }
            }
            if (chosen && chosen.side === 'below') break;
          }
          if (!chosen) {
            for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - rotatedHeight && !chosen; y++) {
              for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - rotatedWidth && !chosen; x++) {
                if (inside(x, y, rotatedWidth, rotatedHeight) && !collide(x, y, rotatedWidth, rotatedHeight)) {
                  chosen = { x, y, dist: 0, side: 'scan' };
                }
              }
            }
          }
          if (chosen) {
            showAlert('Info', 'Rotated and auto-placed to available space', 'info');
            return { ...newBox, x: chosen.x, y: chosen.y };
          }
          showAlert('Warning', `Rotated box (${rotatedWidth}×${rotatedHeight}) would exceed container bounds!`, 'warning');
          return box;
        }
        const hasCollision = prevBoxes.some(otherBox => {
          if (otherBox.id === boxId) return false;
          const otherBoxWidth = otherBox.isRotated ? otherBox.height : otherBox.width;
          const otherBoxHeight = otherBox.isRotated ? otherBox.width : otherBox.height;
          return !(box.x >= otherBox.x + otherBoxWidth || box.x + rotatedWidth <= otherBox.x || box.y >= otherBox.y + otherBoxHeight || box.y + rotatedHeight <= otherBox.y);
        });
        if (hasCollision) {
          const order = ['below', 'right', 'left', 'above'];
          let chosen = null;
          for (const side of order) {
            for (const b of cluster) {
              const bw = b.isRotated ? b.height : b.width;
              const bh = b.isRotated ? b.width : b.height;
              if (side === 'below') {
                const y = b.y + bh;
                for (let x = b.x; x <= b.x + bw - rotatedWidth; x += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              } else if (side === 'right') {
                const x = b.x + bw;
                for (let y = b.y; y <= b.y + bh - rotatedHeight; y += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              } else if (side === 'left') {
                const x = b.x - rotatedWidth;
                for (let y = b.y; y <= b.y + bh - rotatedHeight; y += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              } else if (side === 'above') {
                const y = b.y - rotatedHeight;
                for (let x = b.x; x <= b.x + bw - rotatedWidth; x += 1) {
                  if (!inside(x, y, rotatedWidth, rotatedHeight) || collide(x, y, rotatedWidth, rotatedHeight)) continue;
                  const d = Math.abs((x + rotatedWidth / 2) - centroid.x) + Math.abs((y + rotatedHeight / 2) - centroid.y);
                  if (!chosen || d < chosen.dist) chosen = { x, y, dist: d, side };
                }
              }
            }
            if (chosen && chosen.side === 'below') break;
          }
          if (!chosen) {
            for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - rotatedHeight && !chosen; y++) {
              for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - rotatedWidth && !chosen; x++) {
                if (inside(x, y, rotatedWidth, rotatedHeight) && !collide(x, y, rotatedWidth, rotatedHeight)) {
                  chosen = { x, y, dist: 0, side: 'scan' };
                }
              }
            }
          }
          if (chosen) {
            showAlert('Info', 'Rotated and auto-placed to available space', 'info');
            return { ...newBox, x: chosen.x, y: chosen.y };
          }
          showAlert('Warning', 'Rotated box would collide and no alternative position found!', 'warning');
          return box;
        }
        return newBox;
      });
    });
  }, [boxes, showAlert, workOrderData, baseContainer]);
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const mousePos = getMousePos(e);
    const clickedBox = boxes && boxes.length > 0 ? boxes.find(box => {
      return isMouseOverBox(mousePos, box);
    }) : null;
    
    if (clickedBox) rotateBoxById(clickedBox.id);
  }, [boxes, getMousePos, isMouseOverBox, showAlert, workOrderData, baseContainer]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const mousePos = getMousePos(e);
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.01, Math.min(3, zoom + delta)); // Minimum 1% (0.01x)
    
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
    
    // Get remaining quantity from WO_total_quantity (shared across canvases)
    const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
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
    
    // Calculate remaining quantity: target - used (from other saran plats)
    const remainingQuantity = Math.max(0, targetQuantity - totalUsedQuantity);
    
    console.log('AddBox - Validation using Quantity Remaining:', {
      currentWoItemId,
      currentQuantity,
      targetQuantity,
      totalUsedQuantity,
      remainingQuantity,
      workOrderData: workOrderData,
      explanation: `Current: ${currentQuantity}, Target: ${targetQuantity}, Used: ${totalUsedQuantity}, Remaining: ${remainingQuantity}`
    });
    
    // Check if no remaining quantity available (validation using Quantity Remaining)
    if (remainingQuantity <= 0) {
      showAlert('Warning', `No remaining quantity available! (Used: ${totalUsedQuantity}/${targetQuantity})`, 'warning');
      return;
    }
    
    if (newBoxSize.width > baseContainer.width || newBoxSize.height > baseContainer.height) {
      showAlert('Error', `Box size (${newBoxSize.width}×${newBoxSize.height}) is too big for container (${baseContainer.width}×${baseContainer.height})`, 'error');
      return;
    }
    
    setBoxes(prevBoxes => {
      const newId = prevBoxes && prevBoxes.length > 0 ? Math.max(...prevBoxes.map(b => b.id)) + 1 : 1;
      const currentWoItemIdLocal = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
      const clusterBoxes = prevBoxes ? prevBoxes.filter(box => box.woItemId === currentWoItemIdLocal || box.woItemId === parseInt(currentWoItemIdLocal)) : [];
      const centroid = clusterBoxes.length > 0 ? {
        x: Math.round(clusterBoxes.reduce((s, b) => s + (b.x + (b.isRotated ? b.height : b.width) / 2), 0) / clusterBoxes.length),
        y: Math.round(clusterBoxes.reduce((s, b) => s + (b.y + (b.isRotated ? b.width : b.height) / 2), 0) / clusterBoxes.length)
      } : { x: baseContainer.x, y: baseContainer.y };

      const inside = (x, y, w, h) => (
        x >= baseContainer.x && y >= baseContainer.y &&
        x + w <= baseContainer.x + baseContainer.width &&
        y + h <= baseContainer.y + baseContainer.height
      );

      const collide = (x, y, w, h) => {
        if (!prevBoxes || prevBoxes.length === 0) return false;
        for (const box of prevBoxes) {
          const bw = box.isRotated ? box.height : box.width;
          const bh = box.isRotated ? box.width : box.height;
          if (!(x >= box.x + bw || x + w <= box.x || y >= box.y + bh || y + h <= box.y)) return true;
        }
        return false;
      };

      const sidePriority = { below: 0, right: 1, left: 2, above: 3 };
      const collect = (rot = false) => {
        const w = rot ? newBoxSize.height : newBoxSize.width;
        const h = rot ? newBoxSize.width : newBoxSize.height;
        const cands = [];
        if (clusterBoxes.length === 0) {
          const x0 = baseContainer.x;
          const y0 = baseContainer.y;
          if (inside(x0, y0, w, h) && !collide(x0, y0, w, h)) {
            cands.push({ x: x0, y: y0, rotated: rot, side: 'below', dist: Math.abs(x0 + w / 2 - centroid.x) + Math.abs(y0 + h / 2 - centroid.y) });
          }
          return cands;
        }
        const order = ['below', 'right', 'left', 'above'];
        for (const side of order) {
          for (const b of clusterBoxes) {
            const bw = b.isRotated ? b.height : b.width;
            const bh = b.isRotated ? b.width : b.height;
            if (side === 'below') {
              const y = b.y + bh;
              for (let x = b.x; x <= b.x + bw - w; x += 1) {
                if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                cands.push({ x, y, rotated: rot, side, dist: d });
              }
            } else if (side === 'right') {
              const x = b.x + bw;
              for (let y = b.y; y <= b.y + bh - h; y += 1) {
                if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                cands.push({ x, y, rotated: rot, side, dist: d });
              }
            } else if (side === 'left') {
              const x = b.x - w;
              for (let y = b.y; y <= b.y + bh - h; y += 1) {
                if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                cands.push({ x, y, rotated: rot, side, dist: d });
              }
            } else if (side === 'above') {
              const y = b.y - h;
              for (let x = b.x; x <= b.x + bw - w; x += 1) {
                if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                cands.push({ x, y, rotated: rot, side, dist: d });
              }
            }
          }
        }
        return cands;
      };

      let candidates = collect(false);
      if (candidates.length === 0) candidates = collect(true);
      if (candidates.length === 0) {
        // Fallback: row-major scan (y-first) non-rotated
        const w = newBoxSize.width;
        const h = newBoxSize.height;
        for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - h; y++) {
          for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - w; x++) {
            if (inside(x, y, w, h) && !collide(x, y, w, h)) {
              candidates = [{ x, y, rotated: false, side: 'below', dist: 0 }];
              break;
            }
          }
          if (candidates.length > 0) break;
        }
        // Fallback: row-major scan rotated
        if (candidates.length === 0) {
          const rw = newBoxSize.height;
          const rh = newBoxSize.width;
          for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - rh; y++) {
            for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - rw; x++) {
              if (inside(x, y, rw, rh) && !collide(x, y, rw, rh)) {
                candidates = [{ x, y, rotated: true, side: 'below', dist: 0 }];
                break;
              }
            }
            if (candidates.length > 0) break;
          }
        }
        if (candidates.length === 0) {
          showAlert('Error', 'No space available for new box!', 'error');
          return prevBoxes;
        }
      }
      candidates.sort((a, b) => {
        const sp = sidePriority[a.side] - sidePriority[b.side];
        return sp !== 0 ? sp : a.dist - b.dist;
      });
      const chosen = candidates[0];

      const woItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId || 'unknown';
      const workOrderId = workOrderData?.workOrderId || 'unknown';
      const saranId = workOrderData?.selectedItem?.id || 'unknown';
      const newBox = {
        id: newId,
        x: chosen.x,
        y: chosen.y,
        width: newBoxSize.width,
        height: newBoxSize.height,
        color: '#10b981',
        isDisabled: false,
        isRotated: !!chosen.rotated,
        woItemId,
        workOrderId,
        saranId,
        isSave: false
      };
      const totalBoxes = clusterBoxes.length + 1;
      updateWOQuantity(currentWoItemIdLocal, saranId, totalBoxes);
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
      
      // Update WO_total_quantity in localStorage (set to 0 for current WO item)
      const saranItemId = workOrderData?.selectedItem?.id || 'unknown';
      updateWOQuantity(currentWoItemId, saranItemId, 0);
      
      return otherWoItemBoxes;
    });
    
    showAlert('Success', 'All boxes from current Work Order item cleared!', 'success');
  }, [showAlert, totalQuantity, workOrderData?.workOrderItem?.id, workOrderData?.itemId]);

  const generateJPG = useCallback(async (saveMode = 'download') => {
    console.log('🎯 GENERATE JPG FUNCTION CALLED');
    console.log('📋 Save mode:', saveMode);
    console.log('📦 Container ref exists:', !!containerRef.current);
    
    if (!containerRef.current) {
      console.error('❌ Container not found!');
      showAlert('Error', 'Container not found!', 'error');
      return;
    }

    // Prevent multiple simultaneous generations
    if (isGeneratingJPG) {
      showAlert('Warning', 'JPG generation sedang berlangsung, silakan tunggu...', 'warning');
      return;
    }

    // Check if container is too large to prevent memory issues
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const maxDimension = 8000; // Maximum dimension to prevent memory issues
    
    if (containerWidth > maxDimension || containerHeight > maxDimension) {
      showAlert('Warning', `Canvas terlalu besar (${containerWidth}x${containerHeight}). Mencoba dengan ukuran yang lebih kecil...`, 'warning');
    }
    
    // Determine optimal format based on canvas size and content
    const canvasArea = containerWidth * containerHeight;
    const shouldUsePNG = canvasArea < 1000000 && usePNG; // Use PNG for smaller canvases with solid colors
    const format = shouldUsePNG ? 'png' : 'jpeg';
    const quality = shouldUsePNG ? 1.0 : 0.6; // PNG uses lossless compression

    // Set generation state
    setIsGeneratingJPG(true);
    setJpgProgress(0);
    setJpgStatus('Memulai proses...');

    try {
      showAlert('Info', 'Generating JPG...', 'info');
      
      // Wait a bit for canvas to fully render
      console.log('Waiting for canvas to render...');
      setJpgProgress(5);
      setJpgStatus('Menunggu canvas render...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      
      let dataURL = null;
      let method = '';
      
      // Method 1: Try dom-to-image first (better for large containers)
      try {
        console.log('Trying dom-to-image method...');
        setJpgProgress(10);
        setJpgStatus('Mencoba metode dom-to-image...');
        
        const domToImage = (await import('dom-to-image')).default;
        
        // Calculate safe dimensions
        const safeWidth = Math.min(containerWidth, maxDimension);
        const safeHeight = Math.min(containerHeight, maxDimension);
        
        setJpgProgress(20);
        setJpgStatus('Memproses canvas dengan dom-to-image...');
        
        if (format === 'png') {
          dataURL = await domToImage.toPng(containerRef.current, {
            bgcolor: '#ffffff',
            width: safeWidth,
            height: safeHeight,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            },
            filter: (node) => {
              // Skip problematic elements
              if (node.classList?.contains('ignore-capture')) {
                return false;
              }
              return true;
            }
          });
        } else {
          dataURL = await domToImage.toJpeg(containerRef.current, {
            quality: quality, // Dynamic quality based on format
            bgcolor: '#ffffff',
            width: safeWidth,
            height: safeHeight,
            style: {
              transform: 'scale(1)',
              transformOrigin: 'top left'
            },
            filter: (node) => {
              // Skip problematic elements
              if (node.classList?.contains('ignore-capture')) {
                return false;
              }
              return true;
            }
          });
        }
        
        method = 'dom-to-image';
        setJpgProgress(50);
        setJpgStatus('dom-to-image berhasil!');
        console.log('dom-to-image success');
        
      } catch (domError) {
        console.log('dom-to-image failed:', domError);
        
        // Method 2: Try html2canvas with reduced settings
        try {
          console.log('Trying html2canvas method...');
          setJpgProgress(30);
          setJpgStatus('Mencoba metode html2canvas...');
          
          const html2canvas = (await import('html2canvas')).default;
          
          // Calculate safe scale to prevent memory issues
          const containerRect = containerRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const maxScale = Math.min(
            viewportWidth / containerWidth, 
            viewportHeight / containerHeight, 
            0.8 // Limit scale to prevent memory issues
          );
          const scale = Math.max(0.3, maxScale); // Minimum scale 0.3
          
          console.log('Scaling calculation:', {
            containerWidth,
            containerHeight,
            viewportWidth,
            viewportHeight,
            maxScale,
            finalScale: scale
          });
          
          const canvas = await html2canvas(containerRef.current, {
            backgroundColor: '#ffffff',
            scale: scale,
            useCORS: true,
            allowTaint: true,
            width: Math.min(containerWidth, maxDimension),
            height: Math.min(containerHeight, maxDimension),
            scrollX: 0,
            scrollY: 0,
            windowWidth: Math.min(containerWidth, maxDimension),
            windowHeight: Math.min(containerHeight, maxDimension),
            x: containerRect.left,
            y: containerRect.top,
            removeContainer: true,
            foreignObjectRendering: false,
            logging: false, // Disable logging for better performance
            ignoreElements: (element) => {
              return element.classList?.contains('ignore-capture');
            },
            onclone: (clonedDoc) => {
              // Simplified style injection to prevent crashes
              const style = clonedDoc.createElement('style');
              style.textContent = `
                * {
                  color: #000000 !important;
                  background-color: #ffffff !important;
                  border-color: #000000 !important;
                }
                .bg-green-500, .bg-green-600, .bg-green-700 {
                  background-color: #10b981 !important;
                }
                .bg-blue-500, .bg-blue-600, .bg-blue-700 {
                  background-color: #3b82f6 !important;
                }
                .bg-red-500, .bg-red-600, .bg-red-700 {
                  background-color: #ef4444 !important;
                }
                .bg-purple-500, .bg-purple-600, .bg-purple-700 {
                  background-color: #8b5cf6 !important;
                }
                .bg-gray-500, .bg-gray-600, .bg-gray-700 {
                  background-color: #6b7280 !important;
                }
                .text-white { color: #ffffff !important; }
                .text-black { color: #000000 !important; }
                .border-gray-300 { border-color: #d1d5db !important; }
                .border-gray-400 { border-color: #9ca3af !important; }
                .canvas-container {
                  overflow: visible !important;
                  max-width: none !important;
                  max-height: none !important;
                }
              `;
              clonedDoc.head.appendChild(style);
            }
          });
          
          dataURL = canvas.toDataURL(`image/${format}`, quality);
          method = 'html2canvas';
          setJpgProgress(50);
          setJpgStatus('html2canvas berhasil!');
          console.log('html2canvas success');
          
        } catch (html2canvasError) {
          console.log('html2canvas failed:', html2canvasError);
          
          // Method 3: Try with minimal settings
          try {
            console.log('Trying html2canvas with minimal settings...');
            const html2canvas = (await import('html2canvas')).default;
            
            const canvas = await html2canvas(containerRef.current, {
              backgroundColor: '#ffffff',
              scale: 0.5, // Fixed low scale
              useCORS: false,
              allowTaint: false,
              logging: false,
              removeContainer: true,
              foreignObjectRendering: false
            });
            
            dataURL = canvas.toDataURL(`image/${format}`, quality);
            method = 'html2canvas-minimal';
            setJpgProgress(50);
            setJpgStatus('html2canvas minimal berhasil!');
            console.log('html2canvas minimal success');
            
          } catch (minimalError) {
            console.error('All capture methods failed:', minimalError);
            throw new Error('Semua metode capture gagal. Canvas mungkin terlalu kompleks atau besar.');
          }
        }
      }
      
      if (!dataURL) {
        throw new Error('Gagal menghasilkan data gambar');
      }
      
      console.log('DataURL generated successfully:', dataURL.substring(0, 50) + '...');
      setJpgProgress(70);
      setJpgStatus('Mengompres file...');
      
      // Compress the image further if it's too large
      let finalDataURL = dataURL;
      const originalSize = dataURL.length;
      console.log('Original dataURL size:', originalSize, 'characters');
      
      // If dataURL is too large (> 2MB), compress it further
      if (originalSize > 2000000) {
        console.log('File terlalu besar, mengompres lebih lanjut...');
        setJpgStatus('Mengompres file yang besar...');
        
        try {
          // Create a canvas to recompress the image
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (reduce by 50% if too large)
            const maxWidth = 2000;
            const maxHeight = 2000;
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw with lower quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'low';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to format with lower quality
            finalDataURL = canvas.toDataURL(`image/${format}`, format === 'png' ? 1.0 : 0.5);
            console.log('Compressed dataURL size:', finalDataURL.length, 'characters');
            
            // Continue with download
            downloadFile(finalDataURL, method);
          };
          img.src = dataURL;
          return; // Exit early, download will be handled in img.onload
        } catch (compressError) {
          console.log('Compression failed, using original:', compressError);
          // Continue with original dataURL
        }
      }
      
      // If not too large, proceed with download
      await downloadFile(finalDataURL, method);
      
      async function downloadFile(dataURL, method) {
        setJpgProgress(80);
        setJpgStatus('Menyiapkan download...');
        
        // Create filename based on save mode
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const fileExtension = format === 'png' ? 'png' : 'jpg';
        
        let filename;
        let woItemIdFilename; // New filename for woitemid_itemid format
        
        if (saveMode === 'preview') {
          // For preview mode, use itemBarangId (saranId) format
          const itemBarangId = workOrderData?.selectedItem?.id || 'unknown';
          const woItemUniqueId = workOrderData?.workOrderItem?.wo_item_unique_id || 'unknown';
          
          // Original filename format (per item ID)
          filename = `canvas-preview-ItemId-${itemBarangId}.${fileExtension}`;
          
          // New filename format (per woitemid_itemid)
          woItemIdFilename = `canvas-preview-WoItemId-${woItemUniqueId}_ItemId-${itemBarangId}.${fileExtension}`;
        } else {
          // For download mode, use generic name
          filename = `canvas-layout-${timestamp}.${fileExtension}`;
        }
        
        // Save to app folder instead of downloads
        console.log('Saving to app folder:', filename);
        if (woItemIdFilename) {
          console.log('Also saving with woitemid_itemid format:', woItemIdFilename);
        }
        
        if (saveMode === 'preview') {
          // For preview mode, save to app folder using Electron API
          try {
            console.log('=== SAVE CANVAS DEBUG ===');
            console.log('Save mode:', saveMode);
            console.log('Filename (ItemId):', filename);
            console.log('Filename (WoItemId_ItemId):', woItemIdFilename);
            console.log('DataURL length:', dataURL ? dataURL.length : 'null');
            console.log('window.electronAPI exists:', !!window.electronAPI);
            console.log('saveCanvasFile exists:', !!(window.electronAPI && window.electronAPI.saveCanvasFile));
            
            // Check if we're in Electron environment
            if (window.electronAPI && window.electronAPI.saveCanvasFile) {
              console.log('Calling Electron API to save canvas...');
              
              // Save with original filename format (per item ID)
              const result = await window.electronAPI.saveCanvasFile(dataURL, filename);
              console.log('Electron API result (ItemId):', result);
              
              // Save with new filename format (per woitemid_itemid)
              let woItemResult = null;
              if (woItemIdFilename) {
                console.log('Saving additional copy with woitemid_itemid format...');
                woItemResult = await window.electronAPI.saveCanvasFile(dataURL, woItemIdFilename);
                console.log('Electron API result (WoItemId_ItemId):', woItemResult);
              }
              
              if (result.success) {
                if (typeof window !== 'undefined') {
                  window.canvasPreviewCacheBuster = Date.now();
                }
                try {
                  const itemBarangId = workOrderData?.selectedItem?.id || null;
                  if (itemBarangId) {
                    window.dispatchEvent(new CustomEvent('canvasPreviewSaved', { detail: { itemId: itemBarangId } }));
                  }
                } catch {}
                console.log('✅ CANVAS SAVE SUCCESS (ItemId format)!');
                console.log(`📁 File saved to: ${result.path}`);
                console.log(`📄 Filename: ${filename}`);
                
                if (woItemResult && woItemResult.success) {
                console.log('✅ CANVAS SAVE SUCCESS (WoItemId_ItemId format)!');
                if (typeof window !== 'undefined') {
                  window.canvasPreviewCacheBuster = Date.now();
                }
                try {
                  const itemBarangId = workOrderData?.selectedItem?.id || null;
                  if (itemBarangId) {
                    window.dispatchEvent(new CustomEvent('canvasPreviewSaved', { detail: { itemId: itemBarangId } }));
                  }
                } catch {}
                console.log(`📁 Additional file saved to: ${woItemResult.path}`);
                console.log(`📄 Additional filename: ${woItemIdFilename}`);
              }
                
                console.log(`📊 DataURL length: ${dataURL.length} characters`);
                console.log(`💾 Full path: public/canvas-previews/${filename}`);
                
                const successMessage = woItemResult && woItemResult.success 
                  ? `Canvas berhasil disimpan!\n\nFile 1: ${filename}\nFile 2: ${woItemIdFilename}\nLokasi: public/canvas-previews/`
                  : `Canvas berhasil disimpan!\n\nFile: ${filename}\nLokasi: public/canvas-previews/`;
                
                showAlert('Success', successMessage, 'success');
              } else {
                console.error('❌ CANVAS SAVE FAILED!');
                console.error('Error details:', result.error);
                console.error('Error message:', result.details);
                // Fallback to download if Electron save fails
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataURL;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            } else {
              console.warn('Electron API not available, falling back to download');
              console.log('Available window.electronAPI methods:', window.electronAPI ? Object.keys(window.electronAPI) : 'none');
              // Fallback to download if not in Electron
              const link = document.createElement('a');
              link.download = filename;
              link.href = dataURL;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } catch (error) {
            console.error('Error saving to app folder:', error);
            console.error('Error stack:', error.stack);
            // Fallback to download
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataURL;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else {
          // For download mode, use normal download
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataURL;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        console.log('File operation completed successfully');
        
        setJpgProgress(100);
        setJpgStatus('Download berhasil!');
        
        if (saveMode === 'preview') {
          console.log(`Canvas preview saved to app folder: /canvas-previews/${filename}`);
          // Don't show alert for preview mode to avoid interrupting save flow
        } else {
          showAlert('Success', `JPG berhasil dibuat dengan metode ${method}: ${filename}`, 'success');
        }
      }
      
    } catch (error) {
      console.error('Error generating JPG:', error);
      setJpgStatus('Error: ' + error.message);
      showAlert('Error', `Gagal membuat JPG: ${error.message}`, 'error');
    } finally {
      // Cleanup and reset state
      setIsGeneratingJPG(false);
      setTimeout(() => {
        setJpgProgress(0);
        setJpgStatus('');
      }, 2000); // Keep status for 2 seconds then clear
      
      // Force garbage collection if available
      if (window.gc) {
        setTimeout(() => window.gc(), 1000);
      }
    }
  }, [showAlert, isGeneratingJPG, workOrderData]);

  const fillAllBoxes = useCallback(() => {
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    
    // Get remaining quantity from WO_total_quantity (shared across canvases)
    const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
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
    
    const remainingQuantity = Math.max(0, targetQuantity - totalUsedQuantity);
    
    // Count current boxes in canvas for this WO item
    const currentWoItemBoxes = boxes ? boxes.filter(box => 
      box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
    ) : [];
    const currentQuantity = currentWoItemBoxes.length;
    
    console.log('Fill All Boxes - Validation using Quantity Remaining:', {
      currentWoItemId,
      targetQuantity,
      totalUsedQuantity,
      remainingQuantity,
      currentQuantity,
      canFill: remainingQuantity > 0
    });

    // Check if no remaining quantity available
    if (remainingQuantity <= 0) {
      showAlert('Warning', `No remaining quantity available! (Used: ${totalUsedQuantity}/${targetQuantity})`, 'warning');
      return;
    }

    // Calculate how many boxes to add (limited by remaining quantity)
    const boxesToFill = remainingQuantity;

    if (boxesToFill <= 0) {
      showAlert('Info', 'All boxes already filled!', 'info');
      return;
    }

    // Use single color for all boxes
    const singleColor = '#10b981'; // Green color for all boxes
    
    // Loop strictly by Quantity Remaining; placement will stop when no slot available
    const boxesToAdd = boxesToFill;

    // Generate boxes with perfect grid layout (no gaps)
    const newBoxes = [];
    let newId = boxes && boxes.length > 0 ? Math.max(...boxes.map(b => b.id)) + 1 : 1;
    
    // Create a grid to track occupied positions
    const grid = Array(baseContainer.height).fill().map(() => 
      Array(baseContainer.width).fill(false)
    );
    
    // Mark existing boxes as occupied (handle rotation)
    if (boxes && boxes.length > 0) {
      boxes.forEach(box => {
        // Get actual dimensions considering rotation
        const boxWidth = box.isRotated ? box.height : box.width;
        const boxHeight = box.isRotated ? box.width : box.height;
        
        for (let y = box.y; y < box.y + boxHeight; y++) {
          for (let x = box.x; x < box.x + boxWidth; x++) {
            if (x >= 0 && x < baseContainer.width && y >= 0 && y < baseContainer.height) {
              grid[y][x] = true;
            }
          }
        }
      });
    }
    
    // Place new boxes with collision detection and position finding (optimized for speed)
    const placeBoxesWithDelay = async () => {
      const working = boxes ? [...boxes] : [];
      const sidePriority = { below: 0, right: 1, left: 2, above: 3 };
      const inside = (x, y, w, h) => (
        x >= baseContainer.x && y >= baseContainer.y &&
        x + w <= baseContainer.x + baseContainer.width &&
        y + h <= baseContainer.y + baseContainer.height
      );
      const collide = (x, y, w, h) => {
        if (!working || working.length === 0) return false;
        for (const box of working) {
          const bw = box.isRotated ? box.height : box.width;
          const bh = box.isRotated ? box.width : box.height;
          if (!(x >= box.x + bw || x + w <= box.x || y >= box.y + bh || y + h <= box.y)) return true;
        }
        return false;
      };
      for (let i = 0; i < boxesToAdd; i++) {
        const cluster = working.filter(b => b.woItemId === currentWoItemId || b.woItemId === parseInt(currentWoItemId));
        const centroid = cluster.length > 0 ? {
          x: Math.round(cluster.reduce((s, b) => s + (b.x + (b.isRotated ? b.height : b.width) / 2), 0) / cluster.length),
          y: Math.round(cluster.reduce((s, b) => s + (b.y + (b.isRotated ? b.width : b.height) / 2), 0) / cluster.length)
        } : { x: baseContainer.x, y: baseContainer.y };
        const collect = (rot) => {
          const w = rot ? newBoxSize.height : newBoxSize.width;
          const h = rot ? newBoxSize.width : newBoxSize.height;
          const cands = [];
          if (cluster.length === 0) {
            const x0 = baseContainer.x;
            const y0 = baseContainer.y;
            if (inside(x0, y0, w, h) && !collide(x0, y0, w, h)) cands.push({ x: x0, y: y0, rotated: rot, side: 'below', dist: 0 });
            return cands;
          }
          const order = ['below', 'right', 'left', 'above'];
          for (const side of order) {
            for (const b of cluster) {
              const bw = b.isRotated ? b.height : b.width;
              const bh = b.isRotated ? b.width : b.height;
              if (side === 'below') {
                const y = b.y + bh;
                for (let x = b.x; x <= b.x + bw - w; x += 1) {
                  if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                  const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                  cands.push({ x, y, rotated: rot, side, dist: d });
                }
              } else if (side === 'right') {
                const x = b.x + bw;
                for (let y = b.y; y <= b.y + bh - h; y += 1) {
                  if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                  const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                  cands.push({ x, y, rotated: rot, side, dist: d });
                }
              } else if (side === 'left') {
                const x = b.x - w;
                for (let y = b.y; y <= b.y + bh - h; y += 1) {
                  if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                  const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                  cands.push({ x, y, rotated: rot, side, dist: d });
                }
              } else if (side === 'above') {
                const y = b.y - h;
                for (let x = b.x; x <= b.x + bw - w; x += 1) {
                  if (!inside(x, y, w, h) || collide(x, y, w, h)) continue;
                  const d = Math.abs((x + w / 2) - centroid.x) + Math.abs((y + h / 2) - centroid.y);
                  cands.push({ x, y, rotated: rot, side, dist: d });
                }
              }
            }
            if (cands.length > 0) break;
          }
          return cands;
        };
        let candidates = collect(false);
        if (candidates.length === 0) candidates = collect(true);
        if (candidates.length === 0) {
          const w = newBoxSize.width;
          const h = newBoxSize.height;
          for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - h; y++) {
            for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - w; x++) {
              if (inside(x, y, w, h) && !collide(x, y, w, h)) { candidates = [{ x, y, rotated: false, side: 'below', dist: 0 }]; break; }
            }
            if (candidates.length > 0) break;
          }
          if (candidates.length === 0) {
            const rw = newBoxSize.height;
            const rh = newBoxSize.width;
            for (let y = baseContainer.y; y <= baseContainer.y + baseContainer.height - rh; y++) {
              for (let x = baseContainer.x; x <= baseContainer.x + baseContainer.width - rw; x++) {
                if (inside(x, y, rw, rh) && !collide(x, y, rw, rh)) { candidates = [{ x, y, rotated: true, side: 'below', dist: 0 }]; break; }
              }
              if (candidates.length > 0) break;
            }
          }
        }
        if (candidates.length === 0) break;
        candidates.sort((a, b) => {
          const sp = sidePriority[a.side] - sidePriority[b.side];
          return sp !== 0 ? sp : a.dist - b.dist;
        });
        const pos = candidates[0];
        const woItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId || 'unknown';
        const workOrderId = workOrderData?.workOrderId || 'unknown';
        const saranId = workOrderData?.selectedItem?.id || 'unknown';
        newBoxes.push({ id: newId++, x: pos.x, y: pos.y, width: newBoxSize.width, height: newBoxSize.height, color: '#10b981', isDisabled: false, isRotated: pos.rotated, woItemId, workOrderId, saranId, isSave: false });
        working.push({ id: newId - 1, x: pos.x, y: pos.y, width: newBoxSize.width, height: newBoxSize.height, color: '#10b981', isDisabled: false, isRotated: pos.rotated, woItemId, workOrderId, saranId, isSave: false });
      }
      
      // Update boxes after all are placed
      if (newBoxes.length > 0) {
        setBoxes(prevBoxes => {
          const updatedBoxes = [...(prevBoxes || []), ...newBoxes];
          
          // Update WO_total_quantity in localStorage
          const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
          const saranItemId = workOrderData?.selectedItem?.id || 'unknown';
          
          // Count only boxes from current WO item
          const currentWoItemBoxes = updatedBoxes.filter(box => 
            box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
          );
          const totalBoxes = currentWoItemBoxes.length;
          updateWOQuantity(currentWoItemId, saranItemId, totalBoxes);
          
          return updatedBoxes;
        });
        
        // Calculate remaining quantity correctly
        const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
        const currentWoItemBoxes = boxes ? boxes.filter(box => 
          box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
        ) : [];
        const totalBoxes = currentWoItemBoxes.length + newBoxes.length;
        const newRemaining = Math.max(0, targetQuantity - totalBoxes);
        
        console.log('Fill All - Final Calculation:', {
          targetQuantity: targetQuantity,
          currentWoItemBoxes: currentWoItemBoxes.length,
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
    const newZoom = Math.max(zoom - 0.2, 0.01); // Minimum 1% (0.01x)
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
    const newZoom = Math.max(fitZoom * paddingFactor, 0.01);
    
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


  // Enhanced save system - only save canvas data with required info
  const generateSaveData = useCallback(() => {
    // Get current work order info for reference
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const currentWorkOrderId = workOrderData?.workOrderId;
    const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId;
    
    // Calculate total area used
    const totalAreaUsed = boxes ? boxes.reduce((total, box) => total + (box.width * box.height), 0) : 0;
    const containerArea = baseContainer.width * baseContainer.height;
    const areaUtilization = containerArea > 0 ? Math.round((totalAreaUsed / containerArea) * 100) : 0;
    
    console.log('Generating canvas save data:', {
      currentWoItemId,
      currentWorkOrderId,
      currentWorkOrderUniqueId,
      totalBoxes: boxes?.length || 0,
      totalAreaUsed: totalAreaUsed,
      containerArea: containerArea,
      areaUtilization: areaUtilization,
      allBoxes: boxes?.map(box => ({ 
        id: box.id, 
        woItemId: box.woItemId, 
        // workItemUniqueId: box.workItemUniqueId,
        area: box.width * box.height
      })) || []
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
        totalArea: totalAreaUsed,
        containerArea: containerArea,
        areaUtilization: areaUtilization,
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
    // Auto zoom fit before save for optimal view
    console.log('Auto zoom fit before save...');
    zoomFit();
    
    // Small delay to ensure zoom fit is applied
    setTimeout(() => {
      const saveData = generateSaveData();
    
      // Generate unique key for localStorage
      const workOrderUniqueId = localStorage.getItem('WO_current_work_order_id') || 'unknown';
      const saranId = workOrderData?.selectedItem?.id || 'unknown';
      const woItemUniqueId = workOrderData?.workOrderItem?.wo_item_unique_id || workOrderData?.workOrderItem?.id || 'unknown';
      const itemBarangId = workOrderData?.workOrderItem?.id || workOrderData?.itemId || 'unknown';
      
      // Primary storage key (existing format)
      const storageKey = `WO_canvas_layout_${saranId}_${workOrderUniqueId}`;
      
      // Additional storage key with woitemid_itemid format
      const woItemIdStorageKey = `WO_canvas_layout_WoItemId-${woItemUniqueId}_ItemId-${itemBarangId}_${workOrderUniqueId}`;
      
      // Check if current work order ID matches stored ID
      const storedWorkOrderId = localStorage.getItem('WO_current_work_order_id');
      const isCurrentWorkOrder = storedWorkOrderId === workOrderUniqueId;
      
      console.log('Saving Canvas Layout:', {
        current: workOrderUniqueId,
        stored: storedWorkOrderId,
        isCurrent: isCurrentWorkOrder,
        storageKey: storageKey,
        woItemIdStorageKey: woItemIdStorageKey,
        woItemUniqueId: woItemUniqueId,
        itemBarangId: itemBarangId
      });
      
      try {
        const jsonString = JSON.stringify(saveData);
        const jsonSize = new Blob([jsonString]).size;
        
        console.log('Canvas JSON size:', {
          sizeBytes: jsonSize,
          sizeKB: Math.round(jsonSize / 1024),
          totalBoxes: saveData.boxes?.length || 0,
          storageKey: storageKey
        });
        
        // Check localStorage size limit (usually 5-10MB)
        if (jsonSize > 5 * 1024 * 1024) { // 5MB
          console.warn('⚠️ Canvas JSON size is large:', jsonSize, 'bytes');
        }
        
        localStorage.setItem(storageKey, jsonString);
        
        // Also save with woitemid_itemid format for additional access pattern
        localStorage.setItem(woItemIdStorageKey, jsonString);
        
        // Verify save integrity for both keys
        const savedData = localStorage.getItem(storageKey);
        const savedWoItemData = localStorage.getItem(woItemIdStorageKey);
        
        if (savedData && savedData.length === jsonString.length && 
            savedWoItemData && savedWoItemData.length === jsonString.length) {
          console.log('✅ Canvas saved successfully to both storage keys');
        } else {
          console.error('❌ Canvas save verification failed:', {
            originalLength: jsonString.length,
            savedLength: savedData?.length || 0,
            savedWoItemLength: savedWoItemData?.length || 0
          });
        }
        
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
        
        console.log('🔍 DEBUG: Calculating arranged quantity for save:', {
          woItemId: woItemId,
          woItemIdType: typeof woItemId,
          totalBoxes: boxes ? boxes.length : 0,
          currentWoItemBoxes: currentWoItemBoxes.length,
          arrangedQuantity: arrangedQuantity,
          saranId: saranId,
          allBoxWoItemIds: boxes ? boxes.map(box => ({ id: box.id, woItemId: box.woItemId, type: typeof box.woItemId })) : [],
          workOrderData: {
            workOrderItem: workOrderData?.workOrderItem,
            itemId: workOrderData?.itemId
          }
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
            // Add saran item ID if there are boxes (inline logic)
            try {
              console.log('=== ADDING SARAN ITEM ID TO USED SARAN PLATS ===');
              console.log('Saran Item ID:', saranId);
              
              // Get current used saran plats array (simple format: ["1","2"])
              const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
              
              // Check if saran item ID already exists
              const saranIdStr = saranId.toString();
              const alreadyExists = usedSaranPlats.includes(saranIdStr) || usedSaranPlats.includes(parseInt(saranIdStr));
              
              if (!alreadyExists) {
                // Add new saran item ID
                usedSaranPlats.push(saranIdStr);
                
                // Update localStorage
                localStorage.setItem('WO_used_saran_plats', JSON.stringify(usedSaranPlats));
                console.log('✅ Added saran item ID to used saran plats');
                console.log('📦 Total used saran plats:', usedSaranPlats.length);
                
                // Trigger custom event to notify other components
                window.dispatchEvent(new CustomEvent('usedSaranPlatsChanged'));
              } else {
                console.log('✅ Saran item ID already exists in used saran plats');
              }
            } catch (error) {
              console.error('❌ Error adding saran item ID to used saran plats:', error);
            }
          } else {
            // Don't remove saran item ID if no boxes - preserve existing data
            // This prevents deletion of yellow boxes from other WO items
            console.log(`Canvas empty for saran item ${saranId}, but preserving existing data to avoid deleting boxes from other WO items`);
          }
        }
        
        const idStatus = isCurrentWorkOrder ? 'Current Work Order' : 'Different Work Order';
        showAlert('Success', `Canvas saved for ${itemName}!\n\nID Status: ${idStatus}\nPrimary Key: ${storageKey}\nWoItemId Key: ${woItemIdStorageKey}\n\nJPG preview will be saved to /canvas-previews/ folder in both formats.`, 'success');
        
        // Recalculate quantity after save
        setForceUpdate(prev => prev + 1);
        
        // Call onCanvasSaved callback if provided
        if (onCanvasSaved && workOrderData?.selectedItem) {
          onCanvasSaved(workOrderData.selectedItem);
        }
        
        // Generate JPG for preview (save to folder) - wait for completion before closing
        console.log('🖼️ GENERATING JPG FOR CANVAS PREVIEW...');
        console.log('⏰ Will start JPG generation in 1 second...');
        console.log('📦 Container ref before delay:', !!containerRef.current);
        
        setTimeout(async () => {
          console.log('🚀 Starting JPG generation now...');
          console.log('📦 Container ref after delay:', !!containerRef.current);
          
          // Check if container still exists before generating
          if (!containerRef.current) {
            console.error('❌ Container ref is null after delay - cannot generate JPG');
            // Close modal even if JPG generation fails
            if (onClose) {
              onClose();
            }
            return;
          }
          
          try {
            await generateJPG('preview');
            console.log('✅ JPG generation completed successfully');
          } catch (jpgError) {
            console.error('❌ Failed to generate JPG:', jpgError);
            // Don't show error to user as JPG is optional for preview
          }
          
          // Close canvas and return to work order modal AFTER JPG generation
          if (onClose) {
            onClose();
          } else {
            // For page usage, go back in browser history (closes modal)
            window.history.back();
          }
        }, 500); // Wait 500ms for canvas to fully render after zoom fit
      } catch (error) {
        showAlert('Error', 'Failed to save canvas.', 'error');
        console.error('LocalStorage save error:', error);
      }
    }, 100); // Small delay to ensure zoom fit is applied
  }, [generateSaveData, workOrderData, showAlert, onClose, zoomFit, boxes, setForceUpdate, onCanvasSaved, generateJPG]);

  // Handle close with rollback to PreviousQuantity
  const handleClose = useCallback(() => {
    // Rollback to PreviousQuantity (current saran plat only)
    const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
    const currentSaranId = workOrderData?.selectedItem?.id;
    
    if (currentWoItemId && currentSaranId) {
      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
      const woItemData = totalQuantityData.find(item => 
        item.WoItemID === currentWoItemId || item.WoItemID === parseInt(currentWoItemId)
      );
      
      if (woItemData && woItemData.PreviousQuantity !== undefined) {
        // Find current saran item and rollback to PreviousQuantity
        const saranItem = woItemData.WOQuantity.find(item => 
          item.ItemId === currentSaranId || item.ItemId === parseInt(currentSaranId)
        );
        
        if (saranItem) {
          saranItem.Quantity = woItemData.PreviousQuantity;
          
          // Remove saran items with 0 quantity
          woItemData.WOQuantity = woItemData.WOQuantity.filter(item => item.Quantity > 0);
          
          localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
          console.log(`Rolled back to PreviousQuantity: ${woItemData.PreviousQuantity}`);
        }
      }
    }
    
    // Call original onClose if provided (for modal usage)
    if (onClose) {
      onClose();
    } else {
      // For page usage, go back in browser history (closes modal)
      window.history.back();
    }
  }, [onClose, workOrderData]);

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
    const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_id') || 'unknown';
    
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
              // const workItemUniqueId = box.workItemUniqueId || 'unknown';
              const boxWorkOrderId = box.workOrderId || 'unknown';
              const boxSaranId = box.saranId || 'unknown';
              const isFromDifferentWO = boxWoItemId !== currentWoItemId;
              
              // Determine color based on workItemUniqueId comparison
              let boxColor = '#10b981'; // Default green
              if (box.isSave === true || box.isDisabled === true) {
                boxColor = '#ef4444'; // Red for saved boxes (preserve red from database)
              } else if (boxWoItemId && boxWoItemId !== currentWoItemId && boxWoItemId !== parseInt(currentWoItemId)) {
                boxColor = '#f59e0b'; // Yellow for different WO item
              }
              
              console.log('Additional box color decision:', {
                boxId: box.id,
                boxWoItemId: boxWoItemId,
                boxWorkOrderId: boxWorkOrderId,
                boxSaranId: boxSaranId,
                // workItemUniqueId: workItemUniqueId,
                currentWorkOrderId: currentWorkOrderId,
                currentWorkOrderUniqueId: currentWorkOrderUniqueId,
                isSave: box.isSave,
                boxColor: boxColor,
                // isSameWorkOrderUniqueId: workItemUniqueId === currentWorkOrderUniqueId
              });
              
              additionalBoxes.push({
                ...box,
                woItemId: boxWoItemId,
                workOrderId: boxWorkOrderId,
                saranId: boxSaranId,
                isSave: box.isSave || false,
                // workItemUniqueId: workItemUniqueId,
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
        // workItemUniqueId: box.workItemUniqueId,
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
    const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_id') || 'unknown';
    
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
              // const workItemUniqueId = box.workItemUniqueId || 'unknown';
              const boxWorkOrderId = box.workOrderId || 'unknown';
              const boxSaranId = box.saranId || 'unknown';
              const isFromDifferentWO = boxWoItemId !== currentWoItemId;
              
              // Determine color based on workItemUniqueId comparison
              let boxColor = '#10b981'; // Default green
              if (box.isSave === true || box.isDisabled === true) {
                boxColor = '#ef4444'; // Red for saved boxes (preserve red from database)
              } else if (boxWoItemId && boxWoItemId !== currentWoItemId && boxWoItemId !== parseInt(currentWoItemId)) {
                boxColor = '#f59e0b'; // Yellow for different WO item
              }
              
              console.log('Box color decision during load:', {
                boxId: box.id,
                boxWoItemId: boxWoItemId,
                boxWorkOrderId: boxWorkOrderId,
                boxSaranId: boxSaranId,
                // workItemUniqueId: workItemUniqueId,
                currentWorkOrderId: currentWorkOrderId,
                currentWorkOrderUniqueId: currentWorkOrderUniqueId,
                isSave: box.isSave,
                boxColor: boxColor,
                // isSameWorkOrderUniqueId: workItemUniqueId === currentWorkOrderUniqueId
              });
              
              allBoxes.push({
                ...box,
                woItemId: boxWoItemId,
                isSave: box.isSave || false, // Will be true when saving
                // workItemUniqueId: workItemUniqueId, // Set workItemUniqueId from storage
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
              // workItemUniqueId: box.workItemUniqueId,
              color: box.color,
              isFromDifferentWO: box.isFromDifferentWO 
            }))
        });
    
    setBoxes(allBoxes);
  }, [workOrderData]);

  // Load from localStorage
  const loadCanvasLayout = useCallback(() => {
    // Load base container and boxes from current WO item
    const workOrderUniqueId = localStorage.getItem('WO_current_work_order_id') || 'unknown';
    const saranId = workOrderData?.selectedItem?.id || 'unknown';
    const storageKey = `WO_canvas_layout_${saranId}_${workOrderUniqueId}`;
    
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
            // const currentWorkOrderUniqueId = localStorage.getItem('WO_current_work_order_item_id') || currentWorkOrderId;
            
            const processedBoxes = data.boxes.map(box => {
              const boxWoItemId = box.woItemId || 'unknown';
              // const workItemUniqueId = box.workItemUniqueId || 'unknown';
              const isFromDifferentWO = boxWoItemId !== currentWoItemId;
              
              // Determine color based on woItemId comparison
              let boxColor = '#10b981'; // Default green
              if (box.isSave === true || box.isDisabled === true) {
                boxColor = '#ef4444'; // Red for saved boxes (preserve red from database)
              } else if (boxWoItemId && boxWoItemId !== currentWoItemId && boxWoItemId !== parseInt(currentWoItemId)) {
                boxColor = '#f59e0b'; // Yellow for different WO item
              }
              
              return {
                ...box,
                woItemId: boxWoItemId,
                isSave: box.isSave || false,
                // workItemUniqueId: workItemUniqueId,
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
    isSaranPlatUsed,
    zoomFit
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
          // Preserve original woItemId - don't change it to current work order
          woItemId: box.woItemId || 'unknown'
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
          // Preserve original woItemId - don't change it to current work order
          woItemId: box.woItemId || 'unknown'
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
    
    // Mark occupied cells (handle rotation)
    if (boxes && boxes.length > 0) {
      boxes.forEach(box => {
        // Safety check for box properties
        if (box && typeof box.x === 'number' && typeof box.y === 'number' && 
            typeof box.width === 'number' && typeof box.height === 'number' &&
            box.width > 0 && box.height > 0) {
          
          // Get actual dimensions considering rotation
          const boxWidth = box.isRotated ? box.height : box.width;
          const boxHeight = box.isRotated ? box.width : box.height;
          
          for (let y = box.y; y < box.y + boxHeight; y++) {
            for (let x = box.x; x < box.x + boxWidth; x++) {
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
      
      // Update WO_total_quantity in localStorage
      const saranItemId = workOrderData?.selectedItem?.id || 'unknown';
      updateWOQuantity(currentWoItemId, saranItemId, totalBoxes);
      
      return updatedBoxes;
    });
    setSelectedBoxIds(new Set());
    showAlert('Success', `Deleted ${deletedCount} box(es)`, 'success');
  }, [selectedBoxIds, totalQuantity, showAlert, boxes, workOrderData?.workOrderItem?.id, workOrderData?.itemId, updateWOQuantity]);

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
  }, [draw, animationFrameId, zoomFit]);
  
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
          console.log('Home pressed - reset position to top-left');
          const margin = 20;
          setPanOffset({ x: margin, y: margin });
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
    canvas.addEventListener('dblclick', handleDoubleClick);
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
      canvas.removeEventListener('dblclick', handleDoubleClick);
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
  }, [handleMouseDown, handleDoubleClick, handleMouseMove, handleMouseUp, handleMouseMovePan, handleMouseUpPan, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown, handleRightClick]);
  
  return (
    <div className="h-screen flex flex-col">
      {!hideTitle && (
        <div className="p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back button for page navigation */}
              {!onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
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
                ✅ {(() => {
                  const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
                  
                  // Get total quantity added from all saran plats for this WO item
                  const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
                  const woItemData = totalQuantityData.find(item => 
                    item.WoItemID === currentWoItemId || item.WoItemID === parseInt(currentWoItemId)
                  );
                  
                  let totalAddedQuantity = 0;
                  if (woItemData && woItemData.WOQuantity && Array.isArray(woItemData.WOQuantity)) {
                    // Sum all quantities from all saran plats for this WO item
                    totalAddedQuantity = woItemData.WOQuantity.reduce((total, saranItem) => {
                      return total + (parseInt(saranItem.Quantity) || 0);
                    }, 0);
                  }
                  
                  const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
                  
                  // Display: totalAddedQuantity/targetQuantity
                  return `${totalAddedQuantity}/${targetQuantity}`;
                })()} Boxes Added
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="p-1.5 space-y-1.5">
                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <>
                    {/* Save & Back to Modal Buttons */}
                    <div className="bg-white rounded-lg p-1 border">
                      <Button
                        onClick={saveCanvasLayout}
                        className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700 font-medium mb-1"
                      >
                        💾 Save
                      </Button>
                      <Button
                        onClick={handleClose}
                        className="w-full h-8 text-sm bg-gray-600 hover:bg-gray-700"
                      >
                        ← Back to Modal
                      </Button>
                    </div>

                    {/* Grid Statistics */}
                    <div className="bg-white rounded-lg p-1 border">
                      <h3 className="text-sm font-medium mb-1">Grid Statistics</h3>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">Quantity Added:</span> {(() => {
                            const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
                            
                            // Get total quantity from all saran plats for this WO item
                            const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
                            const woItemData = totalQuantityData.find(item => 
                              item.WoItemID === currentWoItemId || item.WoItemID === parseInt(currentWoItemId)
                            );
                            
                            let totalAddedQuantity = 0;
                            if (woItemData && woItemData.WOQuantity && Array.isArray(woItemData.WOQuantity)) {
                              // Sum all quantities from all saran plats for this WO item
                              totalAddedQuantity = woItemData.WOQuantity.reduce((total, saranItem) => {
                                return total + (parseInt(saranItem.Quantity) || 0);
                              }, 0);
                            }
                            
                            console.log('Quantity Added for WO Item (All Saran Plats):', {
                              currentWoItemId: currentWoItemId,
                              woItemData: woItemData,
                              totalAddedQuantity: totalAddedQuantity
                            });
                            
                            return `${totalAddedQuantity}`;
                          })()}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Quantity Required:</span> {(() => {
                            const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
                            return `${targetQuantity}`;
                          })()}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Quantity Remaining:</span> {(() => {
                            const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
                            
                            // Always read from WO_total_quantity in localStorage (real-time)
                            const targetQuantity = parseInt(workOrderData?.itemQty) || 0;
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
                            
                            const remainingQuantity = Math.max(0, targetQuantity - totalUsedQuantity);
                            
                            console.log('Quantity Remaining - Reading from storage:', {
                              currentWoItemId,
                              targetQuantity,
                              totalUsedQuantity,
                              remainingQuantity,
                              woItemData,
                              forceUpdate
                            });
                            
                            return (
                              <span className={`ml-1 ${remainingQuantity === 0 ? 'text-red-600 font-bold' : remainingQuantity <= 2 ? 'text-yellow-600 font-medium' : 'text-green-600'}`}>
                                {remainingQuantity}
                                {remainingQuantity === 0 && (
                                  <span className="ml-1 text-xs text-red-500">(Compliant!)</span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Quantity in this Canvas:</span> {(() => {
                            const currentWoItemId = workOrderData?.workOrderItem?.id || workOrderData?.itemId;
                            
                            // Count actual boxes in canvas for current work item
                            const currentWoItemBoxes = boxes ? boxes.filter(box => 
                              box.woItemId === currentWoItemId || box.woItemId === parseInt(currentWoItemId)
                            ) : [];
                            const canvasBoxCount = currentWoItemBoxes.length;
                            
                            return `${canvasBoxCount}`;
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
                        
                        {/* Total Area */}
                        <div className="text-sm">
                          <span className="font-medium">Total Area:</span> {(() => {
                            const totalArea = boxes ? boxes.reduce((total, box) => total + (box.width * box.height), 0) : 0;
                            return `${totalArea} px²`;
                          })()}
                        </div>
                        
                        {/* Area Utilization */}
                        <div className="text-sm">
                          <span className="font-medium">Area Utilization:</span> {(() => {
                            const totalAreaUsed = boxes ? boxes.reduce((total, box) => total + (box.width * box.height), 0) : 0;
                            const containerArea = baseContainer.width * baseContainer.height;
                            const areaUtilization = containerArea > 0 ? Math.round((totalAreaUsed / containerArea) * 100) : 0;
                            return `${areaUtilization}%`;
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
                              <div className="border-t pt-1 mt-1">
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
                    <div className="bg-white rounded-lg p-1 border">
                      <h3 className="text-sm font-medium mb-1">Base Container</h3>
                      <div className="space-y-1">
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
                    <div className="bg-white rounded-lg p-1 border">
                      <h3 className="text-sm font-medium mb-1">Box Size</h3>
                      <div className="space-y-1">
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
                        {/* Removed repetitive WO item size info */}
                        <div className="text-xs text-blue-600 mt-1">
                          💡 Double-click a box to rotate it 90°
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions Tab */}
                {activeTab === 'actions' && (
                  <>
                    {/* Box Actions */}
                    <div className="bg-white rounded-lg p-1 border">
                      <h3 className="text-sm font-medium mb-1">Box Actions</h3>
                      <div className="space-y-1">
                        <Button
                          onClick={fillAllBoxes}
                          className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          Fill All
                        </Button>
                        <Button
                          onClick={addBox}
                          className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          Add New Box
                        </Button>
                        <Button
                          onClick={clearAllBoxes}
                          className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          Clear All Boxes
                        </Button>
                        <Button
                          onClick={() => {
                            if (selectedBoxIds.size === 1) {
                              const boxId = Array.from(selectedBoxIds)[0];
                              rotateBoxById(boxId);
                            } else {
                              showAlert('Info', 'Please select exactly one box to rotate', 'info');
                            }
                          }}
                          className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                        >
                          Rotate Selected Box
                        </Button>
                        {/* Controls for image generation have been removed intentionally */}
                      </div>
                    </div>

                    {/* Zoom Controls */}
                    <div className="bg-white rounded-lg p-1 border">
                      <h3 className="text-sm font-medium mb-1">Kontrol Zoom</h3>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Zoom:</span> {Math.round(zoom * 100)}%
                        </div>
                        <div className="space-y-1">
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
                          <div className="flex">
                            <Button
                              onClick={zoomFit}
                              className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                            >
                              Zoom Fit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </>
                )}

                {/* Tools Tab */}
                {activeTab === 'tools' && (
                  <>
                    {/* Zoom Controls */}
                    <div className="bg-white rounded-lg p-1 border">
                      <h3 className="text-sm font-medium mb-1">Zoom Controls</h3>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Zoom:</span> {Math.round(zoom * 100)}%
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            onClick={zoomOut}
                            className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-700"
                          >
                            Zoom Out
                          </Button>
                          <Button
                            onClick={resetZoom}
                            className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-700"
                          >
                            Reset
                          </Button>
                          <Button
                            onClick={zoomIn}
                            className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-700"
                          >
                            Zoom In
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Keyboard Controls Info */}
                    <div className="bg-white rounded-lg p-1 border">
                      <h3 className="text-sm font-medium mb-1">Keyboard Controls</h3>
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
