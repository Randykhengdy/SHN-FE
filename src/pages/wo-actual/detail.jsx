import React, { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Eye, FileText, Calendar, User, Package } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/hooks/useAlert";
import { woActualService } from '@/services/woActualService';
import apiConfig from '@/config/api';
import PageLayout from "@/components/PageLayout";
import { generateWOActualPrintContent, openPrintDialog } from "@/lib/printUtils";

export default function WOActualDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  // Loading states
  const [loading, setLoading] = useState(false);

  // Prevent multiple API calls
  const isLoadingRef = useRef(false);

  // WO Actual Data
  const [woActual, setWoActual] = useState(null);
  const [workOrderPlanning, setWorkOrderPlanning] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [warehouseData, setWarehouseData] = useState(null);
  const [items, setItems] = useState([]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return timeString.substring(0, 5); // Get HH:MM from HH:MM:SS
    } catch (error) {
      return 'N/A';
    }
  };

  // Build storage URL from relative file path when API returns non-base64
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

  // Load WO Actual data
  const loadWOActualData = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('🔧 Skipping loadWOActualData - already loading');
      return;
    }

    isLoadingRef.current = true;

    try {
      setLoading(true);
      console.log('🔧 Fetching WO Actual data for ID:', id);

      const response = await woActualService.getWOActualById(id);

      console.log('🔍 WO Actual API Response:', response);

      const woActualData = response.data || response;

      if (!woActualData) {
        throw new Error('WO Actual data not found in response');
      }

      setWoActual(woActualData);

      // Extract work order planning data
      const woPlanning = woActualData.work_order_planning;
      if (woPlanning) {
        setWorkOrderPlanning(woPlanning);

        // Extract customer and warehouse data from planning
        setCustomerData(woPlanning.pelanggan || woPlanning.customer);
        setWarehouseData(woPlanning.gudang || woPlanning.warehouse);
      }

      // Process items data
      const actualItems = woActualData.work_order_actual_items || woActualData.items || [];
      const processedItems = actualItems.map((actualItem, index) => {
        const planningItem = actualItem.work_order_planning_item || {};
        const itemBarang = planningItem.item_barang || {};
        const pelaksanas = actualItem.work_order_actual_pelaksanas || actualItem.has_many_pelaksana || [];

        return {
          id: actualItem.id,
          no: index + 1,
          itemName: itemBarang.nama_item_barang || 'N/A',
          jenisBarang: itemBarang.jenis_barang?.nama_jenis_barang || 'N/A',
          bentukBarang: itemBarang.bentuk_barang?.nama_bentuk_barang || 'N/A',
          gradeBarang: itemBarang.grade_barang?.nama_grade_barang || 'N/A',
          dimensi: (() => {
            let dimString = '';
            const tb = itemBarang.bentuk_barang?.tipe_barang || itemBarang.bentuk_barang?.tipeBarang || planningItem.bentuk_barang?.tipe_barang || planningItem.bentuk_barang?.tipeBarang;
            if (tb) {
              const formatInt = (val) => Math.round(parseFloat(val) || 0);
              const dims = [];
              const src = {
                diameter_luar: actualItem.diameter_luar_actual ?? planningItem.diameter_luar,
                diameter_dalam: actualItem.diameter_dalam_actual ?? planningItem.diameter_dalam,
                panjang: actualItem.panjang_actual ?? planningItem.panjang,
                sisi1: actualItem.sisi1_actual ?? planningItem.sisi1,
                sisi2: actualItem.sisi2_actual ?? planningItem.sisi2,
                tebal: actualItem.tebal_actual ?? planningItem.tebal,
                lebar: actualItem.lebar_actual ?? planningItem.lebar,
                ketebalan: actualItem.tebal_actual ?? planningItem.ketebalan,
                diameter: actualItem.diameter_actual ?? planningItem.diameter
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

            if (!dimString) {
              dimString = actualItem.dimensi || planningItem.dimensi || `${Math.round(parseFloat(planningItem.panjang || 0))}x${Math.round(parseFloat(planningItem.lebar || 0))}x${Math.round(parseFloat(planningItem.tebal || 0))}`;
            }
            return dimString;
          })(),
          qtyPlanning: planningItem.qty || 0,
          qtyActual: actualItem.qty_actual || 0,
          beratActual: (actualItem.berat ?? actualItem.berat_actual ?? 0),
          jenisPotongan: planningItem.jenis_potongan || 'N/A',
          pelaksanas: pelaksanas
        };
      });

      setItems(processedItems);

    } catch (error) {
      console.error('❌ Error loading WO Actual data:', error);
      showAlert('Gagal Memuat WO Actual', 'Gagal memuat data WO Actual: ' + error.message, 'error');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [id, showAlert]);

  // Load data on component mount
  useEffect(() => {
    if (id) {
      loadWOActualData();
    }
  }, [id, loadWOActualData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data WO Actual...</p>
        </div>
      </div>
    );
  }

  if (!woActual) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">WO Actual tidak ditemukan</p>
          <Button onClick={() => navigate('/wo-actual')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout title="Detail Work Order Actual" subtitle="PRODUKSI">
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

      {/* WO Actual Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informasi Work Order Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Nomor WO
              </Label>
              <Input
                value={workOrderPlanning?.nomor_wo || 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Tanggal WO</Label>
              <Input
                value={formatDate(workOrderPlanning?.tanggal_wo)}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Prioritas</Label>
              <Input
                value={workOrderPlanning?.prioritas || 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Input
                value={workOrderPlanning?.status || 'N/A'}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Tanggal Actual</Label>
              <Input
                value={formatDate(woActual?.tanggal_actual || woActual?.created_at)}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Foto Bukti</Label>
              <div className="flex items-center gap-2">
                {woActual?.foto_bukti ? (
                  (() => {
                    const foto = woActual.foto_bukti;
                    const url = (typeof foto === 'string' && /^https?:\/\//i.test(foto))
                      ? foto
                      : buildStorageUrl(foto);
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const blob = await woActualService.getWOActualHeaderImageBlob(woActual?.id);
                            const blobUrl = URL.createObjectURL(blob);
                            window.open(blobUrl, '_blank');
                          } catch (e) {
                            console.warn('Gagal memuat foto bukti header:', e);
                            if (url) {
                              window.open(url, '_blank');
                            }
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat Foto
                      </Button>
                    );
                  })()
                ) : (
                  <span className="text-gray-400 text-sm">Tidak ada foto</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      {customerData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informasi Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Kode Pelanggan</Label>
                <Input
                  value={customerData.kode || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Nama Pelanggan</Label>
                <Input
                  value={customerData.nama_pelanggan || customerData.nama || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Kota</Label>
                <Input
                  value={customerData.kota || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Telepon/HP</Label>
                <Input
                  value={customerData.telepon_hp || customerData.telepon || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warehouse Information */}
      {warehouseData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Informasi Gudang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Nama Gudang</Label>
                <Input
                  value={warehouseData.nama_gudang || warehouseData.nama || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Alamat</Label>
                <Input
                  value={warehouseData.alamat || 'N/A'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detail Item Work Order Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Item</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Bentuk</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Dimensi</TableHead>
                  <TableHead>Qty Planning</TableHead>
                  <TableHead>Qty Actual</TableHead>
                  <TableHead>Berat Actual</TableHead>
                  <TableHead>Jenis Potongan</TableHead>
                  <TableHead>Pelaksana</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      Tidak ada item
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{item.no}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.jenisBarang}</TableCell>
                      <TableCell>{item.bentukBarang}</TableCell>
                      <TableCell>{item.gradeBarang}</TableCell>
                      <TableCell>{item.dimensi}</TableCell>
                      <TableCell>{item.qtyPlanning}</TableCell>
                      <TableCell className="font-semibold text-blue-600">{item.qtyActual}</TableCell>
                      <TableCell className="font-semibold text-green-600">{item.beratActual} kg</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.jenisPotongan === 'potongan'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                          }`}>
                          {item.jenisPotongan === 'potongan' ? 'Potongan' : 'Utuh'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.pelaksanas && item.pelaksanas.length > 0 ? (
                          <div className="space-y-1">
                            {item.pelaksanas.map((pelaksana, idx) => (
                              <div key={idx} className="text-sm">
                                <div className="font-medium">{pelaksana.pelaksana?.nama_pelaksana || 'N/A'}</div>
                                <div className="text-gray-500">
                                  {formatDate(pelaksana.tanggal)} | {formatTime(pelaksana.jam_mulai)} - {formatTime(pelaksana.jam_selesai)}
                                </div>
                                <div className="text-gray-500">
                                  Qty: {pelaksana.qty} | Berat: {pelaksana.berat} kg
                                </div>
                                {pelaksana.catatan && (
                                  <div className="text-gray-400 italic text-xs">{pelaksana.catatan}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Tidak ada pelaksana</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-white border-blue-200">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Jumlah Item:</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Qty Actual:</span>
                <span className="font-semibold text-blue-600">
                  {items.reduce((sum, item) => sum + (item.qtyActual || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Berat Actual:</span>
                <span className="font-semibold text-green-600">
                  {items.reduce((sum, item) => sum + (item.beratActual || 0), 0).toFixed(2)} kg
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status WO:</span>
                <span className="font-semibold text-blue-600">{workOrderPlanning?.status || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dibuat pada:</span>
                <span className="font-semibold">{formatDate(woActual?.created_at)}</span>
              </div>
              {woActual?.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Diupdate pada:</span>
                  <span className="font-semibold">{formatDate(woActual?.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <Button size="lg" variant="outline" onClick={() => navigate('/wo-actual')}>
          Kembali ke List
        </Button>
        <Button
          size="lg"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
          variant="outline"
          onClick={() => {
            try {
              const printData = {
                workOrderPlanning,
                woActual,
                customer: customerData,
                warehouse: warehouseData,
                items
              };
              const html = generateWOActualPrintContent(printData);
              openPrintDialog(html);
              showAlert('Sukses', 'Dialog print dibuka untuk WO Actual', 'success');
            } catch (e) {
              console.error('Gagal membuka dialog print WO Actual:', e);
              showAlert('Error', 'Gagal membuka dialog print WO Actual', 'error');
            }
          }}
        >
          Print
        </Button>
      </div>

      <AlertComponent />
    </PageLayout>
  );
}