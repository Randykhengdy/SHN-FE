import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Edit, CheckCircle, XCircle, Printer } from "lucide-react";
import { warehouseTransferRequestService } from "@/services/warehouseTransferRequestService";
import { useAuth } from "@/hooks/useAuth";

const WarehouseTransferRequestView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await warehouseTransferRequestService.getById(id);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching warehouse transfer request:", error);
      toast.error("Gagal memuat data warehouse transfer request");
      navigate("/warehouse-transfer-request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await warehouseTransferRequestService.approve(id, "Approved by admin");
      toast.success("Warehouse transfer request berhasil disetujui");
      fetchData();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Gagal menyetujui request");
    }
  };

  const handleReject = async () => {
    try {
      await warehouseTransferRequestService.reject(id, "Rejected by admin");
      toast.success("Warehouse transfer request berhasil ditolak");
      fetchData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Gagal menolak request");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      approved: { variant: "default", label: "Approved", color: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive", label: "Rejected", color: "bg-red-100 text-red-800" },
      completed: { variant: "default", label: "Completed", color: "bg-blue-100 text-blue-800" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", label: status, color: "bg-gray-100 text-gray-800" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyConfig = {
      low: { variant: "secondary", label: "Rendah" },
      normal: { variant: "outline", label: "Normal" },
      high: { variant: "default", label: "Tinggi" },
      urgent: { variant: "destructive", label: "Mendesak" }
    };
    
    const config = urgencyConfig[urgency] || { variant: "secondary", label: urgency };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Data tidak ditemukan</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canApprove = user?.role === "admin" && data.status === "pending";
  const canEdit = data.status === "pending" && data.created_by === user?.id;

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/warehouse-transfer-request")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Detail Warehouse Transfer Request</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {canEdit && (
                <Button onClick={() => navigate(`/warehouse-transfer-request/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {canApprove && (
                <>
                  <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setujui
                  </Button>
                  <Button onClick={handleReject} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-1">No. Dokumen</h3>
              <p className="font-medium">{data.document_number || "-"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-1">Status</h3>
              {getStatusBadge(data.status)}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-1">Tingkat Urgensi</h3>
              {getUrgencyBadge(data.urgency_level)}
            </div>
          </div>

          <Separator />

          {/* Transfer Information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Informasi Transfer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">Dari Gudang</h4>
                  <p className="font-medium">{data.from_warehouse_name || "-"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">Item</h4>
                  <p className="font-medium">{data.item_name || "-"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">Ke Gudang</h4>
                  <p className="font-medium">{data.to_warehouse_name || "-"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">Jumlah</h4>
                  <p className="font-medium">{data.quantity || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          {data.notes && (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-2">Catatan</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{data.notes}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Approval Information */}
          {(data.approved_by || data.approval_notes) && (
            <>
              <div>
                <h3 className="font-semibold text-lg mb-4">Informasi Persetujuan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.approved_by && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Disetujui Oleh</h4>
                      <p className="font-medium">{data.approved_by_name || data.approved_by}</p>
                    </div>
                  )}
                  {data.approved_at && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Tanggal Persetujuan</h4>
                      <p className="font-medium">{new Date(data.approved_at).toLocaleString("id-ID")}</p>
                    </div>
                  )}
                </div>
                {data.approval_notes && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Catatan Persetujuan</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{data.approval_notes}</p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Audit Information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Informasi Audit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-500 mb-1">Dibuat Oleh</h4>
                <p className="font-medium">{data.created_by_name || data.created_by || "-"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-500 mb-1">Tanggal Dibuat</h4>
                <p className="font-medium">{new Date(data.created_at).toLocaleString("id-ID")}</p>
              </div>
              {data.updated_at && (
                <>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Diupdate Oleh</h4>
                    <p className="font-medium">{data.updated_by_name || data.updated_by || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-500 mb-1">Tanggal Update</h4>
                    <p className="font-medium">{new Date(data.updated_at).toLocaleString("id-ID")}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseTransferRequestView;