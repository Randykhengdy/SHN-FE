import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, FileText, Eye, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data untuk Sales Order
const mockSalesOrders = [
  {
    id: 1,
    noSo: "SO-20250812-001",
    pelanggan: "PT Test Customer",
    tanggalSo: "23/8/2025",
    asalGudang: "Gudang Utama - Jakarta Pusat",
    jumlahItem: 2,
    totalHarga: 885000,
    status: "Draft"
  }
];

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in-progress", label: "In Progress" },
  { value: "partial-wo", label: "Partial WO" },
  { value: "completed", label: "Completed" }
];

const periodOptions = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "quarter", label: "Kuartal Ini" },
  { value: "year", label: "Tahun Ini" }
];

export default function SalesOrderPage() {
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState(mockSalesOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  // Calculate summary statistics
  const totalSO = salesOrders.length;
  const totalNilai = salesOrders.reduce((sum, so) => sum + so.totalHarga, 0);
  const rataRataPerSO = totalSO > 0 ? totalNilai / totalSO : 0;

  // Calculate status breakdown
  const statusBreakdown = {
    Draft: salesOrders.filter(so => so.status === "Draft").length,
    Confirmed: salesOrders.filter(so => so.status === "Confirmed").length,
    "In Progress": salesOrders.filter(so => so.status === "In Progress").length,
    "Partial WO": salesOrders.filter(so => so.status === "Partial WO").length,
    Completed: salesOrders.filter(so => so.status === "Completed").length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft": return "bg-orange-100 text-orange-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-yellow-100 text-yellow-800";
      case "Partial WO": return "bg-purple-100 text-purple-800";
      case "Completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleClearFilter = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPeriodFilter("all");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting sales orders...");
  };

  const handleTestConvert = () => {
    // TODO: Implement test convert functionality
    console.log("Testing convert...");
  };

  const handleView = (id) => {
    // TODO: Implement view functionality
    console.log("Viewing sales order:", id);
  };

  const handleAddNew = () => {
    navigate("/sales-order/add");
  };

  const handleConvertToWO = (id) => {
    // TODO: Implement convert to WO functionality
    console.log("Converting to WO:", id);
  };

  const handleDelete = (id) => {
    // TODO: Implement delete functionality
    console.log("Deleting sales order:", id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-gray-500">TRANSAKSI</span> Sales Order (SO)
          </h1>
          <div className="mt-2 bg-gray-100 rounded-lg px-4 py-2">
            <h2 className="text-lg font-semibold text-gray-800">Daftar Sales Order</h2>
          </div>
        </div>
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Sales Order
        </Button>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari SO:
              </label>
              <Input
                placeholder="Cari berdasarkan No SO, nama pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status:
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periode:
              </label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
              <Button variant="outline" onClick={handleClearFilter}>
                Clear Filter
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleTestConvert}>
                <FileText className="w-4 h-4 mr-2" />
                Test Convert
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Order Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No SO</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal SO</TableHead>
                <TableHead>Asal Gudang</TableHead>
                <TableHead>Jumlah Item</TableHead>
                <TableHead>Total Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesOrders.map((so) => (
                <TableRow key={so.id}>
                  <TableCell className="font-medium">{so.noSo}</TableCell>
                  <TableCell>{so.pelanggan}</TableCell>
                  <TableCell>{so.tanggalSo}</TableCell>
                  <TableCell>{so.asalGudang}</TableCell>
                  <TableCell className="text-center">{so.jumlahItem}</TableCell>
                  <TableCell>{formatCurrency(so.totalHarga)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(so.status)}>
                      {so.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(so.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleConvertToWO(so.id)}>
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Convert to WO
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(so.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary and Status Breakdown */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total SO:</span>
                  <span className="font-semibold">{totalSO}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Nilai:</span>
                  <span className="font-semibold">{formatCurrency(totalNilai)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rata-rata per SO:</span>
                  <span className="font-semibold">{formatCurrency(rataRataPerSO)}</span>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Breakdown Status</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <Badge key={status} className={getStatusColor(status)}>
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
