import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAlert } from "@/hooks/useAlert";
import { ArrowLeft, Edit, Printer } from "lucide-react";
import { generateItemRequestPrintContent, openPrintDialog } from "@/lib/printUtils";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import CustomAlert from "@/components/modals/CustomAlert";

export default function ViewItemBarangRequestPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert, AlertComponent } = useAlert();
    const { hasPermission } = useAppContext();
    const canRead = hasPermission && hasPermission('ITEM_BARANG_REQUEST', 'Read');

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [gudangOptions, setGudangOptions] = useState([]);

    const showAlertRef = useRef(showAlert);
    useEffect(() => { showAlertRef.current = showAlert; }, [showAlert]);

    useEffect(() => {
        const loadRequest = async () => {
            try {
                setLoading(true);
                const response = await itemBarangRequestService.getById(id);
                if (response.success) {
                    setRequest(response.data);
                } else {
                    showAlertRef.current && showAlertRef.current("error", "Gagal memuat data request");
                    navigate("/item-barang-request");
                }
            } catch (error) {
                console.error("Error loading request:", error);
                showAlertRef.current && showAlertRef.current("error", "Terjadi kesalahan saat memuat data");
                navigate("/item-barang-request");
            } finally {
                setLoading(false);
            }
        };
        if (id) loadRequest();
    }, [id, navigate]);

    // Approve/Reject hanya dari menu Approval — tidak ada action di view

    const handlePrint = () => {
        if (!request) return;
        const printData = {
            nomor_request: request.nomor_request || request.document_number,
            requested_at: request.requested_at || request.created_at,
            requested_by: request.requested_by || request.user,
            asal_gudang: request.asal_gudang,
            tujuan_gudang: request.tujuan_gudang,
            nama_item_barang: request.nama_item_barang || request.item_barang?.nama_item_barang || request.item_barang?.nama || '-',
            kode_barang: request.kode_barang || request.item_barang?.kode_barang || request.item_barang?.kode || '-',
            quantity: request.quantity,
            keterangan: request.keterangan,
        };
        const html = generateItemRequestPrintContent(printData);
        openPrintDialog(html);
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

    if (!canRead) {
        return (
            <PageLayout title="Detail Item Barang Request">
                <div className="p-6">
                    <Card>
                        <CardContent className="p-6 text-center text-gray-600">Anda tidak memiliki akses Read untuk Item Barang Request</CardContent>
                    </Card>
                    <AlertComponent />
                </div>
            </PageLayout>
        );
    }

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
            <div className="space-y-6 max-w-6xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(location?.state?.fromApproval ? "/approval" : "/item-barang-request")}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Button>
                            <CardTitle>Detail Request #{request.nomor_request || request.document_number}</CardTitle>
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
                                        <span className="font-medium">{request.nomor_request || request.document_number}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status:</span>
                                        {getStatusBadge(request.status)}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tanggal Request:</span>
                                        <span>{request.requested_at ? new Date(request.requested_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4">Informasi Requestor</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nama:</span>
                                        <span className="font-medium">{request.requested_by?.name || request.user?.name || "-"}</span>
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
                                        <span className="font-medium">{request.nama_item_barang || request.item_barang?.nama || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Kode Item:</span>
                                        <span>{request.kode_barang || request.item_barang?.kode_barang || request.item_barang?.kode || "-"}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Quantity:</span>
                                            <span className="font-medium">{request.quantity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Gudang Tujuan:</span>
                                            <span className="font-medium">{request.tujuan_gudang?.nama_gudang || "-"}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Gudang Asal:</span>
                                        <span className="font-medium">{request.asal_gudang?.nama_gudang || "-"}</span>
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

                        {/* Approval Info */}
                        {request.status === "approved" && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-4">Approved</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Disetujui oleh:</span>
                                            <span className="font-medium">{request.approved_by?.name || "-"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Disetujui pada:</span>
                                            <span className="font-medium">
                                                {request.approved_at ? new Date(request.approved_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {request.status === "rejected" && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-4">Rejected</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Ditolak oleh:</span>
                                            <span className="font-medium">{request.rejected_by?.name || "-"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Ditolak pada:</span>
                                            <span className="font-medium">
                                                {request.rejected_at ? new Date(request.rejected_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                    <div className="px-6 pb-6">
                        <div className="flex gap-3 justify-center items-center">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(location?.state?.fromApproval ? "/approval" : "/item-barang-request")}
                                className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
                            >
                                Kembali ke List
                            </Button>
                            <Button
                                size="sm"
                                onClick={handlePrint}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Cetak
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tidak ada approve/reject di halaman view */}

            <AlertComponent />
        </PageLayout>
    );
}
