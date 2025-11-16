import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAlert } from "@/hooks/useAlert";
import { ArrowLeft, Edit, Printer, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getGudangOptions } from "@/services/masterDataService";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import { isAdmin } from "@/lib/utils";
import CustomAlert from "@/components/modals/CustomAlert";

export default function ViewItemBarangRequestPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showAlert, AlertComponent } = useAlert();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [gudangOptions, setGudangOptions] = useState([]);
    const [destGudangId, setDestGudangId] = useState("");

    useEffect(() => {
        const loadRequest = async () => {
            try {
                setLoading(true);
                const response = await itemBarangRequestService.getById(id);
                
                if (response.success) {
                    setRequest(response.data);
                } else {
                    showAlert("error", "Gagal memuat data request");
                    navigate("/item-barang-request");
                }
            } catch (error) {
                console.error("Error loading request:", error);
                showAlert("error", "Terjadi kesalahan saat memuat data");
                navigate("/item-barang-request");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadRequest();
        }
        const loadGudang = async () => {
            try {
                const resp = await getGudangOptions();
                setGudangOptions(resp || []);
            } catch (_) {}
        };
        loadGudang();
    }, [id, navigate, showAlert]);

    const handleApprove = async () => {
        try {
            setSubmitting(true);
            const payload = {
                approval_notes: approvalNotes,
                gudang_tujuan_id: destGudangId ? parseInt(destGudangId) : undefined
            };
            const response = await itemBarangRequestService.approve(id, payload);
            
            if (response.success) {
                showAlert("success", "Request berhasil disetujui");
                setRequest(prev => ({ ...prev, status: "approved" }));
                setShowApproveModal(false);
                setApprovalNotes("");
            } else {
                showAlert("error", response.message || "Gagal menyetujui request");
            }
        } catch (error) {
            console.error("Error approving request:", error);
            showAlert("error", "Terjadi kesalahan saat menyetujui request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.reject(id, {
                notes: approvalNotes
            });
            
            if (response.success) {
                showAlert("success", "Request berhasil ditolak");
                setRequest(prev => ({ ...prev, status: "rejected" }));
                setShowRejectModal(false);
                setApprovalNotes("");
            } else {
                showAlert("error", response.message || "Gagal menolak request");
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
            showAlert("error", "Terjadi kesalahan saat menolak request");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { variant: "secondary", label: "Pending" },
            approved: { variant: "default", label: "Approved" },
            rejected: { variant: "destructive", label: "Rejected" },
        };

        const config = statusConfig[status] || { variant: "secondary", label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getUrgencyBadge = (urgency) => {
        const urgencyConfig = {
            low: { variant: "secondary", label: "Low" },
            medium: { variant: "outline", label: "Medium" },
            high: { variant: "default", label: "High" },
            urgent: { variant: "destructive", label: "Urgent" },
        };

        const config = urgencyConfig[urgency] || { variant: "secondary", label: urgency };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (loading) {
        return (
            <PageLayout title="Detail Item Barang Request">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading...</div>
                </div>
            </PageLayout>
        );
    }

    if (!request) {
        return (
            <PageLayout title="Detail Item Barang Request">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Request tidak ditemukan</div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Detail Item Barang Request">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/item-barang-request")}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali
                                </Button>
                                <CardTitle>Detail Request #{request.document_number}</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handlePrint}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                                
                                {request.status === "pending" && request.can_edit && (
                                    <Button
                                        size="sm"
                                        onClick={() => navigate(`/item-barang-request/edit/${request.id}`)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                )}

                                {request.status === "pending" && isAdmin() && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => setShowApproveModal(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Select value={destGudangId} onValueChange={setDestGudangId}>
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="Gudang Tujuan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {gudangOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value.toString()}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            size="sm"
                                            onClick={() => setShowRejectModal(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold mb-4">Informasi Request</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">No. Dokumen:</span>
                                        <span className="font-medium">{request.document_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        {getStatusBadge(request.status)}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Urgency Level:</span>
                                        {getUrgencyBadge(request.urgency_level)}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tanggal Request:</span>
                                        <span>{new Date(request.created_at).toLocaleDateString("id-ID")}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">Informasi Requestor</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nama:</span>
                                        <span className="font-medium">{request.user?.name || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Email:</span>
                                        <span>{request.user?.email || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Item Information */}
                        <div>
                            <h3 className="font-semibold mb-4">Detail Item</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nama Item:</span>
                                        <span className="font-medium">{request.item_barang?.nama || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Kode Item:</span>
                                        <span>{request.item_barang?.kode || "-"}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Quantity:</span>
                                        <span className="font-medium">{request.quantity}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Unit:</span>
                                        <span>{request.item_barang?.unit?.nama || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {request.notes && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-4">Notes</h3>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                                        {request.notes}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Approval Information */}
                        {(request.approved_by || request.rejected_by) && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-4">Informasi Approval</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">
                                                    {request.status === "approved" ? "Disetujui oleh:" : "Ditolak oleh:"}
                                                </span>
                                                <span className="font-medium">
                                                    {request.approved_by?.name || request.rejected_by?.name || "-"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tanggal:</span>
                                                <span>
                                                    {new Date(request.approved_at || request.rejected_at).toLocaleDateString("id-ID")}
                                                </span>
                                            </div>
                                        </div>
                                        {request.approval_notes && (
                                            <div>
                                                <span className="text-gray-600">Notes Approval:</span>
                                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-2">
                                                    {request.approval_notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Audit Trail */}
                        <Separator />
                        <div>
                            <h3 className="font-semibold mb-4">Audit Trail</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Dibuat:</span>
                                        <span>{new Date(request.created_at).toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Terakhir diupdate:</span>
                                        <span>{new Date(request.updated_at).toLocaleString("id-ID")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Approve Modal */}
            <CustomAlert
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApprove}
                title="Konfirmasi Approve"
                description={`Apakah Anda yakin ingin menyetujui request "${request.document_number}"?`}
                confirmText="Approve"
                cancelText="Batal"
                variant="default"
                loading={submitting}
                showTextarea={true}
                textareaValue={approvalNotes}
                onTextareaChange={setApprovalNotes}
                textareaPlaceholder="Masukkan catatan approval (opsional)"
            />

            {/* Reject Modal */}
            <CustomAlert
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
                title="Konfirmasi Reject"
                description={`Apakah Anda yakin ingin menolak request "${request.document_number}"?`}
                confirmText="Reject"
                cancelText="Batal"
                variant="destructive"
                loading={submitting}
                showTextarea={true}
                textareaValue={approvalNotes}
                onTextareaChange={setApprovalNotes}
                textareaPlaceholder="Masukkan alasan penolakan (opsional)"
            />

            <AlertComponent />
        </PageLayout>
    );
}