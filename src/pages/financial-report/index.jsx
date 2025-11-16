import React, { useState, useEffect, useCallback } from "react";
import { Search, Download, RefreshCw, FileText, ShoppingCart, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { pembayaranService } from "@/services/pembayaranService";
import { useAlert } from "@/hooks/useAlert";
import PageLayout from "@/components/PageLayout";

// Format tanggal helper: tanggal/bulan/tahun
const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Format tanggal dengan waktu: tanggal/bulan/tahun, jam:menit:detik
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

export default function FinancialReportPage() {
  const { showAlert, AlertComponent } = useAlert();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [pagination, setPagination] = useState(null);
  
  // Summary state
  const [summary, setSummary] = useState({
    total_invoice_payment: 0,
    total_po_payment: 0,
    total_payment: 0,
    cash_growth: 0,
    total_invoice_count: 0,
    total_po_count: 0,
    total_count: 0
  });

  // Load financial report from API
  const loadFinancialReport = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        per_page: itemsPerPage
      };
      
      if (dateFrom) {
        params.date_from = dateFrom;
      }
      if (dateTo) {
        params.date_to = dateTo;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const result = await pembayaranService.getFinancialReport(params);
      
      if (result.success) {
        setReports(result.data || []);
        setSummary(result.summary || {
          total_invoice_payment: 0,
          total_po_payment: 0,
          total_payment: 0,
          cash_growth: 0,
          total_invoice_count: 0,
          total_po_count: 0,
          total_count: 0
        });
        setTotalItems(result.pagination?.total || 0);
        setPagination(result.pagination);
      } else {
        showAlert("Error", result.message || "Gagal memuat financial report", "error");
      }
    } catch (error) {
      console.error('Error loading financial report:', error);
      showAlert("Error", error.message || "Gagal memuat financial report", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, dateFrom, dateTo, searchTerm]);

  // Load report when dependencies change
  useEffect(() => {
    loadFinancialReport();
  }, [loadFinancialReport]);

  const handleClearFilter = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting financial report...");
  };

  // Pagination calculations
  const totalPages = pagination?.last_page || Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getTypeBadge = (type) => {
    if (type === 'invoice') {
      return <Badge className="bg-blue-100 text-blue-800">Invoice</Badge>;
    }
    return <Badge className="bg-orange-100 text-orange-800">Purchase Order</Badge>;
  };

  return (
    <PageLayout title="Financial Report" category="FINANCE">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Financial Report</h2>
        </div>
        <Button onClick={loadFinancialReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Invoice Payment</p>
                <p className="text-2xl font-semibold text-blue-900">
                  Rp {summary.total_invoice_payment.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-blue-600 mt-1">{summary.total_invoice_count} transaksi</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total PO Payment</p>
                <p className="text-2xl font-semibold text-orange-900">
                  Rp {summary.total_po_payment.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-orange-600 mt-1">{summary.total_po_count} transaksi</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Payment</p>
                <p className="text-2xl font-semibold text-purple-900">
                  Rp {summary.total_payment.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-purple-600 mt-1">{summary.total_count} transaksi</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${summary.cash_growth >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cash Growth</p>
                <p className={`text-2xl font-semibold ${summary.cash_growth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {summary.cash_growth >= 0 ? '+' : ''}Rp {summary.cash_growth.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-600 mt-1">Net cash inflow</p>
              </div>
              {summary.cash_growth >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari:
              </label>
              <Input
                placeholder="No Invoice, Customer, No PO, Supplier, No Receipt..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari Tanggal:
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sampai Tanggal:
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearFilter} className="w-full">
                Clear Filter
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Report Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Tanggal</TableHead>
                  <TableHead className="font-semibold">Tipe</TableHead>
                  <TableHead className="font-semibold">No. Invoice/PO</TableHead>
                  <TableHead className="font-semibold">Customer/Supplier</TableHead>
                  <TableHead className="font-semibold">Jumlah Payment</TableHead>
                  <TableHead className="font-semibold">No. Receipt</TableHead>
                  <TableHead className="font-semibold">Catatan</TableHead>
                  <TableHead className="font-semibold">Waktu Input</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Tidak ada data Financial Report
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-gray-50">
                      <TableCell>{formatDate(report.tanggal_payment)}</TableCell>
                      <TableCell>{getTypeBadge(report.type)}</TableCell>
                      <TableCell className="font-medium">
                        {report.type === 'invoice' 
                          ? report.invoice?.nomor_invoice || '-'
                          : report.purchase_order?.nomor_po || '-'}
                      </TableCell>
                      <TableCell>
                        {report.type === 'invoice'
                          ? report.customer?.nama_pelanggan || '-'
                          : report.supplier?.nama_supplier || '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={report.type === 'invoice' ? 'text-green-600' : 'text-red-600'}>
                          {report.type === 'invoice' ? '+' : '-'}Rp {parseFloat(report.jumlah_payment || 0).toLocaleString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.nomor_receipt ? (
                          <Badge className="bg-green-100 text-green-800">{report.nomor_receipt}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={report.catatan || '-'}>
                        {report.catatan || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(report.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {reports.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Menampilkan {startItem}-{endItem} dari {totalItems} data
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                  <option value={100}>100 per halaman</option>
                  <option value={200}>200 per halaman</option>
                </select>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Alert Modal Component */}
      <AlertComponent />
    </PageLayout>
  );
}

