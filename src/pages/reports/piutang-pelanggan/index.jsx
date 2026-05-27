import React, { useState, useCallback, useEffect } from "react";
import {
  RefreshCw,
  Download,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageLayout from "@/components/PageLayout";
import { useAlert } from "@/hooks/useAlert";
import { reportSalesService } from "@/services/reportSalesService";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
};

const formatRupiah = (val) => {
  const num = parseFloat(val ?? 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
};

const STATUS_CONFIG = {
  paid: {
    label: "Lunas",
    className: "bg-green-100 text-green-800 border border-green-200",
    icon: CheckCircle,
  },
  partial: {
    label: "Sebagian",
    className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    icon: Clock,
  },
  pending: {
    label: "Belum Bayar",
    className: "bg-red-100 text-red-800 border border-red-200",
    icon: AlertCircle,
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Sub-table: invoice rows per pelanggan ───────────────────────────────────

function InvoiceTable({ invoices }) {
  if (!invoices || invoices.length === 0) {
    return (
      <tr>
        <td colSpan={6} className="text-center py-3 text-sm text-gray-400 italic">
          Tidak ada invoice
        </td>
      </tr>
    );
  }

  return invoices.map((inv, i) => (
    <tr
      key={inv.no_invoice ?? i}
      className="border-t border-gray-100 hover:bg-indigo-50/40 transition-colors"
    >
      <td className="py-2 pl-8 pr-3 text-sm font-mono text-indigo-700 whitespace-nowrap">
        {inv.no_invoice ?? "-"}
      </td>
      <td className="py-2 px-3 text-sm text-gray-600 whitespace-nowrap">
        {formatDate(inv.tanggal_invoice)}
      </td>
      <td className="py-2 px-3 text-sm text-right font-medium text-gray-800 whitespace-nowrap">
        {formatRupiah(inv.harga_invoice)}
      </td>
      <td className="py-2 px-3 text-sm text-right text-gray-600 whitespace-nowrap">
        {formatRupiah(inv.uang_muka)}
      </td>
      <td className="py-2 px-3 text-sm text-right text-gray-600 whitespace-nowrap">
        {formatRupiah(inv.total_pembayaran)}
      </td>
      <td
        className={`py-2 px-3 text-sm text-right font-semibold whitespace-nowrap ${
          parseFloat(inv.sisa_piutang ?? 0) === 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {formatRupiah(inv.sisa_piutang)}
      </td>
      <td className="py-2 px-3 text-center">
        <StatusBadge status={inv.status_bayar} />
      </td>
    </tr>
  ));
}

// ─── Pelanggan row (collapsible) ─────────────────────────────────────────────

function PelangganRow({ pelanggan, invoices, index }) {
  const [open, setOpen] = useState(true);

  const totalPiutang = invoices.reduce((s, i) => s + parseFloat(i.sisa_piutang ?? 0), 0);
  const totalInvoice = invoices.reduce((s, i) => s + parseFloat(i.harga_invoice ?? 0), 0);
  const totalBayar   = invoices.reduce((s, i) => s + parseFloat(i.total_pembayaran ?? 0), 0);
  const lunas        = invoices.filter((i) => i.status_bayar === "paid").length;
  const belumLunas   = invoices.length - lunas;

  return (
    <>
      {/* Header row pelanggan */}
      <tr
        className={`cursor-pointer select-none transition-colors ${
          index % 2 === 0 ? "bg-slate-50" : "bg-white"
        } hover:bg-indigo-50`}
        onClick={() => setOpen((o) => !o)}
      >
        <td className="py-3 pl-4 pr-2 w-6">
          {open ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </td>
        <td className="py-3 px-3 font-semibold text-gray-800" colSpan={2}>
          {pelanggan}
        </td>
        <td className="py-3 px-3 text-sm text-gray-500 text-center">
          {invoices.length} invoice
          <span className="ml-2 text-green-600 text-xs">({lunas} lunas)</span>
          {belumLunas > 0 && (
            <span className="ml-1 text-red-500 text-xs">({belumLunas} blm lunas)</span>
          )}
        </td>
        <td className="py-3 px-3 text-sm text-right text-gray-600 whitespace-nowrap">
          {formatRupiah(totalInvoice)}
        </td>
        <td className="py-3 px-3 text-sm text-right text-gray-600 whitespace-nowrap">
          {formatRupiah(totalBayar)}
        </td>
        <td
          className={`py-3 px-3 text-sm text-right font-bold whitespace-nowrap ${
            totalPiutang === 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatRupiah(totalPiutang)}
        </td>
        <td />
      </tr>

      {/* Detail invoices */}
      {open && (
        <tr>
          <td colSpan={8} className="p-0 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-50 border-t border-b border-indigo-100">
                  <th className="py-2 pl-8 pr-3 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    No. Invoice
                  </th>
                  <th className="py-2 px-3 text-left text-xs font-semibold text-indigo-600 uppercase tracking-wider whitespace-nowrap">
                    Tgl. Invoice
                  </th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-indigo-600 uppercase tracking-wider whitespace-nowrap">
                    Harga Invoice
                  </th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-indigo-600 uppercase tracking-wider whitespace-nowrap">
                    Uang Muka
                  </th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-indigo-600 uppercase tracking-wider whitespace-nowrap">
                    Total Bayar
                  </th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-indigo-600 uppercase tracking-wider whitespace-nowrap">
                    Sisa Piutang
                  </th>
                  <th className="py-2 px-3 text-center text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <InvoiceTable invoices={invoices} />
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ReportPiutangPelangganPage() {
  const { showAlert, AlertComponent } = useAlert();

  const [data, setData]       = useState([]);   // array: [{pelanggan, invoices}]
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [search, setSearch]       = useState("");

  // ── Summary kalkulasi ───────────────────────────────────────────────────
  const summary = data.reduce(
    (acc, grup) => {
      grup.invoices.forEach((inv) => {
        acc.totalInvoice   += parseFloat(inv.harga_invoice ?? 0);
        acc.totalBayar     += parseFloat(inv.total_pembayaran ?? 0);
        acc.totalPiutang   += parseFloat(inv.sisa_piutang ?? 0);
        acc.countInvoice   += 1;
        if (inv.status_bayar === "paid")    acc.countLunas   += 1;
        if (inv.status_bayar === "pending") acc.countPending += 1;
        if (inv.status_bayar === "partial") acc.countPartial += 1;
      });
      acc.countPelanggan += 1;
      return acc;
    },
    {
      totalInvoice: 0, totalBayar: 0, totalPiutang: 0,
      countInvoice: 0, countPelanggan: 0,
      countLunas: 0, countPending: 0, countPartial: 0,
    }
  );

  // ── Filter by search ────────────────────────────────────────────────────
  const filteredData = search.trim()
    ? data.filter((g) => g.pelanggan?.toLowerCase().includes(search.toLowerCase()))
    : data;

  // ── Load data ───────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate)   params.end_date   = endDate;

      const res = await reportSalesService.getPiutangPelanggan(params);
      if (res?.success) {
        setData(res.data ?? []);
      } else {
        showAlert("Error", res?.message || "Gagal mengambil data piutang", "error");
      }
    } catch (err) {
      showAlert("Error", err?.message || "Gagal mengambil data piutang", "error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setSearch("");
  };

  return (
    <PageLayout title="Report Piutang Pelanggan" category="REPORT › SALES">
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Laporan Piutang Pelanggan</h2>
          <p className="text-xs text-gray-500">Invoice berdasarkan status pembayaran</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {}} // TODO: export
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            onClick={loadData}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Pelanggan",  value: summary.countPelanggan, color: "bg-blue-50 border-blue-200",   text: "text-blue-700",   icon: Users },
          { label: "Total Invoice",    value: summary.countInvoice,   color: "bg-slate-50 border-slate-200", text: "text-slate-700",  icon: FileText },
          { label: "Total Nilai",      value: formatRupiah(summary.totalInvoice), color: "bg-gray-50 border-gray-200", text: "text-gray-800", icon: null, isRupiah: true },
          { label: "Total Terbayar",   value: formatRupiah(summary.totalBayar),   color: "bg-green-50 border-green-200", text: "text-green-700", icon: null, isRupiah: true },
          { label: "Sisa Piutang",     value: formatRupiah(summary.totalPiutang), color: "bg-red-50 border-red-200",   text: "text-red-700",  icon: null, isRupiah: true },
          { label: "Lunas / Blm Lunas",value: `${summary.countLunas} / ${summary.countPending + summary.countPartial}`, color: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: null },
        ].map((card, i) => (
          <Card key={i} className={`border ${card.color} shadow-sm`}>
            <CardContent className="p-3">
              <p className="text-xs font-medium text-gray-500 mb-1 truncate">{card.label}</p>
              <p className={`text-base font-bold ${card.text} leading-tight`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter ─────────────────────────────────────────────────── */}
      <Card className="mb-5 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Cari Pelanggan</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Nama pelanggan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button variant="outline" onClick={handleClear} className="flex items-center gap-1">
              <X className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
              <span className="text-gray-500">Memuat data...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">Tidak ada data piutang</p>
              {(startDate || endDate || search) && (
                <button
                  onClick={handleClear}
                  className="mt-2 text-xs text-indigo-600 hover:underline"
                >
                  Reset filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* kolom header grouping */}
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="py-3 pl-4 w-6" />
                    <th className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wider" colSpan={2}>
                      Pelanggan
                    </th>
                    <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                      Jumlah Invoice
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                      Total Nilai
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                      Total Bayar
                    </th>
                    <th className="py-3 px-3 text-right text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                      Sisa Piutang
                    </th>
                    <th className="py-3 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((grup, i) => (
                    <PelangganRow
                      key={grup.pelanggan ?? i}
                      pelanggan={grup.pelanggan}
                      invoices={grup.invoices ?? []}
                      index={i}
                    />
                  ))}
                </tbody>

                {/* Footer total */}
                <tfoot>
                  <tr className="bg-indigo-50 border-t-2 border-indigo-200 font-bold">
                    <td />
                    <td colSpan={2} className="py-3 px-3 text-sm text-indigo-800">
                      TOTAL ({filteredData.length} pelanggan)
                    </td>
                    <td className="py-3 px-3 text-center text-sm text-indigo-800">
                      {summary.countInvoice} invoice
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-indigo-800 whitespace-nowrap">
                      {formatRupiah(summary.totalInvoice)}
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-green-700 whitespace-nowrap">
                      {formatRupiah(summary.totalBayar)}
                    </td>
                    <td className={`py-3 px-3 text-right text-sm whitespace-nowrap ${summary.totalPiutang > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatRupiah(summary.totalPiutang)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertComponent />
    </PageLayout>
  );
}
