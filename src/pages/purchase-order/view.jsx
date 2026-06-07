import React, { useState, useEffect } from "react";
import { ArrowLeft, Eye, FileText, Download } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import { useAlert } from "@/hooks/useAlert";
import PageLayout from "@/components/PageLayout";
import { generatePurchaseOrderPrintContent, openPrintDialog } from "@/lib/printUtils";

export default function ViewPurchaseOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();

  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchaseOrder();
  }, [id]);

  const loadPurchaseOrder = async () => {
    try {
      setLoading(true);
      const result = await purchaseOrderService.getById(id);
      setPurchaseOrder(result.data);
    } catch (error) {
      console.error('Error loading purchase order:', error);
      showAlert("Error", "Gagal memuat data Purchase Order", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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


  const handleBackToList = () => {
    navigate('/purchase-order');
  };

  const getDimensiString = (item) => {
    let dimensiParts = [];
    
    const addDim = (val) => {
      if (val === null || val === undefined || val === '') return;
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed > 0) {
        dimensiParts.push(parsed.toString());
      }
    };

    addDim(item.diameter_luar);
    addDim(item.diameter_dalam);
    addDim(item.diameter);
    addDim(item.sisi1);
    addDim(item.sisi2);
    addDim(item.tebal);
    addDim(item.lebar);
    addDim(item.panjang);

    return dimensiParts.length > 0 ? dimensiParts.join(' x ') : '-';
  };

  const handlePrint = () => {
    if (!purchaseOrder) return;

    try {
      const items = (purchaseOrder.purchase_order_items || []).map(item => ({
        bentuk_barang: item.bentuk_barang?.nama_bentuk || "",
        jenis_barang: item.jenis_barang?.nama_jenis || "",
        grade_barang: item.grade_barang?.nama || "",
        dimensi: getDimensiString(item),
        qty: item.qty || 0,
        harga_display: formatCurrency(parseFloat(item.harga || 0)),
        diskon_display: `${item.diskon || 0}%`,
        total_display: formatCurrency((item.qty || 0) * (parseFloat(item.harga || 0)))
      }));

      const sup = purchaseOrder.supplier || {};

      const data = {
        nomor_po: purchaseOrder.nomor_po,
        tanggal_po: purchaseOrder.tanggal_po,
        status: purchaseOrder.status,
        supplier_name: sup.nama_supplier || sup.nama || "",
        supplier_phone: sup.telepon || "",
        supplier_address: sup.alamat || "",
        items
      };

      const html = generatePurchaseOrderPrintContent(data);
      openPrintDialog(html);
    } catch (e) {
      console.error("Error printing Purchase Order:", e);
      showAlert("Error", "Gagal mencetak Purchase Order", "error");
    }
  };

  if (loading) {
    return (
      <PageLayout title="Purchase Order (PO)" category="TRANSAKSI">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </PageLayout>
    );
  }

  if (!purchaseOrder) {
    return (
      <PageLayout title="Purchase Order (PO)" category="TRANSAKSI">
        <div className="text-center py-8">
          <p className="text-gray-500">Purchase Order tidak ditemukan</p>
          <Button onClick={handleBackToList} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke List
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Purchase Order (PO)" category="TRANSAKSI">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Detail Purchase Order - {purchaseOrder.nomor_po}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBackToList} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke List
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <FileText className="w-4 h-4 mr-2" />
            Print PO
          </Button>
        </div>
      </div>

      {/* Purchase Order Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Informasi Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Nomor PO</Label>
              <div className="text-lg font-semibold">{purchaseOrder.nomor_po}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Supplier</Label>
              <div className="text-lg">{purchaseOrder.supplier?.nama_supplier || 'N/A'}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <div>
                <Badge className={getStatusColor(purchaseOrder.status)}>
                  {purchaseOrder.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Tanggal PO</Label>
              <div>{formatDate(purchaseOrder.tanggal_po)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Tanggal Penerimaan</Label>
              <div>{formatDate(purchaseOrder.tanggal_penerimaan)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Tanggal Jatuh Tempo</Label>
              <div>{formatDate(purchaseOrder.tanggal_jatuh_tempo)}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(purchaseOrder.total_amount)}
              </div>
            </div>
          </div>

          {purchaseOrder.catatan && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-gray-600">Catatan</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded border">
                {purchaseOrder.catatan}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Daftar Item</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Item Barang</TableHead>
                  <TableHead className="font-semibold">Qty</TableHead>
                  <TableHead className="font-semibold">Harga</TableHead>
                  <TableHead className="font-semibold">Dimensi</TableHead>
                  <TableHead className="font-semibold">Berat</TableHead>
                  <TableHead className="font-semibold">Subtotal</TableHead>
                  <TableHead className="font-semibold">Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrder.purchase_order_items?.length > 0 ? (
                  purchaseOrder.purchase_order_items.map((item, index) => {
                    // Calculate subtotal: qty * harga
                    const subtotal = item.qty * parseFloat(item.harga);

                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {/* Display item info using relation data from API */}
                          <div>
                            <div className="font-medium">
                              {item.bentuk_barang?.nama_bentuk || 'N/A'} {item.jenis_barang?.nama_jenis || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Grade: {item.grade_barang?.nama || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(parseFloat(item.harga))}
                        </TableCell>
                        <TableCell>
                          {getDimensiString(item)}
                        </TableCell>
                        <TableCell>
                          {/* Calculate weight if needed or show N/A */}
                          {item.berat || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold text-right text-green-600">
                          {formatCurrency(subtotal)}
                        </TableCell>
                        <TableCell>{item.catatan || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Tidak ada item dalam Purchase Order ini
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Component */}
      <AlertComponent />
    </PageLayout>
  );
}
