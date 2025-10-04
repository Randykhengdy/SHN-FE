import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSelect from '@/components/ui/search-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, Users, Package, Grid3X3, X, Eye } from 'lucide-react';
import SelectPlatShaftDasar from './select-platshaftdasar';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { workOrderService } from '@/services/workOrderService';
import { request } from '@/lib/request';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from '@/components/Table';
import PelaksanaModal from '@/components/modals/PelaksanaModal';
import WorkOrderItemEditModal from '@/components/modals/WorkOrderItemEditModal';
import PlatPreviewModal from '@/components/PlatPreviewModal';
// Import test utilities for development
import '@/lib/canvasPreviewTest';
import '@/lib/canvasPreviewDemo';
import { 
  getGudangOptions, 
  getJenisBarangOptions, 
  getBentukBarangOptions, 
  getGradeBarangOptions,
  getPelangganFromSOHeader,
  getPelaksanaOptions,
  getPelangganOptions,
  getSalesOrderOptions
} from '@/services/masterDataService';

export default function AddWorkOrderPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  
  // Work Order Planning State
  const [workOrderData, setWorkOrderData] = useState({
    nomor_wo: '',
    tanggal_wo: new Date().toISOString().split('T')[0],
    tanggal_target: '',
    gudang_id: '',
    pelanggan_id: '',
    sales_order_id: '',
    catatan: '',
    status: 'Pending',
    prioritas: 'MEDIUM'
  });

  // Work Order Items State
  const [workOrderItems, setWorkOrderItems] = useState([]);

  // Work Order ID State - generate new ID every time page is opened
  const [workOrderId, setWorkOrderId] = useState(() => {
    // Clear all WO_ storage first
    console.log('Clearing all WO_ storage before generating new ID');
    const keys = Object.keys(localStorage);
    const woKeys = keys.filter(key => key.startsWith('WO_'));
    woKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('Removed storage key:', key);
    });
    console.log(`Cleared ${woKeys.length} WO_ storage keys`);
    
    // Always generate a new work order ID when opening add WO page
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const newWorkOrderId = `wo_${timestamp}_${random}`;
    
    // Store the new ID in localStorage for this session
    localStorage.setItem('WO_current_work_order_id', newWorkOrderId);
    
    console.log('Generated new work order ID:', newWorkOrderId);
    return newWorkOrderId;
  });

  // Master Data State
  const [gudangList, setGudangList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [jenisBarangList, setJenisBarangList] = useState([]);
  const [bentukBarangList, setBentukBarangList] = useState([]);
  const [gradeBarangList, setGradeBarangList] = useState([]);
  const [pelaksanaList, setPelaksanaList] = useState([]);
  const [salesOrderList, setSalesOrderList] = useState([]);

  // Sales Order Detail State
  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);
  const [loadingSalesOrderDetail, setLoadingSalesOrderDetail] = useState(false);

  // Plat Dasar State
  const [showPlatDasarModal, setShowPlatDasarModal] = useState(false);
  const [currentItemData, setCurrentItemData] = useState(null);
  const [selectedPlatDasar, setSelectedPlatDasar] = useState({});
  
  // Plat Preview Modal State
  const [showPlatPreviewModal, setShowPlatPreviewModal] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Loading State
  const [loading, setLoading] = useState(false);
  const [loadingGudang, setLoadingGudang] = useState(false);
  const [loadingPelanggan, setLoadingPelanggan] = useState(false);
  const [loadingJenisBarang, setLoadingJenisBarang] = useState(false);
  const [loadingBentukBarang, setLoadingBentukBarang] = useState(false);
  const [loadingGradeBarang, setLoadingGradeBarang] = useState(false);
  const [loadingPelaksana, setLoadingPelaksana] = useState(false);
  const [loadingSalesOrder, setLoadingSalesOrder] = useState(false);

  // UI State for pelaksana modal
  const [pelaksanaModalOpen, setPelaksanaModalOpen] = useState(false);
  const [pelaksanaModalItemId, setPelaksanaModalItemId] = useState(null);

  // UI State for work order item edit modal
  const [itemEditModalOpen, setItemEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const openPelaksanaModal = (itemId) => {
    setPelaksanaModalItemId(itemId);
    setPelaksanaModalOpen(true);
  };

  const savePelaksanaForItem = (rows) => {
    if (!pelaksanaModalItemId) return;
    updateWorkOrderItem(pelaksanaModalItemId, 'pelaksana', rows);
  };

  // Work Order Item Edit Modal functions
  const openItemEditModal = (item) => {
    setEditingItem(item);
    setItemEditModalOpen(true);
  };

  // Check if item is new (not in workOrderItems yet)
  const isNewItem = (item) => {
    return !workOrderItems.some(workItem => workItem.id === item.id);
  };

  const closeItemEditModal = () => {
    setItemEditModalOpen(false);
    setEditingItem(null);
  };

  const saveItemEdit = (updatedItemData) => {
    if (!editingItem) return;
    
    // Check if this is a new item (not in workOrderItems yet)
    const existingItem = workOrderItems.find(item => item.id === editingItem.id);
    
    if (existingItem) {
      // Update existing item
      updateWorkOrderItem(editingItem.id, null, updatedItemData);
    } else {
      // Add new item
      setWorkOrderItems(prev => [...prev, { ...editingItem, ...updatedItemData }]);
    }
  };

  // Helper functions to get display values
  const getJenisBarangName = (jenisBarangId) => {
    // First try to get from selected sales order items
    if (selectedSalesOrder && selectedSalesOrder.sales_order_items) {
      const soItem = selectedSalesOrder.sales_order_items.find(item => item.jenis_barang_id === jenisBarangId);
      if (soItem && soItem.jenis_barang) {
        return soItem.jenis_barang.nama_jenis;
      }
    }
    
    // Fallback to master data list
    const jenis = jenisBarangList.find(item => item.value === jenisBarangId);
    return jenis ? jenis.label : 'Belum dipilih';
  };

  const getBentukBarangName = (bentukBarangId) => {
    // First try to get from selected sales order items
    if (selectedSalesOrder && selectedSalesOrder.sales_order_items) {
      const soItem = selectedSalesOrder.sales_order_items.find(item => item.bentuk_barang_id === bentukBarangId);
      if (soItem && soItem.bentuk_barang) {
        return soItem.bentuk_barang.nama_bentuk;
      }
    }
    
    // Fallback to master data list
    const bentuk = bentukBarangList.find(item => item.value === bentukBarangId);
    return bentuk ? bentuk.label : 'Belum dipilih';
  };

  const getGradeBarangName = (gradeBarangId) => {
    // First try to get from selected sales order items
    if (selectedSalesOrder && selectedSalesOrder.sales_order_items) {
      const soItem = selectedSalesOrder.sales_order_items.find(item => item.grade_barang_id === gradeBarangId);
      if (soItem && soItem.grade_barang) {
        return soItem.grade_barang.nama;
      }
    }
    
    // Fallback to master data list
    const grade = gradeBarangList.find(item => item.value === gradeBarangId);
    return grade ? grade.label : 'Belum dipilih';
  };



  // Sync workOrderId with localStorage on component mount
  useEffect(() => {
    const storedWorkOrderId = localStorage.getItem('WO_current_work_order_id');
    if (storedWorkOrderId && storedWorkOrderId !== workOrderId) {
      console.log('Syncing workOrderId with localStorage:', storedWorkOrderId);
      setWorkOrderId(storedWorkOrderId);
    }
  }, []);

  // Load master data on component mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        console.log('Loading master data...');
        
        const [
          gudang,
          jenisBarang,
          bentukBarang,
          gradeBarang,
          pelaksana
        ] = await Promise.all([
          getGudangOptions(),
          getJenisBarangOptions(),
          getBentukBarangOptions(),
          getGradeBarangOptions(),
          getPelaksanaOptions()
        ]);

        console.log('Gudang data:', gudang);
        console.log('Jenis Barang data:', jenisBarang);
        console.log('Bentuk Barang data:', bentukBarang);
        console.log('Grade Barang data:', gradeBarang);
        console.log('Pelaksana data:', pelaksana);

        // Set data directly like sales order does
        console.log('Setting gudang list:', gudang);
        console.log('Setting jenis barang list:', jenisBarang);
        console.log('Setting bentuk barang list:', bentukBarang);
        console.log('Setting grade barang list:', gradeBarang);
        console.log('Setting pelaksana list:', pelaksana);
        
        setGudangList(gudang);
        setJenisBarangList(jenisBarang);
        setBentukBarangList(bentukBarang);
        setGradeBarangList(gradeBarang);
        setPelaksanaList(pelaksana);
        
        // Load pelanggan separately since it needs different handling
        try {
          setLoadingPelanggan(true);
          setLoadingSalesOrder(true);
          
          const [salesOrderResponse, pelangganResponse] = await Promise.all([
            getSalesOrderOptions(),
            getPelangganOptions()
          ]);
          
          console.log('Sales Order response:', salesOrderResponse);
          console.log('Pelanggan response:', pelangganResponse);
          
          // getPelangganOptions sudah mengembalikan data yang sudah di-map
          if (pelangganResponse && Array.isArray(pelangganResponse)) {
            setPelangganList(pelangganResponse);
            console.log('Pelanggan options:', pelangganResponse);
          } else if (pelangganResponse?.data && Array.isArray(pelangganResponse.data)) {
            // Fallback jika response masih dalam format lama
            const pelangganOptions = pelangganResponse.data.map(item => ({
              value: item.id?.toString(),
              label: item.nama_pelanggan ? `${item.nama_pelanggan} (${item.alamat || 'N/A'})` : item.nama || 'Unknown',
              searchKey: `${item.nama_pelanggan || item.nama || ''} ${item.alamat || ''}`.trim()
            }));
            setPelangganList(pelangganOptions);
            console.log('Pelanggan options (fallback):', pelangganOptions);
          }
          
          // Set sales order data
          setSalesOrderList(salesOrderResponse || []);
          
        } catch (error) {
          console.error('Error loading additional data:', error);
        } finally {
          setLoadingPelanggan(false);
          setLoadingSalesOrder(false);
        }
        
        console.log('State set - gudangList:', gudang);
        console.log('State set - pelangganList:', pelangganList);
        
        // Debug: Log semua state setelah di-set
        setTimeout(() => {
          console.log('=== DEBUG STATE AFTER SET ===');
          console.log('gudangList state:', gudangList);
          console.log('pelangganList state:', pelangganList);
          console.log('jenisBarangList state:', jenisBarangList);
          console.log('bentukBarangList state:', bentukBarangList);
          console.log('gradeBarangList state:', gradeBarangList);
          console.log('pelaksanaList state:', pelaksanaList);
          console.log('================================');
        }, 100);
      } catch (error) {
        console.error('Error loading master data:', error);
      }
    };

    loadMasterData();
  }, []);

  // Note: We don't clear workOrderId on unmount anymore
  // It will only be cleared when work order is successfully saved
  // This ensures the ID persists when opening modals within the same page

  // Function to load Sales Order detail and populate items
  const loadSalesOrderDetail = async (salesOrderId) => {
    if (!salesOrderId) return;
    
    setLoadingSalesOrderDetail(true);
    try {
      console.log('Loading Sales Order detail for ID:', salesOrderId);
      
      // Get Sales Order detail with items
      const response = await request(`/sales-order/${salesOrderId}`, {
        method: 'GET'
      });
      
      console.log('Sales Order detail response:', response);
      
      let soData = response.data || response;
      
      // If response is an array, take the first item
      if (Array.isArray(soData)) {
        soData = soData[0];
      }
      
      if (!soData) {
        throw new Error('Sales order data not found');
      }
      
      setSelectedSalesOrder(soData);
      
      // Extract items from Sales Order
      const itemsData = soData.salesOrderItems || soData.items || soData.sales_order_items || soData.orderItems || [];
      console.log('Sales Order items:', itemsData);
      
      if (itemsData && itemsData.length > 0) {
        // Transform Sales Order items to Work Order items
        const transformedItems = itemsData.map((item, index) => {
          // Generate unique workOrderUniqueId for each WO item
          const timestamp = Date.now() + index;
          const random = Math.random().toString(36).substring(2, 8);
          const workOrderUniqueId = `wo_item_${timestamp}_${random}`;
          
          return {
            id: timestamp,
            workOrderUniqueId: workOrderUniqueId, // Add workOrderUniqueId to each WO item
            panjang: item.panjang || item.length || 0,
            lebar: item.lebar || item.width || 0,
            tebal: item.tebal || item.ketebalan || item.thickness || 0,
            qty: item.qty || item.quantity || item.jumlah || 1,
            jenis_barang_id: item.jenis_barang_id || item.jenis_barang?.id,
            bentuk_barang_id: item.bentuk_barang_id || item.bentuk_barang?.id,
            grade_barang_id: item.grade_barang_id || item.grade_barang?.id,
            catatan: item.catatan || item.note || item.notes || '',
            pelaksana: []
          };
        });
        
        console.log('Transformed Work Order items:', transformedItems);
        setWorkOrderItems(transformedItems);
        
        // Store WO item IDs for canvas color logic
        const woItemIds = transformedItems.map(item => item.id);
        localStorage.setItem('WO_item_unique_ids', JSON.stringify(woItemIds));
        console.log('Stored WO_item_unique_ids:', woItemIds);
        
                 // Auto-fill other fields from Sales Order
         setWorkOrderData(prev => ({
           ...prev,
           gudang_id: soData.gudang_id || soData.gudang?.id,
           pelanggan_id: soData.pelanggan_id || soData.pelanggan?.id,
           catatan: soData.catatan || '',
           tanggal_target: workOrderData.tanggal_wo // Set tanggal target sama dengan tanggal WO
         }));
        
        showAlert('Sukses', `${itemsData.length} item berhasil diambil dari Sales Order`, 'success');
      } else {
        showAlert('Info', 'Sales Order tidak memiliki item', 'info');
        // Reset to default item if no items found
        setWorkOrderItems([{
          id: Date.now(),
          panjang: '',
          lebar: '',
          tebal: '',
          qty: 1,
          jenis_barang_id: '',
          bentuk_barang_id: '',
          grade_barang_id: '',
          catatan: '',
          pelaksana: []
        }]);
      }
      
    } catch (error) {
      console.error('Error loading Sales Order detail:', error);
      showAlert('Error', 'Gagal memuat detail Sales Order', 'error');
    } finally {
      setLoadingSalesOrderDetail(false);
    }
  };

  // Add new work order item - now opens modal directly
  const addWorkOrderItem = () => {
    const newItem = {
      id: Date.now(),
      panjang: '0',
      lebar: '0',
      tebal: '0',
      qty: '0',
      jenis_barang_id: '',
      bentuk_barang_id: '',
      grade_barang_id: '',
      catatan: '',
      pelaksana: []
    };
    setEditingItem(newItem);
    setItemEditModalOpen(true);
  };

  // Remove work order item
  const removeWorkOrderItem = (itemId) => {
    setWorkOrderItems(workOrderItems.filter(item => item.id !== itemId));
  };

  // Update work order item
  const updateWorkOrderItem = (itemId, field, value) => {
    if (field === null && typeof value === 'object') {
      // Update entire item
      setWorkOrderItems(workOrderItems.map(item => 
        item.id === itemId ? { ...item, ...value } : item
      ));
    } else {
      // Update specific field
      setWorkOrderItems(workOrderItems.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      ));
    }
  };

  // Add pelaksana to item
  const addPelaksanaToItem = (itemId) => {
    const item = workOrderItems.find(item => item.id === itemId);
    if (item) {
      const newPelaksana = {
        id: Date.now(),
        pelaksana_id: '',
        qty: 1,
        catatan: ''
      };
      updateWorkOrderItem(itemId, 'pelaksana', [...item.pelaksana, newPelaksana]);
    }
  };

  // Remove pelaksana from item
  const removePelaksanaFromItem = (itemId, pelaksanaId) => {
    const item = workOrderItems.find(item => item.id === itemId);
    if (item) {
      const updatedPelaksana = item.pelaksana.filter(p => p.id !== pelaksanaId);
      updateWorkOrderItem(itemId, 'pelaksana', updatedPelaksana);
    }
  };

  // Update pelaksana
  const updatePelaksana = (itemId, pelaksanaId, field, value) => {
    const item = workOrderItems.find(item => item.id === itemId);
    if (item) {
      const updatedPelaksana = item.pelaksana.map(p => 
        p.id === pelaksanaId ? { ...p, [field]: value } : p
      );
      updateWorkOrderItem(itemId, 'pelaksana', updatedPelaksana);
    }
  };

  // Plat Dasar functions
  const openPlatDasarModal = (item) => {
    console.log('Opening modal work order item:', {
      item: item,
      workOrderId: workOrderId,
      workOrderUniqueId: item.workOrderUniqueId
    });
    
    setCurrentItemData(item);
    setShowPlatDasarModal(true);
  };

  const closePlatDasarModal = () => {
    setShowPlatDasarModal(false);
    setCurrentItemData(null);
  };

  // Plat Preview Modal Functions
  const openPlatPreviewModal = async (item) => {
    setCurrentItemData(item);
    setShowPlatPreviewModal(true);
    setLoadingPreview(true);
    
    try {
      // Hit same API as regular Pilih button
      const response = await request('/work-order-planning/get-saran-plat-dasar', {
        method: 'POST',
        body: JSON.stringify({
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          tebal: parseFloat(item.tebal) || 0,
          sisa_luas: calculateRequiredArea(item)
        })
      });
      
      console.log('Preview API response:', response.data);
      setPreviewItems(response.data || []);
    } catch (error) {
      console.error('Error loading preview items:', error);
      showAlert('Error', 'Gagal memuat data preview', 'error');
      setPreviewItems([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePlatPreviewModal = () => {
    setShowPlatPreviewModal(false);
    setCurrentItemData(null);
    setPreviewItems([]);
  };

  const handlePlatDasarSelection = (selectedItems) => {
    if (currentItemData) {
      setSelectedPlatDasar(prev => ({
        ...prev,
        [currentItemData.id]: selectedItems
      }));
    }
  };

  const getTotalLuasTercukupi = (itemId) => {
    const selected = selectedPlatDasar[itemId] || [];
    return selected.reduce((sum, item) => sum + item.sisa_luas, 0);
  };

  // Helper function to calculate required area based on dimension
  const calculateRequiredArea = (item) => {
    const panjang = parseFloat(item.panjang || 0);
    const lebar = parseFloat(item.lebar || 0);
    const qty = parseInt(item.qty || 0);
    
    // Get bentuk barang info to determine dimension
    const bentukBarang = bentukBarangList.find(b => b.value === item.bentuk_barang_id);
    
    if (bentukBarang && bentukBarang.dimensi === '1D') {
      // For 1D (shaft), only use panjang
      return panjang * qty;
    } else {
      // For 2D (plat), use panjang × lebar
      return panjang * lebar * qty;
    }
  };

  const isLuasCukup = (itemId, totalDibutuhkan) => {
    const totalTercukupi = getTotalLuasTercukupi(itemId);
    return totalTercukupi >= (totalDibutuhkan * 1.1); // 110% tolerance
  };

   

  // Function to save saran plat dasar
  const saveSaranPlatDasar = async (workOrderId, workOrderItemsResponse) => {
    try {
      console.log('=== SAVING SARAN PLAT DASAR ===');
      console.log('Work Order ID:', workOrderId);
      console.log('Work Order Items Response:', workOrderItemsResponse);
      
      // Get used saran plats from localStorage
      const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
      console.log('Used saran plats:', usedSaranPlats);
      
      if (usedSaranPlats.length === 0) {
        console.log('❌ No saran plats to save - usedSaranPlats is empty');
        console.log('usedSaranPlats:', usedSaranPlats);
        return;
      }
      
      // Get canvas layouts for each saran plat
      const saranPlatData = [];
      
      for (const saranItemId of usedSaranPlats) {
        console.log(`Processing saran plat ${saranItemId}...`);
        
        // Check which WO items use this saran plat
        const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
        const woItemsUsingThisSaranPlat = totalQuantityData.filter(woItem => 
          woItem.WOQuantity && woItem.WOQuantity.some(saranItem => 
            saranItem.ItemId === parseInt(saranItemId) || saranItem.ItemId === saranItemId
          )
        );
        
        console.log(`Saran plat ${saranItemId} is used in WO items:`, woItemsUsingThisSaranPlat.map(item => item.WoItemID));
        
        if (woItemsUsingThisSaranPlat.length === 0) {
          console.log(`❌ No WO items found using saran plat ${saranItemId} - skipping to preserve existing data`);
          continue;
        }
        
        // Get all woItemUniqueIds from localStorage
        const woItemUniqueIds = JSON.parse(localStorage.getItem('WO_item_unique_ids') || '[]');
        
        if (woItemUniqueIds.length === 0) {
          console.log('❌ No woItemUniqueIds found in localStorage');
          continue;
        }
        
        console.log(`=== SAVING SARAN PLAT ${saranItemId} ===`);
        console.log(`woItemUniqueIds:`, woItemUniqueIds);
        console.log(`WO items using this saran plat:`, woItemsUsingThisSaranPlat.map(item => item.WoItemID));
        
        // Get canvas data from localStorage
        const workOrderUniqueId = localStorage.getItem('WO_current_work_order_id');
        const canvasLayoutKey = `WO_canvas_layout_${saranItemId}_${workOrderUniqueId}`;
        const canvasLayoutData = localStorage.getItem(canvasLayoutKey);
        
        console.log(`Canvas layout key: ${canvasLayoutKey}`);
        console.log(`Canvas data exists:`, !!canvasLayoutData);
        
        let processedCanvasData = null;
        if (canvasLayoutData) {
          const canvasLayout = JSON.parse(canvasLayoutData);
          
          // Check if there are any boxes from current work order items
          const currentWoItemIds = JSON.parse(localStorage.getItem('WO_item_unique_ids') || '[]');
          const currentWOBoxes = canvasLayout.boxes ? canvasLayout.boxes.filter(box => {
            // Check if box.woItemId is in current WO item IDs array (handle both string and number)
            const boxWoItemId = box.woItemId;
            return currentWoItemIds.includes(boxWoItemId) || 
                   currentWoItemIds.includes(String(boxWoItemId)) || 
                   currentWoItemIds.includes(parseInt(boxWoItemId));
          }) : [];
          
          console.log(`🔍 DEBUG: Checking boxes for saran item ${saranItemId}:`, {
            currentWoItemIds: currentWoItemIds,
            totalBoxes: canvasLayout.boxes ? canvasLayout.boxes.length : 0,
            currentWOBoxes: currentWOBoxes.length,
            allBoxes: canvasLayout.boxes ? canvasLayout.boxes.map(box => ({ 
              woItemId: box.woItemId, 
              workOrderId: box.workOrderId
            })) : [],
            localStorage: {
              WO_current_work_order_id: localStorage.getItem('WO_current_work_order_id'),
              WO_item_unique_ids: localStorage.getItem('WO_item_unique_ids')
            }
          });
          
          // Only process canvas data if there are boxes from current work order
          if (currentWOBoxes.length > 0) {
            // Change box colors to red before saving, but preserve yellow boxes from other WO items
            if (canvasLayout.boxes && Array.isArray(canvasLayout.boxes)) {
              canvasLayout.boxes = canvasLayout.boxes.map(box => {
                // Check if this box belongs to current work order items or different work order
                const boxWoItemId = box.woItemId;
                const isFromCurrentWO = currentWoItemIds.includes(boxWoItemId) || 
                                        currentWoItemIds.includes(String(boxWoItemId)) || 
                                        currentWoItemIds.includes(parseInt(boxWoItemId));
                
                // Only change color to red if it's from current work order
                // Preserve yellow color for boxes from other work orders
                if (isFromCurrentWO) {
                  return {
                    ...box,
                    color: "#ef4444", // Red color for saved boxes from current WO
                    isDisabled: true, // Mark as disabled/saved
                    isSave: true // Mark as saved to database
                  };
                } else {
                  // Keep original color for boxes from other work orders (preserve yellow)
                  return {
                    ...box,
                    // Don't change color, isDisabled, or isSave for boxes from other WO
                  };
                }
              });
              
              console.log(`Changed ${currentWOBoxes.length} boxes to red color for saran item ${saranItemId} (preserved ${canvasLayout.boxes.length - currentWOBoxes.length} boxes from other WO items)`);
            }
            
            processedCanvasData = JSON.stringify(canvasLayout);
          } else {
            // No boxes from current work order - don't save canvas data to preserve existing data
            console.log(`No boxes from current WO for saran item ${saranItemId} - skipping canvas save to preserve existing data`);
            processedCanvasData = null;
          }
        }
        
        // Only add saran plat data if there's canvas data from current work order
        if (processedCanvasData) {
          // Try to get canvas image from file
          let canvasImageBase64 = null;
          try {
            const imageFileName = `canvas-preview-ItemId-${saranItemId}.jpg`;
            const imagePath = `/canvas-previews/${imageFileName}`;
            
            // Check if file exists by trying to fetch it
            const response = await fetch(imagePath);
            if (response.ok) {
              const blob = await response.blob();
              const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
              canvasImageBase64 = base64;
              console.log(`✅ Canvas image loaded for item ${saranItemId}: ${imageFileName}`);
            } else {
              console.log(`📷 No canvas image file found for item ${saranItemId}: ${imageFileName}`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to load canvas image for item ${saranItemId}:`, error);
          }

          const saranData = {
            wo_planning_item_id: woItemUniqueIds, // Send array of woItemUniqueIds
            item_barang_id: parseInt(saranItemId),
            is_selected: true,
            canvas_data: processedCanvasData // Use processed canvas data with red boxes
          };
          
          // Add canvas_image if available
          if (canvasImageBase64) {
            saranData.canvas_image = canvasImageBase64;
          }
          
          console.log(`📷 Canvas image included for item ${saranItemId}:`, !!canvasImageBase64);
          
          saranPlatData.push(saranData);
          
          console.log(`✅ Added saran plat data for saran item ${saranItemId} with ${woItemUniqueIds.length} WO items`);
          console.log(`📷 Canvas image included:`, !!saranData.canvas_image);
          
        } else {
          console.log(`⏭️ Skipped saran plat data for saran item ${saranItemId} - no canvas data from current WO (preserving existing data)`);
        }
      }
      
      console.log('Saran plat data to save:', saranPlatData);
      
      if (saranPlatData.length === 0) {
        console.log('❌ No saran plat data to save - saranPlatData is empty');
        return;
      }
      
      // Save each saran plat dasar
      for (const saranData of saranPlatData) {
        try {
          console.log('🚀 Calling API for saran data:', saranData);
          const response = await workOrderService.saveSaranPlatDasar(
            saranData.wo_planning_item_id,
            saranData.item_barang_id,
            saranData.is_selected,
            saranData.canvas_data,
            saranData.canvas_image
          );
          console.log('✅ Saved saran plat dasar:', saranData.item_barang_id, response);
        } catch (error) {
          console.error('❌ Error saving saran plat dasar for item:', saranData.item_barang_id, error);
          console.error('Error details:', error.response?.data || error.message);
          // Continue with other items even if one fails
        }
      }
      
      console.log('✅ All saran plat dasar saved successfully');
      
    } catch (error) {
      console.error('❌ Error saving saran plat dasar:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!workOrderData.nomor_wo || !workOrderData.gudang_id || !workOrderData.pelanggan_id || !workOrderData.sales_order_id) {
      showAlert('Error', 'Mohon lengkapi data Work Order', 'error');
      return;
    }

    // Validasi pelaksana - cek item mana yang belum ada pelaksana
    const itemsWithoutPelaksana = [];
    workOrderItems.forEach((item, index) => {
      if (!item.pelaksana || item.pelaksana.length === 0) {
        itemsWithoutPelaksana.push(`Item ${index + 1}`);
      }
    });

    if (itemsWithoutPelaksana.length > 0) {
      showAlert(
        'Validasi Pelaksana', 
        `Item berikut belum memiliki pelaksana:\n${itemsWithoutPelaksana.join(', ')}\n\nSetiap item harus memiliki minimal 1 pelaksana.`, 
        'warning'
      );
      return;
    }

    // Validate items
    for (let item of workOrderItems) {
      if (!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id) {
        showAlert('Error', 'Mohon lengkapi data item', 'error');
        return;
      }
      
      // Validate pelaksana - setiap item harus memiliki minimal 1 pelaksana
      if (!item.pelaksana || item.pelaksana.length === 0) {
        showAlert('Error', `Item ${index + 1}: Setiap item harus memiliki minimal 1 pelaksana`, 'error');
        return;
      }
      
      for (let pelaksana of item.pelaksana) {
        if (!pelaksana.pelaksana_id) {
          showAlert('Error', `Item ${index + 1}: Mohon lengkapi data pelaksana`, 'error');
          return;
        }
      }
    }

    // Konfirmasi sebelum save
    const confirmSave = window.confirm(
      `Konfirmasi Simpan Work Order\n\n` +
      `Nomor WO: ${workOrderData.nomor_wo}\n` +
      `Tanggal WO: ${workOrderData.tanggal_wo}\n` +
      `Jumlah Item: ${workOrderItems.length}\n` +
      `Total Pelaksana: ${workOrderItems.reduce((total, item) => total + item.pelaksana.length, 0)}\n\n` +
      `Apakah Anda yakin ingin menyimpan Work Order ini?`
    );

    if (!confirmSave) {
      return;
    }

    setLoading(true);
    try {
      // Get existing unique IDs from localStorage
      const existingWoUniqueId = localStorage.getItem('WO_current_work_order_id');
      const woUniqueId = existingWoUniqueId || `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Get existing woItemUniqueIds from WO_total_quantity (convert to string)
      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
      const existingWoItemIds = totalQuantityData.map(item => item.WoItemID.toString());
      
      // Transform data to match API expected format
      const transformedData = {
        wo_unique_id: woUniqueId,
        nomor_wo: workOrderData.nomor_wo,
        tanggal_wo: workOrderData.tanggal_wo,
        tanggal_target: workOrderData.tanggal_target,
        id_sales_order: workOrderData.sales_order_id,
        id_pelanggan: workOrderData.pelanggan_id,
        id_gudang: workOrderData.gudang_id,
        // Add id_pelaksana field at the top level as required by API (array of all pelaksana IDs)
        id_pelaksana: (() => {
          const allPelaksanaIds = [];
          workOrderItems.forEach(item => {
            item.pelaksana.forEach(pelaksana => {
              if (pelaksana.pelaksana_id && !allPelaksanaIds.includes(pelaksana.pelaksana_id)) {
                allPelaksanaIds.push(pelaksana.pelaksana_id);
              }
            });
          });
          return allPelaksanaIds.length > 0 ? allPelaksanaIds : null;
        })(),
        prioritas: workOrderData.prioritas,
        catatan: workOrderData.catatan,
        status: workOrderData.status,
        items: workOrderItems.map((item, index) => ({
          wo_item_unique_id: existingWoItemIds[index] || `WOI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          qty: item.qty,
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          tebal: parseFloat(item.tebal) || 0,
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          catatan: item.catatan,
          // Add plat dasar data if selected
          plat_dasar: selectedPlatDasar[item.id] ? selectedPlatDasar[item.id].map(plat => ({
            plat_dasar_id: plat.id,
            sisa_luas: plat.sisa_luas,
            panjang: plat.panjang,
            lebar: plat.lebar,
            tebal: plat.tebal
          })) : [],
          // Add required fields for pelaksana
          pelaksana: item.pelaksana.map(p => ({
            pelaksana_id: p.pelaksana_id,
            qty: p.qty,
            weight: 0, // Default weight, bisa diisi nanti
            tanggal: workOrderData.tanggal_wo, // Use WO date as default
            jam_mulai: "08:00", // Default start time
            jam_selesai: "17:00", // Default end time
            catatan: p.catatan
          }))
        }))
      };

      console.log('Transformed data to send:', transformedData);
      
      const response = await workOrderService.createWorkOrder(transformedData);
      
      // Get the created work order ID from response
      const workOrderId = response.data?.id || response.id;
      const workOrderNumber = response.data?.nomor_wo || workOrderData.nomor_wo;
      const workOrderItemsResponse = response.data?.items || [];
      
      // Store array of woItemUniqueIds for saran plat dasar
      localStorage.setItem('WO_item_unique_ids', JSON.stringify(existingWoItemIds));
      
      console.log('WO Unique ID:', woUniqueId);
      console.log('WO Item Unique IDs:', existingWoItemIds.length > 0 ? existingWoItemIds : transformedData.items.map(item => item.wo_item_unique_id));
      
      // Save saran plat dasar
      try {
        console.log('🚀 Calling saveSaranPlatDasar...');
        await saveSaranPlatDasar(workOrderId, workOrderItemsResponse);
        console.log('✅ saveSaranPlatDasar completed');
      } catch (error) {
        console.error('❌ Error saving saran plat dasar:', error);
        // Don't throw error here, just log it
      }
      
      // Clear the stored work order ID since work order is now saved
      // localStorage.removeItem('WO_current_work_order_id');
      
      showAlert('Sukses', `Work Order ${workOrderNumber} berhasil dibuat!\n\nID: ${workOrderId}\n\nKlik OK untuk melihat daftar Work Order.`, 'success', () => {
        navigate('/work-order');
      });
    } catch (error) {
      console.error('Error creating work order:', error);
      
      // Extract error message from API response
      let errorMessage = 'Gagal membuat Work Order';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Tambah Work Order Planning" category="TRANSAKSI">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/work-order')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Work Order Planning Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informasi Work Order Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Order *
                </label>
                <SearchSelect
                  label=""
                  options={salesOrderList}
                  value={workOrderData.sales_order_id ? workOrderData.sales_order_id.toString() : ''} 
                  onValueChange={(value) => {
                    const selectedSO = salesOrderList.find(so => so.value === value);
                    if (selectedSO) {
                      // Generate WO number from SO number
                      const soNumber = selectedSO.label || selectedSO.value;
                      const woNumber = soNumber.replace(/^SO-/, 'WO-');
                      setWorkOrderData({
                        ...workOrderData, 
                        sales_order_id: parseInt(value),
                        nomor_wo: woNumber
                      });
                      
                      // Load Sales Order detail and populate items automatically
                      loadSalesOrderDetail(parseInt(value));
                    } else {
                      setWorkOrderData({...workOrderData, sales_order_id: parseInt(value)});
                    }
                  }}
                  placeholder="Pilih Sales Order"
                  loading={loadingSalesOrder}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor WO *
                </label>
                <Input
                  placeholder="Masukkan nomor WO atau akan otomatis terisi dari SO"
                  value={workOrderData.nomor_wo}
                  onChange={(e) => setWorkOrderData({
                    ...workOrderData,
                    nomor_wo: e.target.value
                  })}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal WO *
                </label>
                <Input
                  type="date"
                  value={workOrderData.tanggal_wo}
                  onChange={(e) => setWorkOrderData({...workOrderData, tanggal_wo: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Target
                </label>
                <Input
                  type="date"
                  value={workOrderData.tanggal_target}
                  onChange={(e) => setWorkOrderData({...workOrderData, tanggal_target: e.target.value})}
                />
              </div>
              
              <div>
                <SearchSelect
                  label="Gudang *"
                  options={gudangList}
                  value={workOrderData.gudang_id ? workOrderData.gudang_id.toString() : ''} 
                  onValueChange={(value) => {
                    console.log('Gudang selected:', value, 'Type:', typeof value);
                    console.log('Available gudang options:', gudangList);
                    setWorkOrderData({...workOrderData, gudang_id: parseInt(value)});
                  }}
                  placeholder="Pilih gudang"
                  loading={loadingGudang}
                />
              </div>
              
              <div>
                <SearchSelect
                  label="Pelanggan *"
                  options={pelangganList}
                  value={workOrderData.pelanggan_id ? workOrderData.pelanggan_id.toString() : ''} 
                  onValueChange={(value) => {
                    console.log('Pelanggan selected:', value, 'Type:', typeof value);
                    console.log('Available pelanggan options:', pelangganList);
                    setWorkOrderData({...workOrderData, pelanggan_id: parseInt(value)});
                  }}
                  placeholder="Pilih pelanggan"
                  loading={loadingPelanggan}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioritas
                </label>
                <select
                  value={workOrderData.prioritas}
                  onChange={(e) => setWorkOrderData({...workOrderData, prioritas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                  <option value="URGENT">Mendesak</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <Input
                  placeholder="Catatan tambahan..."
                  value={workOrderData.catatan}
                  onChange={(e) => setWorkOrderData({...workOrderData, catatan: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Work Order Items
              {selectedSalesOrder && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSalesOrder.nomor_so} - {selectedSalesOrder.pelanggan?.nama_pelanggan || 'Unknown'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
              <Table className="text-sm">
                <TableHead>
                  <TableRow>
                    <TableHeader className="text-left w-10"></TableHeader>
                    <TableHeader className="text-left">Panjang (mm)</TableHeader>
                    <TableHeader className="text-left">Lebar (mm)</TableHeader>
                    <TableHeader className="text-left">Tebal (mm)</TableHeader>
                    <TableHeader className="text-left">Qty</TableHeader>
                    <TableHeader className="text-left">Jenis</TableHeader>
                    <TableHeader className="text-left">Bentuk</TableHeader>
                    <TableHeader className="text-left">Grade</TableHeader>
                    <TableHeader className="text-left">Catatan</TableHeader>
                    <TableHeader className="text-left">Plat Dasar</TableHeader>
                    <TableHeader className="text-left">Pelaksana</TableHeader>
                    <TableHeader className="text-left w-16">Aksi</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workOrderItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="11" className="px-4 py-8 text-center text-gray-500">
                        Belum ada item. Klik "Tambah Item" untuk menambahkan item pertama.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrderItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <TableRow>
                        <TableCell className="text-left">#{index + 1}</TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {item.panjang ? `${item.panjang} mm` : '0 mm'}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {item.lebar ? `${item.lebar} mm` : '0 mm'}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {item.tebal ? `${item.tebal} mm` : '0 mm'}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {item.qty || '0'}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {getJenisBarangName(item.jenis_barang_id)}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {getBentukBarangName(item.bentuk_barang_id)}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {getGradeBarangName(item.grade_barang_id)}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {item.catatan || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openPlatDasarModal(item)}
                              disabled={!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id || !item.tebal}
                              className="text-xs"
                            >
                              <Package className="w-3 h-3 mr-1" />
                              Pilih
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openPlatPreviewModal(item)}
                              disabled={!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id || !item.tebal}
                              className="text-xs"
                            >
                              <Grid3X3 className="w-3 h-3 mr-1" />
                              Pilih Preview
                            </Button>
                            {selectedPlatDasar[item.id] && selectedPlatDasar[item.id].length > 0 && (
                              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                {(() => {
                                  const totalDibutuhkan = calculateRequiredArea(item);
                                  const isCukup = isLuasCukup(item.id, totalDibutuhkan);
                                  return `${selectedPlatDasar[item.id].length} • ${isCukup ? 'Cukup' : 'Kurang'}`;
                                })()}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openPelaksanaModal(item.id)}
                            className="text-xs"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {`Kelola (${item.pelaksana.length})`}
                          </Button>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openItemEditModal(item)}
                              className="text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeWorkOrderItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                    </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addWorkOrderItem}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tambah Item
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/work-order')}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Menyimpan...' : 'Simpan Work Order'}
          </Button>
        </div>
      </form>

      {/* Plat Dasar Modal */}
      {showPlatDasarModal && currentItemData && (
        <SelectPlatShaftDasar
          jenisBarangId={currentItemData.jenis_barang_id}
          bentukBarangId={currentItemData.bentuk_barang_id}
          gradeBarangId={currentItemData.grade_barang_id}
          tebal={parseFloat(currentItemData.tebal) || 0}
          totalDibutuhkan={calculateRequiredArea(currentItemData)}
          workOrderItem={currentItemData}
          workOrderId={workOrderId}
          onSelectionChange={handlePlatDasarSelection}
          onClose={closePlatDasarModal}
        />
      )}

      {/* Pelaksana Modal */}
      <PelaksanaModal
        open={pelaksanaModalOpen}
        onOpenChange={setPelaksanaModalOpen}
        title="Kelola Pelaksana"
        pelaksanaOptions={pelaksanaList}
        value={workOrderItems.find(item => item.id === pelaksanaModalItemId)?.pelaksana || []}
        onSave={savePelaksanaForItem}
        loadingOptions={loadingPelaksana}
      />

      {/* Plat Preview Modal */}
      <PlatPreviewModal
        isOpen={showPlatPreviewModal}
        onClose={closePlatPreviewModal}
        currentItemData={currentItemData}
        previewItems={previewItems}
        loadingPreview={loadingPreview}
        calculateRequiredArea={calculateRequiredArea}
      />

      {/* Work Order Item Edit Modal */}
      <WorkOrderItemEditModal
        isOpen={itemEditModalOpen}
        onClose={closeItemEditModal}
        item={editingItem}
        onSave={saveItemEdit}
        selectedPlatDasar={editingItem ? selectedPlatDasar[editingItem.id] : []}
        onPlatDasarChange={(plats) => {
          if (editingItem) {
            setSelectedPlatDasar(prev => ({
              ...prev,
              [editingItem.id]: plats
            }));
          }
        }}
        isLuasCukup={isLuasCukup}
        selectedSalesOrder={selectedSalesOrder}
        isNewItem={editingItem ? isNewItem(editingItem) : false}
      />
      
      {/* Alert Component */}
      <AlertComponent />
    </PageLayout>
  );
}
