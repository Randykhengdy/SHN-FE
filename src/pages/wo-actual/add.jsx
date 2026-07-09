import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AsyncSearchSelect from '@/components/ui/async-search-select';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Plus, Trash2, Calendar, User, Package, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { woActualService } from '@/services/woActualService';
import { workOrderService } from '@/services/workOrderService';
import { generateWOActualPrintContent, openPrintDialog } from '@/lib/printUtils';
import CustomAlert from '@/components/modals/CustomAlert';
import { Switch } from '@/components/ui/switch';
import PelaksanaActualModal from '@/components/modals/PelaksanaActualModal';
import ReturnToRackModal from '@/components/modals/ReturnToRackModal';
import { getPelaksanaOptions } from '@/services/masterDataService';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import apiConfig from '@/config/api';

export default function AddWOActualPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  // Helper: build storage URL from file path
  const buildStorageUrl = (path) => {
    if (!path) return null;
    try {
      const base = apiConfig.baseUrl.replace(/\/api$/, '');
      let normalized = path.replace(/^\/+/, '');
      normalized = normalized.replace(/^work-order-actual\/\d+\/items\//, 'work-order-actual/items/');
      const hasStoragePrefix = /^storage\//.test(normalized);
      return hasStoragePrefix ? `${base}/${normalized}` : `${base}/storage/${normalized}`;
    } catch (e) {
      return null;
    }
  };

  // Helper: resolve any input (base64/raw/url/path) to displayable img src
  const resolveImageSrc = (input) => {
    if (!input) return null;
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (trimmed.startsWith('blob:')) return trimmed;
    if (/^data:image\//i.test(trimmed)) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^[A-Za-z0-9+/=]+$/i.test(trimmed) && trimmed.length > 100) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    return buildStorageUrl(trimmed);
  };

  const getItemDetailsText = (planningItem) => {
    if (!planningItem) return '';
    let dimStr = planningItem.dimensi || '-';
    const tb = planningItem.bentuk_barang?.tipe_barang || planningItem.bentuk_barang?.tipeBarang;
    if (tb) {
      const formatInt = (val) => Math.round(parseFloat(val) || 0);
      const dims = [];
      if (tb.diameter_luar && tb.diameter_dalam && tb.panjang) {
        dims.push(formatInt(planningItem.diameter_luar), formatInt(planningItem.diameter_dalam), formatInt(planningItem.panjang));
      } else if (tb.sisi1 && tb.sisi2 && tb.tebal && tb.panjang) {
        dims.push(formatInt(planningItem.sisi1), formatInt(planningItem.sisi2), formatInt(planningItem.tebal), formatInt(planningItem.panjang));
      } else if (tb.tebal && tb.lebar && tb.panjang) {
        dims.push(formatInt(planningItem.tebal || planningItem.ketebalan), formatInt(planningItem.lebar), formatInt(planningItem.panjang));
      } else if (tb.diameter && tb.panjang) {
        dims.push(formatInt(planningItem.diameter), formatInt(planningItem.panjang));
      } else {
        if (tb.tebal) dims.push(formatInt(planningItem.tebal || planningItem.ketebalan));
        if (tb.lebar) dims.push(formatInt(planningItem.lebar));
        if (tb.panjang) dims.push(formatInt(planningItem.panjang));
      }
      if (dims.length > 0) dimStr = dims.join('x');
    } else if (!planningItem.dimensi) {
      dimStr = `${Math.round(parseFloat(planningItem.panjang) || 0)}x${Math.round(parseFloat(planningItem.lebar) || 0)}x${Math.round(parseFloat(planningItem.ketebalan || planningItem.tebal) || 0)}`;
    }

    let kodeBarang = '-';
    if (planningItem.item_barang_group && planningItem.item_barang_group.kode_barang) {
      kodeBarang = planningItem.item_barang_group.kode_barang;
    } else if (planningItem.item_barang_group_name) {
      kodeBarang = planningItem.item_barang_group_name;
    } else if (planningItem.jenis_barang && planningItem.jenis_barang.kode_barang) {
      kodeBarang = planningItem.jenis_barang.kode_barang;
    } else if (planningItem.kode_barang) {
      kodeBarang = planningItem.kode_barang;
    }

    const bentuk = planningItem.bentuk_barang?.nama || planningItem.bentuk_barang?.nama_bentuk_barang || '-';
    const grade = planningItem.grade_barang?.nama || planningItem.grade_barang?.nama_grade_barang || '-';
    const potong = planningItem.jenis_potongan || '-';

    return `Kode Barang: ${kodeBarang} | Bentuk: ${bentuk} | Grade: ${grade} | Dimensi: ${dimStr} | Potong: ${potong}`;
  };

  // Form State - Updated to match new API structure
  const [formData, setFormData] = useState({
    planningWorkOrderId: '',
    status: 'Pending', // Default status
    prioritas: 'MEDIUM', // Default priority
    catatan: '',
    foto_bukti: [], // Will store array of base64 encoded images
    foto_bukti_preview: [] // For preview display array
  });
  const [planningCanvasImagesMap, setPlanningCanvasImagesMap] = useState({});

  // WO Planning Options
  const [woPlanningList, setWoPlanningList] = useState([]);
  const [selectedWOPlanning, setSelectedWOPlanning] = useState(null);
  const [loadingWOPlanning, setLoadingWOPlanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Items State - Updated structure
  const [actualItems, setActualItems] = useState({});

  // Pelaksana state
  const [pelaksanaList, setPelaksanaList] = useState([]);
  const [loadingPelaksana, setLoadingPelaksana] = useState(false);
  const [pelaksanaModalOpen, setPelaksanaModalOpen] = useState(false);
  const [pelaksanaModalItemId, setPelaksanaModalItemId] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewDetails, setPreviewDetails] = useState('');

  // Loading State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  const [pendingPrintData, setPendingPrintData] = useState(null);
  const [saveErrorOpen, setSaveErrorOpen] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [saveErrorDetails, setSaveErrorDetails] = useState([]);
  const [preValidateOpen, setPreValidateOpen] = useState(false);
  const [preValidateMessages, setPreValidateMessages] = useState([]);
  const [returnToRackModalOpen, setReturnToRackModalOpen] = useState(false);

  // Load WO Planning options
  const loadWOPlanningOptions = useCallback(async () => {
    try {
      setLoadingWOPlanning(true);
      const response = await woActualService.getWOPlanningForActual({ exclude_status: 'Selesai' });
      const planningList = response.data || response || [];
      setWoPlanningList(planningList);
    } catch (error) {
      console.error('Error loading WO Planning options:', error);
      showAlert('Gagal memuat WO Planning', 'Terjadi kesalahan saat memuat daftar WO Planning', 'error');
    } finally {
      setLoadingWOPlanning(false);
    }
  }, [showAlert]);

  // Filter WO Planning based on search term
  const filteredWOPlanningList = woPlanningList.filter(planning => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      planning.nomor_wo?.toLowerCase().includes(searchLower) ||
      planning.pelanggan?.nama?.toLowerCase().includes(searchLower) ||
      planning.id?.toString().includes(searchLower)
    );
  });

  // Load WO Planning detail when selected
  const handleWOPlanningChange = async (planningId) => {
    if (!planningId) {
      setSelectedWOPlanning(null);
      setActualItems({});
      setPlanningCanvasImagesMap({});
      setFormData(prev => ({ ...prev, planningWorkOrderId: '' }));
      return;
    }

    try {
      setLoading(true);
      // Cari planning terpilih dari list
      const planning = woPlanningList.find(p => p.id === planningId);
      console.log('Selected planning:', planning);

      // Ambil detail WO Planning untuk mendapatkan item
      const response = await workOrderService.getWorkOrderById(planningId);
      let woData = response?.data || response;
      if (Array.isArray(woData)) woData = woData[0];
      if (!woData && response?.work_order) woData = response.work_order;
      if (!woData && response?.workOrder) woData = response.workOrder;
      console.log('WO Planning detail:', woData);

      // Normalisasi items dari berbagai kemungkinan field
      const rawItems = woData?.workOrderPlanningItems || woData?.workOrderItems || woData?.items || woData?.work_order_items || woData?.orderItems || [];
      const normalizedItems = (rawItems || []).map(item => {
        // Normalisasi pelaksana dari berbagai kemungkinan struktur di planning
        const rawPelaksana = item.pelaksana || item.pelaksanas || item.executors || item.workOrderItemPelaksana || [];
        const normalizedPelaksana = (rawPelaksana || []).map(p => ({
          pelaksana_info: {
            id: p?.pelaksana_info?.id || p?.pelaksana?.id || p?.id || null,
            nama_pelaksana: p?.pelaksana_info?.nama_pelaksana || p?.pelaksana?.nama || p?.nama_pelaksana || p?.nama || p?.name || 'N/A',
            jabatan: p?.pelaksana?.jabatan || p?.jabatan || p?.position || ''
          },
          qty: parseFloat(p?.qty || p?.jumlah || 0),
          weight: parseFloat(p?.weight || p?.berat || 0),
          tanggal: p?.tanggal || p?.date || null,
          jam_mulai: p?.jam_mulai || p?.jamMulai || p?.start_time || null,
          jam_selesai: p?.jam_selesai || p?.jamSelesai || p?.end_time || null,
          catatan: p?.catatan || p?.notes || ''
        }));

        const groupData = item.item_barang_group || item.itemBarangGroup || null;

        return {
          id: item.id,
          jenis_barang: item.jenis_barang || item.jenisBarang || {},
          bentuk_barang: item.bentuk_barang || item.bentukBarang || {},
          grade_barang: item.grade_barang || item.gradeBarang || {},
          jenis_potongan: item.jenis_potongan || item.potongan_jenis || item.jenisPotongan || null,
          jumlah: parseFloat(item.qty || item.quantity || item.jumlah || 0),
          qty_planning: parseFloat(item.qty_planning || 0),
          berat: parseFloat(item.berat || 0),
          pelaksana: normalizedPelaksana,
          // Include dimension properties
          panjang: item.panjang,
          lebar: item.lebar,
          tebal: item.tebal || item.ketebalan,
          diameter: item.diameter,
          diameter_luar: item.diameter_luar,
          diameter_dalam: item.diameter_dalam,
          sisi1: item.sisi1,
          sisi2: item.sisi2,
          dimensi: item.dimensi,
          // Group barang info dari WO Planning
          item_barang_group_id: item.item_barang_group_id || groupData?.id || null,
          item_barang_group: groupData,
          item_barang_group_name: (groupData && (groupData.nama_group_barang || groupData.nama)) || null
        };
      });

      // Siapkan objek selectedWOPlanning yang berisi info + items
      const selected = {
        ...(planning || {}),
        ...woData,
        items: normalizedItems,
        pelanggan: woData?.pelanggan || planning?.pelanggan || null,
        gudang: woData?.gudang || planning?.gudang || null,
      };

      setSelectedWOPlanning(selected);
      setFormData(prev => ({
        ...prev,
        planningWorkOrderId: planningId
      }));

      // Fetch canvas/design images for this WO Planning
      try {
        const imagesResp = await workOrderService.getWorkOrderImages(planningId);
        const imagesData = imagesResp?.data || imagesResp || [];

        let planningCanvasImages = [];
        if (Array.isArray(imagesData)) {
          planningCanvasImages = imagesData;
        } else if (imagesData.images && Array.isArray(imagesData.images)) {
          planningCanvasImages = imagesData.images;
        }

        const newImagesMap = {};
        planningCanvasImages.forEach(img => {
          // Identify which item this image belongs to. 
          // The API returns wo_item_id which is the WorkOrderPlanningItem ID.
          const itemIds = [
            img.wo_item_id,
            img.work_order_planning_item_id,
            img.wo_plan_item_id,
            img.work_order_item_id,
            img.item_id,
            img.wo_item_unique_id
          ].filter(Boolean);

          const uniqueIds = [...new Set(itemIds)];
          uniqueIds.forEach(id => {
            const key = String(id);
            if (!newImagesMap[key]) newImagesMap[key] = [];
            // Use saran_id or id for uniqueness check
            const imgId = img.saran_id || img.id;
            const exists = newImagesMap[key].some(existing => (existing.saran_id || existing.id) === imgId);

            if (!exists || !imgId) {
              newImagesMap[key].push(img);
            }
          });
        });
        setPlanningCanvasImagesMap(newImagesMap);
      } catch (err) {
        console.warn('Gagal mengambil gambar referensi WO Planning:', err);
      }

      // Inisialisasi actualItems berdasarkan items planning (prefill assignments dari planning, hanya pelaksana yang editable)
      const initialItems = {};
      if (normalizedItems.length > 0) {
        normalizedItems.forEach(it => {
          const prefilledAssignments = (it.pelaksana || []).map(p => ({
            id: null,
            pelaksana_id: p?.pelaksana_info?.id || p?.pelaksana?.id || p?.id || null,
            pelaksana: p?.pelaksana_info?.nama_pelaksana || p?.pelaksana?.nama || p?.nama || p?.name || '-',
            qty: p.qty || (it.pelaksana.length === 1 ? (it.qty_planning || it.jumlah) : 0),
            weight: '',
            berat: '',
            tanggal: p?.tanggal || null,
            jamMulai: p?.jam_mulai || p?.jamMulai || null,
            jamSelesai: p?.jam_selesai || p?.jamSelesai || null,
            catatan: p?.catatan || '',
            status: 'PENDING'
          }));

          initialItems[it.id] = {
            timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            status: 'PENDING',
            assignments: prefilledAssignments
          };
        });
      }
      setActualItems(initialItems);
    } catch (error) {
      console.error('Error loading WO Planning detail:', error);
      showAlert('Gagal memuat detail WO Planning', 'Terjadi kesalahan saat memuat detail', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle actual item changes
  const handleActualItemChange = (itemId, field, value) => {
    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss') // Update timestamp on any change
      }
    }));
  };

  // Add assignment to item
  const addAssignment = (itemId) => {
    const newAssignment = {
      id: Date.now(), // Temporary ID
      qty: 0,
      weight: 0,
      pelaksana: '',
      pelaksana_id: null,
      tanggal: new Date().toISOString().split('T')[0],
      jamMulai: '',
      jamSelesai: '',
      catatan: '',
      status: 'Pending'
    };

    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        assignments: [...(prev[itemId]?.assignments || []), newAssignment]
      }
    }));
  };

  // Remove assignment from item
  const removeAssignment = (itemId, assignmentIndex) => {
    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        assignments: prev[itemId].assignments.filter((_, index) => index !== assignmentIndex)
      }
    }));
  };

  // Handle assignment changes
  const handleAssignmentChange = (itemId, assignmentIndex, field, value) => {
    setActualItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        assignments: prev[itemId].assignments.map((assignment, index) =>
          index === assignmentIndex
            ? { ...assignment, [field]: value }
            : assignment
        )
      }
    }));
  };

  // Handle foto bukti upload (kirim sebagai string base64 array sesuai validasi BE)
  const handleFotoBuktiChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    const base64Array = [];
    const previewArray = [];
    let loadedCount = 0;

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showAlert('File tidak valid', `File ${file.name} bukan gambar`, 'error');
        loadedCount++;
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Ukuran terlalu besar', `Maksimal 5MB untuk ${file.name}`, 'error');
        loadedCount++;
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        base64Array.push(e.target.result);
        previewArray.push(objectUrl);
        loadedCount++;
        if (loadedCount === files.length) {
          setFormData(prev => ({
            ...prev,
            foto_bukti: [...(prev.foto_bukti || []), ...base64Array],
            foto_bukti_preview: [...(prev.foto_bukti_preview || []), ...previewArray]
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    // reset input
    event.target.value = '';
  };

  // Remove foto bukti by index
  const removeFotoBukti = (indexToRemove) => {
    try {
      const previewUrl = formData.foto_bukti_preview[indexToRemove];
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (_) { }

    setFormData(prev => ({
      ...prev,
      foto_bukti: (prev.foto_bukti || []).filter((_, index) => index !== indexToRemove),
      foto_bukti_preview: (prev.foto_bukti_preview || []).filter((_, index) => index !== indexToRemove)
    }));
  };

  // Upload foto bukti per item (base64)
  const handleItemFotoBuktiChange = (itemId, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert('File tidak valid', 'Silakan pilih file gambar', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Ukuran file terlalu besar', 'Maksimal 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setActualItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          foto_bukti: base64
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Upload foto sisa barang per item (base64)
  const handleItemFotoSisaChange = (itemId, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert('File tidak valid', 'Silakan pilih file gambar', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Ukuran file terlalu besar', 'Maksimal 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setActualItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          foto_sisa_barang: base64
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Upload foto sisa barang per plat (base64)
  const handlePlateFotoSisaChange = (itemId, plateId, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert('File tidak valid', 'Silakan pilih file gambar', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Ukuran file terlalu besar', 'Maksimal 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setActualItems(prev => {
        const itemData = prev[itemId] || {};
        const sisaPlates = itemData.sisa_plates || {};
        return {
          ...prev,
          [itemId]: {
            ...itemData,
            sisa_plates: {
              ...sisaPlates,
              [plateId]: base64
            }
          }
        };
      });
    };
    reader.readAsDataURL(file);
  };

  // Save WO Actual
  const handleSave = async () => {
    try {
      const messages = [];
      if (!formData.planningWorkOrderId) {
        messages.push('WO Planning belum dipilih');
      }
      const hasActualData = Object.values(actualItems).some(item => (item.assignments || []).length > 0);
      if (!hasActualData) {
        messages.push('Data actual belum ada');
      }
      const totalActualQty = Object.values(actualItems).reduce((sum, item) => {
        const assigns = item.assignments || [];
        return sum + assigns.reduce((s, a) => s + (parseInt(a.qty) || 0), 0);
      }, 0);
      if (totalActualQty <= 0) {
        messages.push('Qty Actual harus lebih dari 0');
      }
      if (!formData.foto_bukti || formData.foto_bukti.length === 0) {
        messages.push('Gambar foto bukti header belum ada (Minimal 1)');
      }
      const plannedItems = selectedWOPlanning?.items || [];
      const missingItemImages = [];
      plannedItems.forEach((pi, idx) => {
        const ai = actualItems[pi.id];
        const hasAssign = ai && Array.isArray(ai.assignments) && ai.assignments.length > 0;
        const hasImage = ai && !!ai.foto_bukti;
        if (hasAssign && !hasImage) {
          missingItemImages.push(idx + 1);
        }
      });
      if (missingItemImages.length > 0) {
        messages.push(`Belum semua gambar diupload untuk item: ${missingItemImages.join(', ')}`);
      }
      if (messages.length > 0) {
        setPreValidateMessages(messages);
        setPreValidateOpen(true);
        return;
      }

      setSaving(true);

      // Siapkan data sesuai format keyed-object: items di-key oleh ID item
      const itemsForSave = Object.fromEntries(Object.entries(actualItems).map(([id, item]) => {
        const planningItem = (selectedWOPlanning?.items || []).find(pi => String(pi.id) === String(id));
        const assignmentsOut = (item.assignments || []).map(r => ({
          id: r.id,
          pelaksana_id: r.pelaksana_id ?? r.pelaksanaInfo?.id ?? r.pelaksana?.id ?? r.pelaksana_info?.id ?? null,
          pelaksana: r.pelaksana || r.pelaksana_name || r.pelaksanaInfo?.nama || r.pelaksana_info?.nama_pelaksana || '',
          qty: parseInt(r.qty) || 0,
          berat: parseFloat(r.weight ?? r.berat ?? 0) || 0,
          tanggal: r.tanggal || new Date().toISOString().split('T')[0],
          jamMulai: (r.jamMulai ?? r.jam_mulai ?? '08:00:00').includes('T') ? (r.jamMulai ?? r.jam_mulai).split('T')[1].substring(0, 8) : (r.jamMulai ?? r.jam_mulai ?? '08:00:00'),
          jamSelesai: (r.jamSelesai ?? r.jam_selesai ?? '17:00:00').includes('T') ? (r.jamSelesai ?? r.jam_selesai).split('T')[1].substring(0, 8) : (r.jamSelesai ?? r.jam_selesai ?? '17:00:00'),
          catatan: r.catatan || '',
          status: r.status || 'PENDING'
        }));
        const assignQty = assignmentsOut.reduce((sum, r) => sum + (parseInt(r.qty) || 0), 0);
        const assignBerat = assignmentsOut.reduce((sum, r) => sum + (parseFloat(r.berat) || 0), 0);
        const value = {
          qtyActual: assignQty,
          berat: assignBerat,
          timestamp: item?.timestamp || new Date().toISOString(),
          assignments: assignmentsOut.map(a => ({
            id: a.id || null,
            qty: a.qty || 0,
            weight: a.berat ?? a.weight ?? 0,
            pelaksana_id: a.pelaksana_id || null,
            tanggal: a.tanggal || new Date().toISOString().split('T')[0],
            jamMulai: a.jamMulai,
            jamSelesai: a.jamSelesai,
            catatan: a.catatan || '',
            status: a.status || null
          }))
        };

        if (planningItem?.item_barang_group_id || planningItem?.item_barang_group?.id) {
          value.item_barang_group_id = parseInt(
            planningItem.item_barang_group_id || planningItem.item_barang_group?.id,
            10
          );
        }
        if (item?.foto_bukti) {
          value.foto_bukti = item.foto_bukti;
        }
        if (item?.foto_sisa_barang && planningItem?.jenis_potongan?.toLowerCase() !== 'utuh') {
          value.foto_sisa_barang = item.foto_sisa_barang;
        }
        if (item?.sisa_plates && planningItem?.jenis_potongan?.toLowerCase() !== 'utuh') {
          value.sisa_plates = item.sisa_plates;
        }
        return [id, value];
      }));

      const saveData = {
        // Jangan kirim actualWorkOrderId saat create; BE minta integer jika ada
        actualWorkOrderId: null,
        planningWorkOrderId: parseInt(formData.planningWorkOrderId, 10),
        foto_bukti: Array.isArray(formData.foto_bukti) ? formData.foto_bukti : [],
        items: itemsForSave
      };

      console.log('Saving WO Actual:', saveData);

      const response = await woActualService.saveWOActual(saveData);

      if (response.success || response.data) {
        // Ambil gambar WO Planning untuk BEFORE
        let planningCanvasImagesMap = {};
        try {
          // Add timeout to prevent hanging indefinitely, though axios usually handles this
          const imagesResp = await workOrderService.getWorkOrderImages(parseInt(formData.planningWorkOrderId, 10));
          const imagesData = imagesResp?.data || imagesResp || [];

          let planningCanvasImages = [];
          if (Array.isArray(imagesData)) {
            planningCanvasImages = imagesData;
          } else if (imagesData.images && Array.isArray(imagesData.images)) {
            planningCanvasImages = imagesData.images;
          }

          // Build robust map keyed by item IDs
          planningCanvasImages.forEach(img => {
            const itemIds = [
              img.work_order_planning_item_id,
              img.wo_plan_item_id,
              img.wo_item_id,
              img.work_order_item_id,
              img.item_id,
              img.wo_item_unique_id
            ].filter(Boolean);

            const uniqueIds = [...new Set(itemIds)];
            uniqueIds.forEach(id => {
              const key = String(id);
              if (!planningCanvasImagesMap[key]) planningCanvasImagesMap[key] = [];
              // Avoid duplicates
              if (!planningCanvasImagesMap[key].some(existing => existing.id === img.id)) {
                planningCanvasImagesMap[key].push(img);
              }
            });
          });
        } catch (imgErr) {
          console.warn('Gagal mengambil gambar WO Planning untuk print:', imgErr);
        }

        // Bangun items untuk print dengan BEFORE/AFTER
        const printItems = (selectedWOPlanning?.items || []).map((planningItem, idx) => {
          const actualItem = actualItems[planningItem.id] || {};
          const assignments = actualItem.assignments || [];
          const pelaksanas = assignments.map((r) => ({
            qty: r.qty || 0,
            berat: r.berat ?? r.weight ?? 0,
            pelaksana: {
              nama_pelaksana: r.pelaksana || r.pelaksana_name || r.pelaksanaInfo?.nama || r.pelaksana_info?.nama_pelaksana || '-'
            }
          }));
          const beratPlanningComputed = parseFloat(planningItem.berat || 0);
          const qtyActualComputed = assignments.reduce((a, r) => a + (parseInt(r.qty) || 0), 0);
          const beratActualComputed = assignments.reduce((a, r) => a + (parseFloat(r.berat ?? r.weight) || 0), 0);

          // BEFORE: Get images from map (prioritized) or fallback to item details
          let beforeImages = [];

          // 1. Try from fetched map using planningItem.id
          if (planningItem.id && planningCanvasImagesMap[String(planningItem.id)]) {
            beforeImages = planningCanvasImagesMap[String(planningItem.id)].map(img => {
              const rawVal = img.canvas_image_base64 || img.image_base64 || img.image_url || img.src || img.url || img.canvas_file_path;
              return { src: resolveImageSrc(rawVal) || '' };
            });
          }

          // 2. Try from fetched map using wo_item_unique_id
          if (beforeImages.length === 0 && planningItem.wo_item_unique_id && planningCanvasImagesMap[String(planningItem.wo_item_unique_id)]) {
            beforeImages = planningCanvasImagesMap[String(planningItem.wo_item_unique_id)].map(img => {
              const rawVal = img.canvas_image_base64 || img.image_base64 || img.image_url || img.src || img.url || img.canvas_file_path;
              return { src: resolveImageSrc(rawVal) || '' };
            });
          }

          // 3. Fallback REMOVED as per request - only use API fetched images
          // if (beforeImages.length === 0) { ... }


          // AFTER: gunakan foto bukti item yang baru diupload (data URL)
          const afterImages = actualItem.foto_bukti ? [{ src: actualItem.foto_bukti }] : [];
          
          let sisaImages = [];
          if (planningItem.jenis_potongan?.toLowerCase() !== 'utuh') {
            if (actualItem.sisa_plates && typeof actualItem.sisa_plates === 'object') {
              Object.values(actualItem.sisa_plates).forEach(imgB64 => {
                if (imgB64) sisaImages.push({ src: imgB64 });
              });
            } else if (actualItem.foto_sisa_barang) {
              sisaImages.push({ src: actualItem.foto_sisa_barang });
            }
          }

          return {
            no: idx + 1,
            itemName: planningItem.jenis_barang?.nama || planningItem.jenis_barang?.nama_jenis_barang || 'Item',
            jenisBarang: planningItem.jenis_barang?.nama || planningItem.jenis_barang?.nama_jenis_barang || '-',
            bentukBarang: planningItem.bentuk_barang?.nama || planningItem.bentuk_barang?.nama_bentuk_barang || '-',
            gradeBarang: planningItem.grade_barang?.nama || planningItem.grade_barang?.nama_grade_barang || '-',
            dimensi: (() => {
              const tb = planningItem.bentuk_barang?.tipe_barang || planningItem.bentuk_barang?.tipeBarang;
              if (tb) {
                const formatInt = (val) => Math.round(parseFloat(val) || 0);
                const dims = [];
                if (tb.diameter_luar && tb.diameter_dalam && tb.panjang) {
                  dims.push(formatInt(planningItem.diameter_luar), formatInt(planningItem.diameter_dalam), formatInt(planningItem.panjang));
                } else if (tb.sisi1 && tb.sisi2 && tb.tebal && tb.panjang) {
                  dims.push(formatInt(planningItem.sisi1), formatInt(planningItem.sisi2), formatInt(planningItem.tebal), formatInt(planningItem.panjang));
                } else if (tb.tebal && tb.lebar && tb.panjang) {
                  dims.push(formatInt(planningItem.tebal || planningItem.ketebalan), formatInt(planningItem.lebar), formatInt(planningItem.panjang));
                } else if (tb.diameter && tb.panjang) {
                  dims.push(formatInt(planningItem.diameter), formatInt(planningItem.panjang));
                } else {
                  // Fallback using available standard properties
                  if (tb.tebal) dims.push(formatInt(planningItem.tebal || planningItem.ketebalan));
                  if (tb.lebar) dims.push(formatInt(planningItem.lebar));
                  if (tb.panjang) dims.push(formatInt(planningItem.panjang));
                }
                if (dims.length > 0) return dims.join('x');
              }
              // Strict fallback if Tipe Barang is missing
              return planningItem.dimensi || `${Math.round(parseFloat(planningItem.panjang) || 0)}x${Math.round(parseFloat(planningItem.lebar) || 0)}x${Math.round(parseFloat(planningItem.ketebalan || planningItem.tebal) || 0)}`;
            })(),
            qtyPlanning: planningItem.qty_planning || planningItem.jumlah || 0,
            qtyActual: qtyActualComputed,
            beratActual: Math.round(beratActualComputed || 0),
            jenisPotongan: planningItem.jenis_potongan || 'N/A',
            pelaksanas,
            beforeImages,
            afterImages,
            sisaImages,
            woPlanItemId: planningItem.id
          };
        });

        // Bangun data untuk template print
        const woActualCreated = response?.data || {};
        const printData = {
          workOrderPlanning: selectedWOPlanning,
          woActual: woActualCreated,
          customer: selectedWOPlanning?.pelanggan || null,
          warehouse: selectedWOPlanning?.gudang || null,
          items: printItems,
          parentImages: Array.isArray(formData.foto_bukti) ? formData.foto_bukti.map(b64 => ({ src: b64 })) : [],
        };

        setPendingPrintData(printData);
        setPrintOptionsOpen(true);
      } else {
        throw new Error(response.message || 'Failed to save WO Actual');
      }
    } catch (error) {
      console.error('Error saving WO Actual:', error);
      const errData = error?.response?.data || error?.data || {};
      const errMsg = errData?.message || error.message || 'Terjadi kesalahan saat menyimpan';
      const errDetailsObj = errData?.errors || {};
      const detailsList = [];
      try {
        if (Array.isArray(errDetailsObj)) {
          detailsList.push(...errDetailsObj);
        } else if (errDetailsObj && typeof errDetailsObj === 'object') {
          Object.keys(errDetailsObj).forEach((k) => {
            const v = errDetailsObj[k];
            if (Array.isArray(v)) {
              v.forEach((msg) => detailsList.push(msg));
            } else if (typeof v === 'string') {
              detailsList.push(v);
            }
          });
        }
      } catch (_) { }
      if (detailsList.length > 0) {
        setSaveErrorMessage(errMsg);
        setSaveErrorDetails(detailsList);
        setSaveErrorOpen(true);
      } else {
        showAlert('Gagal menyimpan WO Actual', errMsg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // Load initial data
  useEffect(() => {
    // Load pelaksana options for assignment modal
    (async () => {
      try {
        setLoadingPelaksana(true);
        const options = await getPelaksanaOptions();
        setPelaksanaList(options);
      } catch (e) {
        console.error('Error loading pelaksana options:', e);
      } finally {
        setLoadingPelaksana(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <PageLayout title="Work Order Actual" category="TRANSAKSI">
      <div className="space-y-6">
        <AlertComponent />
        <CustomAlert
          open={preValidateOpen}
          onOpenChange={setPreValidateOpen}
          title="Validasi gagal"
          message={null}
          type="warning"
          showCancel={false}
          confirmText="OK"
          onConfirm={() => setPreValidateOpen(false)}
          extraContent={(
            <div className="mt-1">
              {Array.isArray(preValidateMessages) && preValidateMessages.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                  {preValidateMessages.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
        <CustomAlert
          open={saveErrorOpen}
          onOpenChange={setSaveErrorOpen}
          title="Gagal menyimpan WO Actual"
          message={saveErrorMessage || 'Validasi gagal'}
          type="error"
          showCancel={false}
          confirmText="OK"
          onConfirm={() => setSaveErrorOpen(false)}
          extraContent={(
            <div className="mt-3">
              {Array.isArray(saveErrorDetails) && saveErrorDetails.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                  {saveErrorDetails.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        />
        <CustomAlert
          open={printOptionsOpen}
          onOpenChange={setPrintOptionsOpen}
          title="Opsi Cetak WO Actual"
          message={null}
          type="info"
          showCancel={true}
          confirmText={saving ? 'Mencetak...' : 'Cetak'}
          cancelText="Batal"
          onConfirm={() => {
            if (pendingPrintData) {
              const html = generateWOActualPrintContent(pendingPrintData, { includeImages });
              openPrintDialog(html);
              setTimeout(() => navigate('/wo-actual'), 500);
            }
          }}
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



        {/* Main Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="section-card">
                <CardHeader className="section-header">
                  <div className="flex items-center justify-between">
                    <CardTitle className="page-title flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Input Work Order Actual
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="btn-primary">
                        {saving ? 'Menyimpan...' : 'Simpan WO Actual'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/wo-actual')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="planningWorkOrderId">WO Planning *</Label>
                      <AsyncSearchSelect
                        label={null}
                        placeholder={selectedWOPlanning ? selectedWOPlanning.nomor_wo : 'Pilih WO Planning'}
                        searchPlaceholder="Cari nomor WO atau pelanggan..."
                        value={formData.planningWorkOrderId ? String(formData.planningWorkOrderId) : ''}
                        onValueChange={(val) => {
                          const id = parseInt(val, 10);
                          if (id) {
                            handleWOPlanningChange(id);
                          } else {
                            handleWOPlanningChange(null);
                          }
                        }}
                        fetchOptions={async (q, page) => {
                          try {
                            const resp = await woActualService.getWOPlanningForActual({
                              page: page || 1,
                              per_page: 50,
                              search: q || '',
                              exclude_status: 'Selesai'
                            });
                            const rows = resp?.data || [];
                            return rows.map(pl => {
                              const nomor = pl.nomor_wo || String(pl.id);
                              const nama = (pl.pelanggan?.nama_pelanggan || pl.pelanggan?.nama || pl.customer?.name || '').trim();
                              const label = nama ? `${nomor} - ${nama}` : nomor;
                              return { value: String(pl.id), label };
                            });
                          } catch (_) {
                            return [];
                          }
                        }}
                        displayKey="label"
                        valueKey="value"
                      />
                    </div>

                    <div>
                      {/* Removed Actual WO ID field as requested */}
                    </div>

                    {/* Tanggal/Jam dihapus sesuai permintaan */}

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="On Progress">On Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="prioritas">Prioritas</Label>
                      <Select
                        value={formData.prioritas}
                        onValueChange={(value) => handleInputChange('prioritas', value)}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Prioritas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="catatan">Catatan</Label>
                    <Textarea
                      id="catatan"
                      value={formData.catatan}
                      onChange={(e) => handleInputChange('catatan', e.target.value)}
                      placeholder="Catatan tambahan..."
                      rows={3}
                    />
                  </div>

                  {/* Foto Bukti Upload */}
                  <div>
                    <Label htmlFor="foto_bukti">Foto Bukti</Label>
                    <div className="mt-2 flex flex-col gap-4">
                      <div>
                        <input
                          id="foto_bukti"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFotoBuktiChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="foto_bukti"
                          className="inline-flex items-center rounded-md border px-4 py-2 text-xs font-medium hover:bg-gray-50 cursor-pointer"
                        >
                          Upload Foto (Bisa lebih dari 1)
                        </label>
                      </div>

                      {/* Tampilan Grid Preview */}
                      {formData.foto_bukti_preview && formData.foto_bukti_preview.length > 0 && (
                        <div className="flex flex-wrap gap-4">
                          {formData.foto_bukti_preview.map((preview, idx) => (
                            <div key={idx} className="relative inline-block">
                              <img
                                src={preview}
                                alt={`Preview foto bukti ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setPreviewImages(formData.foto_bukti_preview);
                                  setCurrentPreviewIndex(idx);
                                  setPreviewTitle(`Foto Bukti Header: ${selectedWOPlanning?.nomor_wo || '-'}`);
                                  setPreviewDetails('');
                                  setPreviewOpen(true);
                                }}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeFotoBukti(idx)}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Items table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item WO (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {!selectedWOPlanning || (selectedWOPlanning.items || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {!selectedWOPlanning ? 'Pilih WO Planning terlebih dahulu' : 'Tidak ada item di WO Planning ini'}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Jenis Potongan</TableHead>
                        <TableHead className="text-center">Qty Planning</TableHead>
                        <TableHead className="text-center">Berat Planning (kg)</TableHead>
                        <TableHead className="text-center">Qty Actual</TableHead>
                        <TableHead className="text-center">Berat Actual (kg)</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Pelaksana</TableHead>
                        <TableHead className="text-center">Visual Planning</TableHead>
                        <TableHead className="text-center">Foto Bukti (Item)</TableHead>
                        <TableHead className="text-center">Foto Sisa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWOPlanning.items.map((planningItem) => {
                        const actualItem = actualItems[planningItem.id] || {};
                        const assignments = actualItem.assignments || [];
                        const beratPlanningComputed = parseFloat(planningItem.berat || 0);
                        const qtyActualComputed = assignments.reduce((a, r) => a + (parseInt(r.qty) || 0), 0);
                        const beratActualComputed = assignments.reduce((a, r) => a + (parseFloat(r.berat ?? r.weight) || 0), 0);
                        return (
                          <TableRow key={planningItem.id}>
                            <TableCell>
                              <div className="font-medium">
                                {planningItem.jenis_barang?.nama || planningItem.jenis_barang?.nama_jenis_barang || 'Item'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {(planningItem.bentuk_barang?.nama || planningItem.bentuk_barang?.nama_bentuk_barang || 'Bentuk')} - {(planningItem.grade_barang?.nama || planningItem.grade_barang?.nama_grade_barang || 'Grade')}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{planningItem.jenis_potongan || '-'}</TableCell>
                            <TableCell className="text-center">{planningItem.qty_planning || planningItem.jumlah || 0}</TableCell>
                            <TableCell className="text-center">{Math.round(beratPlanningComputed)}</TableCell>
                            <TableCell className="text-center">{qtyActualComputed}</TableCell>
                            <TableCell className="text-center">{Math.round(beratActualComputed)}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                {(actualItem.status || 'PENDING')}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPelaksanaModalItemId(planningItem.id);
                                  setPelaksanaModalOpen(true);
                                }}
                              >
                                Pelaksana ({assignments.length})
                              </Button>
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const canvases = planningCanvasImagesMap[String(planningItem.id)];
                                if (canvases && canvases.length > 0) {
                                  // Prefer canvas_image_base64, or fallback to file path
                                  const imgObj = canvases[0];
                                  const thumbnailSrc = resolveImageSrc(imgObj.canvas_image_base64 || imgObj.image_base64 || imgObj.canvas_file_path || imgObj.image_path);

                                  return thumbnailSrc ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <img
                                        src={thumbnailSrc}
                                        alt={`Preview Item #${planningItem.id}`}
                                        className="w-12 h-12 object-cover rounded border cursor-pointer mx-auto hover:opacity-80"
                                        onClick={() => {
                                          const imageUrls = canvases.map(img => resolveImageSrc(img.canvas_image_base64 || img.image_base64 || img.canvas_file_path || img.image_path)).filter(Boolean);
                                          setPreviewImages(imageUrls);
                                          setCurrentPreviewIndex(0);
                                          setPreviewTitle(`Desain Planning Item: ${planningItem.jenis_barang?.nama || '-'}`);
                                          setPreviewDetails(getItemDetailsText(planningItem));
                                          setPreviewOpen(true);
                                        }}
                                      />
                                      {canvases.length > 1 && <span className="text-[10px] text-gray-500">+{canvases.length - 1} gambar</span>}
                                    </div>
                                  ) : <span className="text-xs text-gray-500">Render x</span>;
                                }
                                return <span className="text-xs text-gray-400">-</span>;
                              })()}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  id={`item-foto-${planningItem.id}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleItemFotoBuktiChange(planningItem.id, file);
                                  }}
                                  className="hidden"
                                />
                                <label
                                  htmlFor={`item-foto-${planningItem.id}`}
                                  className="inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium hover:bg-gray-50 cursor-pointer"
                                >
                                  Upload
                                </label>
                                {actualItem.foto_bukti ? (
                                  <img
                                    src={actualItem.foto_bukti}
                                    alt={`Foto Bukti Item #${planningItem.id}`}
                                    className="w-12 h-12 object-cover rounded border cursor-pointer"
                                    onClick={() => {
                                      setPreviewImages([actualItem.foto_bukti]);
                                      setCurrentPreviewIndex(0);
                                      setPreviewTitle(`Foto Bukti Item: ${planningItem.jenis_barang?.nama || '-'}`);
                                      setPreviewDetails(getItemDetailsText(planningItem));
                                      setPreviewOpen(true);
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs text-gray-500">Belum ada</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {planningItem.jenis_potongan?.toLowerCase() === 'utuh' ? (
                                <span className="text-xs text-gray-400 font-medium">N/A (Utuh)</span>
                              ) : (
                                <div className="flex flex-col gap-2 min-w-[200px] justify-center items-stretch">
                                  {(() => {
                                    const plates = planningCanvasImagesMap[String(planningItem.id)] || [];
                                    if (plates.length === 0) {
                                      return <span className="text-xs text-gray-400">Tidak ada plat</span>;
                                    }
                                    return plates.map((plate, index) => {
                                      const plateId = plate.saran_id || `saran-${index}`;
                                      const plateName = plate.item_barang_name || `Plat #${plateId}`;
                                      const plateSisaImage = actualItem.sisa_plates?.[plateId] || null;
                                      return (
                                        <div key={plateId} className="flex items-center justify-between gap-2 border p-1 rounded bg-gray-50">
                                          <span className="text-[10px] text-gray-600 truncate max-w-[120px] text-left" title={plateName}>{plateName}</span>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <input
                                              id={`item-foto-sisa-${planningItem.id}-${plateId}`}
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handlePlateFotoSisaChange(planningItem.id, plateId, file);
                                              }}
                                              className="hidden"
                                            />
                                            <label
                                              htmlFor={`item-foto-sisa-${planningItem.id}-${plateId}`}
                                              className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium hover:bg-gray-100 cursor-pointer bg-white"
                                            >
                                              Upload
                                            </label>
                                            {plateSisaImage ? (
                                              <img
                                                src={plateSisaImage}
                                                alt={`Sisa Plat ${plateName}`}
                                                className="w-7 h-7 object-cover rounded border cursor-pointer shrink-0"
                                                onClick={() => {
                                                  setPreviewImages([plateSisaImage]);
                                                  setCurrentPreviewIndex(0);
                                                  setPreviewTitle(`Foto Sisa Plat: ${plateName}`);
                                                  setPreviewDetails(getItemDetailsText(planningItem));
                                                  setPreviewOpen(true);
                                                }}
                                              />
                                            ) : (
                                              <span className="text-[9px] text-gray-400">Belum ada</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Totals Bar: Actual */}

              </div>
            )}
          </CardContent>
        </Card>

        {/* Info & Summary below */}
        <div className="space-y-6">
          {selectedWOPlanning && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Info WO Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">No. WO</Label>
                  <p className="text-sm">{selectedWOPlanning.nomor_wo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Pelanggan</Label>
                  <p className="text-sm">
                    {selectedWOPlanning.pelanggan?.nama_pelanggan || selectedWOPlanning.pelanggan?.nama || selectedWOPlanning.customer?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Gudang</Label>
                  <p className="text-sm">
                    {selectedWOPlanning.gudang?.nama_gudang || selectedWOPlanning.gudang?.nama || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tanggal WO</Label>
                  <p className="text-sm">
                    {selectedWOPlanning.tanggal_wo ? format(new Date(selectedWOPlanning.tanggal_wo), 'dd MMM yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant="outline" className="text-xs">
                    {selectedWOPlanning.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return to Rack - Shortcut */}
          {selectedWOPlanning && (
            <Card className="border-dashed border-blue-300 bg-blue-50/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Kembalikan Barang ke Rak</p>
                      <p className="text-xs text-blue-600">Scan item barang dan rak untuk mencatat pengembalian</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 items-center transition-colors"
                    onClick={() => setReturnToRackModalOpen(true)}
                  >
                    Buka Scan →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Item:</span>
                <span className="text-sm font-medium">{Object.keys(actualItems).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Qty Actual:</span>
                <span className="text-sm font-medium">
                  {Object.values(actualItems).reduce((sum, item) => {
                    const assignQty = (item.assignments || []).reduce((a, r) => a + (parseInt(r.qty) || 0), 0);
                    return sum + assignQty;
                  }, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Berat Actual:</span>
                <span className="text-sm font-medium text-blue-600">
                  {Object.values(actualItems).reduce((sum, item) => {
                    const assignBerat = (item.assignments || []).reduce((a, r) => a + (parseFloat(r.weight) || 0), 0);
                    return sum + assignBerat;
                  }, 0)} kg
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Action: Simpan di bawah kanan */}
      <div className="flex justify-end mt-6">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/wo-actual')}
            disabled={saving || loading}
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* Modal pelaksana khusus WO Actual: planning view + input actual */}
      <PelaksanaActualModal
        open={pelaksanaModalOpen}
        onOpenChange={setPelaksanaModalOpen}
        title="Daftar Pelaksana & Input Actual"
        pelaksanaOptions={pelaksanaList}
        value={(pelaksanaModalItemId && actualItems[pelaksanaModalItemId]?.assignments) ? actualItems[pelaksanaModalItemId].assignments : []}
        planningPelaksana={selectedWOPlanning?.items?.find(it => it.id === pelaksanaModalItemId)?.pelaksana || []}
        qtyPlanning={(() => {
          const item = selectedWOPlanning?.items?.find(it => it.id === pelaksanaModalItemId);
          return item ? (item.qty_planning || item.jumlah || 0) : 0;
        })()}
        loadingOptions={loadingPelaksana}
        onSave={(rows) => {
          const normalized = (Array.isArray(rows) ? rows : []).map(r => ({
            ...r,
            weight: parseFloat(r.weight ?? r.berat ?? 0),
          }));
          setActualItems(prev => ({
            ...prev,
            [pelaksanaModalItemId]: {
              ...prev[pelaksanaModalItemId],
              assignments: normalized
            }
          }));
        }}
      />

      <ReturnToRackModal
        open={returnToRackModalOpen}
        onOpenChange={setReturnToRackModalOpen}
      />

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-base font-semibold text-gray-900">{previewTitle || 'Preview Foto'}</h3>
              <button type="button" className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors" onClick={() => setPreviewOpen(false)}>✕</button>
            </div>

            <div className="p-4 relative flex-1 flex flex-col justify-center items-center bg-gray-50/50 min-h-[400px]">
              {previewImages && previewImages.length > 0 ? (
                <>
                  <div className="relative group w-full flex justify-center items-center">
                    <img src={previewImages[currentPreviewIndex]} alt="Preview Foto" className="max-h-[60vh] max-w-full object-contain rounded-md shadow-sm border border-gray-200" />

                    {previewImages.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2.5 shadow-md flex items-center justify-center transition-transform hover:scale-105"
                          onClick={() => setCurrentPreviewIndex(prev => prev > 0 ? prev - 1 : previewImages.length - 1)}
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2.5 shadow-md flex items-center justify-center transition-transform hover:scale-105"
                          onClick={() => setCurrentPreviewIndex(prev => prev < previewImages.length - 1 ? prev + 1 : 0)}
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                          {currentPreviewIndex + 1} / {previewImages.length}
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <span>Tidak ada gambar</span>
                </div>
              )}
            </div>

            {previewDetails && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <div className="font-semibold text-gray-900 mb-1 border-b pb-1">Detail Barang:</div>
                  <div className="leading-relaxed whitespace-pre-wrap">{previewDetails.replace(/ \| /g, '\n')}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
