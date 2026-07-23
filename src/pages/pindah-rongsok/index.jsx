import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/hooks/useAlert";
import {
  ArrowLeft,
  Warehouse,
  Shuffle,
  Loader2,
  AlertTriangle,
  Info,
  PackageCheck
} from "lucide-react";
import { itemBarangService, gudangService } from "@/services/master-data";

export default function PindahRongsokPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  // State
  const [optGudang, setOptGudang] = useState([]);
  const [gudangAsal, setGudangAsal] = useState("");
  const [gudangTujuan, setGudangTujuan] = useState("");
  const [loadingGudangs, setLoadingGudangs] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsPreview, setItemsPreview] = useState([]);

  // Fetch Gudang options
  useEffect(() => {
    setLoadingGudangs(true);
    gudangService.getAll()
      .then(res => {
        setOptGudang(res?.data || []);
      })
      .catch(e => {
        console.error("Error fetching gudang:", e);
        showAlert("Error", "Gagal mengambil data gudang.", "error");
      })
      .finally(() => {
        setLoadingGudangs(false);
      });
  }, [showAlert]);

  // Load preview items in selected source warehouse
  const loadPreviewItems = useCallback(async (gudangId) => {
    if (!gudangId) {
      setItemsPreview([]);
      return;
    }
    setLoadingItems(true);
    try {
      // Use the paginated endpoint with a large perPage to get the list of rongsok items
      const res = await itemBarangService.getPaginated(1, 100, "", "", "", {
        gudang_id: gudangId,
        status: "RONGSOK"
      });
      setItemsPreview(res?.data || []);
    } catch (e) {
      console.error("Error loading preview items:", e);
      setItemsPreview([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    loadPreviewItems(gudangAsal);
  }, [gudangAsal, loadPreviewItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gudangAsal || !gudangTujuan) {
      showAlert("Peringatan", "Silakan pilih gudang asal dan tujuan.", "warning");
      return;
    }
    if (gudangAsal === gudangTujuan) {
      showAlert("Peringatan", "Gudang asal dan tujuan tidak boleh sama.", "warning");
      return;
    }
    if (itemsPreview.length === 0) {
      showAlert("Info", "Tidak ada barang rongsok di gudang asal yang perlu dipindahkan.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await itemBarangService.moveRongsok(gudangAsal, gudangTujuan);
      const count = response?.data?.count ?? 0;
      showAlert(
        "Berhasil",
        `Berhasil memindahkan ${count} barang rongsok ke gudang tujuan.`,
        "success",
        () => {
          setGudangAsal("");
          setGudangTujuan("");
          setItemsPreview([]);
        }
      );
    } catch (error) {
      console.error("Error moving rongsok:", error);
      showAlert("Error", error.message || "Gagal memindahkan barang rongsok.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <AlertComponent />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-amber-500" />
              Pindah Barang Rongsok
            </h1>
            <p className="text-sm text-gray-500">
              Pindahkan semua barang berstatus Rongsok dari satu gudang ke gudang lainnya secara massal.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Transfer Form Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-gray-200/80 shadow-md bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/30">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-800">
                <Warehouse className="w-4 h-4 text-blue-500" />
                Parameter Gudang
              </CardTitle>
              <CardDescription>
                Pilih gudang asal yang berisi barang rongsok dan tentukan gudang tujuannya.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="gudang-asal" className="text-sm font-semibold text-gray-700">
                    Gudang Asal (Sumber)
                  </label>
                  <select
                    id="gudang-asal"
                    value={gudangAsal}
                    onChange={(e) => setGudangAsal(e.target.value)}
                    disabled={loadingGudangs || isSubmitting}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                  >
                    <option value="">{loadingGudangs ? "Memuat..." : "Pilih Gudang Asal..."}</option>
                    {optGudang.map(g => (
                      <option key={g.id} value={g.id}>{g.kode} - {g.nama_gudang}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="gudang-tujuan" className="text-sm font-semibold text-gray-700">
                    Gudang Tujuan (Destinasi)
                  </label>
                  <select
                    id="gudang-tujuan"
                    value={gudangTujuan}
                    onChange={(e) => setGudangTujuan(e.target.value)}
                    disabled={loadingGudangs || isSubmitting}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                  >
                    <option value="">{loadingGudangs ? "Memuat..." : "Pilih Gudang Tujuan..."}</option>
                    {optGudang.map(g => (
                      <option key={g.id} value={g.id}>{g.kode} - {g.nama_gudang}</option>
                    ))}
                  </select>
                </div>

                {gudangAsal && gudangTujuan && gudangAsal === gudangTujuan && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Gudang asal dan tujuan tidak boleh sama. Silakan pilih gudang yang berbeda.</span>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !gudangAsal || !gudangTujuan || (gudangAsal === gudangTujuan) || itemsPreview.length === 0}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2.5 rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memindahkan...
                      </>
                    ) : (
                      <>
                        <Shuffle className="w-4 h-4" />
                        Pindahkan Barang Rongsok ({itemsPreview.length} Item)
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview List Panel */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-gray-200/80 shadow-md bg-white hover:shadow-lg transition-all duration-300 min-h-[400px] flex flex-col">
            <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-500" />
                  Daftar Barang Rongsok
                </CardTitle>
                <CardDescription>
                  Menampilkan semua item dengan status rongsok di gudang asal.
                </CardDescription>
              </div>
              {itemsPreview.length > 0 && (
                <div className="bg-amber-100 border border-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
                  {itemsPreview.length} Rongsok
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {loadingItems ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="text-sm font-medium">Memuat daftar barang...</span>
                </div>
              ) : !gudangAsal ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 py-16">
                  <Info className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="font-bold text-gray-700 mb-1">Pilih Gudang Asal</h3>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Silakan pilih gudang asal di panel kiri untuk melihat barang-barang rongsok yang akan dipindahkan.
                  </p>
                </div>
              ) : itemsPreview.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 py-16">
                  <PackageCheck className="w-12 h-12 text-emerald-300 mb-3" />
                  <h3 className="font-bold text-gray-700 mb-1">Tidak Ada Barang Rongsok</h3>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Gudang asal ini bersih dari barang rongsok. Tidak ada item yang perlu dipindahkan.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500 border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">No.</th>
                        <th className="px-4 py-3">Kode Barang</th>
                        <th className="px-4 py-3">Nama Item</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Berat (kg)</th>
                        <th className="px-4 py-3">Rak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {itemsPreview.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">{idx + 1}</td>
                          <td className="px-4 py-3 font-semibold text-amber-600 font-mono text-xs">{item.kode_barang}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{item.nama_item_barang}</td>
                          <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{item.saldo_berat || item.berat} kg</td>
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold font-mono">
                              {item.rak?.kode || "Tidak ada rak"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
