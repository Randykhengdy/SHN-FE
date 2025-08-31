import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Check, X, Clock } from "lucide-react";
import { salesOrderService } from "@/services/salesOrderService";
import { useAlert } from "@/hooks/useAlert";
import RejectionModal from "@/components/modals/RejectionModal";
import SalesOrderLayout from "@/components/SalesOrderLayout";

export default function ApprovalPage() {
  const { showAlert, AlertComponent } = useAlert();
  const [activeTab, setActiveTab] = useState("sales-order");
  const [salesOrderRequests, setSalesOrderRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState(null); // Track which request is being approved
  const [rejectingId, setRejectingId] = useState(null); // Track which request is being rejected
  
  // Rejection modal state
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  


  useEffect(() => {
    if (activeTab === "sales-order") {
      loadSalesOrderRequests();
    }
  }, [activeTab]);

  const loadSalesOrderRequests = async (showErrorAlert = true) => {
    try {
      setLoading(true);
      const response = await salesOrderService.getPendingDeleteRequests();
      
      console.log('📋 Sales Order delete requests:', response);
      
             // Transform API data to match our UI structure
       const transformedData = (response.data || []).map(request => ({
         id: request.id,
         so_id: request.id, // Sales order ID
         no_so: request.nomor_so,
         pelanggan: request.pelanggan?.nama_pelanggan || 'N/A',
         requested_by: request.delete_requested_by?.name || 'Unknown',
         requested_at: request.delete_requested_at,
         reason: request.delete_reason,
         status: 'pending' // Since this endpoint only returns pending requests
       }));
      
      setSalesOrderRequests(transformedData);
    } catch (error) {
      console.error('❌ Error loading delete requests:', error);
      if (showErrorAlert) {
        showAlert("Error", "Gagal memuat data permintaan hapus", "error");
      }
      setSalesOrderRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    // Prevent multiple clicks
    if (approvingId === requestId) {
      console.log('⏭️ Already processing approval for request:', requestId);
      return;
    }
    
    try {
      setApprovingId(requestId);
      
      const response = await salesOrderService.approveDelete(requestId);
      
      console.log('✅ Request approved:', response);
      
      // Show success message and reload data after alert closes
      showAlert("Sukses", "Permintaan hapus disetujui!", "success", () => {
        loadSalesOrderRequests(false);
      });
      
    } catch (error) {
      console.error('❌ Error approving request:', error);
      showAlert("Error", "Gagal menyetujui permintaan", "error");
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
      
      const response = await salesOrderService.rejectDelete(selectedRequest.id, reason);
      
      console.log('❌ Request rejected:', response);
      
      // Close modal first
      setShowRejectionModal(false);
      
      // Show success message and reload data after alert closes
      showAlert("Sukses", "Permintaan hapus ditolak!", "success", () => {
        loadSalesOrderRequests(false);
      });
      
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      showAlert("Error", "Gagal menolak permintaan", "error");
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sales-order">Sales Order</TabsTrigger>
              <TabsTrigger value="purchase-order" disabled>Purchase Order</TabsTrigger>
              <TabsTrigger value="other" disabled>Lainnya</TabsTrigger>
            </TabsList>
            
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
                  ) : salesOrderRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada permintaan hapus Sales Order
                    </div>
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
                          {salesOrderRequests.map((request) => (
                            <TableRow key={request.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{request.no_so}</TableCell>
                              <TableCell>{request.pelanggan}</TableCell>
                              <TableCell>{request.requested_by}</TableCell>
                              <TableCell>{formatDate(request.requested_at)}</TableCell>
                              <TableCell className="max-w-xs truncate" title={request.reason}>
                                {request.reason}
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => window.open(`/sales-order/view/${request.so_id}`, '_blank')}
                                    title="Lihat Sales Order"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {request.status === 'pending' && (
                                    <>
                                                                             <Button 
                                         size="sm" 
                                         className="bg-green-600 hover:bg-green-700" 
                                         onClick={() => handleApprove(request.id)}
                                         disabled={approvingId === request.id}
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
                                         disabled={rejectingId === request.id}
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
            
            <TabsContent value="purchase-order" className="mt-6">
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    Menu approval Purchase Order akan segera hadir
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="other" className="mt-6">
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    Menu approval lainnya akan segera hadir
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Rejection Modal */}
      <RejectionModal
        open={showRejectionModal}
        onOpenChange={setShowRejectionModal}
        salesOrder={selectedRequest}
        onConfirm={handleRejectConfirm}
        onCancel={() => setShowRejectionModal(false)}
      />
      
      {/* Alert Modal Component */}
      <AlertComponent />
    </SalesOrderLayout>
  );
}
