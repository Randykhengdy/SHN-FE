import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';

export default function SimpleGridTestingPage() {
  const { showAlert } = useAlert();
  
  // Simple state
  const [boxes, setBoxes] = useState([]);
  const [baseContainer, setBaseContainer] = useState({ width: 10, height: 10, x: 0, y: 0 }); // Grid units
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedBoxId, setDraggedBoxId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [gridSize, setGridSize] = useState(50);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [newBoxSize, setNewBoxSize] = useState({ width: 1, height: 1 });
  const boxRefs = useRef({});
  
  // Smooth drag and drop functions
  const handleMouseDown = (e, boxId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const boxRef = boxRefs.current[boxId];
    if (boxRef) {
      const rect = boxRef.getBoundingClientRect();
      const containerRect = boxRef.parentElement.getBoundingClientRect();
      
      // Calculate offset from mouse to box center
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      setIsDragging(true);
      setDraggedBoxId(boxId);
      setDragOffset({
        x: offsetX,
        y: offsetY
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !draggedBoxId) return;
    
    // Get container bounds
    const container = document.querySelector('.grid-container');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    // Calculate new position relative to container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Calculate grid position
    const gridX = Math.round((mouseX - dragOffset.x) / gridSize) * gridSize;
    const gridY = Math.round((mouseY - dragOffset.y) / gridSize) * gridSize;
    
    // Get the dragged box to check its size
    const draggedBox = boxes.find(box => box.id === draggedBoxId);
    const boxWidth = (draggedBox?.width || 1) * gridSize;
    const boxHeight = (draggedBox?.height || 1) * gridSize;
    
    // Clamp to base container bounds (convert to grid units)
    const containerWidthPx = baseContainer.width * gridSize;
    const containerHeightPx = baseContainer.height * gridSize;
    const clampedX = Math.max(baseContainer.x * gridSize, Math.min(gridX, (baseContainer.x + baseContainer.width) * gridSize - boxWidth));
    const clampedY = Math.max(baseContainer.y * gridSize, Math.min(gridY, (baseContainer.y + baseContainer.height) * gridSize - boxHeight));
    
    // Show preview of where the box will be placed
    setPreviewPosition({ x: clampedX, y: clampedY });
    
    // Update position smoothly
    setBoxes(prevBoxes => 
      prevBoxes.map(box => 
        box.id === draggedBoxId 
          ? { ...box, x: clampedX, y: clampedY }
          : box
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedBoxId(null);
    setPreviewPosition(null);
  };

  // Add event listeners
  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragOffset, isDragging, draggedBoxId, gridSize, zoom]);
  
  // Zoom functions
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
    setGridSize(prev => Math.min(prev + 10, 150));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
    setGridSize(prev => Math.max(prev - 10, 20));
  };

  const resetZoom = () => {
    setZoom(1);
    setGridSize(50);
  };

  // Base container functions
  const updateBaseContainer = (width, height) => {
    setBaseContainer(prev => ({ ...prev, width: width, height: height }));
  };

  const clearAllBoxes = () => {
    setBoxes([]);
    showAlert('Success', 'All boxes cleared!', 'success');
  };
  
  // Add new box
  const addBox = () => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const newId = boxes.length > 0 ? Math.max(...boxes.map(b => b.id)) + 1 : 1;
    const newColor = colors[(newId - 1) % colors.length];
    
    // Check if box fits in base container
    if (newBoxSize.width > baseContainer.width || newBoxSize.height > baseContainer.height) {
      showAlert('Error', `Box size (${newBoxSize.width}×${newBoxSize.height}) is too big for container (${baseContainer.width}×${baseContainer.height})`, 'error');
      return;
    }
    
    setBoxes(prevBoxes => [...prevBoxes, { 
      id: newId, 
      x: baseContainer.x * gridSize, 
      y: baseContainer.y * gridSize, 
      width: newBoxSize.width,
      height: newBoxSize.height,
      color: newColor 
    }]);
    showAlert('Success', `Box ${newId} (${newBoxSize.width}×${newBoxSize.height}) added!`, 'success');
  };

  // Remove box
  const removeBox = (boxId) => {
    setBoxes(prevBoxes => prevBoxes.filter(box => box.id !== boxId));
    showAlert('Success', `Box ${boxId} removed!`, 'success');
  };

  // Reset all boxes
  const resetAllBoxes = () => {
    setBoxes(prevBoxes => 
      prevBoxes.map(box => ({ ...box, x: 0, y: 0 }))
    );
    showAlert('Success', 'All boxes reset to top-left!', 'success');
  };

  
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">📦 Simple Drag Box</h1>
            <p className="text-gray-600">One box that can move around in a grid - Super simple!</p>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">📦 One Box</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">🖱️ Drag & Drop</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">📐 Grid Snap</span>
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
        <div className="w-72 bg-gray-50 border-r overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Box Info */}
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">Boxes Info</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Total Boxes:</span> {boxes.length}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Dragging:</span> {isDragging ? 'Yes' : 'No'}
                </div>
                {draggedBoxId && (
                  <div className="text-sm">
                    <span className="font-medium">Dragged Box:</span> {draggedBoxId}
                  </div>
                )}
                {previewPosition && (
                  <div className="text-sm text-blue-600">
                    <span className="font-medium">Preview:</span> {Math.round(previewPosition.x / gridSize)}×{Math.round(previewPosition.y / gridSize)}
                  </div>
                )}
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
                      max="20"
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
                      max="20"
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
                  onClick={resetAllBoxes}
                  className="w-full h-8 text-sm bg-blue-600 hover:bg-blue-700"
                >
                  Reset All Positions
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
            <div className="bg-white rounded-lg p-3 border">
              <h3 className="text-sm font-medium mb-3">Zoom Controls</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Zoom:</span> {Math.round(zoom * 100)}%
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Grid Size:</span> {gridSize}px
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
                <div>• Boxes snap to grid positions</div>
                <div>• Each grid cell is {gridSize}px × {gridSize}px</div>
                <div>• Right-click box to remove it</div>
                <div>• Use "Add New Box" for more boxes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 bg-gray-100">
          <div className="h-full border-2 border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden">
            <div className="p-2 text-sm text-gray-600 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Simple Drag Boxes:</span> 
                  <span className="ml-2">🖱️ Click and drag any box to move it around</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    ✅ {boxes.length} Boxes Ready
                  </div>
                  <div className="text-xs text-gray-500">
                    Drag boxes around!
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-full p-4 relative overflow-auto">
              {/* Grid Background */}
              <div 
                className="absolute inset-4 grid-container"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                  backgroundColor: '#f9fafb'
                }}
              >
                {/* Base Container */}
                <div
                  className="absolute border-4 border-gray-400 bg-gray-100 bg-opacity-20"
                  style={{
                    left: baseContainer.x * gridSize * zoom,
                    top: baseContainer.y * gridSize * zoom,
                    width: `${baseContainer.width * gridSize * zoom}px`,
                    height: `${baseContainer.height * gridSize * zoom}px`,
                    zIndex: 1
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs font-bold text-gray-600">
                    Base: {baseContainer.width}×{baseContainer.height}
                  </div>
                </div>

                {/* Draggable Boxes */}
                {boxes.map((box) => (
                  <div
                    key={box.id}
                    ref={(el) => { boxRefs.current[box.id] = el; }}
                    className={`absolute w-12 h-12 border-2 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-lg select-none ${
                      isDragging && draggedBoxId === box.id ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    style={{
                      backgroundColor: box.color,
                      borderColor: box.color,
                      left: box.x * zoom,
                      top: box.y * zoom,
                      width: `${(box.width || 1) * gridSize * zoom}px`,
                      height: `${(box.height || 1) * gridSize * zoom}px`,
                      transform: (isDragging && draggedBoxId === box.id) ? 'scale(1.05) rotate(2deg)' : 'scale(1) rotate(0deg)',
                      transition: (isDragging && draggedBoxId === box.id) ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: (isDragging && draggedBoxId === box.id) ? 1000 : 1,
                      boxShadow: (isDragging && draggedBoxId === box.id) ? '0 10px 25px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, box.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      removeBox(box.id);
                    }}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{box.id}</div>
                      <div className="text-xs opacity-80">{box.width || 1}×{box.height || 1}</div>
                    </div>
                  </div>
                ))}
                
                {/* Preview Overlay */}
                {previewPosition && isDragging && (() => {
                  const draggedBox = boxes.find(box => box.id === draggedBoxId);
                  return (
                    <>
                      {/* Grid Cell Highlight */}
                      <div
                        className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                        style={{
                          left: previewPosition.x * zoom,
                          top: previewPosition.y * zoom,
                          width: `${(draggedBox?.width || 1) * gridSize * zoom}px`,
                          height: `${(draggedBox?.height || 1) * gridSize * zoom}px`,
                          zIndex: 998
                        }}
                      />
                      
                      {/* Drop Preview Box */}
                      <div
                        className="absolute border-2 border-dashed border-blue-400 bg-blue-100 bg-opacity-50 rounded-lg pointer-events-none"
                        style={{
                          left: previewPosition.x * zoom,
                          top: previewPosition.y * zoom,
                          width: `${(draggedBox?.width || 1) * gridSize * zoom}px`,
                          height: `${(draggedBox?.height || 1) * gridSize * zoom}px`,
                          zIndex: 999
                        }}
                      >
                        <div className="w-full h-full flex flex-col items-center justify-center text-blue-600 font-bold text-sm">
                          <div>Drop</div>
                          <div className="text-xs opacity-80">{(draggedBox?.width || 1)}×{(draggedBox?.height || 1)}</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
