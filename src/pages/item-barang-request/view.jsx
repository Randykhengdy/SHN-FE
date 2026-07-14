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
import { isAdmin } from "@/lib/utils";

export default function ViewItemBarangRequestPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showAlert, AlertComponent } = useAlert();
    const { hasPermission, user } = useAppContext();
    const canRead = hasPermission && hasPermission('ITEM_BARANG_REQUEST', 'Read');
    const isAdminUser = isAdmin();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Assignment state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [selectedItemBarangId, setSelectedItemBarangId] = useState("");
    const [selectedItemAssignments, setSelectedItemAssignments] = useState([]); // [{id_item_barang, kode_barang, quantity}]
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

    const handlePrint = (title) => {
        if (!request) return;
        const printData = {
            nomor_request: request.nomor_request || request.document_number,
            requested_at: request.requested_at || request.created_at,
            requested_by: request.requested_by || request.user,
            asal_gudang: request.asal_gudang,
            tujuan_gudang: request.tujuan_gudang,
            details: request.details?.map(d => ({
                item_name: d.item_barang_group?.nama_group_barang || d.item_name || "-",
                quantity: d.quantity,
                notes: d.notes,
                assigned_items: d.assigned_items?.map(ai => ({
                    kode_barang: ai.kode_barang,
                    quantity: ai.pivot?.quantity || ai.quantity || 1
                })) || []
            })) || [],
            keterangan: request.keterangan || request.notes,
        };
        const html = generateItemRequestPrintContent(printData, title);
        openPrintDialog(html);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { variant: "secondary", label: "Pending" },
            reviewed: { variant: "outline", label: "Reviewed" },
            approved_kirim: { variant: "warning", label: "Disetujui Kirim" },
            approved: { variant: "default", label: "Approved" },
            rejected: { variant: "destructive", label: "Rejected" },
        };

        const config = statusConfig[status] || { variant: "secondary", label: status };
        return <Badge variant={config.variant} className="capitalize">{config.label}</Badge>;
    };

    const handleOpenAssignModal = async (detail) => {
        setSelectedDetail(detail);
        setSelectedItemBarangId("");

        // Populate existing assignments
        const existing = detail.assigned_items?.map(item => ({
            id_item_barang: item.id,
            kode_barang: item.kode_barang,
            quantity: item.pivot?.quantity || 1
        })) || [];
        setSelectedItemAssignments(existing);

        setShowAssignModal(true);

        try {
            setLoadingItems(true);
            const response = await itemBarangService.getAll({
                item_barang_group_id: detail.item_barang_group_id,
                gudang_id: request.gudang_asal_id,
                jenis_potongan: 'utuh',
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

    const handleAddItemToAssignment = () => {
        if (!selectedItemBarangId) return;

        const item = itemOptions.find(o => o.value === selectedItemBarangId);
        if (!item) return;

        if (selectedItemAssignments.some(a => a.id_item_barang.toString() === selectedItemBarangId)) {
            showAlert("error", "Item ini sudah ada dalam daftar");
            return;
        }

        const totalAssigned = selectedItemAssignments.reduce((sum, a) => sum + a.quantity, 0);
        if (totalAssigned >= selectedDetail.quantity) {
            showAlert("error", "Quantity sudah mencukupi");
            return;
        }

        setSelectedItemAssignments([...selectedItemAssignments, {
            id_item_barang: parseInt(selectedItemBarangId),
            kode_barang: item.label.split(' - ')[0],
            quantity: 1 // Default to 1, can be adjusted if needed
        }]);
        setSelectedItemBarangId("");
    };

    const handleRemoveItemFromAssignment = (id) => {
        setSelectedItemAssignments(selectedItemAssignments.filter(a => a.id_item_barang !== id));
    };

    const handleAssignItem = async () => {
        if (selectedItemAssignments.length === 0) {
            showAlert("error", "Pilih setidaknya satu item barang");
            return;
        }

        const totalAssigned = selectedItemAssignments.reduce((sum, a) => sum + a.quantity, 0);
        if (totalAssigned !== selectedDetail.quantity) {
            showAlert("warning", `Total quantity yang di-assign (${totalAssigned}) tidak sama dengan requested quantity (${selectedDetail.quantity})`);
            // We allow it but warn, or should we block? Usually must be exact.
            // Let's block for now as per usual inventory rules.
            return;
        }

        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.assignItem(selectedDetail.id, selectedItemAssignments);

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

    const handleApproveKirim = async () => {
        const unassigned = request.details.some(d => !d.assigned_items || d.assigned_items.length === 0);
        if (unassigned) {
            showAlert("error", "Semua item harus di-assign terlebih dahulu sebelum approve");
            return;
        }

        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.approveKirim(id);
            if (response.success) {
                showAlert("success", "Pengiriman request berhasil disetujui");
                loadRequest();
            } else {
                showAlert("error", response.message || "Gagal menyetujui pengiriman request");
            }
        } catch (error) {
            console.error("Error approving kirim:", error);
            showAlert("error", "Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        const unassigned = request.details.some(d => !d.assigned_items || d.assigned_items.length === 0);
        if (unassigned) {
            showAlert("error", "Semua item harus di-assign terlebih dahulu sebelum approve");
            return;
        }

        try {
            setSubmitting(true);
            const response = await itemBarangRequestService.approve(id);
            if (response.success) {
                showAlert("success", "Penerimaan request berhasil disetujui");
                loadRequest();
            } else {
                showAlert("error", response.message || "Gagal menyetujui penerimaan request");
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
                                    onClick={() => handlePrint("BUKTI KONVERSI")}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Cetak Bukti Konversi
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handlePrint("SURAT JALAN")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Cetak Surat Jalan
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8 p-6">
                        {/* Summary Header */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="space-y-1">
                                <Label className="text-gray-500 font-normal">Status Request</Label>
                                <div className="pt-1">{getStatusBadge(request.status)}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500 font-normal">Gudang Asal</Label>
                                <div className="font-semibold text-gray-900">{request.asal_gudang?.nama_gudang || "-"}</div>
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
                                                    {detail.assigned_items && detail.assigned_items.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {detail.assigned_items.map(item => (
                                                                <div key={item.id} className="p-2 bg-green-50 rounded border border-green-100 flex justify-between items-center text-xs">
                                                                    <div className="font-semibold text-green-700">{item.kode_barang}</div>
                                                                    <div className="text-gray-600 font-bold">qty: {item.pivot?.quantity || item.quantity || 1}</div>
                                                                </div>
                                                            ))}
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
                                                            {detail.assigned_items?.length > 0 ? "Edit Assignment" : "Assign"}
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
                        {isAdminUser && ['pending', 'reviewed', 'approved_kirim'].includes(request.status) && (
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
                                {request.status !== 'pending' && (
                                    <Button
                                        onClick={request.status === 'approved_kirim' ? handleApprove : handleApproveKirim}
                                        disabled={submitting}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        {request.status === 'approved_kirim' ? "Approve Penerimaan" : "Approve Pengiriman"}
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assignment Modal */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Assign Item Fisik</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">Item Group yang Diminta</Label>
                            <div className="font-bold text-gray-900 leading-tight mb-2">
                                {selectedDetail?.item_name || selectedDetail?.item_barang_group?.nama_group_barang}
                            </div>
                            <div className="flex justify-between items-center bg-white/50 p-2 rounded border border-gray-100">
                                <div className="text-xs text-gray-600 font-medium font-mono">
                                    Req Qty: <span className="font-bold text-gray-900">{selectedDetail?.quantity}</span>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded-full ${selectedItemAssignments.reduce((sum, a) => sum + a.quantity, 0) === selectedDetail?.quantity ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    Assigned: {selectedItemAssignments.reduce((sum, a) => sum + a.quantity, 0)}
                                </div>
                            </div>
                        </div>

                        {selectedItemAssignments.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Item Terpilih:
                                </Label>
                                <div className="max-h-[250px] overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50/30 shadow-inner">
                                    {selectedItemAssignments.map((assignment) => (
                                        <div key={assignment.id_item_barang} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm gap-4">
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-xs font-mono font-bold text-gray-800 break-all leading-relaxed">
                                                    {assignment.kode_barang}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={assignment.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 1;
                                                            setSelectedItemAssignments(selectedItemAssignments.map(a =>
                                                                a.id_item_barang === assignment.id_item_barang ? { ...a, quantity: val } : a
                                                            ));
                                                        }}
                                                        className="w-16 h-9 text-center border-y border-x rounded-md text-sm font-bold bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    onClick={() => handleRemoveItemFromAssignment(assignment.id_item_barang)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-gray-700">Tambah Item (Serial/Kode)</Label>
                            <div className="flex gap-2">
                                <div className="flex-1 min-w-0">
                                    <SearchSelect
                                        placeholder="Cari item..."
                                        value={selectedItemBarangId}
                                        onValueChange={setSelectedItemBarangId}
                                        options={itemOptions.filter(opt => !selectedItemAssignments.some(a => a.id_item_barang.toString() === opt.value))}
                                        loading={loadingItems}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    className="bg-gray-900 hover:bg-black text-white px-4 shrink-0 shadow-sm"
                                    onClick={handleAddItemToAssignment}
                                    disabled={!selectedItemBarangId}
                                >
                                    Tambah
                                </Button>
                            </div>
                            <div className="flex items-start gap-2 text-[10px] text-gray-500 bg-blue-50/50 p-2 rounded border border-blue-100/50">
                                <div className="mt-0.5 mt-0.5 p-0.5 bg-blue-500 rounded-full text-white text-[8px]">
                                    <Check className="h-2 w-2" />
                                </div>
                                <span className="italic">Item yang dipilih dipastikan dari Warehouse Asal ({request?.asal_gudang?.nama_gudang}).</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2 gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setShowAssignModal(false)} disabled={submitting} className="font-semibold text-gray-600">Batal</Button>
                        <Button
                            onClick={handleAssignItem}
                            disabled={submitting || selectedItemAssignments.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200 min-w-[150px]"
                        >
                            {submitting ? "Processing..." : "Simpan Assignment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertComponent />
        </PageLayout>
    );
}
