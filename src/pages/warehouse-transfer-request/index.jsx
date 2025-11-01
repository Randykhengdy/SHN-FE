import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { warehouseTransferRequestService } from "@/services/warehouseTransferRequestService";
import { useAuth } from "@/hooks/useAuth";

const WarehouseTransferRequestIndex = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchData = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search
      };
      
      const response = await warehouseTransferRequestService.getAll(params);
      setData(response.data || []);
      setPagination(prev => ({
        ...prev,
        page: response.current_page || 1,
        total: response.total || 0,
        totalPages: response.last_page || 1
      }));
    } catch (error) {
      console.error("Error fetching warehouse transfer requests:", error);
      toast.error("Gagal memuat data warehouse transfer request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData(1, searchTerm);
  };

  const handlePageChange = (page) => {
    fetchData(page, searchTerm);
  };

  const handleDelete = async (id) => {
    try {
      await warehouseTransferRequestService.requestDelete(id, "Deleted by user");
      toast.success("Request delete berhasil dikirim");
      fetchData(pagination.page, searchTerm);
    } catch (error) {
      console.error("Error requesting delete:", error);
      toast.error("Gagal mengirim request delete");
    }
  };

  const handleApprove = async (id) => {
    try {
      await warehouseTransferRequestService.approve(id, "Approved");
      toast.success("Warehouse transfer request berhasil disetujui");
      fetchData(pagination.page, searchTerm);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Gagal menyetujui request");
    }
  };

  const handleReject = async (id) => {
    try {
      await warehouseTransferRequestService.reject(id, "Rejected");
      toast.success("Warehouse transfer request berhasil ditolak");
      fetchData(pagination.page, searchTerm);
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Gagal menolak request");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      completed: { variant: "default", label: "Completed" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      accessorKey: "document_number",
      header: "No. Dokumen",
    },
    {
      accessorKey: "from_warehouse_name",
      header: "Dari Gudang",
    },
    {
      accessorKey: "to_warehouse_name",
      header: "Ke Gudang",
    },
    {
      accessorKey: "item_name",
      header: "Item",
    },
    {
      accessorKey: "quantity",
      header: "Jumlah",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "created_at",
      header: "Tanggal Dibuat",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("id-ID"),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const request = row.original;
        const canApprove = user?.role === "admin" && request.status === "pending";
        const canEdit = request.status === "pending" && request.created_by === user?.id;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/warehouse-transfer-request/${request.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => navigate(`/warehouse-transfer-request/${request.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canApprove && (
                <>
                  <DropdownMenuItem onClick={() => handleApprove(request.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Setujui
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleReject(request.id)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak
                  </DropdownMenuItem>
                </>
              )}
              {canEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus warehouse transfer request ini?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(request.id)}>
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Warehouse Transfer Request</CardTitle>
            <Button onClick={() => navigate("/warehouse-transfer-request/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Cari warehouse transfer request..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Cari
            </Button>
          </div>
          
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseTransferRequestIndex;