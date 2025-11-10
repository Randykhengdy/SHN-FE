import CustomAlert from "@/components/modals/CustomAlert";
import PageLayout from "@/components/PageLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/hooks/useAlert";
import { Download, Eye, Plus, RefreshCw, Trash2, Check, X, Edit } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { isAdmin } from "@/lib/utils";
import { itemBarangRequestService } from "@/services/itemBarangRequestService";

const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const urgencyOptions = [
    { value: "all", label: "Semua Urgency" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

export default function ItemBarangRequestPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const { showAlert, AlertComponent } = useAlert();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [urgencyFilter, setUrgencyFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                per_page: itemsPerPage,
                search: searchTerm,
                status: statusFilter !== "all" ? statusFilter : undefined,
                urgency_level: urgencyFilter !== "all" ? urgencyFilter : undefined,
            };

            const response = await itemBarangRequestService.getAll(params);
            
            if (response.success) {
                setRequests(response.data.data || []);
                setTotalItems(response.data.total || 0);
            } else {
                showAlert("error", "Gagal memuat data request");
            }
        } catch (error) {
            console.error("Error loading requests:", error);
            showAlert("error", "Terjadi kesalahan saat memuat data");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, statusFilter, urgencyFilter, showAlert]);

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
        setUrgencyFilter("all");
        setCurrentPage(1);
    };

    const handleDelete = async () => {
        if (!selectedRequest) return;

        try {
            setIsDeleting(true);
            const response = await itemBarangRequestService.delete(selectedRequest.id);
            
            if (response.success) {
                showAlert("success", "Request berhasil dihapus");
                loadRequests();
            } else {
                showAlert("error", response.message || "Gagal menghapus request");
            }
        } catch (error) {
            console.error("Error deleting request:", error);
            showAlert("error", "Terjadi kesalahan saat menghapus request");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setSelectedRequest(null);
        }
    };

    const handleApprove = async (request) => {
        try {
            const response = await itemBarangRequestService.approve(request.id);
            
            if (response.success) {
                showAlert("success", "Request berhasil disetujui");
                loadRequests();
            } else {
                showAlert("error", response.message || "Gagal menyetujui request");
            }
        } catch (error) {
            console.error("Error approving request:", error);
            showAlert("error", "Terjadi kesalahan saat menyetujui request");
        }
    };

    const handleReject = async (request) => {
        try {
            const response = await itemBarangRequestService.reject(request.id);
            
            if (response.success) {
                showAlert("success", "Request berhasil ditolak");
                loadRequests();
            } else {
                showAlert("error", response.message || "Gagal menolak request");
            }
        } catch (error) {
            console.error("Error rejecting request:", error);
            showAlert("error", "Terjadi kesalahan saat menolak request");
        }
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

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <PageLayout title="Item Barang Request">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Daftar Item Barang Request</CardTitle>
                            <Button onClick={() => navigate("/item-barang-request/add")}>
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Request
                            </Button>
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
                            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter Urgency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {urgencyOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                                Cari
                            </Button>
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                        </div>

                        {/* Table Section */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Dokumen</TableHead>
                                        <TableHead>Item Barang</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Urgency</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requestor</TableHead>
                                        <TableHead>Tanggal Request</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : requests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-4">
                                                Tidak ada data request
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requests.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">
                                                    {request.document_number}
                                                </TableCell>
                                                <TableCell>{request.item_barang?.nama || "-"}</TableCell>
                                                <TableCell>{request.quantity}</TableCell>
                                                <TableCell>{getUrgencyBadge(request.urgency_level)}</TableCell>
                                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                                <TableCell>{request.user?.name || "-"}</TableCell>
                                                <TableCell>
                                                    {new Date(request.created_at).toLocaleDateString("id-ID")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/item-barang-request/view/${request.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        
                                                        {request.status === "pending" && request.can_edit && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => navigate(`/item-barang-request/edit/${request.id}`)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {request.status === "pending" && isAdmin() && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleApprove(request)}
                                                                    className="text-green-600 hover:text-green-700"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleReject(request)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}

                                                        {request.can_delete && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedRequest(request);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
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
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Konfirmasi Hapus"
                description={`Apakah Anda yakin ingin menghapus request "${selectedRequest?.document_number}"?`}
                confirmText="Hapus"
                cancelText="Batal"
                variant="destructive"
                loading={isDeleting}
            />

            <AlertComponent />
        </PageLayout>
    );
}