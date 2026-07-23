import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, FileText, Calculator, Building2 } from "lucide-react";
import { generateRongsokInvoicePrintContent } from "@/lib/printUtils";

export default function RongsokInvoiceModal({ open, onClose, sale }) {
  const [taxType, setTaxType] = useState("tanpa_ppn"); // 'tanpa_ppn', 'dengan_ppn', 'include_ppn'
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showTotalBerat, setShowTotalBerat] = useState(false);
  const [showHargaUnit, setShowHargaUnit] = useState(false);

  if (!sale) return null;

  const actualPrice = parseFloat(sale.actual_price) || 0;
  const actualWeight = parseFloat(sale.actual_weight) || 0;
  const computerWeight = parseFloat(sale.computer_weight) || 0;
  const computerPrice = parseFloat(sale.computer_price) || 0;

  // Tax calculations
  let dpp = 0;
  let ppn = 0;
  let totalInvoice = 0;

  if (taxType === "tanpa_ppn") {
    dpp = actualPrice;
    ppn = 0;
    totalInvoice = actualPrice;
  } else if (taxType === "dengan_ppn") {
    dpp = actualPrice;
    ppn = actualPrice * 0.11;
    totalInvoice = dpp + ppn;
  } else if (taxType === "include_ppn") {
    totalInvoice = actualPrice;
    dpp = actualPrice / 1.11;
    ppn = totalInvoice - dpp;
  }

  const formatIDR = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePrint = () => {
    const printHtml = generateRongsokInvoicePrintContent(sale, {
      taxType,
      customerName,
      customerAddress,
      customerPhone,
      showTotalBerat,
      showHargaUnit,
    });

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white border border-slate-200 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Generate Invoice Penjualan Rongsok
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          
          {/* Tax Options */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-500" />
              Pilihan Skema Pajak (PPN)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTaxType("tanpa_ppn")}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  taxType === "tanpa_ppn"
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Tanpa PPN
              </button>
              <button
                type="button"
                onClick={() => setTaxType("dengan_ppn")}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  taxType === "dengan_ppn"
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Dengan PPN (+11%)
              </button>
              <button
                type="button"
                onClick={() => setTaxType("include_ppn")}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  taxType === "include_ppn"
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Include PPN (11%)
              </button>
            </div>
          </div>

          {/* Customer Inputs */}
          <div className="grid grid-cols-1 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-600">Nama Pembeli (Opsional)</label>
              <Input
                placeholder="Masukkan nama pembeli..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="text-xs mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Alamat (Opsional)</label>
                <Input
                  placeholder="Alamat pembeli..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">No. HP (Opsional)</label>
                <Input
                  placeholder="No. Telp..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Optional Columns Toggles */}
          <div className="flex flex-col gap-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200/60">
            <label className="text-xs font-bold text-slate-700">Tampilkan Kolom di Printout Invoice (Default: Hide)</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTotalBerat}
                  onChange={(e) => setShowTotalBerat(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                Tampilkan Kolom Total Berat
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHargaUnit}
                  onChange={(e) => setShowHargaUnit(e.target.checked)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                Tampilkan Kolom Harga / kg
              </label>
            </div>
          </div>

          {/* Live Tax Breakdown Card */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs space-y-2">
            <div className="font-bold text-slate-700 border-b border-slate-200 pb-1.5 flex justify-between items-center">
              <span>Perhitungan Invoice & DPP</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded uppercase font-extrabold">
                {taxType.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Harga Penjualan Aktual (Awal):</span>
              <span className="font-semibold text-slate-800">{formatIDR(actualPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Dasar Pengenaan Pajak (DPP):</span>
              <span className="font-bold text-slate-900">{formatIDR(dpp)}</span>
            </div>
            {taxType !== "tanpa_ppn" && (
              <div className="flex justify-between text-slate-600">
                <span>PPN 11%:</span>
                <span className="font-bold text-amber-600">{formatIDR(ppn)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Invoice Tagihan:</span>
              <span className="text-amber-600 font-mono">{formatIDR(totalInvoice)}</span>
            </div>
          </div>

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs">
            Tutup
          </Button>
          <Button onClick={handlePrint} className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            Cetak / Preview Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
