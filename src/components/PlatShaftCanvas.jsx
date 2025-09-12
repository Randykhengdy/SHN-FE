import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Move, ExternalLink, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PlatShaftCanvasPage from '@/pages/work-order/PlatShaftCanvasPage';

export default function PlatShaftCanvas({ 
  isOpen, 
  onClose, 
  selectedItem, 
  workOrderItem 
}) {
  const navigate = useNavigate();
  const [showCanvas, setShowCanvas] = useState(false);

  // Calculate dimensions based on work order item
  const itemPanjang = parseFloat(workOrderItem?.panjang || 0);
  const itemLebar = parseFloat(workOrderItem?.lebar || 0);
  const itemQty = parseInt(workOrderItem?.qty || 1);

  // Calculate plat/shaft dimensions (base boundary)
  const extractDimensions = (ukuran) => {
    if (!ukuran) return { panjang: 0, lebar: 0 };
    
    const parts = ukuran.toString().split('x').map(part => part.trim());
    const panjang = parseFloat(parts[0]) || 0;
    const lebar = parts[1] ? parseFloat(parts[1]) : 0;
    
    return { panjang, lebar };
  };

  const { panjang: platPanjang, lebar: platLebar } = extractDimensions(selectedItem?.ukuran);
  
  const handleOpenCanvas = () => {
    // Store data in sessionStorage for the canvas
    const canvasData = {
      selectedItem,
      workOrderItem,
      platPanjang,
      platLebar,
      itemPanjang,
      itemLebar,
      itemQty
    };
    
    sessionStorage.setItem('canvasData', JSON.stringify(canvasData));
    
    // Show the canvas
    setShowCanvas(true);
  };

  const handleBackToModal = () => {
    setShowCanvas(false);
  };

  if (!isOpen) return null;

  // If canvas is shown, render the full canvas page
  if (showCanvas) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToModal}
            className="flex items-center gap-2 bg-white shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Modal
          </Button>
        </div>
        <PlatShaftCanvasPage hideTitle={true} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Move className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Canvas Grid - Saran Plat</h2>
              <p className="text-sm text-gray-600">Advanced canvas system for work order visualization</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Saran Plat Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  Saran Plat (Base Container)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                  <span className="text-gray-600">Dimensi:</span>
                  <span className="font-medium">{platPanjang} × {platLebar} units</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">Tebal:</span>
                  <span className="font-medium">0.50mm</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium text-blue-600">{selectedItem?.nama || 'N/A'}</span>
              </div>
              </CardContent>
            </Card>

            {/* Work Items Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  Work Items (Boxes)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-bold text-green-600">{itemQty}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">Item Size:</span>
                  <span className="font-medium">{itemPanjang} × {itemLebar} units</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{itemQty}</span>
              </div>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">Canvas Features</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Drag & Drop Boxes
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Zoom & Pan
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Grid Alignment
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Collision Detection
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Multi-Selection
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Export/Import
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleOpenCanvas}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Advanced Canvas
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
      </div>

          {/* Note */}
          <div className="text-xs text-gray-500 text-center">
            This will open the advanced canvas system with all your work order data pre-loaded
          </div>
        </div>
      </div>
    </div>
  );
}