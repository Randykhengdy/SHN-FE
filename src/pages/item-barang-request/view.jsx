import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlert } from "@/hooks/useAlert";
import { ArrowLeft, Check, Printer, UserPlus, X } from "lucide-react";
import { generateItemRequestPrintContent, openPrintDialog } from "@/lib/printUtils";
import { useAppContext } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import { itemBarangService } from "@/services/master-data/itemBarangService";
import SearchSelect from "@/components/ui/search-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function ViewItemBarangRequestPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert, AlertComponent } = useAlert();
    const { hasPermission, user } = useAppContext();
    const canRead = hasPermission && hasPermission('ITEM_BARANG_REQUEST', 'Read');
    const isAdminUser = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Assignment state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [selectedItemBarangId, setSelectedItemBarangId] = useState("");
    const [itemOptions, setItemOptions] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

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

    useEffect(() => {
        if (id) loadRequest();
    }, [id]);

    const handlePrint = () => {
        if (!request) return;
        const printData = {
            nomor_request: request.nomor_request || request.document_number,
            requested_at: request.requested_at || request.created_at,
            requested_by: request.requested_by || request.user,
            asal_gudang: request.asal_gudang,
            tujuan_gudang: request.tujuan_gudang,
            nama_item_barang: request.details?.[0]?.item_name || '-',
            quantity: request.details?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0,
            keterangan: request.keterangan || request.notes,
        };
        const html = generateItemRequestPrintContent(printData);
        openPrintDialog(html);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { variant: "secondary", label: "Pending" },
            reviewed: { variant: "outline", label: "Reviewed" },
            approved: { variant: "default", label: "Approved" },
            rejected: { variant: "destructive", label: "Rejected" },
        };

        const config = statusConfig[status] || { variant: "secondary", label: status };
        return <Badge variant={config.variant} className="capitalize">{config.label}</Badge>;
    };

    const handleOpenAssignModal = async (detail) => {
        setSelectedDetail(detail);
        setSelectedItemBarangId("");
        setShowAssignModal(true);

        try {
            setLoadingItems(true);
            const response = await itemBarangService.getAll({
                item_barang_group_id: detail.item_barang_group_id,
                status: 'utuh',
                per_page: 50
            });

            const rows = Array.isArray(response?.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []);
            setItemOptions(rows.map(item => ({
                value: item.id?.toString(),
                label: `${item.kode_barang} - ${item.nama_item_barang} (${item.quantity})`,
                searchKey: `${item.kode_barang} ${item.nama_item_barang}`
            })));
        } catch (error) {
            console.error("Error loading items:", error);
            showAlert("error", "Gagal memuat daftar item barang");
        } finally {
            setLoadingItems(false);
        }
    };

    const handleAssignItem = async () => {
        if (!selectedItemBarangId) {
            showAlert("error", "Pilih item barang terlebih dahulu");
            return;
        }

        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.assignItem(selectedDetail.id, selectedItemBarangId);

            if (response.success) {
                showAlert("success", "Item berhasil di-assign");
                setShowAssignModal(false);
                loadRequest();
            } else {
                showAlert("error", response.message || "Gagal meng-assign item");
            }
        } catch (error) {
            console.error("Error assigning item:", error);
            showAlert("error", "Terjadi kesalahan saat meng-assign item");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        const unassigned = request.details.some(d => !d.id_item_barang);
        if (unassigned) {
            showAlert("error", "Semua item harus di-assign terlebih dahulu sebelum approve");
            return;
        }

        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.approve(id);
            if (response.success) {
                showAlert("success", "Request berhasil disetujui");
                loadRequest();
            } else {
                showAlert("error", response.message || "Gagal menyetujui request");
            }
        } catch (error) {
            console.error("Error approving:", error);
            showAlert("error", "Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.reject(id);
            if (response.success) {
                showAlert("success", "Request berhasil ditolak");
                loadRequest();
            } else {
                showAlert("error", response.message || "Gagal menolak request");
            }
        } catch (error) {
            console.error("Error rejecting:", error);
            showAlert("error", "Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
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
                <Card className="section-card">
                    <CardHeader className="section-header">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(location?.state?.fromApproval ? "/approval" : "/item-barang-request")}
                                    className="btn-secondary"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali
                                </Button>
                                <CardTitle className="page-title">Detail Request #{request.nomor_request || request.document_number}</CardTitle>
                            </div>
                            <div className="flex gap-2">
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
                    </CardHeader>
                    <CardContent className="space-y-8 p-6">
                        {/* Summary Header */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                                <Label className="text-gray-500 font-normal">Status Request</Label>
                                <div className="pt-1">{getStatusBadge(request.status)}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500 font-normal">Gudang Tujuan</Label>
                                <div className="font-semibold text-gray-900">{request.tujuan_gudang?.nama_gudang || "-"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500 font-normal">Tanggal & User</Label>
                                <div className="text-sm">
                                    <div className="font-medium text-gray-900">{request.requested_by?.name || request.user?.name || "-"}</div>
                                    <div className="text-gray-500">
                                        {request.requested_at ? new Date(request.requested_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {request.keterangan && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 italic text-blue-800 text-sm">
                                <span className="font-bold not-italic mr-2">Keterangan:</span>
                                {request.keterangan}
                            </div>
                        )}

                        <Separator />

                        {/* Details Table */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-900">Daftar Item Request</h3>
                            <div className="rounded-lg border overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-bold">Item Group</TableHead>
                                            <TableHead className="font-bold text-center w-[80px]">Qty</TableHead>
                                            <TableHead className="font-bold">Notes</TableHead>
                                            <TableHead className="font-bold">Assigned Item (Physical)</TableHead>
                                            {isAdminUser && (request.status === 'pending' || request.status === 'reviewed') && (
                                                <TableHead className="font-bold text-right w-[150px]">Aksi Admin</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {request.details?.map((detail) => (
                                            <TableRow key={detail.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium">{detail.item_barang_group?.nama_group_barang || detail.item_name || "-"}</TableCell>
                                                <TableCell className="text-center">{detail.quantity}</TableCell>
                                                <TableCell className="text-gray-500 italic max-w-xs truncate">{detail.notes || "-"}</TableCell>
                                                <TableCell>
                                                    {detail.item_barang ? (
                                                        <div className="space-y-0.5">
                                                            <div className="font-semibold text-green-700">{detail.item_barang.kode_barang}</div>
                                                            <div className="text-xs text-gray-500">{detail.item_barang.nama_item_barang}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-orange-500 text-sm font-medium italic">Belum di-assign</span>
                                                    )}
                                                </TableCell>
                                                {isAdminUser && (request.status === 'pending' || request.status === 'reviewed') && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenAssignModal(detail)}
                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        >
                                                            <UserPlus className="h-4 w-4 mr-2" />
                                                            {detail.id_item_barang ? "Ganti Item" : "Assign"}
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Lifecycle Info */}
                        {(request.status === 'approved' || request.status === 'rejected') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className={`p-4 rounded-lg border ${request.status === 'approved' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className="text-sm font-bold uppercase mb-2">
                                        {request.status === 'approved' ? 'Approval Info' : 'Rejection Info'}
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span>Oleh:</span>
                                            <span className="font-semibold">{(request.status === 'approved' ? request.approved_by?.name : request.rejected_by?.name) || "-"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Tanggal:</span>
                                            <span>{(request.status === 'approved' ? request.approved_at : request.rejected_at) ? new Date(request.status === 'approved' ? request.approved_at : request.rejected_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Action Bar */}
                        {isAdminUser && (request.status === 'pending' || request.status === 'reviewed') && (
                            <div className="flex flex-col md:flex-row gap-4 justify-end pt-8 border-t">
                                <Button
                                    variant="outline"
                                    onClick={handleReject}
                                    disabled={submitting}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Tolak Request
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={submitting || request.status !== 'reviewed'}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve Request
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assignment Modal */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Assign Item Fisik</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <Label className="text-xs text-gray-500 uppercase tracking-wider">Item Group yang Diminta</Label>
                            <div className="font-bold text-gray-900">{selectedDetail?.item_name}</div>
                            <div className="text-sm text-gray-600">Quantity: {selectedDetail?.quantity}</div>
                        </div>

                        <div className="space-y-2">
                            <Label>Pilih Item Spesifik (Serial/Kode)</Label>
                            <SearchSelect
                                placeholder="Cari item..."
                                value={selectedItemBarangId}
                                onValueChange={setSelectedItemBarangId}
                                options={itemOptions}
                                loading={loadingItems}
                            />
                            <p className="text-[10px] text-gray-500 italic">
                                * Hanya menampilkan item dengan status "Utuh" dalam group ini.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignModal(false)} disabled={submitting}>Batal</Button>
                        <Button onClick={handleAssignItem} disabled={submitting || !selectedItemBarangId} className="bg-blue-600">
                            {submitting ? "Processing..." : "Assign Item"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertComponent />
        </PageLayout>
    );
}
