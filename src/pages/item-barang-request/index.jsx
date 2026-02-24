import CustomAlert from "@/components/modals/CustomAlert";
import PageLayout from "@/components/PageLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/hooks/useAlert";
import { Download, Eye, Plus, RefreshCw, Trash2, Check, X, Edit, UserPlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGudangOptions } from "@/services/masterDataService";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { isAdmin } from "@/lib/utils";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";
import { useAppContext } from "@/context/AppContext";

const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "pending", label: "Pending" },
    { value: "reviewed", label: "Reviewed/Assigned" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

// Urgency dihapus sesuai API terbaru

export default function ItemBarangRequestPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const { showAlert, AlertComponent } = useAlert();
    const { hasPermission } = useAppContext();
    const canRead = hasPermission && hasPermission('ITEM_BARANG_REQUEST', 'Read');
    const canCreate = hasPermission && hasPermission('ITEM_BARANG_REQUEST', 'Create');
    const canDelete = hasPermission && hasPermission('ITEM_BARANG_REQUEST', 'Delete');
    const isAdminUser = isAdmin();
    const showAlertRef = useRef(showAlert);
    useEffect(() => { showAlertRef.current = showAlert; }, [showAlert]);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [urgencyFilter, setUrgencyFilter] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [gudangOptions, setGudangOptions] = useState([]);

    useEffect(() => {
        const loadGudang = async () => {
            try {
                const resp = await getGudangOptions();
                setGudangOptions(resp || []);
            } catch (_) { }
        };
        loadGudang();
    }, []);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                per_page: itemsPerPage,
                search: searchTerm,
                status: statusFilter !== "all" ? statusFilter : undefined,
                // urgency dihapus
            };

            const response = await itemBarangRequestService.getAll(params);

            if (response.success) {
                const rows = Array.isArray(response.data) ? response.data : (Array.isArray(response?.data?.data) ? response.data.data : []);
                setRequests(rows);
                const total = response?.pagination?.total ?? (Array.isArray(rows) ? rows.length : 0);
                setTotalItems(total);
            } else {
                showAlertRef.current && showAlertRef.current("error", "Gagal memuat data request");
            }
        } catch (error) {
            console.error("Error loading requests:", error);
            showAlertRef.current && showAlertRef.current("error", "Terjadi kesalahan saat memuat data");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, statusFilter, urgencyFilter]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleSearch = () => {
        setCurrentPage(1);
        loadRequests();
    };

    const handleReset = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setUrgencyFilter(undefined);
        setCurrentPage(1);
    };

    const handleDelete = async () => {
        if (!selectedRequest) return;

        try {
            setIsDeleting(true);
            const response = await itemBarangRequestService.delete(selectedRequest.id);

            if (response.success) {
                showAlertRef.current && showAlertRef.current("success", "Request berhasil dihapus");
                loadRequests();
            } else {
                showAlertRef.current && showAlertRef.current("error", response.message || "Gagal menghapus request");
            }
        } catch (error) {
            console.error("Error deleting request:", error);
            showAlertRef.current && showAlertRef.current("error", "Terjadi kesalahan saat menghapus request");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setSelectedRequest(null);
        }
    };

    const handleApprove = async (request) => {
        try {
            const response = await itemBarangRequestService.approve(request.id, { approval_notes: "Approved" });

            if (response.success) {
                showAlertRef.current && showAlertRef.current("success", "Request berhasil disetujui");
                loadRequests();
            } else {
                showAlertRef.current && showAlertRef.current("error", response.message || "Gagal menyetujui request");
            }
        } catch (error) {
            console.error("Error approving request:", error);
            showAlertRef.current && showAlertRef.current("error", "Terjadi kesalahan saat menyetujui request");
        }
    };

    const handleReject = async (request) => {
        try {
            const response = await itemBarangRequestService.reject(request.id);

            if (response.success) {
                showAlertRef.current && showAlertRef.current("success", "Request berhasil ditolak");
                loadRequests();
            } else {
                showAlertRef.current && showAlertRef.current("error", response.message || "Gagal menolak request");
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
            showAlertRef.current && showAlertRef.current("error", "Terjadi kesalahan saat menolak request");
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { variant: "secondary", label: "Pending" },
            reviewed: { variant: "outline", label: "Reviewed" },
            approved: { variant: "default", label: "Approved" },
            rejected: { variant: "destructive", label: "Rejected" },
        };

        const config = statusConfig[status] || { variant: "secondary", label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    // Urgency badge dihapus

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (!canRead) {
        return (
            <PageLayout title="Item Barang Request">
                <div className="p-6">
                    <Card>
                        <CardContent className="p-6 text-center text-gray-600">Anda tidak memiliki akses Read untuk Item Barang Request</CardContent>
                    </Card>
                    <AlertComponent />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Item Barang Request">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Daftar Item Barang Request</CardTitle>
                            {canCreate ? (
                                <Button onClick={() => navigate("/item-barang-request/add")} className="bg-green-600 hover:bg-green-700 text-white">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Request
                                </Button>
                            ) : null}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search and Filter Section */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder="Cari berdasarkan nomor dokumen, item, atau notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Urgency filter dihapus */}
                            {/* Controls moved to bottom-right */}
                        </div>

                        <div className="flex justify-end gap-2 mb-4">
                            <Button onClick={handleReset} variant="outline" className="border-gray-300">
                                Reset
                            </Button>
                            <Button onClick={handleSearch} disabled={loading} variant="outline" className="border-gray-300">
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Cari
                            </Button>
                        </div>

                        {/* Table Section */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Dokumen</TableHead>
                                        <TableHead>Gudang Asal</TableHead>
                                        <TableHead>Gudang Tujuan</TableHead>
                                        <TableHead className="text-center">Quantity</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requestor</TableHead>
                                        <TableHead>Tanggal Request</TableHead>
                                        <TableHead className="text-center">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : requests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4">
                                                Tidak ada data request
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requests.map((request) => {
                                            const detailsCount = request.details?.length || 0;

                                            // Calculate total quantity from details specifically
                                            const detailsQty = (request.details || []).reduce((sum, d) => sum + (parseInt(d.quantity) || 0), 0);
                                            // Fallback to header quantity if details count is 0
                                            const totalQty = detailsCount > 0 ? detailsQty : (parseInt(request.quantity) || 0);

                                            return (
                                                <TableRow key={request.id}>
                                                    <TableCell className="font-medium">
                                                        {request.nomor_request || request.document_number || "-"}
                                                    </TableCell>
                                                    <TableCell>{request.asal_gudang?.nama_gudang || "-"}</TableCell>
                                                    <TableCell>{request.tujuan_gudang?.nama_gudang || "-"}</TableCell>
                                                    <TableCell className="text-center font-semibold">
                                                        {totalQty}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                                                    <TableCell>{request.requested_by?.name || request.user?.name || "-"}</TableCell>
                                                    <TableCell>
                                                        {request.requested_at ? new Date(request.requested_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2 justify-center">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => navigate(`/item-barang-request/view/${request.id}`)}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                title="Lihat Detail"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {isAdminUser && (request.status === 'pending' || request.status === 'reviewed') && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => navigate(`/item-barang-request/view/${request.id}`)}
                                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                                    title="Assign Item"
                                                                >
                                                                    <UserPlus className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {canDelete && request.status === 'pending' ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => { setSelectedRequest(request); setShowDeleteModal(true); }}
                                                                    className="text-white"
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Section */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="px-3 py-1 text-sm">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <CustomAlert
                open={showDeleteModal}
                onOpenChange={setShowDeleteModal}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus request "${selectedRequest?.nomor_request || selectedRequest?.document_number || ''}"?`}
                confirmText="Hapus"
                showCancel={true}
                cancelText="Batal"
                type="error"
            />

            <AlertComponent />
        </PageLayout>
    );
}
