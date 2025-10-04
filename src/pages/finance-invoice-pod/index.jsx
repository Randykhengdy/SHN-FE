import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, FileText, Eye, RefreshCw, Printer, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { financeInvoicePodService } from "@/services/financeInvoicePodService";
import { useAlert } from "@/hooks/useAlert";
import PageLayout from "@/components/PageLayout";
import { generatePodPrintContent, generateInvoicePrintContent, openPrintDialog } from "@/lib/printUtils";

const filterOptions = [
  { value: "all", label: "Semua Status" },
  { value: "not_generated", label: "Belum Generate" },
  { value: "generated", label: "Sudah Generate" }
];

const invoiceFilterOptions = [
  { value: "all", label: "Semua Invoice" },
  { value: "not_printed", label: "Belum Print Invoice" },
  { value: "printed", label: "Sudah Print Invoice" }
];

const podFilterOptions = [
  { value: "all", label: "Semua POD" },
  { value: "not_printed", label: "Belum Print POD" },
  { value: "printed", label: "Sudah Print POD" }
];

export default function FinanceInvoicePodPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratedFilter, setIsGeneratedFilter] = useState("all");
  const [isPrintedInvoiceFilter, setIsPrintedInvoiceFilter] = useState("all");
  const [isPrintedPodFilter, setIsPrintedPodFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // Load work orders from API
  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filter parameters
      const params = {};
      if (isGeneratedFilter !== "all") {
        params.is_generated = isGeneratedFilter === "generated";
      }
      if (isPrintedInvoiceFilter !== "all") {
        params.is_printed_invoice = isPrintedInvoiceFilter === "printed";
      }
      if (isPrintedPodFilter !== "all") {
        params.is_printed_pod = isPrintedPodFilter === "printed";
      }
      
      const result = await financeInvoicePodService.getEligibleForInvoicePod(params);
      
      // Transform API data to match our UI structure
      const transformedData = result.message.map(wo => ({
        id: wo.nomor_wo,
        nomorSo: wo.nomor_so,
        nomorWo: wo.nomor_wo,
        namaCustomer: wo.nama_customer,
        isGenerated: wo.is_generated,
        hasGeneratedInvoice: wo.has_generated_invoice,
        hasGeneratedPod: wo.has_generated_pod
      }));
      
      // Apply search filter
      let filteredData = transformedData;
      if (searchTerm) {
        filteredData = filteredData.filter(wo => 
          wo.nomorSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wo.nomorWo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wo.namaCustomer.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setWorkOrders(paginatedData);
      setTotalItems(filteredData.length);
    } catch (error) {
      console.error('Error loading work orders:', error);
      showAlert("Error", "Gagal memuat data Work Order", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, isGeneratedFilter, isPrintedInvoiceFilter, isPrintedPodFilter]);

  // Load work orders from API
  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // Handle generate invoice POD
  const handleGenerateInvoicePod = async (nomorWo) => {
    try {
      setActionLoading(prev => ({ ...prev, [nomorWo]: true }));
      const result = await financeInvoicePodService.generateInvoicePod(nomorWo);
      console.log('Generate result:', result);
      showAlert("Sukses", `Invoice POD berhasil di-generate!<br/>Invoice: ${result.data.nomor_invoice}<br/>Surat Jalan: ${result.data.nomor_pod}`, "success", () => {
        loadWorkOrders();
      });
    } catch (error) {
      console.error('Error generating invoice POD:', error);
      showAlert("Error", "Gagal generate Invoice POD", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [nomorWo]: false }));
    }
  };

  // Handle print invoice
  const handlePrintInvoice = async (nomorWo) => {
    try {
      setActionLoading(prev => ({ ...prev, [`invoice_${nomorWo}`]: true }));
      
      // Get invoice data for printing
      const result = await financeInvoicePodService.viewInvoice(nomorWo);
      console.log('Invoice data:', result);
      
      // Create print content from invoice data
      const printContent = generateInvoicePrintContent(result.data);
      
      // Open print dialog
      openPrintDialog(printContent);
      
      showAlert("Sukses", "Invoice berhasil di-print!", "success");
    } catch (error) {
      console.error('Error printing invoice:', error);
      showAlert("Error", "Gagal print Invoice", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [`invoice_${nomorWo}`]: false }));
    }
  };

  // Handle print POD
  const handlePrintPod = async (nomorWo) => {
    try {
      setActionLoading(prev => ({ ...prev, [`pod_${nomorWo}`]: true }));
      const result = await financeInvoicePodService.printPod(nomorWo);
      console.log('POD data:', result);
      
      // Create print content from POD data
      const printContent = generatePodPrintContent(result.data);
      
      // Open print dialog
      openPrintDialog(printContent);
      
    } catch (error) {
      console.error('Error printing POD:', error);
      showAlert("Error", "Gagal print POD", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [`pod_${nomorWo}`]: false }));
    }
  };


  const handleClearFilter = () => {
    setSearchTerm("");
    setIsGeneratedFilter("all");
    setIsPrintedInvoiceFilter("all");
    setIsPrintedPodFilter("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting work orders...");
  };

  // Calculate summary statistics
  const totalWO = totalItems;
  const generatedCount = workOrders.filter(wo => wo.isGenerated).length;
  const notGeneratedCount = workOrders.filter(wo => !wo.isGenerated).length;
  const printedInvoiceCount = workOrders.filter(wo => wo.hasGeneratedInvoice === 1).length;
  const printedPodCount = workOrders.filter(wo => wo.hasGeneratedPod === 1).length;

  const getStatusBadge = (isGenerated, hasGeneratedInvoice, hasGeneratedPod) => {
    if (!isGenerated) {
      return <Badge className="bg-orange-100 text-orange-800">Not Generated</Badge>;
    }
    if (hasGeneratedInvoice === 1 && hasGeneratedPod === 1) {
      return <Badge className="bg-green-100 text-green-800">All Document Printed</Badge>;
    }
    if (hasGeneratedInvoice === 1) {
      return <Badge className="bg-blue-100 text-blue-800">Invoice Printed</Badge>;
    }
    if (hasGeneratedPod === 1) {
      return <Badge className="bg-purple-100 text-purple-800">Surat Jalan Printed</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Generated</Badge>;
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <PageLayout title="Surat Jalan & Invoicing" category="FINANCE">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Surat Jalan & Invoicing</h2>
        </div>
        <Button onClick={loadWorkOrders} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
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
                Cari WO:
              </label>
              <Input
                placeholder="Cari berdasarkan No SO, No WO, nama customer..."
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
                Status Generate:
              </label>
              <Select value={isGeneratedFilter} onValueChange={(value) => {
                setIsGeneratedFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Invoice:
              </label>
              <Select value={isPrintedInvoiceFilter} onValueChange={(value) => {
                setIsPrintedInvoiceFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {invoiceFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status POD:
              </label>
              <Select value={isPrintedPodFilter} onValueChange={(value) => {
                setIsPrintedPodFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {podFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleClearFilter}>
              Clear Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Order Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">No SO</TableHead>
                  <TableHead className="font-semibold">No WO</TableHead>
                  <TableHead className="font-semibold">Nama Customer</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada data Work Order
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((wo) => (
                    <TableRow key={wo.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{wo.nomorSo}</TableCell>
                      <TableCell>{wo.nomorWo}</TableCell>
                      <TableCell>{wo.namaCustomer}</TableCell>
                      <TableCell>
                        {getStatusBadge(wo.isGenerated, wo.hasGeneratedInvoice, wo.hasGeneratedPod)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          {!wo.isGenerated ? (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700" 
                              onClick={() => handleGenerateInvoicePod(wo.nomorWo)}
                              disabled={actionLoading[wo.nomorWo]}
                            >
                              {actionLoading[wo.nomorWo] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <FileText className="w-4 h-4 mr-1" />
                              )}
                              <span className="hidden sm:inline">Generate</span>
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handlePrintInvoice(wo.nomorWo)}
                                disabled={actionLoading[`invoice_${wo.nomorWo}`]}
                                className={wo.hasGeneratedInvoice === 1 ? "bg-green-50 text-green-700 border-green-300" : ""}
                              >
                                {actionLoading[`invoice_${wo.nomorWo}`] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                ) : (
                                  <Printer className="w-4 h-4 mr-1" />
                                )}
                                <span className="hidden sm:inline">Print Invoice</span>
                              </Button>
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 onClick={() => handlePrintPod(wo.nomorWo)}
                                 disabled={actionLoading[`pod_${wo.nomorWo}`]}
                                 className={wo.hasGeneratedPod === 1 ? "bg-blue-50 text-blue-700 border-blue-300" : ""}
                               >
                                 {actionLoading[`pod_${wo.nomorWo}`] ? (
                                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                 ) : (
                                   <FileText className="w-4 h-4 mr-1" />
                                 )}
                                 <span className="hidden sm:inline">Print Surat Jalan</span>
                               </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {workOrders.length > 0 && (
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
                  <option value={5}>5 per halaman</option>
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
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

      {/* Summary Statistics */}
      <Card className="bg-white border-green-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total WO Selesai</p>
                  <p className="text-2xl font-semibold text-blue-900">{totalWO}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Sudah Generate</p>
                  <p className="text-2xl font-semibold text-green-900">{generatedCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-600">Belum Generate</p>
                  <p className="text-2xl font-semibold text-orange-900">{notGeneratedCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Printer className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-600">Sudah Print</p>
                  <p className="text-2xl font-semibold text-purple-900">{printedInvoiceCount + printedPodCount}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Alert Modal Component */}
      <AlertComponent />
    </PageLayout>
  );
}
