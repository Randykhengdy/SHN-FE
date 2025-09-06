import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Edit3, Download, RotateCcw, Square, SquareStack, Settings, X, Scissors, Grid3X3, Grid, Plus, Trash2 } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';

export default function GridStackTestingPage() {
  const { showAlert } = useAlert();
  
  // GridStack state
  const [gridStack, setGridStack] = useState(null);
  const gridRef = useRef(null);
  
  // Mode State
  const [mode, setMode] = useState('2D'); // '1D' or '2D'
  
  // Base plate dimensions - make them larger by default
  const [baseWidth, setBaseWidth] = useState(200);
  const [baseHeight, setBaseHeight] = useState(150);
  const [baseWeight, setBaseWeight] = useState(10);
  const [baseColor, setBaseColor] = useState('#e0e0e0');
  
  // Cut dimensions - make them more reasonable for larger base plate
  const [cutWidth, setCutWidth] = useState(40);
  const [cutHeight, setCutHeight] = useState(30);
  const [cutColor, setCutColor] = useState('#ff6b6b');
  
  // UI State
  const [showConfig, setShowConfig] = useState(true);
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'cuts', 'actions'
  const [basePlateCreated, setBasePlateCreated] = useState(false);
  
  // Block system: 1 block = 5cm
  const blockSize = 5; // cm per block
  
  // Helper functions for block system
  const cmToBlocks = (cm) => Math.round(cm / blockSize);
  const blocksToCm = (blocks) => blocks * blockSize;
  const formatDimension = (cm) => `${cm}cm (${cmToBlocks(cm)} blocks)`;
  
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
    return cutWidth <= baseWidth && cutHeight <= baseHeight;
  };
  
  // Initialize GridStack
  useEffect(() => {
    if (gridRef.current && !gridStack) {
      // Import GridStack dynamically
      import('gridstack').then((GridStackModule) => {
        const { GridStack } = GridStackModule;
        
        // Initialize GridStack with base plate as container
        const grid = GridStack.init({
          cellHeight: 30, // 30px per cell for larger base plate
          column: 20, // More columns for larger base plate
          margin: 3,
          removable: true,
          acceptWidgets: true, // Allow widgets to be added
          float: false, // No floating, strict grid
          animate: true,
          resizable: {
            handles: 'e, se, s, sw, w'
          },
          draggable: {
            handle: '.grid-stack-item-content'
          }
        }, gridRef.current);
        
        setGridStack(grid);
        
        // Add event listeners
        grid.on('change', (event, items) => {
          console.log('Grid changed:', items);
        });
        
        grid.on('removed', (event, items) => {
          console.log('Items removed:', items);
        });
        
        grid.on('added', (event, items) => {
          console.log('Items added:', items);
        });
        
        showAlert('Success', 'GridStack initialized successfully!', 'success');
      }).catch((error) => {
        console.error('Failed to load GridStack:', error);
        showAlert('Error', 'Failed to load GridStack library', 'error');
      });
    }
    
    return () => {
      if (gridStack) {
        gridStack.destroy(false);
        setGridStack(null);
      }
    };
  }, []);
  
  // Add manual cut to GridStack
  const addManualCut = () => {
    if (!gridStack) {
      showAlert('Error', 'GridStack not initialized!', 'error');
      return;
    }
    
    // Check if base plate is created first
    if (!basePlateCreated) {
      showAlert('Error', 'Buat base plate terlebih dahulu!', 'error');
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
    
    // Calculate grid dimensions
    const gridWidth = Math.floor(cutWidth / blockSize);
    const gridHeight = Math.floor(cutHeight / blockSize);
    
    // Find first available position within base plate
    const basePlate = gridStack.getGridItems().find(item => item.id === 'base-plate');
    if (!basePlate) {
      showAlert('Error', 'Base plate not found!', 'error');
      return;
    }
    
    // Get base plate position and size
    const baseX = basePlate.x || 2;
    const baseY = basePlate.y || 2;
    const baseW = basePlate.w || 16;
    const baseH = basePlate.h || 12;
    
    console.log('Base plate position:', { baseX, baseY, baseW, baseH });
    console.log('Cut dimensions:', { gridWidth, gridHeight });
    
    // Find first available position within base plate
    let foundPosition = false;
    let cutX = baseX + 1; // Start inside base plate
    let cutY = baseY + 1;
    
    // Try to find available position by checking existing cuts
    const existingCuts = gridStack.getGridItems().filter(item => item.id !== 'base-plate');
    
    // Simple grid search for available position
    for (let y = baseY + 1; y <= baseY + baseH - gridHeight; y++) {
      for (let x = baseX + 1; x <= baseX + baseW - gridWidth; x++) {
        // Check if this position is available
        let positionAvailable = true;
        
        for (const existingCut of existingCuts) {
          const exX = existingCut.x;
          const exY = existingCut.y;
          const exW = existingCut.w;
          const exH = existingCut.h;
          
          // Check for overlap
          if (x < exX + exW && x + gridWidth > exX && y < exY + exH && y + gridHeight > exY) {
            positionAvailable = false;
            break;
          }
        }
        
        if (positionAvailable) {
          cutX = x;
          cutY = y;
          foundPosition = true;
          console.log('Found available position:', { cutX, cutY });
          break;
        }
      }
      if (foundPosition) break;
    }
    
    if (!foundPosition) {
      console.log('Cannot find available position in base plate');
      console.log('Required space:', { 
        neededWidth: gridWidth, 
        neededHeight: gridHeight,
        availableWidth: baseW - 2,
        availableHeight: baseH - 2
      });
    }
    
    if (!foundPosition) {
      showAlert('Error', `Cut terlalu besar! Butuh ${gridWidth}×${gridHeight} grid, tersedia ${baseW-2}×${baseH-2} grid di dalam base plate.`, 'error');
      return;
    }
    
    // Create cut element
    const cutElement = document.createElement('div');
    cutElement.className = 'grid-stack-item cut-item';
    cutElement.style.backgroundColor = cutColor;
    cutElement.style.border = '2px solid #333';
    cutElement.style.borderRadius = '6px';
    cutElement.style.position = 'relative';
    cutElement.innerHTML = `
      <div class="grid-stack-item-content" style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #333;
        font-size: 12px;
        font-weight: bold;
        background: linear-gradient(135deg, ${cutColor} 0%, ${cutColor}dd 100%);
        border-radius: 4px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        cursor: move;
        transition: all 0.2s ease;
        min-height: 60px;
      ">
        <div style="font-size: 14px; margin-bottom: 2px;">✂️ Cut</div>
        <div style="font-size: 11px; opacity: 0.9;">${cutWidth}×${cutHeight}cm</div>
        <div style="font-size: 10px; opacity: 0.7;">${cmToBlocks(cutWidth)}×${cmToBlocks(cutHeight)} blocks</div>
        <div style="
          position: absolute;
          top: 2px;
          right: 2px;
          background: #333;
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: bold;
        ">DRAG</div>
      </div>
    `;
    
    // Add hover effects
    cutElement.addEventListener('mouseenter', () => {
      cutElement.style.transform = 'scale(1.05)';
      cutElement.style.zIndex = '10';
      cutElement.style.boxShadow = '0 5px 10px rgba(0,0,0,0.4)';
    });
    
    cutElement.addEventListener('mouseleave', () => {
      cutElement.style.transform = 'scale(1)';
      cutElement.style.zIndex = '1';
      cutElement.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
    });
    
    // Add to GridStack (positioned within base plate bounds)
    gridStack.addWidget(cutElement, {
      x: cutX,
      y: cutY,
      w: gridWidth,
      h: gridHeight,
      id: `cut-${Date.now()}`,
      noResize: false,
      noMove: false,
      locked: false
    });
    
    showAlert('Success', `Cut ${formatDimension(cutWidth)} × ${formatDimension(cutHeight)} added!`, 'success');
  };
  
  // Clear all cuts (but keep base plate)
  const clearAllCuts = () => {
    if (!gridStack) return;
    
    // Remove only cut items, keep base plate
    const cutItems = gridStack.getGridItems().filter(item => item.id !== 'base-plate');
    cutItems.forEach(item => {
      gridStack.removeWidget(item.el, false);
    });
    
    showAlert('Success', 'All cuts cleared!', 'success');
  };
  
  // Reset base plate
  const resetBasePlate = () => {
    setBasePlateCreated(false);
    if (gridStack) {
      gridStack.removeAll();
    }
    showAlert('Success', 'Base plate reset! Create a new base plate to continue.', 'success');
  };
  
  // Create/Update base plate
  const createBasePlate = () => {
    if (!gridStack) return;
    
    // Check if base plate already exists
    if (basePlateCreated) {
      showAlert('Warning', 'Base plate sudah ada! Gunakan "Reset Base Plate" untuk membuat yang baru.', 'warning');
      return;
    }
    
    // Validate base plate dimensions
    const validationErrors = validateDimensions(baseWidth, mode === '2D' ? baseHeight : baseWidth);
    if (validationErrors.length > 0) {
      showAlert('Validation Error', validationErrors.join(', '), 'error');
      return;
    }
    
    // Clear existing items
    gridStack.removeAll();
    
    // Calculate grid dimensions - make base plate larger
    const gridColumns = Math.max(16, Math.floor(baseWidth / blockSize) + 4); // Minimum 16 columns, add 4 extra
    const gridRows = Math.max(12, Math.floor((mode === '2D' ? baseHeight : baseWidth) / blockSize) + 4); // Minimum 12 rows, add 4 extra
    
    // Update grid columns
    gridStack.column(gridColumns);
    
    // Create base plate container - make it large and prominent
    const basePlateElement = document.createElement('div');
    basePlateElement.className = 'grid-stack-item base-plate-container';
    basePlateElement.style.backgroundColor = baseColor;
    basePlateElement.style.border = '4px solid #4ade80';
    basePlateElement.style.borderRadius = '12px';
    basePlateElement.style.position = 'relative';
    basePlateElement.innerHTML = `
      <div class="grid-stack-item-content" style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #333;
        font-weight: bold;
        position: relative;
        background: linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 100%);
        border-radius: 8px;
        box-shadow: inset 0 4px 8px rgba(0,0,0,0.1);
        min-height: 200px;
      ">
        <div style="font-size: 18px; margin-bottom: 8px;">📐 Base Plate Container</div>
        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 4px;">${baseWidth}×${mode === '2D' ? baseHeight : baseWidth}cm</div>
        <div style="font-size: 12px; opacity: 0.6;">${cmToBlocks(baseWidth)}×${cmToBlocks(mode === '2D' ? baseHeight : baseWidth)} blocks</div>
        <div style="
          position: absolute;
          top: 8px;
          right: 8px;
          background: #4ade80;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
        ">CONTAINER</div>
        <div style="
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(0,0,0,0.1);
          color: #333;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: bold;
        ">Drag cuts here</div>
      </div>
    `;
    
    // Add base plate to grid (spans most of the grid area)
    gridStack.addWidget(basePlateElement, {
      x: 2, // Start at position 2 to leave some margin
      y: 2, // Start at position 2 to leave some margin
      w: gridColumns - 4, // Use most of the grid width
      h: gridRows - 4, // Use most of the grid height
      id: 'base-plate',
      noResize: true,
      noMove: true,
      locked: true
    });
    
    setBasePlateCreated(true);
    showAlert('Success', `Base plate container created: ${baseWidth}×${mode === '2D' ? baseHeight : baseWidth}cm (${cmToBlocks(baseWidth)}×${cmToBlocks(mode === '2D' ? baseHeight : baseWidth)} blocks)`, 'success');
  };
  
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">📦 GridStack Container System</h1>
            <p className="text-gray-600">Base plate as fixed container with draggable cuts inside - Perfect for puzzle-like placement</p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">📦 Container</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✂️ Draggable Cuts</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">🔗 Auto Grid</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">❌ No Overlap</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => window.close()}
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Controls Panel */}
        {showConfig && (
          <div className="w-72 bg-gray-50 border-r overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Mode Selection */}
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="text-sm font-medium mb-3">Mode</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setMode('1D')}
                    variant={mode === '1D' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    1D
                  </Button>
                  <Button
                    onClick={() => setMode('2D')}
                    variant={mode === '2D' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    2D
                  </Button>
                </div>
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
                    className={`w-full h-8 text-sm ${basePlateCreated ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={!baseWidth || (mode === '2D' && !baseHeight)}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    {basePlateCreated ? '✅ Container Ready' : 'Create Container'}
                  </Button>
                </div>
              </div>

              {/* Manual Cut Controls */}
              <div className={`bg-white rounded-lg p-3 border ${!basePlateCreated ? 'opacity-50' : ''}`}>
                <h3 className="text-sm font-medium mb-3">
                  Manual Cut
                  {!basePlateCreated && <span className="text-red-500 text-xs ml-2">(Buat base plate dulu!)</span>}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Lebar (cm) {cutWidth > 0 && <span className="text-blue-600">- {formatDimension(cutWidth)}</span>}
                    </label>
                    <Input
                      type="number"
                      value={cutWidth}
                      onChange={(e) => setCutWidth(parseFloat(e.target.value) || 0)}
                      disabled={!basePlateCreated}
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
                      disabled={!basePlateCreated}
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
                      disabled={!basePlateCreated}
                      className="h-8 w-full"
                    />
                  </div>
                  
                  <Button
                    onClick={addManualCut}
                    className="w-full h-8 text-sm"
                    disabled={!basePlateCreated || !cutWidth || !cutHeight}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {basePlateCreated ? 'Add Cut Inside Container' : 'Create Container First'}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg p-3 border">
                <h3 className="text-sm font-medium mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={clearAllCuts}
                    variant="destructive"
                    className="w-full h-8 text-sm"
                    disabled={!basePlateCreated}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Cuts
                  </Button>
                  <Button
                    onClick={resetBasePlate}
                    variant="outline"
                    className="w-full h-8 text-sm border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Base Plate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 bg-gray-100">
          <div className="h-full border-2 border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden">
            <div className="p-2 text-sm text-gray-600 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">GridStack Container System:</span> 
                  <span className="ml-2">📐 Base Plate = Fixed Container | ✂️ Cuts = Draggable Items</span>
                  <br />
                  <span className="text-xs text-blue-600">🎯 Drag & Drop Cuts | 🔗 Auto Grid | 📐 Block System | ❌ No Overlap</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${basePlateCreated ? 'text-green-600' : 'text-red-600'}`}>
                    {basePlateCreated ? '✅ Container Ready' : '❌ No Container'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {basePlateCreated ? 'Drag cuts inside container!' : 'Create base plate container first'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-full p-4">
              <div 
                ref={gridRef}
                className="grid-stack h-full"
                style={{ 
                  backgroundColor: basePlateCreated ? baseColor : '#f9f9f9',
                  minHeight: '400px',
                  border: basePlateCreated ? '2px solid #4ade80' : '2px dashed #ccc',
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                {!basePlateCreated && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📦</div>
                      <div className="text-lg font-semibold text-gray-700 mb-2">No Container Created</div>
                      <div className="text-sm text-gray-500 mb-4">
                        Create a base plate container to hold your cuts
                      </div>
                      <div className="text-xs text-gray-400">
                        {mode === '1D' ? '1D Mode: Only length required' : '2D Mode: Width and height required'}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-blue-700 font-medium">How it works:</div>
                        <div className="text-xs text-blue-600 mt-1">
                          1. Create base plate container<br/>
                          2. Add cuts as draggable items<br/>
                          3. Drag cuts around inside container
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* GridStack items will be added here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
