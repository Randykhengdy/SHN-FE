import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Package, FileText, User, Printer, Calendar, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import CustomAlert from '@/components/modals/CustomAlert';
import PelaksanaActualModal from '@/components/modals/PelaksanaActualModal';
import { useAlert } from '@/hooks/useAlert';
import apiConfig from '@/config/api';
import { woActualService } from '@/services/woActualService';
import { workOrderService } from '@/services/workOrderService';
import { generateWOActualPrintContent, openPrintDialog } from '@/lib/printUtils';
import RoleGuard from "@/components/RoleGuard";

export default function ViewWOActualPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showAlert, AlertComponent } = useAlert();

  const [loading, setLoading] = useState(false);
  const [woActual, setWoActual] = useState(null);
  const [planning, setPlanning] = useState(null);
  const [items, setItems] = useState([]);
  const [headerImageBase64, setHeaderImageBase64] = useState(null);
  const [itemImagesMap, setItemImagesMap] = useState({});
  const [imagesLoading, setImagesLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [pelaksanaModalOpen, setPelaksanaModalOpen] = useState(false);
  const [pelaksanaModalData, setPelaksanaModalData] = useState([]);
  const [pelaksanaPlanningData, setPelaksanaPlanningData] = useState([]);
  const [modalQtyPlanning, setModalQtyPlanning] = useState(0);
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  const [itemSisaImagesMap, setItemSisaImagesMap] = useState({});

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await woActualService.getWOActualById(id);
        const data = response?.data || response || null;

        if (!data) {
          showAlert('WO Actual tidak ditemukan', 'Data tidak tersedia', 'error');
          return;
        }

        const actual = data.work_order_actual || data.woActual || data;
        let planningRel = actual.work_order_planning || data.work_order_planning || null;
        const actualItems = actual.work_order_actual_items || data.work_order_actual_items || actual.items || data.items || [];

        // If planning relation exists but missing nested objects (pelanggan/gudang) or items, fetch full planning details
        if (planningRel && planningRel.id && (!planningRel.pelanggan || !planningRel.gudang || !planningRel.items || planningRel.items.length === 0)) {
          try {
            const planningRes = await workOrderService.getWorkOrderById(planningRel.id);
            if (planningRes?.data) {
              planningRel = { ...planningRel, ...planningRes.data };
            }
          } catch (err) {
            console.warn('Gagal memuat detail WO Planning:', err);
          }
        }

        setWoActual(actual);
        setPlanning(planningRel);
        setItems(actualItems);
      } catch (e) {
        console.error('Error memuat WO Actual:', e);
        showAlert('Gagal memuat data WO Actual', e?.message || 'Terjadi kesalahan saat memuat', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);


  // Load images for WO Actual header and items
  useEffect(() => {
    const loadImages = async () => {
      if (!id) return;
      try {
        setImagesLoading(true);
        try {
          const blob = await woActualService.getWOActualHeaderImageBlob(id);
          const url = URL.createObjectURL(blob);
          setHeaderImageBase64(url);
        } catch (e) {
          console.warn('Gagal mengambil header image WO Actual:', e?.message || e);
        }
        setItemImagesMap({});
      } finally {
        setImagesLoading(false);
      }
    };
    loadImages();
    return () => {
      try {
        if (headerImageBase64 && headerImageBase64.startsWith('blob:')) {
          URL.revokeObjectURL(headerImageBase64);
        }
      } catch (_) { }
    };
  }, [id]);

  // Load item images separately when items change
  useEffect(() => {
    const loadItemImages = async () => {
      if (!items || items.length === 0) return;

      const updates = {};
      let hasUpdates = false;

      await Promise.all(items.map(async (item) => {
        if (!item.foto_bukti) return;
        if (itemImagesMap[item.id]) return;

        try {
          const blob = await woActualService.getWOActualItemImageBlob(item.id);
          const url = URL.createObjectURL(blob);
          updates[item.id] = url;
          hasUpdates = true;
        } catch (e) {
          console.warn(`Gagal load image item ${item.id}:`, e);
        }
      }));

      if (hasUpdates) {
        setItemImagesMap(prev => ({ ...prev, ...updates }));
      }
    };

    loadItemImages();
  }, [items, itemImagesMap]);

  useEffect(() => {
    const loadItemSisaImages = async () => {
      if (!items || items.length === 0) return;

      const updates = {};
      let hasUpdates = false;

      await Promise.all(items.map(async (item) => {
        if (itemSisaImagesMap[item.id]) return;

        try {
          const blob = await woActualService.getWOActualItemSisaImageBlob(item.id);
          const url = URL.createObjectURL(blob);
          updates[item.id] = url;
          hasUpdates = true;
        } catch (e) {
          console.warn(`Gagal load image sisa item ${item.id}:`, e);
        }
      }));

      if (hasUpdates) {
        setItemSisaImagesMap(prev => ({ ...prev, ...updates }));
      }
    };

    loadItemSisaImages();
  }, [items, itemSisaImagesMap]);

  useEffect(() => {
    return () => {
      Object.values(itemImagesMap).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      Object.values(itemSisaImagesMap).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);


  const totals = useMemo(() => {
    const totalQtyActual = (items || []).reduce((sum, it) => sum + (parseFloat(it.qty_actual || 0) || 0), 0);
    const totalBeratActual = (items || []).reduce((sum, it) => sum + (parseFloat(it.berat ?? it.berat_actual ?? 0) || 0), 0);
    const totalQtyPlanning = (items || []).reduce((sum, it) => {
      const qtyPlan = it.qty_planning ?? it.work_order_planning_item?.qty_planning ?? it.work_order_planning_item?.qty ?? 0;
      return sum + (parseFloat(qtyPlan) || 0);
    }, 0);
    const totalBeratPlanning = (items || []).reduce((sum, it) => {
      const pelaksanaArr = Array.isArray(it.work_order_planning_item?.pelaksana)
        ? it.work_order_planning_item.pelaksana
        : (Array.isArray(it.work_order_planning_item?.work_order_item_pelaksanas)
          ? it.work_order_planning_item.work_order_item_pelaksanas
          : []);
      const beratPlan = it.berat_planning ?? pelaksanaArr.reduce((acc, p) => acc + (parseFloat(p.weight ?? p.berat) || 0), 0);
      return sum + (parseFloat(beratPlan) || 0);
    }, 0);
    return { totalQtyActual, totalBeratActual, totalQtyPlanning, totalBeratPlanning };
  }, [items]);

  const handlePrint = async () => {
    try {
      setPrintLoading(true);

      // Fetch all planning images first if we have a planning ID
      let planningImagesMap = {};
      if (planning?.id) {
        try {
          const imagesRes = await workOrderService.getWorkOrderImages(planning.id);
          const images = imagesRes?.data?.images || [];

          if (Array.isArray(images)) {
            images.forEach(img => {
              // Try multiple ID fields to match item
              const itemIds = [
                img.wo_item_id,
                img.wo_item_unique_id
              ].filter(Boolean);

              // Use a Set to avoid duplicate processing for the same ID
              const uniqueIds = [...new Set(itemIds)];

              uniqueIds.forEach(id => {
                const key = String(id);
                if (!planningImagesMap[key]) {
                  planningImagesMap[key] = [];
                }
                // Check if image already added to this key to prevent duplicates
                // Use saran_id because 'id' field might not exist in the response
                const exists = planningImagesMap[key].some(existing => {
                  if (img.saran_id && existing.saran_id) {
                    return existing.saran_id === img.saran_id;
                  }
                  // Fallback to strict object equality if no ID available
                  return existing === img;
                });

                if (!exists) {
                  planningImagesMap[key].push(img);
                }
              });
            });
          }
        } catch (err) {
          console.warn('Gagal memuat gambar WO Planning untuk print:', err);
        }
      }

      const printData = {
        workOrderPlanning: planning,
        woActual: woActual,
        customer: planning?.pelanggan,
        warehouse: planning?.gudang,

        // Keep these for backward compatibility if needed, though printUtils uses structure above
        nomor_wo: planning?.nomor_wo || 'N/A',
        tanggal_wo: planning?.created_at || 'N/A',
        status_planning: planning?.status || 'N/A',
        pelanggan: planning?.pelanggan,
        gudang: planning?.gudang,

        tanggal_actual: woActual?.tanggal_actual || woActual?.created_at,
        jam_mulai: woActual?.jam_mulai,
        jam_selesai: woActual?.jam_selesai,
        status_actual: woActual?.status,
        prioritas: woActual?.prioritas,
        catatan: woActual?.catatan,

        items: items.map(item => {
          const planningItem = item.work_order_planning_item || {};

          // Resolve Pelaksana from Actual Assignments (prioritized) or Planning
          let pelaksanaArr = [];
          // First check has_many_pelaksana (new API format)
          if (Array.isArray(item.has_many_pelaksana) && item.has_many_pelaksana.length > 0) {
            pelaksanaArr = item.has_many_pelaksana;
          }
          // Then check actual assignments (if available and is array)
          else if (Array.isArray(item.assignments) && item.assignments.length > 0) {
            pelaksanaArr = item.assignments;
          }
          // Then check item.pelaksana (sometimes actual data is here)
          else if (Array.isArray(item.pelaksana) && item.pelaksana.length > 0) {
            pelaksanaArr = item.pelaksana;
          }
          // Fallback to planning pelaksana if no actual execution data found
          else if (Array.isArray(planningItem.pelaksana)) {
            pelaksanaArr = planningItem.pelaksana;
          } else if (Array.isArray(planningItem.work_order_item_pelaksanas)) {
            pelaksanaArr = planningItem.work_order_item_pelaksanas;
          }

          const beratPlanning = item.berat_planning ?? pelaksanaArr
            .reduce((a, p) => a + (parseFloat(p.weight ?? p.berat) || 0), 0);

          // Resolve Dimensions
          let dimString = '';
          const tb = planningItem.bentuk_barang?.tipe_barang || planningItem.bentuk_barang?.tipeBarang || item.bentuk_barang?.tipe_barang || item.bentuk_barang?.tipeBarang;
          if (tb) {
            const formatInt = (val) => Math.round(parseFloat(val) || 0);
            const dims = [];
            const src = {
              diameter_luar: item.diameter_luar_actual ?? planningItem.diameter_luar ?? item.diameter_luar,
              diameter_dalam: item.diameter_dalam_actual ?? planningItem.diameter_dalam ?? item.diameter_dalam,
              panjang: item.panjang_actual ?? planningItem.panjang ?? item.panjang,
              sisi1: item.sisi1_actual ?? planningItem.sisi1 ?? item.sisi1,
              sisi2: item.sisi2_actual ?? planningItem.sisi2 ?? item.sisi2,
              tebal: item.tebal_actual ?? planningItem.tebal ?? item.tebal,
              lebar: item.lebar_actual ?? planningItem.lebar ?? item.lebar,
              ketebalan: item.tebal_actual ?? planningItem.ketebalan ?? item.ketebalan,
              diameter: item.diameter_actual ?? planningItem.diameter ?? item.diameter
            };

            if (tb.diameter_luar && tb.diameter_dalam && tb.panjang) {
              dims.push(formatInt(src.diameter_luar), formatInt(src.diameter_dalam), formatInt(src.panjang));
            } else if (tb.sisi1 && tb.sisi2 && tb.tebal && tb.panjang) {
              dims.push(formatInt(src.sisi1), formatInt(src.sisi2), formatInt(src.tebal), formatInt(src.panjang));
            } else if (tb.tebal && tb.lebar && tb.panjang) {
              dims.push(formatInt(src.tebal || src.ketebalan), formatInt(src.lebar), formatInt(src.panjang));
            } else if (tb.diameter && tb.panjang) {
              dims.push(formatInt(src.diameter), formatInt(src.panjang));
            } else {
              if (tb.tebal) dims.push(formatInt(src.tebal || src.ketebalan));
              if (tb.lebar) dims.push(formatInt(src.lebar));
              if (tb.panjang) dims.push(formatInt(src.panjang));
            }
            if (dims.length > 0) dimString = dims.join('x');
          }

          // Fallback to strict properties or provided string
          if (!dimString) {
            dimString = item.dimensi || item.dimensi_actual || planningItem.dimensi || `${Math.round(parseFloat(planningItem.panjang || item.panjang || 0))}x${Math.round(parseFloat(planningItem.lebar || item.lebar || 0))}x${Math.round(parseFloat(planningItem.tebal || item.tebal || item.ketebalan || 0))}`;
          }

          // Resolve Before Images (Planning)
          // 1. Try from fetched images API (prioritized)
          let beforeImages = [];

          // Collect possible IDs for this item to match against images
          const possibleIds = [
            planningItem.id,
            item.work_order_planning_item_id,
            planningItem.wo_item_unique_id,
            item.wo_item_unique_id
          ].filter(Boolean);

          possibleIds.forEach(pid => {
            const key = String(pid);
            if (planningImagesMap[key]) {
              planningImagesMap[key].forEach(img => {
                // Prioritize base64, fallback to file path (simplified based on JSON structure)
                const rawVal = img.canvas_image_base64 || img.canvas_file_path;

                const src = resolveImageSrc(rawVal);

                if (src && !beforeImages.some(existing => existing.src === src)) {
                  beforeImages.push({ src });
                }
              });
            }
          });

          // 2. Fallback REMOVED as per request - only use API fetched images
          // if (beforeImages.length === 0) { ... }

          return {
            jenisBarang: item.jenis_barang?.nama_jenis || item.jenis_barang_nama || planningItem.jenis_barang?.nama_jenis_barang || planningItem.jenis_barang?.nama,
            bentukBarang: item.bentuk_barang?.nama_bentuk || item.bentuk_barang_nama || planningItem.bentuk_barang?.nama_bentuk_barang || planningItem.bentuk_barang?.nama,
            gradeBarang: item.grade_barang?.nama || item.grade_barang_nama || planningItem.grade_barang?.nama_grade_barang || planningItem.grade_barang?.nama,
            dimensi: dimString,
            jenisPotongan: planningItem.jenis_potongan || item.jenis_potongan || 'N/A',

            qtyPlanning: item.qty_planning ?? planningItem.qty_planning ?? planningItem.qty ?? 0,
            beratPlanning: Math.round(beratPlanning),

            qtyActual: item.qty_actual ?? 0,
            beratActual: Math.round(item.berat ?? item.berat_actual ?? 0),

            beforeImages: beforeImages,

            pelaksanas: pelaksanaArr.map(p => {
              // Normalize to { pelaksana: { nama_pelaksana: '...' }, qty: ..., berat: ... } for printUtils
              const name = p.pelaksana?.nama_pelaksana ||
                p.pelaksana?.nama ||
                p.pelaksana_info?.nama_pelaksana ||
                (typeof p.pelaksana === 'string' ? p.pelaksana : null) ||
                p.nama_pelaksana ||
                '-';

              // Extract qty and weight from pelaksana assignment
              const qty = p.qty_actual ?? p.qty ?? p.quantity ?? 0;
              const berat = Math.round(p.berat_actual ?? p.berat ?? p.weight ?? 0);

              return {
                pelaksana: { nama_pelaksana: name },
                qty: qty,
                berat: berat
              };
            }),
            status: item.status || woActual?.status || 'PENDING',

            // Add images
            afterImages: itemImagesMap[item.id] ? [{ src: itemImagesMap[item.id] }] : [],
            sisaImages: itemSisaImagesMap[item.id] ? [{ src: itemSisaImagesMap[item.id] }] : [],
            beforeImages: beforeImages
          };
        }),

        headerImage: headerImageBase64,
        parentImages: headerImageBase64 ? [{ src: headerImageBase64 }] : []
      };

      const html = generateWOActualPrintContent(printData, { includeImages });
      openPrintDialog(html);
      setPrintOptionsOpen(false);
    } catch (error) {
      console.error('❌ Error saat mencetak WO Actual:', error);
      showAlert('Gagal mencetak WO Actual. Silakan coba lagi.', 'error');
    } finally {
      setPrintLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data WO Actual...</p>
        </div>
      </div>
    );
  }

  if (!woActual) {
    return (
      <PageLayout title="Detail WO Actual" subtitle="PRODUKSI">
        <div className="space-y-6">
          <AlertComponent />
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/wo-actual')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>
          <Card>
            <CardContent>
              <p className="text-gray-600">WO Actual tidak ditemukan</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout title="Detail WO Actual" subtitle="PRODUKSI">
        <AlertComponent />

        {/* Header - Aligned with Work Order View */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/wo-actual')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </div>

        {/* Informasi WO Planning */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informasi WO Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">WO Planning</Label>
                <Input value={planning?.nomor_wo || 'N/A'} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tanggal WO Planning</Label>
                <Input value={planning?.tanggal_wo || 'N/A'} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Status Planning</Label>
                <Input value={planning?.status || 'N/A'} disabled className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Pelanggan & Gudang */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Pelanggan & Gudang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Pelanggan</Label>
                <Input value={planning?.pelanggan?.nama || planning?.pelanggan?.nama_pelanggan || 'N/A'} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Gudang</Label>
                <Input value={planning?.gudang?.nama || planning?.gudang?.nama_gudang || 'N/A'} disabled className="bg-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Produksi (Actual) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informasi Produksi (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Tanggal Actual</Label>
                <Input value={(woActual.tanggal_actual || woActual.created_at || '').toString().substring(0, 10)} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Jam Mulai</Label>
                <Input value={woActual.jam_mulai || ''} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Jam Selesai</Label>
                <Input value={woActual.jam_selesai || ''} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Status Actual</Label>
                <Input value={woActual.status || 'N/A'} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Prioritas</Label>
                <Input value={woActual.prioritas || 'MEDIUM'} disabled className="bg-gray-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">Catatan</Label>
                <Textarea value={woActual.catatan || ''} disabled rows={4} className="bg-gray-50 mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Foto Bukti</Label>
                <div className="mt-1.5">
                  {(() => {
                    const hdrSrc = resolveImageSrc(headerImageBase64 || woActual.foto_bukti);
                    return hdrSrc ? (
                      <div className="space-y-2">
                        <img
                          src={hdrSrc}
                          alt="Foto Bukti"
                          className="w-32 h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => { setPreviewSrc(hdrSrc); setPreviewTitle('Foto Bukti WO Actual'); setPreviewOpen(true); }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-32 h-32 bg-gray-100 rounded-lg border border-dashed border-gray-300">
                        <span className="text-xs text-gray-500">Tidak ada foto</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table (Read-only) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daftar Item WO Actual</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada item pada WO Actual ini
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="table-header-standard">
                      <TableRow className="bg-gray-50">
                        <TableHead className="table-header-cell-standard text-center">Jenis</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Bentuk</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Grade</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Jenis Potongan</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Qty Planning</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Berat Planning (kg)</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Qty Actual</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Berat Actual (kg)</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Status</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Pelaksana</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Foto Bukti</TableHead>
                        <TableHead className="table-header-cell-standard text-center">Foto Sisa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((actualItem) => {
                        const planningItem = actualItem.work_order_planning_item || {};
                        const jenisNama = actualItem.jenis_barang?.nama_jenis || actualItem.jenis_barang_nama || planningItem.jenis_barang?.nama_jenis_barang || planningItem.jenis_barang?.nama;
                        const qtyPlanning = actualItem.qty_planning ?? planningItem.qty_planning ?? planningItem.qty ?? 0;
                        const pelaksanaArr = Array.isArray(planningItem.pelaksana)
                          ? planningItem.pelaksana
                          : (Array.isArray(planningItem.work_order_item_pelaksanas)
                            ? planningItem.work_order_item_pelaksanas
                            : []);
                        const beratPlanning = actualItem.berat_planning ?? pelaksanaArr
                          .reduce((a, p) => a + (parseFloat(p.weight ?? p.berat) || 0), 0);

                        const qtyActual = actualItem.qty_actual ?? 0;
                        const beratActual = actualItem.berat ?? actualItem.berat_actual ?? 0;
                        const status = actualItem.status || woActual?.status || 'PENDING';

                        const planningPelaksanaArr = Array.isArray(planningItem.pelaksana)
                          ? planningItem.pelaksana
                          : (Array.isArray(planningItem.work_order_item_pelaksanas)
                            ? planningItem.work_order_item_pelaksanas
                            : []);

                        // Determine Actual Pelaksana Array with fallback priority
                        let actualPelaksanaArr = [];
                        if (Array.isArray(actualItem.has_many_pelaksana) && actualItem.has_many_pelaksana.length > 0) {
                          actualPelaksanaArr = actualItem.has_many_pelaksana;
                        } else if (Array.isArray(actualItem.assignments) && actualItem.assignments.length > 0) {
                          actualPelaksanaArr = actualItem.assignments;
                        } else if (Array.isArray(actualItem.pelaksana) && actualItem.pelaksana.length > 0) {
                          actualPelaksanaArr = actualItem.pelaksana;
                        }

                        // Untuk display di tabel: Prioritas Actual, fallback Planning
                        const pelaksanas = actualPelaksanaArr.length > 0 ? actualPelaksanaArr : planningPelaksanaArr;

                        const bentukNama = actualItem.bentuk_barang?.nama_bentuk || actualItem.bentuk_barang_nama || planningItem.bentuk_barang?.nama_bentuk_barang || planningItem.bentuk_barang?.nama;
                        const gradeNama = actualItem.grade_barang?.nama || actualItem.grade_barang_nama || planningItem.grade_barang?.nama_grade_barang || planningItem.grade_barang?.nama;
                        const jenisPotongan = planningItem.jenis_potongan || actualItem.jenis_potongan || 'N/A';

                        const openPelaksanaModal = () => {
                          setPelaksanaModalData(actualPelaksanaArr);
                          setPelaksanaPlanningData(planningPelaksanaArr);
                          setModalQtyPlanning(qtyPlanning);
                          setPelaksanaModalOpen(true);
                        };

                        return (
                          <TableRow key={actualItem.id} className="hover:bg-gray-50">
                            <TableCell className="text-center font-medium">{jenisNama || 'N/A'}</TableCell>
                            <TableCell className="text-center">{bentukNama || 'N/A'}</TableCell>
                            <TableCell className="text-center">{gradeNama || 'N/A'}</TableCell>
                            <TableCell className="text-center">{jenisPotongan}</TableCell>
                            <TableCell className="text-center">{qtyPlanning}</TableCell>
                            <TableCell className="text-center">{Math.round(beratPlanning)}</TableCell>
                            <TableCell className="text-center">{qtyActual}</TableCell>
                            <TableCell className="text-center">{Math.round(beratActual)}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                {status}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {pelaksanas.length > 0 ? (
                                <button
                                  type="button"
                                  className="text-xs text-blue-600 hover:underline"
                                  onClick={openPelaksanaModal}
                                >
                                  Lihat
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500">Tidak ada</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const cachedBlobSrc = resolveImageSrc(itemImagesMap[actualItem.id]);
                                const rawPathSrc = resolveImageSrc(actualItem.foto_bukti);
                                const displaySrc = cachedBlobSrc || rawPathSrc;

                                return displaySrc ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <img
                                      src={displaySrc}
                                      alt="Foto Item"
                                      className="w-10 h-10 object-cover rounded border cursor-pointer"
                                      onClick={() => { setPreviewSrc(displaySrc); setPreviewTitle(`Foto Item: ${jenisNama}`); setPreviewOpen(true); }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const cachedBlobSrc = resolveImageSrc(itemSisaImagesMap[actualItem.id]);
                                const rawPathSrc = resolveImageSrc(actualItem.foto_sisa_barang);
                                const displaySrc = cachedBlobSrc || rawPathSrc;

                                return displaySrc ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <img
                                      src={displaySrc}
                                      alt="Foto Sisa Item"
                                      className="w-10 h-10 object-cover rounded border cursor-pointer"
                                      onClick={() => { setPreviewSrc(displaySrc); setPreviewTitle(`Foto Sisa Item: ${jenisNama}`); setPreviewOpen(true); }}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ringkasan Produksi */}
        <Card className="bg-white border-green-200 mb-6">
          <CardHeader>
            <CardTitle>Ringkasan Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-3 rounded-md border">
                <span className="text-sm text-gray-600 block mb-1">Total Item</span>
                <span className="text-xl font-semibold text-gray-900">{items.length}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md border">
                <span className="text-sm text-gray-600 block mb-1">Total Qty (Plan / Act)</span>
                <span className="text-xl font-semibold text-gray-900">{totals.totalQtyPlanning} / {totals.totalQtyActual}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md border">
                <span className="text-sm text-gray-600 block mb-1">Total Berat (Plan / Act)</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold text-gray-900">{Math.round(totals.totalBeratPlanning)}</span>
                  <span className="text-sm text-gray-500">/</span>
                  <span className="text-xl font-semibold text-blue-600">{Math.round(totals.totalBeratActual)}</span>
                  <span className="text-sm text-gray-600">kg</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button size="lg" variant="outline" onClick={() => navigate('/wo-actual')}>
            Kembali ke List
          </Button>

          <RoleGuard roles={['admin', 'manager', 'supervisor']}>
            <Button
              size="lg"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              variant="outline"
              onClick={() => setPrintOptionsOpen(true)}
              disabled={printLoading}
            >
              {printLoading ? 'Menyiapkan cetak...' : 'Print'}
            </Button>
          </RoleGuard>
        </div>

        {/* Pelaksana Modal */}
        <PelaksanaActualModal
          open={pelaksanaModalOpen}
          onOpenChange={setPelaksanaModalOpen}
          value={pelaksanaModalData}
          planningPelaksana={pelaksanaPlanningData}
          readOnly={true}
          qtyPlanning={modalQtyPlanning}
        />

        {/* Image Preview Modal */}
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewOpen(false)}>
            <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-lg p-2" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="font-semibold">{previewTitle}</h3>
                <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                  <span className="text-xl">&times;</span>
                </Button>
              </div>
              <div className="flex justify-center bg-gray-100 rounded overflow-hidden" style={{ maxHeight: 'calc(90vh - 60px)' }}>
                <img src={previewSrc} alt="Preview" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          </div>
        )}

        {/* Print Options Dialog */}
        <CustomAlert
          open={printOptionsOpen}
          onOpenChange={setPrintOptionsOpen}
          title="Opsi Cetak WO Actual"
          message={null}
          type="info"
          showCancel={true}
          confirmText="Cetak"
          cancelText="Batal"
          onConfirm={handlePrint}
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
      </PageLayout>
    </>
  );
}
