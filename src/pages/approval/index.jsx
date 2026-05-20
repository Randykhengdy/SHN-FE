import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Check, X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomAlert from "@/components/modals/CustomAlert";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import { salesOrderService } from "@/services/salesOrderService";
import { itemBarangService } from "@/services/master-data";
import { useAlert } from "@/hooks/useAlert";
import RejectionModal from "@/components/modals/RejectionModal";
import SalesOrderLayout from "@/components/SalesOrderLayout";
import { useAppContext } from "@/context/AppContext";

export default function ApprovalPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  const { hasPermission, user } = useAppContext();
  const canUpdateItemRequest = hasPermission && (hasPermission('ITEM_BARANG_REQUEST_APPROVAL', 'Update') || hasPermission('APPROVAL', 'Update'));
  const canUpdateSOApproval = hasPermission && (hasPermission('SALES_ORDER_APPROVAL', 'Update') || hasPermission('APPROVAL', 'Update'));
  
  // Sesuai request, murni pakai is_can_delete_item_barang saja
  const canUpdateRongsokApproval = user?.is_can_delete_item_barang == 1;
  const [activeTab, setActiveTab] = useState(canUpdateItemRequest ? "item-barang-request" : canUpdateSOApproval ? "sales-order" : "rongsok");
  const [itemRequests, setItemRequests] = useState([]);
  const [soDeleteRequests, setSoDeleteRequests] = useState([]);
  const [rongsokRequests, setRongsokRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null); // Track which request is being approved
  const [rejectingId, setRejectingId] = useState(null); // Track which request is being rejected

  // Rejection modal state
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");



  useEffect(() => {
    if (activeTab === "item-barang-request") {
      loadItemRequests();
    } else if (activeTab === "sales-order") {
      loadSalesOrderDeleteRequests();
    } else if (activeTab === "rongsok") {
      loadRongsokRequests();
    }
  }, [activeTab]);

  const loadItemRequests = async (showErrorAlert = true) => {
    try {
      setLoading(true);
      const response = await itemBarangRequestService.getPendingRequests({ per_page: 100 });
      const body = response?.data;
      const rows = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
      const transformed = rows.map(r => {
        const detailsCount = r.details?.length || 0;
        const firstDetail = r.details?.[0];
        const itemName = detailsCount > 1
          ? `${firstDetail?.item_name || 'Item'} (+${detailsCount - 1} lainnya)`
          : (firstDetail?.item_name || r.nama_item_barang || "-");
        const totalQty = detailsCount > 0
          ? r.details.reduce((sum, d) => sum + (d.quantity || 0), 0)
          : (r.quantity || 0);

        return {
          id: r.id,
          nomor_request: r.nomor_request || r.document_number,
          item: itemName,
          kode_item: firstDetail?.kode_barang || r.kode_barang || r.item_barang?.kode || null,
          quantity: totalQty,
          requested_by: r.requested_by?.name || r.user?.name || 'Unknown',
          requested_at: r.requested_at || r.created_at,
          keterangan: r.keterangan || r.notes || '',
          status: r.status || 'pending',
          gudang_asal: r.asal_gudang?.nama_gudang || r.gudang?.nama_gudang || null,
          gudang_tujuan: r.tujuan_gudang?.nama_gudang || null
        };
      });
      setItemRequests(transformed);
    } catch (error) {
      console.error('❌ Error loading item requests:', error);
      if (showErrorAlert) {
        showAlert("Error", "Gagal memuat data request item barang", "error");
      }
      setItemRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesOrderDeleteRequests = async (showErrorAlert = true) => {
    try {
      setLoading(true);
      const response = await salesOrderService.getPendingDeleteRequests();
      const rows = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      const transformed = rows.map(r => ({
        id: r.id,
        no_so: r.nomor_so || r.no_so,
        pelanggan: r.pelanggan?.nama_pelanggan || r.pelanggan || 'N/A',
        requested_by: r.delete_requested_by?.name || r.requested_by?.name || 'Unknown',
        requested_at: r.delete_requested_at || r.requested_at,
        reason: r.delete_reason || r.reason || '',
        status: 'pending'
      }));
      setSoDeleteRequests(transformed);
    } catch (error) {
      console.error('❌ Error loading SO delete requests:', error);
      if (showErrorAlert) {
        showAlert("Error", "Gagal memuat permintaan hapus Sales Order", "error");
      }
      setSoDeleteRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    try {
      setApprovingId(selectedRequest?.id || null);
      const response = await itemBarangRequestService.approve(selectedRequest.id, { approval_notes: approveNotes || "" });
      console.log('✅ Item request approved:', response);
      setShowApproveModal(false);
      setApproveNotes("");
      showAlert("Sukses", "Request item barang disetujui!", "success", () => {
        loadItemRequests(false);
      });
    } catch (error) {
      console.error('❌ Error approving request:', error);
      showAlert("Error", "Gagal menyetujui request", "error");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = async (reason) => {
    if (rejectingId === selectedRequest.id) {
      console.log('⏭️ Already processing rejection for request:', selectedRequest.id);
      return;
    }

    try {
      setRejectingId(selectedRequest.id);
      const response = await itemBarangRequestService.reject(selectedRequest.id, { approval_notes: reason || "" });
      console.log('❌ Item request rejected:', response);

      // Close modal first
      setShowRejectionModal(false);

      // Show success message and reload data after alert closes
      showAlert("Sukses", "Request item barang ditolak!", "success", () => {
        loadItemRequests(false);
      });

    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      showAlert("Error", "Gagal menolak request", "error");
    } finally {
      setRejectingId(null);
    }
  };

  // === Rongsok Approval Handlers ===
  const loadRongsokRequests = async (showErrorAlert = true) => {
    try {
      setLoading(true);
      const response = await itemBarangService.getPendingRongsok({ per_page: 100 });
      const rows = Array.isArray(response?.data) ? response.data : [];
      setRongsokRequests(rows);
    } catch (error) {
      console.error('❌ Error loading rongsok requests:', error);
      if (showErrorAlert) {
        showAlert("Error", "Gagal memuat data request rongsok", "error");
      }
      setRongsokRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRongsok = async (request) => {
    try {
      setApprovingId(request.id);
      await itemBarangService.approveRongsok(request.id);
      showAlert("Sukses", "Request rongsok berhasil di-approve!", "success", () => {
        loadRongsokRequests(false);
      });
    } catch (error) {
      console.error('❌ Error approving rongsok:', error);
      showAlert("Error", error.message || "Gagal approve request rongsok", "error");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectRongsok = (request) => {
    setSelectedRequest({ ...request, _type: 'rongsok' });
    setShowRejectionModal(true);
  };

  const handleRejectRongsokConfirm = async (reason) => {
    try {
      setRejectingId(selectedRequest.id);
      await itemBarangService.rejectRongsok(selectedRequest.id, reason || "Ditolak oleh admin");
      setShowRejectionModal(false);
      showAlert("Sukses", "Request rongsok berhasil ditolak!", "success", () => {
        loadRongsokRequests(false);
      });
    } catch (error) {
      console.error('❌ Error rejecting rongsok:', error);
      showAlert("Error", error.message || "Gagal menolak request rongsok", "error");
    } finally {
      setRejectingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Reviewed</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <SalesOrderLayout title="Approval" subtitle="TRANSAKSI">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Menu Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Fix Tailwind dynamic class compilation by providing static string mapping */}
            <TabsList className={`grid w-full ${
              [canUpdateItemRequest, canUpdateSOApproval, canUpdateRongsokApproval].filter(Boolean).length === 3 
                ? 'grid-cols-3' 
                : [canUpdateItemRequest, canUpdateSOApproval, canUpdateRongsokApproval].filter(Boolean).length === 2 
                  ? 'grid-cols-2' 
                  : 'grid-cols-1'
            }`}>
              {canUpdateItemRequest && (
                <TabsTrigger value="item-barang-request">Item Barang Request</TabsTrigger>
              )}
              {canUpdateSOApproval && (
                <TabsTrigger value="sales-order">Sales Order</TabsTrigger>
              )}
              {canUpdateRongsokApproval && (
                <TabsTrigger value="rongsok">Rongsok Approval</TabsTrigger>
              )}
            </TabsList>

            {canUpdateItemRequest && (
              <TabsContent value="item-barang-request" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Permintaan Item Barang Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    ) : itemRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Tidak ada request item barang
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">No Request</TableHead>
                              <TableHead className="font-semibold">Item</TableHead>
                              <TableHead className="font-semibold">Quantity</TableHead>
                              <TableHead className="font-semibold">Gudang Asal</TableHead>
                              <TableHead className="font-semibold">Gudang Tujuan</TableHead>
                              <TableHead className="font-semibold">Diminta Oleh</TableHead>
                              <TableHead className="font-semibold">Tanggal Request</TableHead>
                              <TableHead className="font-semibold">Keterangan</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold text-center">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itemRequests.map((request) => (
                              <TableRow key={request.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{request.nomor_request}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{request.item}</span>
                                    <span className="text-xs text-gray-500">{request.kode_item || '-'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{request.quantity}</TableCell>
                                <TableCell>{request.gudang_asal || '-'}</TableCell>
                                <TableCell>{request.gudang_tujuan || '-'}</TableCell>
                                <TableCell>{request.requested_by}</TableCell>
                                <TableCell>{formatDate(request.requested_at)}</TableCell>
                                <TableCell className="max-w-xs truncate" title={request.keterangan}>
                                  {request.keterangan}
                                </TableCell>
                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/item-barang-request/view/${request.id}`, { state: { fromApproval: true } })}
                                      title="Lihat Request"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {request.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => handleApprove(request)}
                                          title="Setujui"
                                        >
                                          {approvingId === request.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          ) : (
                                            <Check className="w-4 h-4" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleReject(request)}
                                          title="Tolak"
                                        >
                                          {rejectingId === request.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          ) : (
                                            <X className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {canUpdateSOApproval && (
              <TabsContent value="sales-order" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Permintaan Hapus Sales Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    ) : soDeleteRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">Tidak ada permintaan hapus Sales Order</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">No SO</TableHead>
                              <TableHead className="font-semibold">Pelanggan</TableHead>
                              <TableHead className="font-semibold">Diminta Oleh</TableHead>
                              <TableHead className="font-semibold">Tanggal Request</TableHead>
                              <TableHead className="font-semibold">Alasan</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold text-center">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {soDeleteRequests.map((r) => (
                              <TableRow key={r.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{r.no_so}</TableCell>
                                <TableCell>{r.pelanggan}</TableCell>
                                <TableCell>{r.requested_by}</TableCell>
                                <TableCell>{formatDate(r.requested_at)}</TableCell>
                                <TableCell className="max-w-xs truncate" title={r.reason}>{r.reason}</TableCell>
                                <TableCell>{getStatusBadge(r.status)}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/sales-order/view/${r.id}`)} title="Lihat SO">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => {
                                      try { await salesOrderService.approveDelete(r.id); showAlert("Sukses", "Permintaan hapus disetujui", "success", () => loadSalesOrderDeleteRequests(false)); } catch (e) { showAlert("Error", "Gagal menyetujui", "error"); }
                                    }} title="Setujui">
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => {
                                      setSelectedRequest(r);
                                      setShowRejectionModal(true);
                                    }} title="Tolak">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {canUpdateRongsokApproval && (
              <TabsContent value="rongsok" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Permintaan Rongsok Item Barang</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    ) : rongsokRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Tidak ada request rongsok yang menunggu approval
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">ID</TableHead>
                              <TableHead className="font-semibold">Kode Barang</TableHead>
                              <TableHead className="font-semibold">Nama Item</TableHead>
                              <TableHead className="font-semibold">Gudang</TableHead>
                              <TableHead className="font-semibold text-center">% Sisa</TableHead>
                              <TableHead className="font-semibold">Alasan</TableHead>
                              <TableHead className="font-semibold">Diminta Oleh</TableHead>
                              <TableHead className="font-semibold">Tanggal</TableHead>
                              <TableHead className="font-semibold text-center">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rongsokRequests.map((r) => (
                              <TableRow key={r.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{r.id}</TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                    {r.item_barang?.kode_barang || '-'}
                                  </span>
                                </TableCell>
                                <TableCell>{r.item_barang?.nama_item_barang || '-'}</TableCell>
                                <TableCell>{r.item_barang?.gudang?.nama_gudang || '-'}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={`${r.persentase_sisa < 20 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                    {Number(r.persentase_sisa || 0).toFixed(1)}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate" title={r.reason}>{r.reason || '-'}</TableCell>
                                <TableCell>{r.requested_by_user?.name || '-'}</TableCell>
                                <TableCell>{formatDate(r.requested_at)}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => handleApproveRongsok(r)}
                                      title="Setujui Rongsok"
                                      disabled={approvingId === r.id}
                                    >
                                      {approvingId === r.id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectRongsok(r)}
                                      title="Tolak Rongsok"
                                      disabled={rejectingId === r.id}
                                    >
                                      {rejectingId === r.id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      ) : (
                                        <X className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      <RejectionModal
        open={showRejectionModal}
        onOpenChange={setShowRejectionModal}
        salesOrder={selectedRequest}
        onConfirm={selectedRequest?._type === 'rongsok' ? handleRejectRongsokConfirm : handleRejectConfirm}
        onCancel={() => setShowRejectionModal(false)}
      />
      {/* Approve Modal */}
      <CustomAlert
        open={showApproveModal}
        onOpenChange={setShowApproveModal}
        onConfirm={handleApproveConfirm}
        title="Konfirmasi Approve"
        message="Masukkan catatan approval (opsional)"
        confirmText="Approve"
        showCancel={true}
        cancelText="Batal"
        type="info"
        extraContent={(
          <div className="mt-3">
            <textarea
              className="w-full border rounded-md p-2 text-sm"
              placeholder="Catatan approval"
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}
      />

      {/* Alert Modal Component */}
      <AlertComponent />
    </SalesOrderLayout>
  );
}
