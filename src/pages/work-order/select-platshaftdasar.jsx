import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package, Ruler, Grid3X3 } from 'lucide-react';
import PlatShaftCanvas from '@/components/PlatShaftCanvas';
import { useAlert } from '@/hooks/useAlert';
import { request } from '@/lib/request';

export default function SelectPlatShaftDasar({ 
  jenisBarangId, 
  bentukBarangId, 
  gradeBarangId, 
  tebal, 
  totalDibutuhkan,
  workOrderItem,
  workOrderId, // Add workOrderId prop
  onSelectionChange,
  onClose,
  perPage = 6
}) {
  console.log('SelectPlatShaftDasar props:', {
    workOrderId: workOrderId,
    workOrderItem: workOrderItem,
    workOrderItemId: workOrderItem?.work_order_id
  });
  const { showAlert } = useAlert();
  const [saranItems, setSaranItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBentukBarang, setLoadingBentukBarang] = useState(false);
  const [totalTercukupi, setTotalTercukupi] = useState(0);
  const [bentukBarangInfo, setBentukBarangInfo] = useState(null);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  
  // Used saran plats tracking
  const [usedSaranPlats, setUsedSaranPlats] = useState([]);
  const [usedSaranPlatIds, setUsedSaranPlatIds] = useState([]);
  const [availableSaranPlats, setAvailableSaranPlats] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRefreshing, setAutoRefreshing] = useState(true);
  const refreshTimerRef = useRef(null);
  
  // Canvas state
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedCanvasItem, setSelectedCanvasItem] = useState(null);

  // Set workOrderUniqueId to storage when this menu opens
  useEffect(() => {
    if (workOrderItem?.id) {
      localStorage.setItem('WO_current_work_order_item_id', workOrderItem.id);
      console.log('Set workOrderItem.id to storage when opening menu:', workOrderItem.id);
    }
    
    // Cleanup when component unmounts
    return () => {
      localStorage.removeItem('WO_current_work_order_item_id');
      console.log('Cleared workOrderUniqueId from storage when closing menu');
    };
  }, [workOrderItem?.workOrderUniqueId]);

  // Load saran plat/shaft dasar when dependencies change
  useEffect(() => {
    const loadData = async () => {
      if (jenisBarangId && bentukBarangId && gradeBarangId && tebal) {
        await loadBentukBarangInfo();
        const usedIds = await loadUsedSaranPlats(); // Load used IDs first
        await loadSaranPlatDasar(usedIds); // Pass the IDs directly
      }
    };
    loadData();
  }, [jenisBarangId, bentukBarangId, gradeBarangId, tebal]);

  // Calculate remaining quantity from work item quantity - placed items in canvas
  const calculateRemainingQuantity = () => {
    if (workOrderItem?.qty) {
      const totalQty = parseInt(workOrderItem.qty) || 0;
      const currentWorkOrderId = workOrderId || 'unknown';
      const itemId = workOrderItem.id || 'unknown';
      
      // Calculate total quantity already arranged in canvas from WO_total_quantity
      let arrangedQuantity = 0;
      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
      const woItemId = workOrderItem.id;
      
      console.log('Looking for WO item in totalQuantityData:', {
        woItemId: woItemId,
        totalQuantityData: totalQuantityData,
        workOrderItem: workOrderItem
      });
      
      // Find WO item data with new format
      const woItemData = totalQuantityData.find(item => {
        const match = item.WoItemID === woItemId || 
                     item.WoItemID === parseInt(woItemId) ||
                     item.WoItemID === workOrderItem.id;
        console.log('Comparing WO item:', {
          itemWoItemID: item.WoItemID,
          woItemId: woItemId,
          workOrderItemId: workOrderItem.id,
          match: match
        });
        return match;
      });
      
      if (woItemData && woItemData.WOQuantity && Array.isArray(woItemData.WOQuantity)) {
        // Sum up all quantities from different saran plats
        arrangedQuantity = woItemData.WOQuantity.reduce((total, saranItem) => {
          return total + (parseInt(saranItem.Quantity) || 0);
        }, 0);
        console.log('Found total quantity for WO item', woItemId, ':', arrangedQuantity, 'from saran items:', woItemData.WOQuantity);
      } else {
        console.log('No data found for WO item', woItemId, 'in totalQuantityData:', totalQuantityData);
      }
      
      const remaining = Math.max(0, totalQty - arrangedQuantity);
      setRemainingQuantity(remaining);
      
      console.log('Remaining quantity calculation:', {
        totalQty: totalQty,
        arrangedQuantity: arrangedQuantity,
        remaining: remaining,
        usedSaranPlats: usedSaranPlats.length,
        workOrderItem: workOrderItem,
        totalQuantityData: totalQuantityData,
        woItemId: woItemId,
        woItemData: woItemData
      });
    }
  };

  // Calculate remaining quantity when usedSaranPlats changes
  useEffect(() => {
    calculateRemainingQuantity();
  }, [usedSaranPlats, workOrderItem]);

  // Also recalculate when component mounts or workOrderItem changes
  useEffect(() => {
    if (workOrderItem?.id) {
      console.log('WorkOrderItem changed, recalculating remaining quantity:', workOrderItem);
      calculateRemainingQuantity();
    }
  }, [workOrderItem?.id]);

  // Manual function to recalculate remaining quantity
  const recalculateRemainingQuantity = () => {
    calculateRemainingQuantity();
  };

  // Load used saran plats from localStorage
  const loadUsedSaranPlats = async () => {
    try {
      console.log('🔄 Loading used saran plats...');
      const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
      setUsedSaranPlatIds(usedSaranPlats);
      console.log('📦 Loaded used saran plats:', usedSaranPlats);
      
      // Always reload the full saran plats data to update both tables
      console.log('🔄 Reloading saran plat data...');
      await loadSaranPlatDasar(usedSaranPlats);
      console.log('✅ Saran plat data reloaded');
      
      return usedSaranPlats; // Return the IDs for immediate use
    } catch (error) {
      console.error('❌ Error loading used saran plats:', error);
      setUsedSaranPlatIds([]);
      setUsedSaranPlats([]);
      return [];
    }
  };

  // Listen for localStorage changes to refresh used saran plats
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'WO_used_saran_plats') {
        console.log('WO_used_saran_plats changed, reloading...');
        loadUsedSaranPlats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab changes)
    const handleCustomStorageChange = () => {
      console.log('🔔 Custom storage change detected, reloading used saran plats...');
      loadUsedSaranPlats();
    };

    window.addEventListener('usedSaranPlatsChanged', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('usedSaranPlatsChanged', handleCustomStorageChange);
    };
  }, []);


  // Load bentuk barang info to determine dimensi
  const loadBentukBarangInfo = async () => {
    setLoadingBentukBarang(true);
    try {
      const response = await request(`/bentuk-barang/${bentukBarangId}`);
      if (response.success && response.data) {
        setBentukBarangInfo(response.data);
      }
    } catch (error) {
      console.error('Error loading bentuk barang info:', error);
    } finally {
      setLoadingBentukBarang(false);
    }
  };

  // Calculate total tercukupi when selection changes
  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => sum + calculateSisaLuas(item), 0);
    setTotalTercukupi(total);
  }, [selectedItems, bentukBarangInfo]);

  // Function to calculate sisa luas based on bentuk barang
  const calculateSisaLuas = (item) => {
    if (!bentukBarangInfo) {
      const value = parseFloat(item.sisa_luas || 0);
      return isNaN(value) ? 0 : value;
    }
    
    // If bentuk barang is 1D, return panjang only
    if (bentukBarangInfo.dimensi === '1D') {
      const value = parseFloat(item.panjang || 0);
      return isNaN(value) ? 0 : value;
    }
    
    // If bentuk barang is 2D, return panjang x lebar
    if (bentukBarangInfo.dimensi === '2D') {
      const panjang = parseFloat(item.panjang || 0);
      const lebar = parseFloat(item.lebar || 0);
      const value = panjang * lebar;
      return isNaN(value) ? 0 : value;
    }
    
    // Fallback to original sisa_luas
    const value = parseFloat(item.sisa_luas || 0);
    return isNaN(value) ? 0 : value;
  };

  const loadSaranPlatDasar = async (usedIds = []) => {
    setLoading(true);
    try {
      const response = await request(`/work-order-planning/get-saran-plat-dasar?per_page=${perPage}&page=1`, {
        method: 'POST',
        body: JSON.stringify({
          jenis_barang_id: jenisBarangId,
          bentuk_barang_id: bentukBarangId,
          grade_barang_id: gradeBarangId,
          tebal: tebal,
          panjang: parseFloat(workOrderItem?.panjang || 0),
          lebar: parseFloat(workOrderItem?.lebar || 0),
          per_page: perPage,
          page: 1
        })
      });

      if (response.success) {
        const allSaranItems = (response.data || []).slice(0, perPage);
        
        // Use the passed usedIds parameter
        const currentUsedIds = usedIds || [];
        
        // Filter out used saran plats (handle both string and number IDs)
        const availableItems = allSaranItems.filter(item => {
          const itemId = item.id.toString();
          return !currentUsedIds.includes(itemId) && !currentUsedIds.includes(parseInt(itemId));
        });
        const usedItems = allSaranItems.filter(item => {
          const itemId = item.id.toString();
          return currentUsedIds.includes(itemId) || currentUsedIds.includes(parseInt(itemId));
        });
        
        console.log('Saran plat separation:', {
          totalItems: allSaranItems.length,
          availableItems: availableItems.length,
          usedItems: usedItems.length,
          usedIds: currentUsedIds,
          allItems: allSaranItems.map(item => ({ id: item.id, nama: item.nama }))
        });
        
        // Set available items (yang belum digunakan)
        setSaranItems(availableItems);
        setAvailableSaranPlats(availableItems);
        
        // Set used items (yang sudah digunakan)
        setUsedSaranPlats(usedItems);
        setRetryCount(0);
      } else {
        showAlert('Error', 'Gagal memuat saran plat/shaft dasar', 'error');
      }
    } catch (error) {
      console.error('Error loading saran plat dasar:', error);
      showAlert('Error', 'Gagal memuat saran plat/shaft dasar', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRefreshing) return;
    if (loading) return;
    if (saranItems.length > 0) return;
    if (!jenisBarangId || !bentukBarangId || !gradeBarangId || !tebal) return;
    if (retryCount >= 4) return;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      setRetryCount((c) => c + 1);
      loadSaranPlatDasar(usedSaranPlatIds);
    }, Math.min(1200 * Math.pow(1.4, retryCount), 3000));
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [autoRefreshing, loading, saranItems.length, jenisBarangId, bentukBarangId, gradeBarangId, tebal, retryCount, usedSaranPlatIds]);

  const handleItemSelection = (item, checked) => {
    if (checked) {
      setSelectedItems(prev => {
        const newItems = [...prev, item];
        console.log('Item selected:', { item, newCount: newItems.length, newItems });
        return newItems;
      });
    } else {
      setSelectedItems(prev => {
        const newItems = prev.filter(selected => selected.id !== item.id);
        console.log('Item deselected:', { item, newCount: newItems.length, newItems });
        return newItems;
      });
    }
  };


  const handleOpenCanvas = (item) => {
    console.log('Opening canvas for item:', {
      item: item,
      workOrderId: workOrderId,
      workOrderItem: workOrderItem
    });
    
    // Ensure workOrderId is available
    if (!workOrderId) {
      showAlert('Error', 'Work Order ID not available. Please refresh and try again.', 'error');
      return;
    }
    
    setSelectedCanvasItem(item);
    setShowCanvas(true);
  };

  const handleCanvasClose = () => {
    setShowCanvas(false);
    setSelectedCanvasItem(null);
    
    // Recalculate remaining quantity when canvas is closed
    console.log('Canvas closed, recalculating remaining quantity...');
    setTimeout(() => {
      calculateRemainingQuantity();
    }, 100);
  };

  // Function to check if WO_current_work_order_id exists in canvas
  const checkWOInCanvas = (workOrderId) => {
    try {
      console.log('=== CHECKING WO IN CANVAS ===');
      console.log('Work Order ID to check:', workOrderId);
      
      // Get current work order ID from localStorage
      const currentWorkOrderId = localStorage.getItem('WO_current_work_order_id');
      console.log('Current Work Order ID from storage:', currentWorkOrderId);
      
      if (!currentWorkOrderId) {
        console.log('❌ No current work order ID found in storage');
        return false;
      }
      
      // Check if workOrderId matches current work order ID
      if (workOrderId !== currentWorkOrderId) {
        console.log('❌ Work Order ID does not match current work order ID');
        return false;
      }
      
      // Check canvas data for current WO ID
      const canvasKey = `canvas_layout_${workOrderId}`;
      const canvasData = localStorage.getItem(canvasKey);
      
      if (!canvasData) {
        console.log('❌ No canvas data found for current WO ID');
        return false;
      }
      
      const parsedCanvasData = JSON.parse(canvasData);
      const hasBoxes = parsedCanvasData.boxes && Array.isArray(parsedCanvasData.boxes) && parsedCanvasData.boxes.length > 0;
      
      if (!hasBoxes) {
        console.log('❌ No boxes found in canvas data');
        return false;
      }
      
      console.log('✅ WO exists in canvas with boxes');
      return true;
      
    } catch (error) {
      console.error('❌ Error checking WO in canvas:', error);
      return false;
    }
  };

  // Function to add saran item ID to used saran plats (avoid duplicates)
  const addSaranItemIdToUsedSaranPlats = (saranItemId, workOrderUniqueId) => {
    try {
      console.log('=== ADDING SARAN ITEM ID TO USED SARAN PLATS ===');
      console.log('Saran Item ID:', saranItemId);
      console.log('Work Order Unique ID:', workOrderUniqueId);
      
      // Get current used saran plats array
      const usedSaranPlatsData = localStorage.getItem('WO_used_saran_plats');
      let usedSaranPlats = [];
      
      if (usedSaranPlatsData) {
        usedSaranPlats = JSON.parse(usedSaranPlatsData);
        if (!Array.isArray(usedSaranPlats)) {
          usedSaranPlats = [];
        }
      }
      
      // Check if saran item ID already exists
      const existingItem = usedSaranPlats.find(item => 
        item.saranItemId === saranItemId && item.workOrderUniqueId === workOrderUniqueId
      );
      
      if (existingItem) {
        console.log('✅ Saran item ID already exists in used saran plats');
        return;
      }
      
      // Add new saran item ID
      const newItem = {
        saranItemId: saranItemId,
        workOrderUniqueId: workOrderUniqueId,
        addedAt: new Date().toISOString()
      };
      
      usedSaranPlats.push(newItem);
      
      // Update localStorage
      localStorage.setItem('WO_used_saran_plats', JSON.stringify(usedSaranPlats));
      console.log('✅ Added saran item ID to used saran plats');
      console.log('📦 Total used saran plats:', usedSaranPlats.length);
      
    } catch (error) {
      console.error('❌ Error adding saran item ID to used saran plats:', error);
    }
  };

  // Mark saran plat as used when canvas is saved
  const markSaranPlatAsUsed = (saranItem) => {
    try {
      // Always use workOrderId prop, don't rely on workOrderItem.work_order_id
      const currentWorkOrderId = workOrderId || 'unknown';
      console.log('markSaranPlatAsUsed called with:', {
        saranItem: saranItem,
        workOrderItem: workOrderItem,
        workOrderId: workOrderId,
        currentWorkOrderId: currentWorkOrderId
      });
      
      // Check if current WO exists in canvas
      const woExistsInCanvas = checkWOInCanvas(currentWorkOrderId);
      
      if (!woExistsInCanvas) {
        console.log('❌ Current WO does not exist in canvas, skipping saran plat save');
        return;
      }
      
      // Add saran item ID to used saran plats with enhanced structure
      addSaranItemIdToUsedSaranPlats(saranItem.id.toString(), currentWorkOrderId);
      
      // Legacy logic for backward compatibility
      const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
      
      // Add saran plat to used list if not already there (legacy format)
      const saranId = saranItem.id.toString();
      
      // Check if ID already exists (as string or number)
      const alreadyExists = usedSaranPlats.includes(saranId) || usedSaranPlats.includes(parseInt(saranId));
      
      if (!alreadyExists) {
        usedSaranPlats.push(saranId);
        localStorage.setItem('WO_used_saran_plats', JSON.stringify(usedSaranPlats));
        
        console.log('Marked saran plat as used (legacy format):', {
          workOrderId: currentWorkOrderId,
          saranId: saranItem.id,
          saranName: saranItem.nama
        });
      }
      
      // Add to selected items if not already selected
      setSelectedItems(prev => {
        const isAlreadySelected = prev.some(selected => selected.id === saranItem.id);
        if (!isAlreadySelected) {
          const newSelectedItems = [...prev, saranItem];
          console.log('Added to selected items:', { saranItem, newCount: newSelectedItems.length });
          return newSelectedItems;
        }
        return prev;
      });
      
      // Update the used IDs state and reload
      setUsedSaranPlatIds(usedSaranPlats);
      
      // Reload saran plats to update the separation
      loadSaranPlatDasar(usedSaranPlats);
      
      // Trigger remaining quantity recalculation after canvas save
      console.log('Triggering remaining quantity recalculation after canvas save');
      setTimeout(() => {
        console.log('Recalculating remaining quantity after canvas save...');
        calculateRemainingQuantity();
      }, 100); // Reduce timeout for faster UI update
    } catch (error) {
      console.error('Error marking saran plat as used:', error);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Main Modal */}
      <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-300 ${showCanvas ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        <Card>
          <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6" />
            SARAN PLAT/SHAFT DASAR
          </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Recommendation Logic Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Logic Saran plat/shaft dasar:</p>
                <p>Mengurutkan plat/shaft yang memiliki JENIS, BENTUK, GRADE, dan TEBAL yang sama dari yang luasnya terkecil, sampai terbesar, dengan syarat muat untuk dipotong sesuai dengan jumlah x ukuran potongan</p>
              </div>
            </div>

            {/* Summary Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Total {bentukBarangInfo?.dimensi === '1D' ? 'panjang' : 'luas'} dibutuhkan:</span>
                </div>
                <p className="text-blue-700">{totalDibutuhkan} × 110% (toleransi)</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">{bentukBarangInfo?.dimensi === '1D' ? 'Panjang' : 'Luas'} tercukupi:</span>
                </div>
                <p className="text-green-700 text-xl font-semibold">{totalTercukupi.toFixed(2)}</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="mb-2">
                  <span className="font-medium text-purple-800">Dimensi:</span>
                </div>
                <p className="text-purple-700 font-semibold">
                  {loadingBentukBarang ? 'Loading...' : 
                   bentukBarangInfo?.dimensi === '1D' ? '1D (Panjang saja)' : 
                   bentukBarangInfo?.dimensi === '2D' ? '2D (Panjang × Lebar)' : 
                   'Unknown'}
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Sisa Quantity:</span>
                </div>
                <p className="text-orange-700 text-xl font-semibold">
                  {remainingQuantity}
                </p>
                <p className="text-orange-600 text-xs mt-1">
                  {workOrderItem?.qty ? `Dari total ${workOrderItem.qty} item` : 'Tidak ada data item'}
                </p>
              </div>
            </div>


            {/* Used Saran Plats Table */}
            {usedSaranPlats.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Saran Plat yang Sudah Dipakai
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Nama Barang
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Ukuran
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Sisa {bentukBarangInfo?.dimensi === '1D' ? 'Panjang' : 'Luas'}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Canvas
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {usedSaranPlats.map((item, index) => (
                        <tr key={item.id} className="bg-orange-50">
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                              Sudah Dipakai
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {item.nama || 'Nama Item Barang'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-700">
                              {item.ukuran || 'Ukuran'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-700">
                              {item.sisa_luas || 'Sisa Luas'}
                              {bentukBarangInfo?.dimensi === '2D' && (
                                <div className="text-xs text-gray-500">
                                  Panjang × Lebar
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenCanvas(item)}
                              className="flex items-center gap-1"
                            >
                              <Grid3X3 className="w-4 h-4" />
                              Canvas
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Available Saran Plats Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Saran Plat yang Tersedia
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRetryCount(0);
                      loadSaranPlatDasar(usedSaranPlatIds);
                    }}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                  <Checkbox
                    checked={autoRefreshing}
                    onCheckedChange={(v) => setAutoRefreshing(Boolean(v))}
                    className="ml-2"
                  />
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-12">
                        Pilih
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Nama Barang
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Ukuran
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Sisa {bentukBarangInfo?.dimensi === '1D' ? 'Panjang' : 'Luas'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Canvas
                      </th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : saranItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        Tidak ada saran plat/shaft dasar yang sesuai
                      </td>
                    </tr>
                  ) : (
                    saranItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedItems.some(selected => selected.id === item.id)}
                            onCheckedChange={(checked) => handleItemSelection(item, checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {item.nama || 'Nama Item Barang'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-700">
                            {item.ukuran || 'Ukuran'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Badge variant="secondary" className="font-mono">
                              {calculateSisaLuas(item).toFixed(2)}
                            </Badge>
                            {bentukBarangInfo && (
                              <div className="text-xs text-gray-500">
                                {bentukBarangInfo.dimensi === '1D' ? 'Panjang' : 'Panjang × Lebar'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCanvas(item)}
                            className="text-xs"
                          >
                            <Grid3X3 className="w-3 h-3 mr-1" />
                            Canvas
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Tutup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Canvas Overlay */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${showCanvas ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <PlatShaftCanvas
          isOpen={showCanvas}
          onClose={handleCanvasClose}
          selectedItem={selectedCanvasItem}
          workOrderItem={workOrderItem}
          workOrderId={workOrderId}
          onCanvasSaved={markSaranPlatAsUsed}
        />
      </div>
    </div>
  );
}
