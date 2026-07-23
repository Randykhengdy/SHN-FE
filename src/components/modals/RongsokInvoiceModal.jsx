import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, FileText, Calculator, Building2 } from "lucide-react";
import { LOGO_BASE64 } from "@/lib/logoConstants";

export default function RongsokInvoiceModal({ open, onClose, sale }) {
  const [taxType, setTaxType] = useState("tanpa_ppn"); // 'tanpa_ppn', 'dengan_ppn', 'include_ppn'
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

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
    const invNo = `INV-RONGSOK/${sale.id}/${new Date(sale.created_at || Date.now()).getFullYear()}`;
    const dateStr = new Date(sale.created_at || Date.now()).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    const pricePerKg = actualWeight > 0 ? dpp / actualWeight : 0;

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice Penjualan Rongsok - ${invNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; border-b: 2px solid #333; padding-bottom: 10px; }
          .logo-container { display: flex; align-items: center; gap: 15px; }
          .logo { width: 70px; height: auto; }
          .company-title { font-size: 20px; font-weight: bold; }
          .doc-title { font-size: 18px; font-weight: bold; text-align: right; color: #b45309; }
          .info-table { width: 100%; margin-bottom: 20px; font-size: 13px; }
          .info-table td { padding: 4px 8px; vertical-align: top; }
          table.data { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          table.data th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          table.data td { border: 1px solid #cbd5e1; padding: 6px 8px; }
          .summary-table { width: 40%; margin-left: auto; margin-top: 15px; font-size: 13px; border-collapse: collapse; }
          .summary-table td { padding: 6px; }
          .summary-table td.label { font-weight: bold; text-align: right; }
          .summary-table td.val { text-align: right; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
          .sig-box { width: 200px; }
          .sig-space { height: 60px; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img src="${LOGO_BASE64}" alt="PT. SHN Logo" class="logo" />
            <div>
              <div class="company-title">PT. SURYA HARSA NAGARA</div>
              <div style="font-size: 11px; color: #64748b;">Perdagangan & Distribusi Besi Plat / Metal</div>
            </div>
          </div>
          <div>
            <div class="doc-title">INVOICE RONGSOK</div>
            <div style="font-size: 12px; font-weight: bold; text-align: right;">${invNo}</div>
          </div>
        </div>

        <table class="info-table">
          <tr>
            <td style="width: 50%;">
              <strong>Kepada (Pembeli):</strong><br/>
              ${customerName || "Pembeli Rongsok"}<br/>
              ${customerAddress || "-"}<br/>
              ${customerPhone || ""}
            </td>
            <td style="width: 50%; text-align: right;">
              <strong>Tanggal:</strong> ${dateStr}<br/>
              <strong>Gudang Asal:</strong> ${sale.gudang?.nama_gudang || '-'}<br/>
              <strong>Skema Pajak:</strong> ${taxType === 'tanpa_ppn' ? 'Tanpa PPN' : taxType === 'dengan_ppn' ? 'Dengan PPN (11%)' : 'Include PPN (11%)'}
            </td>
          </tr>
        </table>

        <table class="data">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th>Deskripsi Item</th>
              <th style="width: 120px; text-align: right;">Total Berat</th>
              <th style="width: 140px; text-align: right;">Harga / kg</th>
              <th style="width: 160px; text-align: right;">Harga Total (DPP)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: center;">1</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold;">ALUMINIUM RONGSOK</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">${actualWeight.toFixed(2)} kg</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">${formatIDR(pricePerKg)} / kg</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-weight: bold;">${formatIDR(dpp)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 15px; font-size: 12px; background: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
          <strong>Catatan Timbangan:</strong> Berat Komputer: <b>${computerWeight.toFixed(2)} kg</b> | Timbangan Aktual: <b>${actualWeight.toFixed(2)} kg</b> (Selisih: <b>${(actualWeight - computerWeight).toFixed(2)} kg</b>)
        </div>

        <table class="summary-table">
          <tr>
            <td class="label">DPP:</td>
            <td class="val">${formatIDR(dpp)}</td>
          </tr>
          ${taxType !== 'tanpa_ppn' ? `
          <tr>
            <td class="label">PPN 11%:</td>
            <td class="val">${formatIDR(ppn)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #333; font-size: 14px;">
            <td class="label">Total Invoice:</td>
            <td class="val" style="font-weight: bold; color: #b45309;">${formatIDR(totalInvoice)}</td>
          </tr>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <div>Penerima / Pembeli</div>
            <div class="sig-space"></div>
            <div>( ${customerName || '....................'} )</div>
          </div>
          <div class="sig-box">
            <div>Hormat Kami</div>
            <div class="sig-space"></div>
            <div>( PT. SURYA HARSA NAGARA )</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

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
