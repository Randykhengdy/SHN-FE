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
import { ArrowLeft, Package, FileText, User } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import CustomAlert from '@/components/modals/CustomAlert';
import PelaksanaActualModal from '@/components/modals/PelaksanaActualModal';
import { useAlert } from '@/hooks/useAlert';
import apiConfig from '@/config/api';
import { woActualService } from '@/services/woActualService';
import { workOrderService } from '@/services/workOrderService';
import { generateWOActualPrintContent, openPrintDialog } from '@/lib/printUtils';

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
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);

  // Helper: build storage URL from file path
  const buildStorageUrl = (path) => {
    if (!path) return null;
    try {
      const base = apiConfig.baseUrl.replace(/\/api$/, '');
      let normalized = path.replace(/^\/+/, '');
      // Normalize: remove actual ID segment from item path
      // e.g. work-order-actual/10/items/4/foto_bukti.jpg -> work-order-actual/items/4/foto_bukti.jpg
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
    // Blob URLs from authenticated fetch should be used as-is
    if (trimmed.startsWith('blob:')) return trimmed;
    if (/^data:image\//i.test(trimmed)) return trimmed; // already data URL
    if (/^https?:\/\//i.test(trimmed)) return trimmed; // absolute URL
    // if looks like base64 without prefix
    if (/^[A-Za-z0-9+/=]+$/i.test(trimmed) && trimmed.length > 100) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    // otherwise treat as storage path
    return buildStorageUrl(trimmed);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await woActualService.getWOActualById(id);
        const data = response?.data || response || null;

        if (!data) {
          // title, message, type
          showAlert('WO Actual tidak ditemukan', 'Data tidak tersedia', 'error');
          return;
        }

        const actual = data.work_order_actual || data.woActual || data;
        const planningRel = actual.work_order_planning || data.work_order_planning || null;
        const actualItems = actual.work_order_actual_items || data.work_order_actual_items || actual.items || data.items || [];

        setWoActual(actual);
        setPlanning(planningRel);
        setItems(actualItems);
      } catch (e) {
        console.error('Error memuat WO Actual:', e);
        // title, message, type
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
        // Header image (binary stream)
        try {
          const blob = await woActualService.getWOActualHeaderImageBlob(id);
          const url = URL.createObjectURL(blob);
          setHeaderImageBase64(url);
        } catch (e) {
          console.warn('Gagal mengambil header image WO Actual:', e?.message || e);
        }

        // Item images: no bulk endpoint, load on demand per item click
        setItemImagesMap({});
      } finally {
        setImagesLoading(false);
      }
    };
    loadImages();
    // Cleanup object URLs on id change/unmount
    return () => {
      try {
        if (headerImageBase64 && headerImageBase64.startsWith('blob:')) {
          URL.revokeObjectURL(headerImageBase64);
        }
      } catch (_) {}
    };
  }, [id]);

  const totals = useMemo(() => {
    const totalQtyActual = (items || []).reduce((sum, it) => sum + (parseFloat(it.qty_actual || 0) || 0), 0);
    // Hindari mixing ?? dengan || tanpa kurung: gunakan ?? berantai
    const totalBeratActual = (items || []).reduce((sum, it) => sum + (parseFloat(it.berat ?? it.berat_actual ?? 0) || 0), 0);
    const totalQtyPlanning = (items || []).reduce((sum, it) => {
      const qtyPlan = it.qty_planning ?? it.work_order_planning_item?.qty ?? 0;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Memuat data WO Actual...</p>
        </div>
      </div>
    );
  }

  if (!woActual) {
    return (
      <PageLayout>
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
    <PageLayout>
      <div className="space-y-6">
        <AlertComponent />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/wo-actual')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lihat WO Actual</h1>
              <p className="text-gray-600">Halaman view (read-only) WO Actual</p>
            </div>
          </div>
          {/* Tombol Print dipindahkan ke bagian bawah halaman */}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informasi Dasar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>WO Planning</Label>
                      <Input value={planning?.nomor_wo || 'N/A'} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Tanggal Actual</Label>
                      <Input value={(woActual.tanggal_actual || woActual.created_at || '').toString().substring(0,10)} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Jam Mulai</Label>
                      <Input value={woActual.jam_mulai || ''} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Jam Selesai</Label>
                      <Input value={woActual.jam_selesai || ''} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {woActual.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Prioritas</Label>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {woActual.prioritas || 'MEDIUM'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Catatan</Label>
                    <Textarea value={woActual.catatan || ''} disabled rows={3} />
                  </div>

                  {/* Foto Bukti */}
                  <div>
                    <Label>Foto Bukti</Label>
                    {(() => {
                      const hdrSrc = resolveImageSrc(headerImageBase64 || woActual.foto_bukti);
                      return hdrSrc ? (
                        <div className="space-y-2">
                          <img
                            src={hdrSrc}
                            alt="Foto Bukti"
                            className="w-32 h-32 object-cover rounded-lg border cursor-pointer"
                            onClick={() => { setPreviewSrc(hdrSrc); setPreviewTitle('Foto Bukti WO Actual'); setPreviewOpen(true); }}
                          />
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setPreviewSrc(hdrSrc); setPreviewTitle('Foto Bukti WO Actual'); setPreviewOpen(true); }}
                            >
                              Lihat
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Tidak ada foto bukti</p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Planning Info & Summary */}
            <div className="space-y-6">
              {planning && (
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
                      <p className="text-sm">{planning.nomor_wo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Pelanggan</Label>
                      <p className="text-sm">{planning.pelanggan?.nama || planning.pelanggan?.nama_pelanggan || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Gudang</Label>
                      <p className="text-sm">{planning.gudang?.nama || planning.gudang?.nama_gudang || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tanggal WO</Label>
                      <p className="text-sm">{planning.tanggal_wo || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant="outline" className="text-xs">{planning.status || 'N/A'}</Badge>
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
                    <span className="text-sm font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Qty Planning:</span>
                    <span className="text-sm font-medium">{totals.totalQtyPlanning}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Berat Planning:</span>
                    <span className="text-sm font-medium">{Math.round(totals.totalBeratPlanning)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Qty Actual:</span>
                    <span className="text-sm font-medium">{totals.totalQtyActual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Berat Actual:</span>
                    <span className="text-sm font-medium text-blue-600">{Math.round(totals.totalBeratActual)} kg</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Items Table (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Item WO (Actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada item pada WO Actual ini
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Jenis</TableHead>
                        <TableHead className="text-center">Bentuk</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
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
                      {items.map((actualItem) => {
                        const planningItem = actualItem.work_order_planning_item || {};
                        const jenisNama = actualItem.jenis_barang_nama || planningItem.jenis_barang?.nama || planningItem.jenis_barang?.nama_jenis_barang;
                        const qtyPlanning = actualItem.qty_planning ?? planningItem.qty ?? 0;
                        const pelaksanaArr = Array.isArray(planningItem.pelaksana)
                          ? planningItem.pelaksana
                          : (Array.isArray(planningItem.work_order_item_pelaksanas)
                              ? planningItem.work_order_item_pelaksanas
                              : []);
                        const beratPlanning = actualItem.berat_planning ?? pelaksanaArr
                          .reduce((a, p) => a + (parseFloat(p.weight ?? p.berat) || 0), 0);
                        const qtyActual = actualItem.qty_actual ?? 0;
                        const beratActual = actualItem.berat ?? actualItem.berat_actual ?? 0;
                        const status = actualItem.status || woActual.status || 'PENDING';
                        const pelaksanas = actualItem.work_order_actual_pelaksanas || actualItem.has_many_pelaksana || [];
                        const bentukNama = actualItem.bentuk_barang_nama || planningItem.bentuk_barang?.nama || planningItem.bentuk_barang?.nama_bentuk_barang;
                        const gradeNama = actualItem.grade_barang_nama || planningItem.grade_barang?.nama || planningItem.grade_barang?.nama_grade_barang;
                        const openPelaksanaModal = () => {
                          setPelaksanaModalData(pelaksanas);
                          setPelaksanaPlanningData(pelaksanaArr);
                          setPelaksanaModalOpen(true);
                        };
                        return (
                          <TableRow key={actualItem.id}>
                            <TableCell className="text-center">{jenisNama || 'N/A'}</TableCell>
                            <TableCell className="text-center">{bentukNama || 'N/A'}</TableCell>
                            <TableCell className="text-center">{gradeNama || 'N/A'}</TableCell>
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
                                const handleOpenItemPreview = async () => {
                                  let src = cachedBlobSrc;
                                  // Selalu prioritaskan fetch terautentikasi; hindari langsung pakai URL storage yang 403
                                  if (!src) {
                                    try {
                                      const blob = await woActualService.getWOActualItemImageBlob(actualItem.id);
                                      src = URL.createObjectURL(blob);
                                      setItemImagesMap(prev => ({ ...prev, [actualItem.id]: src }));
                                    } catch (e) {
                                      console.warn('Gagal load image item:', e);
                                      // Fallback hanya jika sudah berupa data URL/Blob
                                      if (rawPathSrc && (rawPathSrc.startsWith('data:image') || rawPathSrc.startsWith('blob:'))) {
                                        src = rawPathSrc;
                                      }
                                    }
                                  }
                                  if (src) { setPreviewSrc(src); setPreviewTitle(`Foto Bukti Item #${actualItem.id}`); setPreviewOpen(true); }
                                };
                                return (cachedBlobSrc || rawPathSrc) ? (
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={handleOpenItemPreview}
                                  >
                                    Lihat
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-500">Belum ada</span>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Totals Bar removed per request: ringkasan sudah tersedia di atas */}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pelaksana Modal (Read-only style sama seperti Add) */}
        <PelaksanaActualModal
          open={pelaksanaModalOpen}
          onOpenChange={setPelaksanaModalOpen}
          title="Pelaksana (View)"
          planningPelaksana={pelaksanaPlanningData}
          value={pelaksanaModalData}
          readOnly={true}
        />

        {/* Action Buttons (Bottom) */}
        <div className="flex justify-center gap-4 mt-6">
          <Button size="lg" variant="outline" onClick={() => navigate('/wo-actual')}>
            Kembali ke List
          </Button>
          <Button
            size="lg"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            variant="outline"
            onClick={() => setPrintOptionsOpen(true)}
          >
            Print
          </Button>
        </div>
      </div>
    </PageLayout>
    <CustomAlert
      open={printOptionsOpen}
      onOpenChange={setPrintOptionsOpen}
      title="Opsi Cetak WO Actual"
      message={null}
      type="info"
      showCancel={true}
      confirmText="Cetak"
      cancelText="Batal"
      onConfirm={async () => {
        try {
          const printItems = (items || []).map((actualItem, index) => {
            const planningItem = actualItem.work_order_planning_item || {};
            const itemBarang = planningItem.item_barang || {};
            const pelaksanas = actualItem.work_order_actual_pelaksanas || actualItem.has_many_pelaksana || [];
            return {
              id: actualItem.id,
              woPlanItemId: actualItem.work_order_planning_item_id || actualItem.wo_plan_item_id || planningItem.id,
              no: index + 1,
              itemName: actualItem.item_barang_nama || itemBarang.nama_item_barang || itemBarang.nama || 'N/A',
              jenisBarang: actualItem.jenis_barang_nama || itemBarang.jenis_barang?.nama_jenis_barang || itemBarang.jenis_barang?.nama || planningItem.jenis_barang?.nama || 'N/A',
              bentukBarang: actualItem.bentuk_barang_nama || itemBarang.bentuk_barang?.nama_bentuk_barang || itemBarang.bentuk_barang?.nama || planningItem.bentuk_barang?.nama || 'N/A',
              gradeBarang: actualItem.grade_barang_nama || itemBarang.grade_barang?.nama_grade_barang || itemBarang.grade_barang?.nama || planningItem.grade_barang?.nama || 'N/A',
              dimensi: `${planningItem.panjang || 0} x ${planningItem.lebar || 0} mm`,
              qtyPlanning: planningItem.qty || actualItem.qty_planning || 0,
              qtyActual: actualItem.qty_actual || 0,
              beratActual: (actualItem.berat ?? actualItem.berat_actual ?? 0),
              jenisPotongan: planningItem.jenis_potongan || 'N/A',
              pelaksanas
            };
          });
          let planningCanvasImages = [];
          try {
            if (planning?.id) {
              const imagesResp = await workOrderService.getWorkOrderImages(planning.id);
              planningCanvasImages = imagesResp?.data?.images || imagesResp?.images || [];
            }
          } catch (imgErr) {
            console.warn('Gagal mengambil gambar WO Planning untuk print:', imgErr);
          }
          const printItemsWithImages = await Promise.all(
            printItems.map(async (pi) => {
              const beforeImages = (planningCanvasImages || []).filter((img) => {
                const candidateIds = [
                  img.work_order_planning_item_id,
                  img.wo_plan_item_id,
                  img.wo_item_id,
                  img.work_order_item_id,
                  img.item_id
                ].filter(Boolean);
                return candidateIds.includes(pi.woPlanItemId);
              });
              let afterImages = [];
              try {
                const blob = await woActualService.getWOActualItemImageBlob(pi.id);
                const url = URL.createObjectURL(blob);
                if (url) {
                  afterImages = [{ src: url, work_order_actual_item_id: pi.id }];
                }
              } catch (aImgErr) {
                console.warn(`Gagal mengambil gambar WO Actual item ${pi.id} untuk print:`, aImgErr);
              }
              return { ...pi, beforeImages, afterImages };
            })
          );
          const printData = {
            workOrderPlanning: planning,
            woActual,
            customer: planning?.pelanggan || planning?.customer || null,
            warehouse: planning?.gudang || planning?.warehouse || null,
            items: printItemsWithImages,
            planningCanvasImages,
            parentImages: (() => {
              try {
                const parentSrc = resolveImageSrc(headerImageBase64 || woActual.foto_bukti);
                return parentSrc ? [{ src: parentSrc }] : [];
              } catch (_) {
                return [];
              }
            })()
          };
          const html = generateWOActualPrintContent(printData, { includeImages });
          openPrintDialog(html);
        } catch (e) {
          console.error('Gagal membuka dialog print WO Actual (view):', e);
          showAlert('Error', 'Gagal membuka dialog print WO Actual', 'error');
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
    {previewOpen && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setPreviewOpen(false)}>
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-[90%] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-medium text-gray-800">{previewTitle || 'Preview Gambar'}</h3>
            <button
              className="text-gray-500 hover:text-gray-700 text-sm"
              onClick={() => setPreviewOpen(false)}
            >
              Tutup
            </button>
          </div>
          <div className="p-4 bg-gray-50">
            {previewSrc ? (
              <img src={previewSrc} alt={previewTitle || 'Preview'} className="w-full max-h-[70vh] object-contain" />
            ) : (
              <div className="text-center text-gray-500 py-10">Gambar tidak tersedia</div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}