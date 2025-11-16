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
import { openPrintDialog, generateWOPlanningPrintContent } from '@/lib/printUtils';
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
import { documentSequenceService } from '@/services/master-data/documentSequenceService';

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
    prioritas: 'MEDIUM',
    handover_method: 'pickup'
  });

  // Work Order Items State
  const [workOrderItems, setWorkOrderItems] = useState([]);

  // Work Order ID State - generate new ID every time page is opened
  const [workOrderId, setWorkOrderId] = useState(() => {
    // Clear all WO_ storage first
    const keys = Object.keys(localStorage);
    const woKeys = keys.filter(key => key.startsWith('WO_'));
    woKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Always generate a new work order ID when opening add WO page
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const newWorkOrderId = `wo_${timestamp}_${random}`;
    
    // Store the new ID in localStorage for this session
    localStorage.setItem('WO_current_work_order_id', newWorkOrderId);
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

  // State untuk modal utuh
  const [utuhModalOpen, setUtuhModalOpen] = useState(false);
  const [selectedUtuhItem, setSelectedUtuhItem] = useState(null);
  const [saranUtuhData, setSaranUtuhData] = useState([]);
  const [loadingSaranUtuh, setLoadingSaranUtuh] = useState(false);
  const [selectedSaranUtuhItems, setSelectedSaranUtuhItems] = useState([]);
  const [saranUtuhQuantities, setSaranUtuhQuantities] = useState({});
  
  // State untuk WO_total_quantity
  const [woTotalQuantity, setWoTotalQuantity] = useState(() => {
    const savedData = localStorage.getItem('WO_total_quantity');
    return savedData ? JSON.parse(savedData) : [];
  });

  const openPelaksanaModal = (itemId) => {
    setPelaksanaModalItemId(itemId);
    setPelaksanaModalOpen(true);
  };

  const openUtuhModal = async (item) => {
    setSelectedUtuhItem(item);
    setUtuhModalOpen(true);
    
    // Reset selection terlebih dahulu
    setSelectedSaranUtuhItems([]);
    setSaranUtuhQuantities({});
    
    // Hit API saran plat utuh
    await fetchSaranUtuh(item);
  };

  const closeUtuhModal = () => {
    setUtuhModalOpen(false);
    setSelectedUtuhItem(null);
    setSaranUtuhData([]);
    setSelectedSaranUtuhItems([]);
    setSaranUtuhQuantities({});
  };

  // Fetch saran plat utuh
  const fetchSaranUtuh = async (item) => {
    if (!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id || !item.tebal) {
      showAlert('Error', 'Data item belum lengkap untuk mencari saran plat utuh', 'error');
      return;
    }

    setLoadingSaranUtuh(true);
    try {
      const response = await request('/work-order-planning/get-saran-plat-utuh', {
        method: 'POST',
        body: JSON.stringify({
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          tebal: parseFloat(item.tebal) || 0,
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          qty: parseInt(item.qty) || 1 // Menambahkan quantity ke request
        })
      });

      console.log('Saran plat utuh response:', response);
      setSaranUtuhData(response.data || []);
      
      // Ambil data dari localStorage
      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
      
      // Cek apakah item sudah ada di localStorage, gunakan selectedUtuhItem.id untuk konsistensi
      const existingEntry = totalQuantityData.find(entry => entry.WoItemID === item.id);
      
      if (existingEntry && response.data && response.data.length > 0) {
        // Jika sudah ada data di localStorage, otomatis check item yang sesuai
        const selectedIds = [];
        const quantities = {};
        
        // Untuk setiap item di WOQuantity, cari di response data dan check jika ada
        existingEntry.WOQuantity.forEach(woItem => {
          const matchingItem = response.data.find(saranItem => saranItem.id === woItem.ItemId);
          if (matchingItem) {
            selectedIds.push(woItem.ItemId);
            quantities[woItem.ItemId] = woItem.Quantity;
          }
        });
        
        // Update state dengan data yang sudah ada
        setSelectedSaranUtuhItems(selectedIds);
        setSaranUtuhQuantities(quantities);
        
        console.log('Auto-checked items:', selectedIds);
        console.log('Auto-set quantities:', quantities);
      }
    } catch (error) {
      console.error('Error fetching saran plat utuh:', error);
      showAlert('Error', 'Gagal mengambil saran plat utuh', 'error');
      setSaranUtuhData([]);
    } finally {
      setLoadingSaranUtuh(false);
    }
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
      setWorkOrderId(storedWorkOrderId);
    }
  }, []);

  // Load master data on component mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
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

        // Set data directly like sales order does
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
          // getPelangganOptions sudah mengembalikan data yang sudah di-map
          if (pelangganResponse && Array.isArray(pelangganResponse)) {
            setPelangganList(pelangganResponse);
          } else if (pelangganResponse?.data && Array.isArray(pelangganResponse.data)) {
            // Fallback jika response masih dalam format lama
            const pelangganOptions = pelangganResponse.data.map(item => ({
              value: item.id?.toString(),
              label: item.nama_pelanggan ? `${item.nama_pelanggan} (${item.alamat || 'N/A'})` : item.nama || 'Unknown',
              searchKey: `${item.nama_pelanggan || item.nama || ''} ${item.alamat || ''}`.trim()
            }));
            setPelangganList(pelangganOptions);
          }
          
          // Set sales order data
          setSalesOrderList(salesOrderResponse || []);
          
        } catch (error) {
          console.error('Error loading additional data:', error);
        } finally {
          setLoadingPelanggan(false);
          setLoadingSalesOrder(false);
        }
        
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
      
      const [salesOrderHeaderResponse, salesOrderItemsResponse, woNumberResponse] = await Promise.all([
        request(`/sales-order/header/${salesOrderId}`, { method: 'GET' }),
        request(`/sales-order/sales-order-for-woplanning?sales_order_id=${salesOrderId}`, { method: 'GET' }),
        documentSequenceService.generateWONumber()
      ]);
      
      console.log('Sales Order header response:', salesOrderHeaderResponse);
      console.log('Generated WO number:', woNumberResponse);
      try {
        localStorage.setItem('WO_current_work_order_id', woNumberResponse);
        setWorkOrderId(woNumberResponse);
      } catch (e) {
        console.warn('Failed to persist generated WO number to storage/state', e);
      }
      
      let soData = salesOrderHeaderResponse.data || salesOrderHeaderResponse;
      
      // If response is an array, take the first item
      if (Array.isArray(soData)) {
        soData = soData[0];
      }
      
      if (!soData) {
        throw new Error('Sales order data not found');
      }
      
      setSelectedSalesOrder(soData);
      
      const itemsDataRaw = salesOrderItemsResponse?.data || salesOrderItemsResponse || [];
      const itemsData = Array.isArray(itemsDataRaw) ? itemsDataRaw : (itemsDataRaw.data || []);
      console.log('Sales Order items (for WO planning):', itemsData);
      
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
            sales_order_item_id: item.id,
            panjang: item.panjang || 0,
            lebar: item.lebar || 0,
            tebal: item.tebal || 0,
            qty: item.sisa_qty || item.qty_so || 1,
            jenis_barang_id: item.jenis_barang_id || item.jenis_barang?.id,
            bentuk_barang_id: item.bentuk_barang_id || item.bentuk_barang?.id,
            grade_barang_id: item.grade_barang_id || item.grade_barang?.id,
            jenis_potongan: item.jenis_potongan || null,
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
        
        // Auto-fill other fields from Sales Order and set generated WO number
        setWorkOrderData(prev => ({
          ...prev,
          nomor_wo: woNumberResponse, // Use generated WO number from API
          gudang_id: soData.gudang_id || soData.gudang?.id,
          pelanggan_id: soData.pelanggan_id || soData.pelanggan?.id,
          catatan: soData.catatan || '',
          handover_method: soData.handover_method || 'pickup', // Set handover method from SO
          tanggal_target: workOrderData.tanggal_wo // Set tanggal target sama dengan tanggal WO
        }));
        
        showAlert('Sukses', `${itemsData.length} item berhasil diambil dari Sales Order\nNomor WO: ${woNumberResponse}`, 'success');
      } else {
        showAlert('Info', 'Sales Order tidak memiliki item', 'info');
        // Reset to default item if no items found
        setWorkOrderItems([{
          id: Date.now(),
          sales_order_item_id: null, // No sales order item ID for manual items
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
        
        // Still set the generated WO number even if no items
        setWorkOrderData(prev => ({
          ...prev,
          nomor_wo: woNumberResponse, // Use generated WO number from API
          gudang_id: soData.gudang_id || soData.gudang?.id,
          pelanggan_id: soData.pelanggan_id || soData.pelanggan?.id,
          catatan: soData.catatan || '',
          handover_method: soData.handover_method || 'pickup',
          tanggal_target: workOrderData.tanggal_wo
        }));
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
      sales_order_item_id: null, // No sales order item ID for manual items
      panjang: '0',
      lebar: '0',
      tebal: '0',
      qty: '0',
      jenis_barang_id: '',
      bentuk_barang_id: '',
      grade_barang_id: '',
      jenis_potongan: 'potongan',
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
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0
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
    
    // Get bentuk barang info to determine dimension
    const bentukBarang = bentukBarangList.find(b => b.value === item.bentuk_barang_id);
    
    if (bentukBarang && bentukBarang.dimensi === '1D') {
      // For 1D (shaft), only use panjang (no quantity multiplication)
      return panjang;
    } else {
      // For 2D (plat), use panjang × lebar (no quantity multiplication)
      return panjang * lebar;
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
                  isSave: true, // Mark as saved to database
                  workOrderId: workOrderUniqueId
                  // workItemUniqueId: boxWoItemId
                };
              } else {
                // Keep original color for boxes from other work orders (preserve yellow)
                return {
                  ...box,
                  // Don't change color, isDisabled, or isSave for boxes from other WO
                  // workItemUniqueId: boxWoItemId
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

  // DUMMY FUNCTION - HAPUS SETELAH TESTING
  const handleGenerateDummyJson = async () => {
    try {
      // Generate dummy payload
      const dummyPayload = {
        wo_unique_id: workOrderData.wo_unique_id,
        tanggal_wo: workOrderData.tanggal_wo,
        tanggal_target: workOrderData.tanggal_target,
        id_sales_order: workOrderData.sales_order_id,
        id_pelanggan: workOrderData.pelanggan_id,
        id_gudang: workOrderData.gudang_id,
        prioritas: workOrderData.prioritas,
        status: workOrderData.status,
        handover_method: workOrderData.handover_method,
        catatan: workOrderData.catatan,
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
        items: workOrderItems.map((item, index) => ({
          wo_item_unique_id: item.wo_item_unique_id,
          sales_order_item_id: item.sales_order_item_id, // Mapped from Sales Order
          qty: item.qty,
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          tebal: parseFloat(item.tebal) || 0,
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          jenis_potongan: item.jenis_potongan || 'potongan',
          berat: 0,
          satuan: "PCS",
          diskon: 0,
          catatan: item.catatan,
          saran_plat_dasar: (() => {
            const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
            const woItemData = totalQuantityData.find(wo => wo.WoItemID === item.id);
            if (!woItemData || !woItemData.WOQuantity) return [];
            return woItemData.WOQuantity.map(woq => ({
              item_barang_id: woq.ItemId,
              quantity: woq.Quantity,
              is_selected: true
            }));
          })(),
          pelaksana: item.pelaksana.map(p => ({
            pelaksana_id: p.pelaksana_id,
            qty: p.qty,
            weight: 0,
            tanggal: p.tanggal,
            jam_mulai: p.jam_mulai,
            jam_selesai: p.jam_selesai,
            catatan: p.catatan
          }))
        }))
      };
      
      console.log('=== DUMMY JSON PAYLOAD ===');
      console.log(JSON.stringify(dummyPayload, null, 2));
      console.log('=== END DUMMY JSON ===');
      
      // Copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(dummyPayload, null, 2));
      alert('Dummy JSON generated and copied to clipboard! Check console for full output.');
      
    } catch (error) {
      console.error('Error generating dummy JSON:', error);
      alert('Error generating dummy JSON. Check console for details.');
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

    // Validasi pelaksana - cek kelengkapan data pelaksana sesuai quantity
    const pelaksanaValidationErrors = [];
    workOrderItems.forEach((item, index) => {
      const itemNumber = index + 1;
      const itemQty = parseInt(item.qty) || 0;
      const pelaksanaCount = item.pelaksana ? item.pelaksana.length : 0;
      
      // Cek apakah ada pelaksana
      if (!item.pelaksana || item.pelaksana.length === 0) {
        pelaksanaValidationErrors.push(`Item ${itemNumber}: Belum memiliki pelaksana`);
        return;
      }
      
      // Hitung total quantity dari semua pelaksana
      const totalPelaksanaQty = item.pelaksana.reduce((total, pelaksana) => {
        return total + (parseInt(pelaksana.qty) || 0);
      }, 0);
      
      // Cek apakah total quantity pelaksana sesuai dengan quantity item
      if (totalPelaksanaQty !== itemQty) {
        pelaksanaValidationErrors.push(
          `Item ${itemNumber}: Total quantity pelaksana (${totalPelaksanaQty}) harus sama dengan quantity item (${itemQty})`
        );
      }
      
      // Cek apakah ada pelaksana yang tidak lengkap
      item.pelaksana.forEach((pelaksana, pelaksanaIndex) => {
        if (!pelaksana.pelaksana_id) {
          pelaksanaValidationErrors.push(
            `Item ${itemNumber}, Pelaksana ${pelaksanaIndex + 1}: Belum memilih pelaksana`
          );
        }
        if (!pelaksana.qty || parseInt(pelaksana.qty) <= 0) {
          pelaksanaValidationErrors.push(
            `Item ${itemNumber}, Pelaksana ${pelaksanaIndex + 1}: Quantity pelaksana harus lebih dari 0`
          );
        }
      });
    });

    if (pelaksanaValidationErrors.length > 0) {
      showAlert(
        'Validasi Pelaksana', 
        `Terdapat kesalahan dalam data pelaksana:\n\n${pelaksanaValidationErrors.join('\n')}\n\nTotal quantity pelaksana harus sama dengan quantity item.`, 
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
    }

    // Konfirmasi sebelum save
    const confirmSave = window.confirm(
      `Konfirmasi Simpan Work Order\n\n` +
      `Nomor WO: ${workOrderData.nomor_wo}\n` +
      `Tanggal WO: ${workOrderData.tanggal_wo}\n` +
      `Prioritas: ${workOrderData.prioritas}\n` +
      `Metode Penyerahan: ${workOrderData.handover_method === 'pickup' ? 'Pickup' : 'Delivery'}\n` +
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
        tanggal_wo: workOrderData.tanggal_wo,
        tanggal_target: workOrderData.tanggal_target,
        id_sales_order: workOrderData.sales_order_id,
        id_pelanggan: workOrderData.pelanggan_id,
        id_gudang: workOrderData.gudang_id,
        prioritas: workOrderData.prioritas,
        status: workOrderData.status,
        handover_method: workOrderData.handover_method,
        catatan: workOrderData.catatan,
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
        handover_method: workOrderData.handover_method,
        catatan: workOrderData.catatan,
        status: workOrderData.status,
        items: workOrderItems.map((item, index) => ({
          wo_item_unique_id: existingWoItemIds[index] || `WOI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          sales_order_item_id: item.sales_order_item_id, // Include sales order item ID
          qty: item.qty,
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          tebal: parseFloat(item.tebal) || 0,
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          jenis_potongan: item.jenis_potongan || 'potongan',
          berat: 0, // Default weight, bisa diisi nanti
          satuan: "PCS", // Default unit
          diskon: 0, // Default discount
          catatan: item.catatan,
          // Saran plat dasar mapping dari WO_total_quantity localStorage
          saran_plat_dasar: (() => {
            const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
            const woItemData = totalQuantityData.find(wo => wo.WoItemID === item.id);
            if (!woItemData || !woItemData.WOQuantity) return [];
            return woItemData.WOQuantity.map(woq => ({
              item_barang_id: woq.ItemId,
              quantity: woq.Quantity,
              is_selected: true
            }));
          })(),
          // Add required fields for pelaksana
          pelaksana: item.pelaksana.map(p => ({
            pelaksana_id: p.pelaksana_id,
            qty: p.qty,
            weight: (typeof p.berat !== 'undefined') ? (parseFloat(p.berat) || 0) : (parseFloat(p.weight) || 0),
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
      
      // Siapkan data cetak menggunakan data lokal yang baru saja dikirim (tanpa refetch)
      const mapLabel = (list, value) => {
        const found = list.find(opt => String(opt.value) === String(value));
        return found ? (found.label || found.nama || found.text || String(value)) : String(value || 'N/A');
      };

      const printData = {
        nomor_wo: workOrderNumber || workOrderData.nomor_wo,
        tanggal_wo: workOrderData.tanggal_wo,
        due_date: workOrderData.tanggal_target,
        priority: workOrderData.prioritas,
        status: workOrderData.status,
        assigned_to: workOrderData.handover_method,
        customer: (() => {
          const cust = pelangganList.find(p => String(p.value) === String(workOrderData.pelanggan_id));
          return cust ? { nama: cust.label } : { nama: 'N/A' };
        })(),
        warehouse: (() => {
          const wh = gudangList.find(g => String(g.value) === String(workOrderData.gudang_id));
          return wh ? { nama_gudang: wh.label } : { nama_gudang: 'N/A' };
        })(),
        items: workOrderItems.map(item => ({
          nama_item: mapLabel(jenisBarangList, item.jenis_barang_id),
          bentukBarang: { nama: mapLabel(bentukBarangList, item.bentuk_barang_id) },
          gradeBarang: { nama: mapLabel(gradeBarangList, item.grade_barang_id) },
          dimensi: `${item.panjang || 0}x${item.lebar || 0}x${item.tebal || 0}mm`,
          qtyPlanning: item.qty || 0,
          jenisPotongan: item.jenis_potongan || 'potongan',
          keterangan: item.catatan || ''
        })),
        // Ambil gambar canvas dari folder public berdasarkan saran ItemId yang dipakai
        canvasImages: (() => {
          try {
            const used = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
            const images = [];
            used.forEach(id => {
              const fileName = `canvas-preview-ItemId-${id}.jpg`;
              const src = `/canvas-previews/${fileName}`;
              images.push({ item_id: parseInt(id), src });
            });
            return images;
          } catch (e) {
            console.warn('Gagal menyiapkan canvas images untuk cetak:', e);
            return [];
          }
        })()
      };

      const html = generateWOPlanningPrintContent(printData);
      openPrintDialog(html);
      // Setelah dialog cetak dibuka, tutup halaman Add dan kembali ke daftar WO
      navigate('/work-order');
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
                      setWorkOrderData({
                        ...workOrderData, 
                        sales_order_id: parseInt(value)
                      });
                      
                      // Load Sales Order detail and populate items automatically
                      // WO number will be generated automatically in loadSalesOrderDetail
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
                  placeholder="Nomor WO akan otomatis terisi dari API generate sequence"
                  value={workOrderData.nomor_wo}
                  disabled
                  className="bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nomor WO otomatis di-generate dari sistem saat memilih Sales Order
                </p>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Penyerahan
                </label>
                <select
                  value={workOrderData.handover_method}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                >
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Metode penyerahan otomatis diambil dari Sales Order yang dipilih
                </p>
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
                    <TableHeader className="text-left">Jenis Potongan</TableHeader>
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
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm capitalize">
                            {item.jenis_potongan || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                            {item.catatan || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-2">
                            {/* Hidden Pilih button as requested by user
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
                            */}
                            {item.jenis_potongan !== 'utuh' ? (
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
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openUtuhModal(item)}
                                disabled={!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id || !item.tebal}
                                className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              >
                                <Package className="w-3 h-3 mr-1" />
                                Utuh
                              </Button>
                            )}
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
              {/* Tombol Tambah Item disembunyikan */}
              {false && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addWorkOrderItem}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Item
                </Button>
              )}
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
            type="button"
            variant="secondary"
            onClick={handleGenerateDummyJson}
            disabled={loading}
          >
            Generate Dummy JSON
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

      {/* Utuh Modal */}
      {utuhModalOpen && selectedUtuhItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Item Utuh - {getJenisBarangName(selectedUtuhItem.jenis_barang_id)} - {getBentukBarangName(selectedUtuhItem.bentuk_barang_id)}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeUtuhModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensi</label>
                    <p className="text-sm text-gray-900">
                      {selectedUtuhItem.panjang} x {selectedUtuhItem.lebar} x {selectedUtuhItem.tebal} mm
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <p className="text-sm text-gray-900">{selectedUtuhItem.qty} pcs</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <p className="text-sm text-gray-900">{getGradeBarangName(selectedUtuhItem.grade_barang_id)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Item Utuh
                    </span>
                  </div>
                </div>

                {/* Saran Plat Utuh */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Saran Plat Utuh</label>
                  {loadingSaranUtuh ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Mencari saran plat utuh...</span>
                    </div>
                  ) : saranUtuhData.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {saranUtuhData.map((saran, index) => {
                        const isSelected = selectedSaranUtuhItems.includes(saran.id);
                        return (
                        <div
                          key={saran.id}
                          className={`p-3 border rounded-lg transition-colors ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedSaranUtuhItems(prev => prev.filter(id => id !== saran.id));
                                    setSaranUtuhQuantities(prev => {
                                      const newQuantities = {...prev};
                                      delete newQuantities[saran.id];
                                      return newQuantities;
                                    });
                                  } else {
                                    setSelectedSaranUtuhItems(prev => [...prev, saran.id]);
                                    setSaranUtuhQuantities(prev => ({
                                      ...prev,
                                      [saran.id]: 1
                                    }));
                                  }
                                }}
                                className="mt-1"
                              />
                              <div>
                                <p className="font-medium text-sm">{saran.nama}</p>
                                <p className="text-xs text-gray-600">{saran.ukuran}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <p className="text-sm font-medium text-green-600">{saran.sisa_luas} m²</p>
                              {isSelected && (
                                <div className="flex items-center">
                                  <label className="text-xs text-gray-600 mr-1">Qty:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={saranUtuhQuantities[saran.id] || 1}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 1;
                                      setSaranUtuhQuantities(prev => ({
                                        ...prev,
                                        [saran.id]: value
                                      }));
                                    }}
                                    className="w-16 text-sm border rounded px-1 py-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                      <p className="text-sm">Tidak ada saran plat utuh yang tersedia</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Informasi Item Utuh</h3>
                  <p className="text-sm text-blue-800">
                    Item ini adalah item utuh yang tidak memerlukan proses pemotongan. 
                    Item akan digunakan langsung sesuai dengan dimensi yang telah ditentukan.
                  </p>
                </div>

                {selectedUtuhItem.catatan && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-900 mb-2">Catatan</h3>
                    <p className="text-sm text-yellow-800">{selectedUtuhItem.catatan}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={closeUtuhModal}
                  className="px-6"
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => {
                    if (selectedSaranUtuhItems.length > 0) {
                      // Validasi total quantity
                      let totalSelectedQuantity = 0;
                      selectedSaranUtuhItems.forEach(saranId => {
                        totalSelectedQuantity += saranUtuhQuantities[saranId] || 1;
                      });
                      
                      // Cek apakah total quantity melebihi target quantity
                      if (totalSelectedQuantity > selectedUtuhItem.qty) {
                        showAlert('Warning', `Total quantity (${totalSelectedQuantity}) melebihi target quantity (${selectedUtuhItem.qty})`, 'warning');
                        return;
                      }
                      
                      // Save selected saran utuh items to localStorage WO_total_quantity
                      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
                      
                      // Cek apakah item sudah ada di woTotalQuantity
                      const existingEntryIndex = totalQuantityData.findIndex(entry => entry.WoItemID === selectedUtuhItem.id);
                      
                      // Gunakan selectedUtuhItem.id sebagai WoItemID untuk konsistensi
                      const woItemID = selectedUtuhItem.id;
                      
                      // Create a new entry for plat dasar utuh
                      const newUtuhEntry = {
                        WoItemID: woItemID,
                        TargetQuantity: selectedUtuhItem.qty,
                        WOQuantity: [],
                        PreviousQuantity: 0
                      };
                      
                      // Process each selected item
                      selectedSaranUtuhItems.forEach(saranId => {
                        const quantity = saranUtuhQuantities[saranId] || 1;
                        
                        // Add to the new entry's WOQuantity
                        newUtuhEntry.WOQuantity.push({
                          ItemId: saranId,
                          Quantity: quantity
                        });
                      });
                      
                      // Update atau tambahkan entry
                      if (existingEntryIndex >= 0) {
                        totalQuantityData[existingEntryIndex] = newUtuhEntry;
                      } else {
                        totalQuantityData.push(newUtuhEntry);
                      }
                      
                      // Update localStorage
                      localStorage.setItem('WO_total_quantity', JSON.stringify(totalQuantityData));
                      
                      // Update state
                      setWoTotalQuantity(totalQuantityData);
                      
                      showAlert('Success', `${selectedSaranUtuhItems.length} saran plat utuh telah disimpan`, 'success');
                    } else {
                      showAlert('Warning', 'Pilih minimal satu saran plat utuh terlebih dahulu', 'warning');
                      return;
                    }
                    closeUtuhModal();
                  }}
                  className="px-6 bg-green-600 hover:bg-green-700"
                  disabled={selectedSaranUtuhItems.length === 0}
                >
                  Konfirmasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

