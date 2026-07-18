import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AsyncSearchSelect from '@/components/ui/async-search-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, Users, Package, Grid3X3, X, Info } from 'lucide-react';
import SelectPlatShaftDasar from './select-platshaftdasar';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { openPrintDialog, generateWOPlanningPrintContent } from '@/lib/printUtils';
import { clearCanvasPreviews, getStoredPreviewDataUrl } from '@/lib/canvasUtils';
import { findCanvasPreviewFile } from '@/lib/canvasPreviewUtils';
import { workOrderPlanningService } from '@/services/workOrderPlanningService';
import { request } from '@/lib/request';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from '@/components/Table';
import PelaksanaModal from '@/components/modals/PelaksanaModal';
import WorkOrderItemEditModal from '@/components/modals/WorkOrderItemEditModal';
import PlatPreviewModal from '@/components/PlatPreviewModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import test utilities for development
import '@/lib/canvasPreviewTest';
import '@/lib/canvasPreviewDemo';
import {
  getGudangOptions,
  getJenisBarangOptions,
  getBentukBarangOptions,
  getGradeBarangOptions,
  getPelaksanaOptions,
  getPelangganOptions,
} from '@/services/masterDataService';
import { documentSequenceService } from '@/services/master-data/documentSequenceService';
import CustomAlert from '@/components/modals/CustomAlert';
import { Switch } from '@/components/ui/switch';

