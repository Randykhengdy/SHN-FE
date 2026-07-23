import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/hooks/useAlert";
import {
  ArrowLeft,
  Warehouse,
  Scale,
  DollarSign,
  Loader2,
  AlertTriangle,
  Info,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  FileText,
  History,
  Receipt,
  Printer
} from "lucide-react";
import { itemBarangService, gudangService } from "@/services/master-data";
import RongsokInvoiceModal from "@/components/modals/RongsokInvoiceModal";

export default function JualRongsokPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  // Active Tab
  const [activeTab, setActiveTab] = useState("form");

  // Form State
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

  // Sales History State
  const [salesHistory, setSalesHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState(null);

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

  // Fetch Sales History
  const loadSalesHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await itemBarangService.getRongsokSales({ per_page: 50 });
      setSalesHistory(res?.data || []);
    } catch (e) {
      console.error("Error loading sales history:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      loadSalesHistory();
    }
  }, [activeTab, loadSalesHistory]);

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
      const res = await itemBarangService.sellRongsok(gudangId, parseFloat(actualWeight), parseFloat(actualPrice));
      const saleResult = res?.data;

      // Construct a sale object for immediate invoice option
      const newSaleObj = {
        id: saleResult?.id,
        gudang: optGudang.find(g => g.id === parseInt(gudangId)),
        computer_weight: saleResult?.computer_weight ?? computerWeight,
        actual_weight: saleResult?.actual_weight ?? parseFloat(actualWeight),
        computer_price: saleResult?.computer_price ?? computerPrice,
        actual_price: saleResult?.actual_price ?? parseFloat(actualPrice),
        created_at: new Date().toISOString(),
        details: itemsPreview.map(item => ({
          item_barang: item,
          computer_weight: item.saldo_berat ?? item.berat ?? 0,
          computer_price: item.harga_modal ?? 0
        }))
      };

      showAlert(
        "Berhasil",
        `Berhasil memproses penjualan barang rongsok di gudang ini. Status barang diupdate menjadi Habis.`,
        "success",
        () => {
          setGudangId("");
          setActualWeight("");
          setActualPrice("");
          setItemsPreview([]);
          // Open invoice modal directly for convenience
          setSelectedSaleForInvoice(newSaleObj);
          setInvoiceModalOpen(true);
        }
      );
    } catch (error) {
      console.error("Error selling rongsok:", error);
      showAlert("Error", error.message || "Gagal memproses penjualan rongsok.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInvoice = (sale) => {
    setSelectedSaleForInvoice(sale);
    setInvoiceModalOpen(true);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <AlertComponent />
      
      {/* Invoice Modal */}
      <RongsokInvoiceModal
        open={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setSelectedSaleForInvoice(null);
        }}
        sale={selectedSaleForInvoice}
      />

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-slate-100 rounded-full transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-500" />
                Jual Barang Rongsok & Generate Invoice
              </h1>
              <p className="text-sm text-slate-500">
                Proses penjualan barang rongsok massal, komparasi fisik vs komputer, serta pembuatan invoice PPN.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-200/60 p-1 rounded-lg">
            <TabsTrigger value="form" className="font-bold text-xs flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Form Penjualan Rongsok
            </TabsTrigger>
            <TabsTrigger value="history" className="font-bold text-xs flex items-center gap-2">
              <History className="w-4 h-4" />
              Riwayat Penjualan & Invoice
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: FORM PENJUALAN */}
          <TabsContent value="form" className="space-y-6 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input Side */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="border border-slate-200/80 shadow-md bg-white hover:shadow-lg transition-all duration-300">
                  <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/30">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                      <Warehouse className="w-4 h-4 text-amber-500" />
                      Form Penjualan Rongsok
                    </CardTitle>
                    <CardDescription>
                      Pilih gudang dan masukkan timbangan serta harga rongsok aktual.
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
                              Jual Rongsok & Generate Invoice ({itemsPreview.length} Item)
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison & Preview Side */}
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
                          <span className="text-sm font-bold text-slate-800">{formatIDR(computerPrice)}</span>
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
          </TabsContent>

          {/* TAB 2: RIWAYAT PENJUALAN & INVOICE */}
          <TabsContent value="history" className="m-0 space-y-6">
            <Card className="border border-slate-200/80 shadow-md bg-white">
              <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/30 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-500" />
                    Daftar Transaksi Penjualan Rongsok
                  </CardTitle>
                  <CardDescription>
                    Riwayat penjualan barang rongsok beserta perbandingan timbangan dan pencetakan invoice.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadSalesHistory} disabled={loadingHistory} className="text-xs border-slate-300">
                  {loadingHistory ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <span className="text-sm font-medium">Memuat riwayat penjualan...</span>
                  </div>
                ) : salesHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 py-16">
                    <Receipt className="w-12 h-12 text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-700 mb-1">Belum Ada Transaksi Penjualan</h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Semua transaksi penjualan rongsok yang diproses akan tercatat dan ditampilkan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 border-collapse">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">No. Sale</th>
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3">Gudang</th>
                          <th className="px-4 py-3 text-right">Berat (Komp / Akt)</th>
                          <th className="px-4 py-3 text-right">Harga (Modal / Jual)</th>
                          <th className="px-4 py-3">Dibuat Oleh</th>
                          <th className="px-4 py-3 text-center">Cetak Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {salesHistory.map((s) => {
                          const wComp = parseFloat(s.computer_weight || 0);
                          const wAkt = parseFloat(s.actual_weight || 0);
                          const pComp = parseFloat(s.computer_price || 0);
                          const pAkt = parseFloat(s.actual_price || 0);

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-xs text-amber-600">#SALE-{s.id}</td>
                              <td className="px-4 py-3 text-xs">{formatDate(s.created_at)}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{s.gudang?.nama_gudang || '-'}</td>
                              <td className="px-4 py-3 text-right text-xs">
                                <div><span className="text-slate-400">Komp:</span> {wComp.toFixed(2)} kg</div>
                                <div className="font-bold text-slate-900"><span className="text-slate-400 font-normal">Akt:</span> {wAkt.toFixed(2)} kg</div>
                              </td>
                              <td className="px-4 py-3 text-right text-xs">
                                <div><span className="text-slate-400">Modal:</span> {formatIDR(pComp)}</div>
                                <div className="font-bold text-emerald-600"><span className="text-slate-400 font-normal">Jual:</span> {formatIDR(pAkt)}</div>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium">{s.created_by_user?.name || '-'}</td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenInvoice(s)}
                                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 mx-auto shadow-sm"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Invoice
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}
