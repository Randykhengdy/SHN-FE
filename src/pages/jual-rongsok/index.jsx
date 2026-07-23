import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/hooks/useAlert";
import {
  ArrowLeft,
  Warehouse,
  Scale,
  DollarSign,
  Shuffle,
  Loader2,
  AlertTriangle,
  Info,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Percent
} from "lucide-react";
import { itemBarangService, gudangService } from "@/services/master-data";

export default function JualRongsokPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  // State
  const [optGudang, setOptGudang] = useState([]);
  const [gudangId, setGudangId] = useState("");
  const [actualWeight, setActualWeight] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [loadingGudangs, setLoadingGudangs] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsPreview, setItemsPreview] = useState([]);

  // Calculated values
  const [computerWeight, setComputerWeight] = useState(0);
  const [computerPrice, setComputerPrice] = useState(0);

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

  // Load preview items and calculate computer values
  const loadPreviewItems = useCallback(async (gId) => {
    if (!gId) {
      setItemsPreview([]);
      setComputerWeight(0);
      setComputerPrice(0);
      return;
    }
    setLoadingItems(true);
    try {
      const res = await itemBarangService.getPaginated(1, 200, "", "", "", {
        gudang_id: gId,
        status: "RONGSOK"
      });
      const rows = res?.data || [];
      setItemsPreview(rows);

      // Calculations
      let totalW = 0;
      let totalP = 0;
      rows.forEach(item => {
        const w = item.saldo_berat !== null ? parseFloat(item.saldo_berat) : parseFloat(item.berat || 0);
        totalW += w;
        totalP += parseFloat(item.harga_modal || 0);
      });
      setComputerWeight(totalW);
      setComputerPrice(totalP);
    } catch (e) {
      console.error("Error loading preview items:", e);
      setItemsPreview([]);
      setComputerWeight(0);
      setComputerPrice(0);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    loadPreviewItems(gudangId);
  }, [gudangId, loadPreviewItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gudangId) {
      showAlert("Peringatan", "Silakan pilih gudang.", "warning");
      return;
    }
    if (actualWeight === "" || actualPrice === "") {
      showAlert("Peringatan", "Timbangan aktual dan harga jual aktual wajib diisi.", "warning");
      return;
    }
    if (itemsPreview.length === 0) {
      showAlert("Info", "Tidak ada barang rongsok di gudang ini untuk dijual.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      await itemBarangService.sellRongsok(gudangId, parseFloat(actualWeight), parseFloat(actualPrice));
      showAlert(
        "Berhasil",
        `Berhasil memproses penjualan barang rongsok di gudang ini. Status barang diupdate menjadi Habis.`,
        "success",
        () => {
          setGudangId("");
          setActualWeight("");
          setActualPrice("");
          setItemsPreview([]);
        }
      );
    } catch (error) {
      console.error("Error selling rongsok:", error);
      showAlert("Error", error.message || "Gagal memproses penjualan rongsok.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Variance calculations
  const parsedActualWeight = parseFloat(actualWeight) || 0;
  const parsedActualPrice = parseFloat(actualPrice) || 0;
  const weightVariance = parsedActualWeight - computerWeight;
  const priceVariance = parsedActualPrice - computerPrice;

  // Format currency
  const formatIDR = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <AlertComponent />
      
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-slate-100 rounded-full transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" />
              Jual Barang Rongsok
            </h1>
            <p className="text-sm text-slate-500">
              Input timbangan dan harga aktual penjualan barang rongsok secara massal untuk satu gudang.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form and Calculations Side */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Input Form */}
          <Card className="border border-slate-200/80 shadow-md bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/30">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Warehouse className="w-4 h-4 text-amber-500" />
                Form Penjualan Rongsok
              </CardTitle>
              <CardDescription>
                Tentukan gudang dan bandingkan hitungan komputer dengan aktual fisik.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Gudang */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="gudang" className="text-sm font-semibold text-slate-700">
                    Pilih Gudang
                  </label>
                  <select
                    id="gudang"
                    value={gudangId}
                    onChange={(e) => setGudangId(e.target.value)}
                    disabled={loadingGudangs || isSubmitting}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer disabled:opacity-50 transition-all shadow-sm font-medium"
                  >
                    <option value="">{loadingGudangs ? "Memuat..." : "Pilih Gudang..."}</option>
                    {optGudang.map(g => (
                      <option key={g.id} value={g.id}>{g.kode} - {g.nama_gudang}</option>
                    ))}
                  </select>
                </div>

                {/* Timbangan Aktual */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="timbangan-aktual" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    Timbangan Aktual (kg)
                  </label>
                  <Input
                    id="timbangan-aktual"
                    type="number"
                    step="0.01"
                    placeholder="Masukkan berat timbangan fisik (kg)..."
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    disabled={!gudangId || isSubmitting}
                    className="focus-visible:ring-amber-500 font-medium"
                  />
                </div>

                {/* Harga Aktual */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="harga-aktual" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Harga Jual Aktual (Rupiah)
                  </label>
                  <Input
                    id="harga-aktual"
                    type="number"
                    step="1"
                    placeholder="Masukkan total harga jual rongsok..."
                    value={actualPrice}
                    onChange={(e) => setActualPrice(e.target.value)}
                    disabled={!gudangId || isSubmitting}
                    className="focus-visible:ring-amber-500 font-medium"
                  />
                  {actualPrice && (
                    <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 self-start">
                      Format: {formatIDR(parsedActualPrice)}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !gudangId || actualWeight === "" || actualPrice === "" || itemsPreview.length === 0}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold py-3 rounded-md shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Memproses Penjualan...
                      </>
                    ) : (
                      <>
                        <Scale className="w-4 h-4" />
                        Jual Rongsok ({itemsPreview.length} Item)
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>

        {/* Live Comparison and Items Preview Side */}
        <div className="lg:col-span-7 space-y-6">

          {/* Live Comparison Card */}
          {gudangId && (
            <Card className="border border-slate-200/80 shadow-md bg-white hover:shadow-lg transition-all duration-300">
              <CardHeader className="border-b border-slate-100 pb-3 bg-slate-50/20">
                <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Live Perbandingan (Komputer vs Aktual)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Weight Comparison */}
                <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Berat Barang (kg)</span>
                  <div className="flex justify-between items-baseline mt-1 border-b border-dashed border-slate-200 pb-2">
                    <span className="text-xs font-semibold text-slate-400">Komputer:</span>
                    <span className="text-sm font-bold text-slate-800">{computerWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-200 pb-2">
                    <span className="text-xs font-semibold text-slate-400">Aktual:</span>
                    <span className="text-sm font-bold text-slate-900">{parsedActualWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-600">Selisih:</span>
                    <span className={`text-sm font-extrabold flex items-center gap-1 ${weightVariance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {weightVariance >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {weightVariance.toFixed(2)} kg
                    </span>
                  </div>
                </div>

                {/* Price Comparison */}
                <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai Modal vs Jual</span>
                  <div className="flex justify-between items-baseline mt-1 border-b border-dashed border-slate-200 pb-2">
                    <span className="text-xs font-semibold text-slate-400">Modal Komputer:</span>
                    <span className="text-sm font-bold text-slate-850">{formatIDR(computerPrice)}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-dashed border-slate-200 pb-2">
                    <span className="text-xs font-semibold text-slate-400">Harga Jual:</span>
                    <span className="text-sm font-bold text-slate-900">{formatIDR(parsedActualPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-600">Selisih (L/R):</span>
                    <span className={`text-sm font-extrabold flex items-center gap-1 ${priceVariance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {priceVariance >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {formatIDR(priceVariance)}
                    </span>
                  </div>
                </div>

              </CardContent>
            </Card>
          )}
          
          {/* Items Preview List Panel */}
          <Card className="border border-slate-200/80 shadow-md bg-white hover:shadow-lg transition-all duration-300 min-h-[300px] flex flex-col">
            <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-amber-500" />
                  Preview Barang Rongsok Gudang
                </CardTitle>
                <CardDescription>
                  Menampilkan semua item dengan status rongsok yang akan dijual di gudang terpilih.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {loadingItems ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="text-sm font-medium">Memuat preview barang...</span>
                </div>
              ) : !gudangId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 py-16">
                  <Info className="w-12 h-12 text-slate-350 mb-3" />
                  <h3 className="font-bold text-slate-700 mb-1">Pilih Gudang Terlebih Dahulu</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Silakan pilih gudang di panel kiri untuk melihat barang-barang rongsok yang akan diproses penjualannya.
                  </p>
                </div>
              ) : itemsPreview.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 py-16">
                  <PackageCheck className="w-12 h-12 text-emerald-300 mb-3" />
                  <h3 className="font-bold text-slate-700 mb-1">Tidak Ada Barang Rongsok</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Gudang ini tidak memiliki barang rongsok. Tidak ada item yang bisa dijual.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-500 border-collapse">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">No.</th>
                        <th className="px-4 py-3">Kode Barang</th>
                        <th className="px-4 py-3">Nama Item</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Berat (kg)</th>
                        <th className="px-4 py-3 text-right">Harga Modal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {itemsPreview.map((item, idx) => {
                        const weight = item.saldo_berat !== null ? parseFloat(item.saldo_berat) : parseFloat(item.berat || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-amber-600 font-mono text-xs">{item.kode_barang}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.nama_item_barang}</td>
                            <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">{weight.toFixed(2)} kg</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900 font-mono text-xs">{formatIDR(item.harga_modal || 0)}</td>
                          </tr>
                        );
                      })}
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