export default function AddWorkOrderPage() {
  const navigate = useNavigate();
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  const SARAN_PER_PAGE = 6;

  // Function to get initial estimate done time (UTC+7, +30 minutes)
  const getInitialEstimateDone = () => {
    const now = new Date();
    const utc7Time = new Date(now.getTime() + (7 * 60 * 60000) + (30 * 60000));
    
    const pad = (n) => n.toString().padStart(2, '0');
    const yyyy = utc7Time.getUTCFullYear();
    const MM = pad(utc7Time.getUTCMonth() + 1);
    const dd = pad(utc7Time.getUTCDate());
    const hh = pad(utc7Time.getUTCHours());
    const mm = pad(utc7Time.getUTCMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  // Work Order Planning State
  const [workOrderData, setWorkOrderData] = useState({
    nomor_wo: '',
    tanggal_wo: new Date().toISOString().split('T')[0],
    tanggal_target: '',
    gudang_id: '',
    pelanggan_id: '',
    sales_order_id: '',
    estimate_done: getInitialEstimateDone(),
    catatan: '',
    status: 'Pending',
    prioritas: 'MEDIUM',
    handover_method: 'pickup'
  });
  const [typeWO, setTypeWO] = useState('Normal');

  // Qty Log Modal State
  const [qtyLogModalOpen, setQtyLogModalOpen] = useState(false);
  const [selectedQtyLog, setSelectedQtyLog] = useState([]);

  // Work Order Items State
  const [workOrderItems, setWorkOrderItems] = useState([]);

  // Work Order ID State - generate new ID or retrieve existing
  const [workOrderId, setWorkOrderId] = useState(() => {
    // Check if we have an active session
    const storedWorkOrderId = localStorage.getItem('WO_current_work_order_id');
    if (storedWorkOrderId) {
      return storedWorkOrderId;
    }

    // Generate new if none exists
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

  // Loading State
  const [loading, setLoading] = useState(false);
  const [loadingGudang, setLoadingGudang] = useState(false);
  const [loadingPelanggan, setLoadingPelanggan] = useState(false);
  const [loadingJenisBarang, setLoadingJenisBarang] = useState(false);
  const [loadingBentukBarang, setLoadingBentukBarang] = useState(false);
  const [loadingGradeBarang, setLoadingGradeBarang] = useState(false);
  const [loadingPelaksana, setLoadingPelaksana] = useState(false);
  const [loadingSalesOrder, setLoadingSalesOrder] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmSaveMessage, setConfirmSaveMessage] = useState('');
  const [includeImages, setIncludeImages] = useState(true);
  const [hideCustomerName, setHideCustomerName] = useState(true);
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationMismatches, setValidationMismatches] = useState([]);
  const [catatanError, setCatatanError] = useState(false);
  const [catatanRequiredOpen, setCatatanRequiredOpen] = useState(false);



  const runWOCleansing = () => {
    try {
      const keys = Object.keys(localStorage);
      const woKeys = keys.filter(key => key.startsWith('WO_'));
      woKeys.forEach(key => localStorage.removeItem(key));
    } catch (_) { }
    try { clearCanvasPreviews(); } catch (_) { }
    setWorkOrderItems([]);
    setSelectedSalesOrder(null);
    setSelectedPlatDasar({});
    setValidationMismatches([]);
    setCatatanError(false);
    setCatatanRequiredOpen(false);
    setPelaksanaModalOpen(false);
    setItemEditModalOpen(false);
    setUtuhModalOpen(false);
    setSelectedUtuhItem(null);
    setSaranUtuhData([]);
    setSelectedSaranUtuhItems([]);
    setSaranUtuhQuantities({});
    setWoTotalQuantity([]);
    setWorkOrderData(prev => ({
      ...prev,
      nomor_wo: '',
      catatan: '',
    }));
  };

  useEffect(() => {
    runWOCleansing();
  }, []);

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

  // Update qty_planning in workOrderItems whenever woTotalQuantity changes
  useEffect(() => {
    if (!woTotalQuantity || woTotalQuantity.length === 0) return;

    setWorkOrderItems(prevItems => {
      let isChanged = false;
      const newItems = prevItems.map(item => {
        // Find matching entry in woTotalQuantity
        // woTotalQuantity stores WoItemID which matches item.id
        const entry = woTotalQuantity.find(e => e.WoItemID === item.id || e.WoItemID === parseInt(item.id));

        if (entry && entry.WOQuantity) {
          // Calculate sum of Quantity in WOQuantity array
          const plannedQty = entry.WOQuantity.reduce((sum, q) => sum + (parseInt(q.Quantity) || 0), 0);

          // Only update if different to avoid infinite loop
          if (item.qty_planning !== plannedQty) {
            isChanged = true;
            return { ...item, qty_planning: plannedQty };
          }
        }
        return item;
      });

      return isChanged ? newItems : prevItems;
    });
  }, [woTotalQuantity]);

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
    if (!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id) {
      showAlert('Error', 'Data item belum lengkap untuk mencari saran plat utuh', 'error');
      return;
    }

    setLoadingSaranUtuh(true);
    try {
      const response = await request('/work-order-planning/get-saran-plat-utuh', {
        method: 'POST',
        body: JSON.stringify({
          // Required fields
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          tebal: parseFloat(item.tebal) || 0,
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          qty: parseInt(item.qty) || 1,

          // Optional fields
          item_barang_group_id: item.item_barang_group_id || null,
          diameter_luar: parseFloat(item.diameter_luar) || 0,
          diameter_dalam: parseFloat(item.diameter_dalam) || 0,
          diameter: parseFloat(item.diameter) || 0,
          sisi1: parseFloat(item.sisi1) || 0,
          sisi2: parseFloat(item.sisi2) || 0
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
    if (!jenisBarangId) return 'Belum dipilih';
    if (selectedSalesOrder && selectedSalesOrder.sales_order_items) {
      const soItem = selectedSalesOrder.sales_order_items.find(item => String(item.jenis_barang_id) === String(jenisBarangId));
      const jb = soItem?.jenis_barang;
      const name = jb?.nama_jenis_barang || jb?.nama_jenis || jb?.nama;
      if (name) return name;
    }
    const jenis = jenisBarangList.find(item => String(item.value) === String(jenisBarangId));
    return jenis ? jenis.label : 'Belum dipilih';
  };

  const getBentukBarangName = (bentukBarangId) => {
    if (!bentukBarangId) return 'Belum dipilih';
    if (selectedSalesOrder && selectedSalesOrder.sales_order_items) {
      const soItem = selectedSalesOrder.sales_order_items.find(item => String(item.bentuk_barang_id) === String(bentukBarangId));
      const bb = soItem?.bentuk_barang;
      const name = bb?.nama_bentuk_barang || bb?.nama_bentuk || bb?.nama;
      if (name) return name;
    }
    const bentuk = bentukBarangList.find(item => String(item.value) === String(bentukBarangId));
    return bentuk ? bentuk.label : 'Belum dipilih';
  };

  const getGradeBarangName = (gradeBarangId) => {
    if (!gradeBarangId) return 'Belum dipilih';
    if (selectedSalesOrder && selectedSalesOrder.sales_order_items) {
      const soItem = selectedSalesOrder.sales_order_items.find(item => String(item.grade_barang_id) === String(gradeBarangId));
      const gb = soItem?.grade_barang;
      const name = gb?.nama_grade_barang || gb?.nama_grade || gb?.nama;
      if (name) return name;
    }
    const grade = gradeBarangList.find(item => String(item.value) === String(gradeBarangId));
    return grade ? grade.label : 'Belum dipilih';
  };

  // Helper function to get dimensi potong display based on TipeBarang cancut_ flags
  const getDimensiPotong = (item) => {
    const bB = bentukBarangList.find(b => String(b.value) === String(item.bentuk_barang_id));
    const tb = bB?.tipe_barang;
    if (!tb) return '-';

    const formatVal = (val) => {
      const num = parseFloat(val) || 0;
      return num % 1 === 0 ? num.toString() : num.toFixed(2);
    };
    const hasVal = (val) => (parseFloat(val) || 0) !== 0;
    const dims = [];

    // Ordered combination checks (cancut_ flag OR non-zero value)
    if ((tb.cancut_diameter_luar || hasVal(item.diameter_luar)) && (tb.cancut_diameter_dalam || hasVal(item.diameter_dalam)) && (tb.cancut_panjang || hasVal(item.panjang))) {
      dims.push(formatVal(item.diameter_luar), formatVal(item.diameter_dalam), formatVal(item.panjang));
    } else if ((tb.cancut_sisi1 || hasVal(item.sisi1)) && (tb.cancut_sisi2 || hasVal(item.sisi2)) && (tb.cancut_tebal || hasVal(item.tebal)) && (tb.cancut_panjang || hasVal(item.panjang))) {
      dims.push(formatVal(item.sisi1), formatVal(item.sisi2), formatVal(item.tebal), formatVal(item.panjang));
    } else if ((tb.cancut_tebal || hasVal(item.tebal)) && (tb.cancut_lebar || hasVal(item.lebar)) && (tb.cancut_panjang || hasVal(item.panjang))) {
      dims.push(formatVal(item.tebal), formatVal(item.lebar), formatVal(item.panjang));
    } else if ((tb.cancut_diameter || hasVal(item.diameter)) && (tb.cancut_panjang || hasVal(item.panjang))) {
      dims.push(formatVal(item.diameter), formatVal(item.panjang));
    } else {
      // Fallback: include any dimension with cancut_ flag OR non-zero value
      if (tb.cancut_diameter_luar || hasVal(item.diameter_luar)) dims.push(formatVal(item.diameter_luar));
      if (tb.cancut_diameter_dalam || hasVal(item.diameter_dalam)) dims.push(formatVal(item.diameter_dalam));
      if (tb.cancut_diameter || hasVal(item.diameter)) dims.push(formatVal(item.diameter));
      if (tb.cancut_sisi1 || hasVal(item.sisi1)) dims.push(formatVal(item.sisi1));
      if (tb.cancut_sisi2 || hasVal(item.sisi2)) dims.push(formatVal(item.sisi2));
      if (tb.cancut_tebal || hasVal(item.tebal)) dims.push(formatVal(item.tebal));
      if (tb.cancut_lebar || hasVal(item.lebar)) dims.push(formatVal(item.lebar));
      if (tb.cancut_panjang || hasVal(item.panjang)) dims.push(formatVal(item.panjang));
    }

    return dims.length > 0 ? dims.join(' x ') : '-';
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

          const pelangganResponse = await getPelangganOptions();
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

          setSalesOrderList([]);

        } catch (error) {
          console.error('Error loading additional data:', error);
        } finally {
          setLoadingPelanggan(false);
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

      const [salesOrderItemsResponse, woNumberResponse] = await Promise.all([
        request(`/sales-order/sales-order-for-woplanning?sales_order_id=${salesOrderId}`, { method: 'GET' }),
        documentSequenceService.generateWONumber()
      ]);

      console.log('Sales Order for woplanning response:', salesOrderItemsResponse);
      console.log('Generated WO number:', woNumberResponse);
      try {
        localStorage.setItem('WO_current_work_order_id', woNumberResponse);
        setWorkOrderId(woNumberResponse);
      } catch (e) {
        console.warn('Failed to persist generated WO number to storage/state', e);
      }

      // Gunakan struktur response yang dikirim API (data)
      const soData = salesOrderItemsResponse?.data || null;


      const extractItems = (resp) => {
        if (!resp) return [];
        const candidates = [
          resp.items,
          resp.detail_items,
          resp.sales_order_items,
          resp.item_details,
          resp.data?.items,
          resp.data?.detail_items,
          resp.data?.sales_order_items,
          resp.data?.item_details,
          Array.isArray(resp.data) ? resp.data : undefined
        ].filter(Boolean);
        for (const c of candidates) {
          if (Array.isArray(c)) return c;
        }
        return Array.isArray(resp) ? resp : [];
      };
      const itemsData = extractItems(salesOrderItemsResponse);
      console.log('Sales Order items (for WO planning):', itemsData);

      setSelectedSalesOrder({
        ...(soData || {}),
        sales_order_items: Array.isArray(itemsData) ? itemsData : [],
      });

      if (itemsData && itemsData.length > 0) {
        // Transform Sales Order items to Work Order items
        const transformedItems = itemsData.map((item, index) => {
          // Generate unique wo_item_unique_id for each WO item
          const timestamp = Date.now() + index;
          const random = Math.random().toString(36).substring(2, 8);
          const woItemUniqueId = `wo_item_${timestamp}_${random}`;

          return {
            id: timestamp,
            wo_item_unique_id: woItemUniqueId,
            sales_order_item_id: item.id || item.sales_order_item_id,
            panjang: (item.panjang ?? item.length ?? item.p ?? 0),
            lebar: (item.lebar ?? item.width ?? item.l ?? 0),
            tebal: (item.tebal ?? 0),
            diameter_luar: (item.diameter_luar ?? 0),
            diameter_dalam: (item.diameter_dalam ?? 0),
            diameter: (item.diameter ?? 0),
            sisi1: (item.sisi1 ?? 0),
            sisi2: (item.sisi2 ?? 0),
            berat: (item.berat ?? item.weight ?? 0),
            qty: (item.sisa_qty ?? item.remaining_qty ?? item.available_qty ?? item.qty ?? item.qty_so ?? 1),
            qty_planning: 0,
            qty_planning_log: item.qty_planning_log || [],
            jenis_barang_id: (item.jenis_barang_id || item.jenis_barang?.id || item.item_jenis_id)?.toString?.() || '',
            bentuk_barang_id: (item.bentuk_barang_id || item.bentuk_barang?.id || item.item_bentuk_id)?.toString?.() || '',
            grade_barang_id: (item.grade_barang_id || item.grade_barang?.id || item.item_grade_id)?.toString?.() || '',
            jenis_potongan: (item.jenis_potongan ?? item.potongan_jenis ?? item.jenisPotongan ?? null),
            catatan: (item.catatan ?? item.note ?? item.notes ?? ''),
            item_barang_group_id: item.item_barang_group_id || item.item_barang_group?.id || null,
            item_barang_group_name: item.item_barang_group?.nama_group_barang || null,
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
          nomor_wo: woNumberResponse,
          gudang_id: soData?.gudang_id ?? prev.gudang_id,
          pelanggan_id: soData?.pelanggan_id ?? prev.pelanggan_id,
          catatan: soData?.catatan ?? prev.catatan ?? '',
          handover_method: soData?.handover_method ?? prev.handover_method ?? 'pickup',
          tanggal_target: soData?.tanggal_pengiriman ?? workOrderData.tanggal_wo
        }));

        showAlert('Sukses', `${itemsData.length} item berhasil diambil dari Sales Order\nNomor WO: ${woNumberResponse}`, 'success');
      } else {
        showAlert('Info', 'Sales Order tidak memiliki item. Silakan pilih Sales Order lain.', 'info');
        // Tidak menambahkan item default, biarkan kosong
        setWorkOrderItems([]);
        // Tetap set nomor WO dan header
        setWorkOrderData(prev => ({
          ...prev,
          nomor_wo: woNumberResponse,
          gudang_id: soData?.gudang_id ?? prev.gudang_id,
          pelanggan_id: soData?.pelanggan_id ?? prev.pelanggan_id,
          catatan: soData?.catatan ?? prev.catatan ?? '',
          handover_method: soData?.handover_method ?? prev.handover_method ?? 'pickup',
          tanggal_target: soData?.tanggal_pengiriman ?? workOrderData.tanggal_wo
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
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const woItemUniqueId = `wo_item_${timestamp}_${random}`;

    const newItem = {
      id: timestamp,
      wo_item_unique_id: woItemUniqueId,
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
      item_barang_group_id: null,
      item_barang_group_name: null,
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
  };

  const closePlatPreviewModal = () => {
    setShowPlatPreviewModal(false);
    setCurrentItemData(null);

    // Refresh woTotalQuantity from localStorage
    const savedData = localStorage.getItem('WO_total_quantity');
    setWoTotalQuantity(savedData ? JSON.parse(savedData) : []);
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

  const isQuantityAvailable = (item) => {
    const entry = woTotalQuantity.find(e => e.WoItemID === item.id || e.WoItemID === parseInt(item.id));
    // Only check current WOQuantity, ignore PreviousQuantity as it's for rollback only
    return entry && (entry.WOQuantity && entry.WOQuantity.some(q => q.Quantity > 0));
  };



  const buildSaranPlatCanvasData = () => {
    try {
      console.log('=== BUILDING SARAN PLAT CANVAS DATA ===');

      // Get used saran plats from localStorage
      const usedSaranPlats = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
      console.log('Used saran plats:', usedSaranPlats);

      if (usedSaranPlats.length === 0) {
        console.log('❌ No saran plats to save - usedSaranPlats is empty');
        console.log('usedSaranPlats:', usedSaranPlats);
        return;
      }

      const saranPlatData = [];

      for (const saranItemId of usedSaranPlats) {
        console.log(`Processing saran plat ${saranItemId}...`);

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

        const woItemUniqueIds = JSON.parse(localStorage.getItem('WO_item_unique_ids') || '[]');

        if (woItemUniqueIds.length === 0) {
          console.log('❌ No woItemUniqueIds found in localStorage');
          continue;
        }

        console.log(`=== SAVING SARAN PLAT ${saranItemId} ===`);
        console.log(`woItemUniqueIds:`, woItemUniqueIds);
        console.log(`WO items using this saran plat:`, woItemsUsingThisSaranPlat.map(item => item.WoItemID));

        const workOrderUniqueId = localStorage.getItem('WO_current_work_order_id');
        const canvasLayoutKey = `WO_canvas_layout_${saranItemId}_${workOrderUniqueId}`;
        const canvasLayoutData = localStorage.getItem(canvasLayoutKey);

        console.log(`Canvas layout key: ${canvasLayoutKey}`);
        console.log(`Canvas data exists:`, !!canvasLayoutData);

        let processedCanvasData = null;
        if (canvasLayoutData) {
          const canvasLayout = JSON.parse(canvasLayoutData);

          const currentWoItemIds = JSON.parse(localStorage.getItem('WO_item_unique_ids') || '[]');
          const currentWOBoxes = canvasLayout.boxes ? canvasLayout.boxes.filter(box => {
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
            if (canvasLayout.boxes && Array.isArray(canvasLayout.boxes)) {
              canvasLayout.boxes = canvasLayout.boxes.map(box => {
                const boxWoItemId = box.woItemId;
                const isFromCurrentWO = currentWoItemIds.includes(boxWoItemId) ||
                  currentWoItemIds.includes(String(boxWoItemId)) ||
                  currentWoItemIds.includes(parseInt(boxWoItemId));

                if (isFromCurrentWO) {
                  return {
                    ...box,
                    color: "#ef4444", // Red color for saved boxes from current WO
                    isDisabled: true, // Mark as disabled/saved
                    isSave: true, // Mark as saved to database
                    workOrderId: workOrderUniqueId
                  };
                } else {
                  return {
                    ...box,
                  };
                }
              });

              console.log(`Changed ${currentWOBoxes.length} boxes to red color for saran item ${saranItemId} (preserved ${canvasLayout.boxes.length - currentWOBoxes.length} boxes from other WO items)`);
            }

            processedCanvasData = JSON.stringify(canvasLayout);
          } else {
            console.log(`No boxes from current WO for saran item ${saranItemId} - skipping canvas save to preserve existing data`);
            processedCanvasData = null;
          }
        }

        if (processedCanvasData) {
          let canvasImageBase64 = null;
          try {
            const dataUrl = getStoredPreviewDataUrl(saranItemId);
            if (dataUrl) {
              canvasImageBase64 = dataUrl;
              console.log(`✅ Canvas image loaded from localStorage for item ${saranItemId}`);
            } else {
              console.log(`📷 No canvas image in localStorage for item ${saranItemId}`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to load canvas image from localStorage for item ${saranItemId}:`, error);
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
      return saranPlatData;
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
        estimate_done: workOrderData.estimate_done || null,
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
          diameter_luar: parseFloat(item.diameter_luar) || 0,
          diameter_dalam: parseFloat(item.diameter_dalam) || 0,
          diameter: parseFloat(item.diameter) || 0,
          sisi1: parseFloat(item.sisi1) || 0,
          sisi2: parseFloat(item.sisi2) || 0,
          item_barang_group_id: item.item_barang_group_id || null,
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          jenis_potongan: item.jenis_potongan || 'potongan',
          berat: parseFloat(item.berat) || 0,
          satuan: "PCS",
          diskon: 0,
          catatan: item.catatan,
          saran_plat_dasar: (() => {
            const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
            const woItemData = totalQuantityData.find(wo => wo.WoItemID === item.id);
            if (!woItemData || !woItemData.WOQuantity) return [];
            return woItemData.WOQuantity.map(woq => {
              // Get timestamp from stored WOQuantity
              let saveDate = woq.save_date;

              // Fallback to ancient date if no timestamp found
              if (!saveDate) {
                saveDate = "2000-01-01 00:00:00";
              }

              return {
                item_barang_id: woq.ItemId,
                quantity: woq.Quantity,
                is_selected: true,
                save_date: saveDate
              };
            });
          })(),
          pelaksana: item.pelaksana.map(p => ({
            pelaksana_id: p.pelaksana_id,
            qty: p.qty,
            weight: (typeof p.berat !== 'undefined') ? (parseFloat(p.berat) || 0) : (parseFloat(p.weight) || 0),
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
      showAlert('Sukses', 'Dummy JSON generated and copied to clipboard! Check console for full output.', 'success');

    } catch (error) {
      console.error('Error generating dummy JSON:', error);
      showAlert('Error', 'Error generating dummy JSON. Check console for details.', 'error');
    }
  };

  // Handle form submission
  const proceedSave = async () => {
    setLoading(true);
    try {
      const existingWoUniqueId = localStorage.getItem('WO_current_work_order_id');
      const woUniqueId = existingWoUniqueId || `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const totalQuantityData = JSON.parse(localStorage.getItem('WO_total_quantity') || '[]');
      const existingWoItemIds = totalQuantityData.map(item => item.WoItemID.toString());
      localStorage.setItem('WO_item_unique_ids', JSON.stringify(existingWoItemIds));
      const saranPlatCanvasData = buildSaranPlatCanvasData() || [];
      const saranPlatCanvasMap = {};
      saranPlatCanvasData.forEach(entry => {
        if (entry && entry.item_barang_id) {
          saranPlatCanvasMap[String(entry.item_barang_id)] = entry;
        }
      });
      const firstCanvasEntry = saranPlatCanvasData.length > 0 ? saranPlatCanvasData[0] : null;
      const transformedData = {
        ...(firstCanvasEntry ? {
          item_barang_id: firstCanvasEntry.item_barang_id,
          canvas_data: firstCanvasEntry.canvas_data,
          canvas_image: firstCanvasEntry.canvas_image
        } : {}),
        wo_unique_id: woUniqueId,
        tanggal_wo: workOrderData.tanggal_wo,
        tanggal_target: workOrderData.tanggal_target,
        id_sales_order: workOrderData.sales_order_id,
        id_pelanggan: workOrderData.pelanggan_id,
        id_gudang: workOrderData.gudang_id,
        prioritas: workOrderData.prioritas,
        typeWO: (() => {
          const t = String(typeWO || '').toLowerCase();
          if (t === 'batal') return 'cancel';
          if (t === 'pending') return 'partial_wo';
          return undefined;
        })(),
        handover_method: workOrderData.handover_method,
        estimate_done: workOrderData.estimate_done || null,
        catatan: workOrderData.catatan,
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
          wo_item_unique_id: existingWoItemIds[index] || `WOI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          sales_order_item_id: item.sales_order_item_id,
          qty: parseInt(item.qty) || 0,
          qty_planning: parseInt(item.qty_planning) || 0,
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          tebal: parseFloat(item.ketebalan || item.tebal) || 0,
          diameter: parseFloat(item.diameter) || 0,
          diameter_luar: parseFloat(item.diameter_luar) || 0,
          diameter_dalam: parseFloat(item.diameter_dalam) || 0,
          sisi1: parseFloat(item.sisi1) || 0,
          sisi2: parseFloat(item.sisi2) || 0,
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          jenis_potongan: item.jenis_potongan || 'potongan',
          berat: parseFloat(item.berat) || 0,
          satuan: 'PCS',
          diskon: 0,
          catatan: item.catatan,
          item_barang_group_id: item.item_barang_group_id || null,
          saran_plat_dasar: (() => {
            const tq = totalQuantityData;
            const woItemData = tq.find(wo => wo.WoItemID === item.id);
            if (!woItemData || !woItemData.WOQuantity) return [];
            return woItemData.WOQuantity.map(woq => {
              const entry = saranPlatCanvasMap[String(woq.ItemId)] || saranPlatCanvasMap[String(parseInt(woq.ItemId))];
              const base = {
                item_barang_id: woq.ItemId,
                quantity: woq.Quantity,
                is_selected: true
              };

              // Try specific image first (WO Item specific)
              const woItemUniqueId = item.wo_item_unique_id || item.id;
              let specificImage = null;
              if (woItemUniqueId) {
                try {
                  const specificKey = `WO_canvas_preview_woitem_${woItemUniqueId}_item_${woq.ItemId}`;
                  specificImage = localStorage.getItem(specificKey);
                  if (specificImage) console.log('Found specific canvas for payload:', specificKey);
                } catch (_) { }
              }

              // Get timestamp from stored WOQuantity
              let saveDate = woq.save_date;

              // Fallback to ancient date if no timestamp found (so it loses against other updates)
              if (!saveDate) {
                saveDate = '2000-01-01 00:00:00';
              }

              base.save_date = saveDate;

              if (specificImage) {
                base.canvas_image = specificImage;
              } else if (entry && entry.canvas_image) {
                base.canvas_image = entry.canvas_image;
              }

              if (entry && entry.canvas_data) {
                base.canvas_layout = entry.canvas_data;
              }
              return base;
            });
          })(),
          pelaksana: item.pelaksana.map(p => ({
            pelaksana_id: p.pelaksana_id,
            qty: p.qty,
            weight: (typeof p.berat !== 'undefined') ? (parseFloat(p.berat) || 0) : (parseFloat(p.weight) || 0),
            tanggal: workOrderData.tanggal_wo,
            jam_mulai: '08:00',
            jam_selesai: '17:00',
            catatan: p.catatan
          }))
        }))
      };
      const response = await request('/work-order-planning/with-saran-plat-dasar', {
        method: 'POST',
        body: JSON.stringify(transformedData)
      });
      const createdId = response.data?.id || response.id;
      const workOrderNumber = response.data?.nomor_wo || workOrderData.nomor_wo;
      const mapLabel = (list, value) => {
        const found = list.find(opt => String(opt.value) === String(value));
        return found ? (found.label || found.nama || found.text || String(value)) : String(value || 'N/A');
      };
      // Prepare canvas images with async lookup
      const prepareCanvasImages = async () => {
        try {
          const images = [];
          // Map items to their selected plat dasar images
          for (const item of workOrderItems) {
            // Get used plats from totalQuantityData (Source of Truth for Logic)
            const itemUsage = totalQuantityData.find(u => u.WoItemID === item.id || u.WoItemID === parseInt(item.id));
            const usedPlatIds = itemUsage ? itemUsage.WOQuantity.map(q => q.ItemId) : [];

            // Get used plats from selectedPlatDasar (Source of Truth for UI Selection)
            const selectedPlats = selectedPlatDasar[item.id] || [];
            const selectedPlatIds = selectedPlats.map(p => p.id || p.item_barang_id).filter(Boolean);

            // Merge unique IDs
            const allPlatIds = [...new Set([...usedPlatIds, ...selectedPlatIds])];

            for (const itemId of allPlatIds) {
              if (!itemId) continue;

              let src = null;
              const woItemUniqueId = item.wo_item_unique_id || item.id;

              // 0. Try to find specific WoItemId preview in localStorage first (Fastest & Newest)
              if (woItemUniqueId) {
                try {
                  const specificKey = `WO_canvas_preview_woitem_${woItemUniqueId}_item_${itemId}`;
                  const cachedSpecific = localStorage.getItem(specificKey);
                  if (cachedSpecific) {
                    src = cachedSpecific;
                    console.log('Found specific canvas in localStorage:', specificKey);
                  }
                } catch (_) { }
              }

              // 1. (Removed) Try to find WoItemId specific file first
              // We removed this because we are now relying solely on localStorage for previews
              // to avoid file system errors in EXE environment

              // 2. Fallback to localStorage (Legacy/Cached generic item)
              if (!src) {
                try {
                  src = getStoredPreviewDataUrl(itemId);
                } catch (_) { }
              }

              // 3. (Removed) Fallback to generic file on disk
              // Removed for the same reason as above

              // Add image with explicit link to WO Item ID
              images.push({
                item_id: itemId, // Inventory Item ID
                wo_item_id: item.id, // WO Item ID (Client side ID)
                wo_item_unique_id: item.wo_item_unique_id || item.id,
                src
              });
            }
          }

          // Fallback: If no images found via mapping (e.g. legacy data in localStorage), try to load from used list
          if (images.length === 0) {
            const used = JSON.parse(localStorage.getItem('WO_used_saran_plats') || '[]');
            for (const id of used) {
              const itemId = parseInt(id);
              if (!itemId) continue;

              // Check if this image is already added
              if (images.some(img => img.item_id === itemId)) continue;

              let src = null;
              try {
                src = getStoredPreviewDataUrl(itemId);
              } catch (_) { }

              if (!src) {
                const fileName = `canvas-preview-ItemId-${itemId}.jpg`;
                src = `/canvas-previews/${fileName}`;
              }

              images.push({ item_id: itemId, src });
            }
          }

          return images;
        } catch (e) {
          console.error('Error preparing canvas images:', e);
          return [];
        }
      };

      const canvasImages = await prepareCanvasImages();

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
          id: item.id,
          wo_item_unique_id: item.wo_item_unique_id || item.id,
          jenisBarang: { nama_jenis_barang: mapLabel(jenisBarangList, item.jenis_barang_id), nama: mapLabel(jenisBarangList, item.jenis_barang_id) },
          bentukBarang: { nama_bentuk_barang: mapLabel(bentukBarangList, item.bentuk_barang_id), nama_bentuk: mapLabel(bentukBarangList, item.bentuk_barang_id), nama: mapLabel(bentukBarangList, item.bentuk_barang_id) },
          gradeBarang: { nama_grade_barang: mapLabel(gradeBarangList, item.grade_barang_id), nama_grade: mapLabel(gradeBarangList, item.grade_barang_id), nama: mapLabel(gradeBarangList, item.grade_barang_id) },
          groupBarangName: item.item_barang_group_name || '-',
          dimensi: (() => {
            const bB = bentukBarangList.find(b => String(b.value) === String(item.bentuk_barang_id));
            const tb = bB?.tipe_barang;
            if (tb) {
              const formatInt = (val) => Math.round(parseFloat(val) || 0);
              const dims = [];
              if (tb.diameter_luar && tb.diameter_dalam && tb.panjang) {
                dims.push(formatInt(item.diameter_luar), formatInt(item.diameter_dalam), formatInt(item.panjang));
              } else if (tb.sisi1 && tb.sisi2 && tb.tebal && tb.panjang) {
                dims.push(formatInt(item.sisi1), formatInt(item.sisi2), formatInt(item.tebal), formatInt(item.panjang));
              } else if (tb.tebal && tb.lebar && tb.panjang) {
                dims.push(formatInt(item.tebal), formatInt(item.lebar), formatInt(item.panjang));
              } else if (tb.diameter && tb.panjang) {
                dims.push(formatInt(item.diameter), formatInt(item.panjang));
              } else {
                // Fallback using available standard properties
                if (tb.tebal) dims.push(formatInt(item.tebal));
                if (tb.lebar) dims.push(formatInt(item.lebar));
                if (tb.panjang) dims.push(formatInt(item.panjang));
              }
              if (dims.length > 0) return dims.join('x');
            }
            return `${Math.round(parseFloat(item.panjang) || 0)}x${Math.round(parseFloat(item.lebar) || 0)}x${Math.round(parseFloat(item.tebal) || 0)}`;
          })(),
          qtyPlanning: item.qty_planning ?? 0,
          jenisPotongan: item.jenis_potongan || 'potongan',
          keterangan: item.catatan || '-'
        })),
        canvasImages: canvasImages
      };
      const html = generateWOPlanningPrintContent(printData, { includeImages, hideCustomerName });
      openPrintDialog(html);
      navigate('/work-order');
    } catch (error) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!workOrderData.nomor_wo || !workOrderData.gudang_id || !workOrderData.pelanggan_id || !workOrderData.sales_order_id) {
      showAlert('Error', 'Mohon lengkapi data Work Order', 'error');
      return;
    }

    // Validasi estimate_done harus lebih besar dari current date time
    if (workOrderData.estimate_done) {
      const estimateDoneDate = new Date(workOrderData.estimate_done);
      const currentDate = new Date();

      if (estimateDoneDate <= currentDate) {
        showAlert('Error', 'Estimate Done harus lebih besar dari tanggal dan waktu saat ini', 'error');
        return;
      }
    }

    // Validasi pelaksana - cek kelengkapan data pelaksana sesuai quantity
    const pelaksanaValidationErrors = [];
    workOrderItems.forEach((item, index) => {
      const itemNumber = index + 1;
      const itemQty = parseInt(item.qty_planning) || 0;
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
          `Item ${itemNumber}: Total quantity pelaksana (${totalPelaksanaQty}) harus sama dengan quantity planning (${itemQty})`
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
        `Terdapat kesalahan dalam data pelaksana:\n\n${pelaksanaValidationErrors.join('\n')}\n\nTotal quantity pelaksana harus sama dengan quantity planning.`,
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

    // Pre-save server validation against Sales Order coverage
    try {
      const validatePayload = {
        id_sales_order: parseInt(workOrderData.sales_order_id),
        items: workOrderItems.map(item => ({
          sales_order_item_id: item.sales_order_item_id,
          quantity: parseInt(item.qty_planning) || 0
        }))
      };
      const validateResp = await workOrderPlanningService.validateSoCoverage(validatePayload);
      const data = validateResp?.data || validateResp;
      const isValid = data?.valid ?? data?.data?.valid ?? false;
      const mismatches = data?.mismatches || data?.data?.mismatches || [];
      if (!isValid) {
        setValidationMismatches(Array.isArray(mismatches) ? mismatches : []);
        if (!workOrderData.catatan || !workOrderData.catatan.trim()) {
          setCatatanError(true);
          setCatatanRequiredOpen(true);
          return;
        }
        setValidationOpen(true);
        return;
      }
    } catch (err) {
      showAlert('Error', 'Gagal melakukan validasi WO terhadap SO', 'error');
      return;
    }

    setTypeWO('Normal');
    const msg = [
      `Nomor WO: ${workOrderData.nomor_wo}`,
      `Tanggal WO: ${workOrderData.tanggal_wo}`,
      `Type WO: ${'Normal'}`,
      `Prioritas: ${workOrderData.prioritas}`,
      `Metode Penyerahan: ${workOrderData.handover_method === 'pickup' ? 'Pickup' : 'Delivery'}`,
      `Jumlah Item: ${workOrderItems.length}`,
      `Total Pelaksana: ${workOrderItems.reduce((total, item) => total + item.pelaksana.length, 0)}`
    ].join('\n');
    setConfirmSaveMessage(msg);
    setConfirmSaveOpen(true);
  };

  return (
    <PageLayout title="Work Order Planning" category="TRANSAKSI">

      <form onSubmit={handleSubmit}>
        {/* Work Order Planning Header */}
        <Card className="section-card">
          <CardHeader className="section-header">
            <div className="flex items-center justify-between">
              <CardTitle className="page-title flex items-center gap-2">

                Input Work Order Planning
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="default" size="sm" onClick={() => handleSubmit({ preventDefault: () => { } })} className="btn-primary">
                  Simpan Work Order
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => { runWOCleansing(); navigate('/work-order'); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke List
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Order *
                </label>
                <AsyncSearchSelect
                  label=""
                  placeholder="Pilih Sales Order"
                  preload={true}
                  value={workOrderData.sales_order_id ? workOrderData.sales_order_id.toString() : ''}
                  onValueChange={(value) => {
                    if (!value) return;
                    runWOCleansing();
                    const id = parseInt(value);
                    setWorkOrderData({ ...workOrderData, sales_order_id: id });
                    loadSalesOrderDetail(id);
                  }}
                  fetchOptions={async (q, page) => {
                    const params = new URLSearchParams({ per_page: '10', page: String(page || 1), status: 'submit,partial_wo' });
                    if (q) params.append('search', q);
                    params.set('per_page', '50');
                    params.append('order', 'desc');
                    const resp = await request(`/sales-order/header?${params.toString()}`, { method: 'GET' });
                    const rows = Array.isArray(resp?.data) ? resp.data : [];
                    return rows.map(so => {
                      const formattedDate = so.tanggal_so
                        ? new Date(so.tanggal_so).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '';
                      return {
                        value: String(so.id),
                        label: `${so.nomor_so} - ${so.pelanggan?.nama_pelanggan || 'Unknown'} (${formattedDate})`,
                        nomor_so: so.nomor_so,
                        tanggal_so: so.tanggal_so,
                        pelanggan_id: so.pelanggan_id,
                        pelanggan_nama: so.pelanggan?.nama_pelanggan,
                        gudang_id: so.gudang_id,
                        gudang_nama: so.gudang?.nama_gudang
                      };
                    });
                  }}
                  displayKey="label"
                  valueKey="value"
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
                  onChange={(e) => setWorkOrderData({ ...workOrderData, tanggal_wo: e.target.value })}
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
                  onChange={(e) => setWorkOrderData({ ...workOrderData, tanggal_target: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gudang *</label>
                <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 bg-gray-50 text-gray-600 cursor-default">
                  <span>{selectedSalesOrder?.gudang?.nama_gudang ? selectedSalesOrder.gudang.nama_gudang : (gudangList.find(g => String(g.value) === String(workOrderData.gudang_id))?.label || 'Belum dipilih')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pelanggan *</label>
                <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 bg-gray-50 text-gray-600 cursor-default">
                  <span>{selectedSalesOrder?.pelanggan?.nama_pelanggan ? selectedSalesOrder.pelanggan.nama_pelanggan : (pelangganList.find(p => String(p.value) === String(workOrderData.pelanggan_id))?.label || 'Belum dipilih')}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioritas
                </label>
                <select
                  value={workOrderData.prioritas}
                  onChange={(e) => setWorkOrderData({ ...workOrderData, prioritas: e.target.value })}
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
                <div className="flex h-10 items-center justify-between rounded-md border px-3 py-2 bg-gray-50 text-gray-600 cursor-default">
                  <span>{workOrderData.handover_method === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perkiraan Selesai
                </label>
                <Input
                  type="datetime-local"
                  value={workOrderData.estimate_done}
                  onChange={(e) => setWorkOrderData({ ...workOrderData, estimate_done: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <Input
                  placeholder="Catatan tambahan..."
                  value={workOrderData.catatan}
                  onChange={(e) => {
                    setWorkOrderData({ ...workOrderData, catatan: e.target.value });
                    if (e.target.value && e.target.value.trim().length > 0) setCatatanError(false);
                  }}
                  className={catatanError ? "border-red-500" : undefined}
                />
                {catatanError && (
                  <p className="text-xs text-red-600 mt-1">Catatan wajib diisi saat validasi tidak valid</p>
                )}
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
                    <TableHeader className="text-left">Dimensi Potong (mm)</TableHeader>
                    <TableHeader className="text-left">Qty</TableHeader>
                    <TableHeader className="text-left">Qty Planning</TableHeader>
                    <TableHeader className="text-left">Berat (kg)</TableHeader>
                    <TableHeader className="text-left">Jenis</TableHeader>
                    <TableHeader className="text-left">Bentuk</TableHeader>
                    <TableHeader className="text-left">Grade</TableHeader>
                    <TableHeader className="text-left">Group Barang</TableHeader>
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
                      <TableCell colSpan="10" className="px-4 py-8 text-center text-gray-500">
                        Sales Order tidak memiliki item. Silakan pilih Sales Order lain.
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrderItems.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <TableRow>
                          <TableCell className="text-left">#{index + 1}</TableCell>
                          <TableCell className="text-left">
                            <div className="px-3 py-2 bg-gray-50 rounded text-sm whitespace-nowrap">
                              {getDimensiPotong(item)}
                            </div>
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex items-center gap-2">
                              <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                                {item.qty || '0'}
                              </div>
                              {item.qty_planning_log && item.qty_planning_log.length > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedQtyLog(item.qty_planning_log);
                                    setQtyLogModalOpen(true);
                                  }}
                                >
                                  <Info className="w-4 h-4 text-blue-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-left">
                            <div className={`px-3 py-2 rounded text-sm font-medium ${(item.qty_planning || 0) === parseInt(item.qty || 0)
                              ? 'bg-green-50 text-green-700'
                              : (item.qty_planning || 0) > parseInt(item.qty || 0)
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-gray-50'
                              }`}>
                              {item.qty_planning || '0'}
                            </div>
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="px-3 py-2 bg-gray-50 rounded text-sm">
                              {item.berat ? `${parseFloat(item.berat).toFixed(2)}` : '0.00'}
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
                              {item.item_barang_group_name || '-'}
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
                                  disabled={!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id}
                                  className={`text-xs ${isQuantityAvailable(item) ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" : ""}`}
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
                                  disabled={!item.jenis_barang_id || !item.bentuk_barang_id || !item.grade_barang_id}
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
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeWorkOrderItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2 border">
            <span className="text-sm text-gray-800">Sembunyikan nama pelanggan saat Print</span>
            <Switch
              checked={hideCustomerName}
              onCheckedChange={setHideCustomerName}
              aria-label="Sembunyikan nama pelanggan saat Print"
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/work-order')}
              disabled={loading}
            >
              Batal
            </Button>
            {false && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateDummyJson}
                disabled={loading}
              >
                Generate Dummy JSON
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Work Order'}
            </Button>
          </div>
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
          perPage={SARAN_PER_PAGE}
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
        workOrderItem={workOrderItems.find(item => item.id === pelaksanaModalItemId) || null}
      />

      {/* Plat Preview Modal */}
      <PlatPreviewModal
        isOpen={showPlatPreviewModal}
        onClose={closePlatPreviewModal}
        currentItemData={currentItemData}
        calculateRequiredArea={calculateRequiredArea}
      />

      {/* Qty Log Modal */}
      <Dialog open={qtyLogModalOpen} onOpenChange={setQtyLogModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Riwayat Penggunaan Qty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. WO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedQtyLog.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{log.nomor_wo}</TableCell>
                    <TableCell>{log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID') : (log.tanggal || '-')}</TableCell>
                    <TableCell>{log.qty_used || log.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

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
                            className={`p-3 border rounded-lg transition-colors ${isSelected
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
                                        const newQuantities = { ...prev };
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
                                <div className="flex flex-col items-end">
                                  <p className="text-sm font-medium text-green-600">{saran.sisa_luas} m²</p>
                                  <p className="text-xs text-gray-500">Sisa: {parseInt(saran.sisa_quantity ?? saran.qty ?? 0)} pcs</p>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center">
                                    <label className="text-xs text-gray-600 mr-1">Qty:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={Math.min(parseInt(saran.sisa_quantity ?? saran.qty ?? 999999), selectedUtuhItem.qty)}
                                      value={saranUtuhQuantities[saran.id] || 1}
                                      onChange={(e) => {
                                        const sisaQty = parseInt(saran.sisa_quantity ?? saran.qty ?? 999999);
                                        const requiredQty = selectedUtuhItem.qty;
                                        const maxQty = Math.min(sisaQty, requiredQty);

                                        let value = parseInt(e.target.value) || 0;
                                        if (value > maxQty) value = maxQty;
                                        if (value < 1) value = 1;

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
                        )
                      })}
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
      <CustomAlert
        open={confirmSaveOpen}
        onOpenChange={setConfirmSaveOpen}
        title="Konfirmasi Simpan Work Order"
        message={`${confirmSaveMessage}\n\nApakah Anda yakin ingin menyimpan Work Order ini?`}
        type="info"
        showCancel={true}
        confirmText={loading ? 'Menyimpan...' : 'Ya, Simpan'}
        cancelText="Tidak"
        onConfirm={proceedSave}
        extraContent={(
          <div className="w-full flex items-center justify-between gap-4 bg-gray-50 rounded-md px-3 py-2 border">
            <span className="text-sm text-gray-800">Sertakan gambar untuk print</span>
            <Switch
              checked={includeImages}
              onCheckedChange={setIncludeImages}
              aria-label="Sertakan gambar untuk print"
            />
          </div>
        )}
      />
      {/* Catatan Required Modal */}
      <CustomAlert
        open={catatanRequiredOpen}
        onOpenChange={setCatatanRequiredOpen}
        title="Catatan Wajib Diisi"
        message={"Quantity WO tidak sesuai dengan SO. Harap isi Catatan terlebih dahulu sebelum melanjutkan."}
        type="warning"
        showCancel={false}
        confirmText="Tutup"
        onConfirm={() => setCatatanRequiredOpen(false)}
      />
      {/* Validation Mismatch Modal (CustomAlert with actions) */}
      <CustomAlert
        open={validationOpen}
        onOpenChange={setValidationOpen}
        title="Validasi WO Gagal"
        message={"Jumlah item WO tidak sesuai dengan SO. Perbaiki mismatches berikut."}
        type="warning"
        showCancel={false}
        confirmText="Tutup"
        onConfirm={() => setValidationOpen(false)}
        extraContent={(
          <div className="mt-3 max-h-72 overflow-y-auto">
            {validationMismatches.length === 0 ? (
              <div className="text-sm text-gray-600">Tidak ada detail mismatch</div>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                {validationMismatches.map((m, idx) => {
                  const soItem = selectedSalesOrder?.sales_order_items?.find(i => String(i.id) === String(m.sales_order_item_id));
                  const itemIndex = selectedSalesOrder?.sales_order_items?.findIndex(i => String(i.id) === String(m.sales_order_item_id));
                  const itemNumber = itemIndex !== -1 ? itemIndex + 1 : m.sales_order_item_id;

                  let itemName = '';
                  if (soItem) {
                    const jb = soItem.jenis_barang?.nama_jenis_barang || soItem.jenis_barang?.nama || '';
                    const bb = soItem.bentuk_barang?.nama_bentuk_barang || soItem.bentuk_barang?.nama || '';
                    const dim = `${parseFloat(soItem.panjang || 0)}x${parseFloat(soItem.lebar || 0)}x${parseFloat(soItem.tebal || 0)}`;
                    itemName = `${jb} ${bb} ${dim}`.trim();
                  }

                  return (
                    <li key={idx}>
                      {`Item #${itemNumber}${itemName ? ` (${itemName})` : ''} membutuhkan ${m.expected_qty}, sekarang ${m.incoming_qty}${(m.existing_planned_qty && Number(m.existing_planned_qty) > 0) ? `, sebelumnya ${m.existing_planned_qty}` : ''}`}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setWorkOrderData(prev => ({ ...prev, status: 'Pending' }));
                  setTypeWO('Pending');
                  setValidationOpen(false);
                  const msg = [
                    `Nomor WO: ${workOrderData.nomor_wo}`,
                    `Tanggal WO: ${workOrderData.tanggal_wo}`,
                    `Type WO: Pending`,
                    `Prioritas: ${workOrderData.prioritas}`,
                    `Metode Penyerahan: ${workOrderData.handover_method === 'pickup' ? 'Pickup' : 'Delivery'}`,
                    `Jumlah Item: ${workOrderItems.length}`,
                    `Total Pelaksana: ${workOrderItems.reduce((total, item) => total + item.pelaksana.length, 0)}`
                  ].join('\n');
                  setConfirmSaveMessage(msg);
                  setConfirmSaveOpen(true);
                }}
                className="bg-gray-900 text-white hover:bg-black"
                size="sm"
              >
                Pending
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setTypeWO('Batal');
                  setValidationOpen(false);
                  const msg = [
                    `Nomor WO: ${workOrderData.nomor_wo}`,
                    `Tanggal WO: ${workOrderData.tanggal_wo}`,
                    `Type WO: Batal`,
                    `Prioritas: ${workOrderData.prioritas}`,
                    `Metode Penyerahan: ${workOrderData.handover_method === 'pickup' ? 'Pickup' : 'Delivery'}`,
                    `Jumlah Item: ${workOrderItems.length}`,
                    `Total Pelaksana: ${workOrderItems.reduce((total, item) => total + item.pelaksana.length, 0)}`
                  ].join('\n');
                  setConfirmSaveMessage(msg);
                  setConfirmSaveOpen(true);
                }}
                variant="outline"
                size="sm"
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      />
      <AlertComponent />
    </PageLayout>
  );
}

