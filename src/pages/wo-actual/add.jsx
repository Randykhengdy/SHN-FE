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
import { ArrowLeft, Save, Plus, Trash2, Calendar, User, Package, FileText, Search } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { woActualService } from '@/services/woActualService';
import { workOrderService } from '@/services/workOrderService';
import { generateWOActualPrintContent, openPrintDialog } from '@/lib/printUtils';
import CustomAlert from '@/components/modals/CustomAlert';
import { Switch } from '@/components/ui/switch';
import PelaksanaActualModal from '@/components/modals/PelaksanaActualModal';
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

  // Form State - Updated to match new API structure
  const [formData, setFormData] = useState({
    planningWorkOrderId: '',
    status: 'Pending', // Default status
    prioritas: 'MEDIUM', // Default priority
    catatan: '',
    foto_bukti: null, // Will store base64 encoded image
    foto_bukti_preview: null // For preview display
  });

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
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

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
          dimensi: item.dimensi
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

  // Handle foto bukti upload (kirim sebagai string base64 sesuai validasi BE)
  const handleFotoBuktiChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showAlert('File tidak valid', 'Silakan pilih file gambar', 'error');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Ukuran file terlalu besar', 'Maksimal 5MB', 'error');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result; // data URL string
      setFormData(prev => ({
        ...prev,
        foto_bukti: base64,
        foto_bukti_preview: objectUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  // Remove foto bukti
  const removeFotoBukti = () => {
    try {
      if (formData?.foto_bukti_preview) {
        URL.revokeObjectURL(formData.foto_bukti_preview);
      }
    } catch (_) {}
    setFormData(prev => ({
      ...prev,
      foto_bukti: null,
      foto_bukti_preview: ''
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
      if (!formData.foto_bukti) {
        messages.push('Gambar foto bukti header belum ada');
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
        if (item?.foto_bukti) {
          value.foto_bukti = item.foto_bukti;
        }
        return [id, value];
      }));

      const saveData = {
        // Jangan kirim actualWorkOrderId saat create; BE minta integer jika ada
        actualWorkOrderId: null,
        planningWorkOrderId: parseInt(formData.planningWorkOrderId, 10),
        foto_bukti: typeof formData.foto_bukti === 'string' ? formData.foto_bukti : '',
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

          return {
            no: idx + 1,
            itemName: planningItem.jenis_barang?.nama || planningItem.jenis_barang?.nama_jenis_barang || 'Item',
            jenisBarang: planningItem.jenis_barang?.nama || planningItem.jenis_barang?.nama_jenis_barang || '-',
            bentukBarang: planningItem.bentuk_barang?.nama || planningItem.bentuk_barang?.nama_bentuk_barang || '-',
            gradeBarang: planningItem.grade_barang?.nama || planningItem.grade_barang?.nama_grade_barang || '-',
            dimensi: (() => {
               // 1. Try pre-formatted dimension strings
               let dimString = planningItem.dimensi;
               
               // 2. If no string or it looks invalid (0x0x0mm), try to construct from numeric values
               if (!dimString || dimString === '0x0x0mm') {
                  const p = parseFloat(planningItem.panjang || 0);
                  const l = parseFloat(planningItem.lebar || 0);
                  const t = parseFloat(planningItem.tebal || planningItem.ketebalan || 0);
                  
                  if (p > 0 || l > 0 || t > 0) {
                     dimString = `${p}x${l}x${t}mm`;
                  } else {
                     dimString = '-';
                  }
               }
               return dimString;
            })(),
            qtyPlanning: planningItem.qty_planning || planningItem.jumlah || 0,
            qtyActual: qtyActualComputed,
            beratActual: Math.round(beratActualComputed || 0),
            jenisPotongan: planningItem.jenis_potongan || 'N/A',
            pelaksanas,
            beforeImages,
            afterImages,
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
          parentImages: formData.foto_bukti ? [{ src: formData.foto_bukti }] : [],
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
      } catch (_) {}
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
                      <div className="space-y-2">
                        <Input
                          id="foto_bukti"
                          type="file"
                          accept="image/*"
                          onChange={handleFotoBuktiChange}
                          className="cursor-pointer"
                        />
                        {formData.foto_bukti_preview && (
                          <div className="relative inline-block">
                            <img
                              src={formData.foto_bukti_preview}
                              alt="Preview foto bukti"
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeFotoBukti}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          Format: JPG, PNG, GIF. Maksimal 5MB.
                        </p>
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
                          <TableHead className="text-center">Foto Bukti (Item)</TableHead>
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
                                    <button
                                      type="button"
                                      className="text-xs text-blue-600 hover:underline"
                                      onClick={() => { setPreviewSrc(actualItem.foto_bukti); setPreviewTitle(`Foto Bukti Item #${planningItem.id}`); setPreviewOpen(true); }}
                                    >
                                      Lihat
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-500">Belum ada</span>
                                  )}
                                </div>
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

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-medium text-gray-900">{previewTitle || 'Preview Foto Bukti'}</h3>
              <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setPreviewOpen(false)}>✕</button>
            </div>
            <div className="p-4">
              {previewSrc ? (
                <img src={previewSrc} alt="Preview Foto Bukti" className="max-h-[70vh] w-full object-contain rounded" />
              ) : (
                <div className="text-center text-gray-500 py-8">Tidak ada gambar</div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
