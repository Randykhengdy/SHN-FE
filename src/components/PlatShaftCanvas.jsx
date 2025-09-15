import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlatShaftCanvasPage from '@/pages/work-order/PlatShaftCanvasPage';

export default function PlatShaftCanvas({ 
  isOpen, 
  onClose, 
  selectedItem, 
  workOrderItem,
  workOrderId, // Add workOrderId as prop
  onCanvasSaved // Add callback for when canvas is saved
}) {
  const navigate = useNavigate();

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
  

  if (!isOpen) return null;

  // Always use the provided workOrderId
  const getWorkOrderId = () => {
    return workOrderId || 'unknown';
  };

  // Store data in sessionStorage for the canvas
  const canvasData = {
    selectedItem,
    workOrderItem,
    platPanjang,
    platLebar,
    itemPanjang,
    itemLebar,
    itemQty,
    workOrderId: getWorkOrderId(),
    itemId: workOrderItem?.id || selectedItem?.id || 'unknown',
    itemName: workOrderItem?.nama_item_barang || selectedItem?.nama || 'Unknown Item'
  };
  
  sessionStorage.setItem('WO_canvasData', JSON.stringify(canvasData));

  // Always show canvas directly
  return (
    <div className="fixed inset-0 z-50">
      <PlatShaftCanvasPage 
        hideTitle={true} 
        onClose={onClose} 
        onCanvasSaved={onCanvasSaved}
      />
    </div>
  );
}