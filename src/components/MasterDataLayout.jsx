import React, { useEffect, useState } from "react";
import MasterFormModal from "./MasterFormModal";
import Header from "./Header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import RolePermissionEditor from "./RolePermissionEditor";
import { useAlert } from "@/hooks/useAlert";

export default function MasterDataLayout({
  title,
  columns,
  fields,
  service,
  customEditComponent,
}) {
  const { showConfirm, AlertComponent } = useAlert();
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showTrashed, setShowTrashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortState, setSortState] = useState({ col: null, dir: null });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = showTrashed 
        ? await service.getTrashedPaginated(currentPage, itemsPerPage, searchTerm, sortState.col, sortState.dir)
        : await service.getPaginated(currentPage, itemsPerPage, searchTerm, sortState.col, sortState.dir);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 ${showTrashed ? 'Trashed' : 'Regular'} data for ${title}:`, {
          dataLength: response.data?.length || 0,
          totalItems: response.meta?.total || response.data?.length || 0,
          currentPage,
          itemsPerPage,
          searchTerm,
          sortState
        });
        if (response.data?.length > 0) {
          console.table(response.data.map(item => ({
            ID: item.id,
            'Nama/Kode': item.name || item.nama_role || item.nama_gudang || item.kode || '-',
            'Deleted At': item.deleted_at || '-',
            'Created At': item.created_at || '-'
          })));
        }
      }
      
      setData(response.data);
      setTotalItems(response.meta?.total || response.data.length);
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
    setLoading(false);
  }, [showTrashed, currentPage, itemsPerPage, searchTerm, sortState.col, sortState.dir, service, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditData(item);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    setSaveLoading(true);
    setError(null);
    try {
      const processedFormData = { ...formData };
      
      // Filter out hidden fields when editing
      if (editData) {
        fields.forEach((field) => {
          if (field.hideOnEdit) {
            delete processedFormData[field.name];
          }
        });
      }
      
      // Handle role field conversion
      if (processedFormData.role) {
        processedFormData.role_id = processedFormData.role;
        delete processedFormData.role;
      }

      if (editData) {
        await service.update(editData.id, processedFormData);
        console.log("✅ Data berhasil diupdate:", processedFormData);
      } else {
        await service.create(processedFormData);
        console.log("✅ Data berhasil ditambahkan:", processedFormData);
      }
      
      setIsModalOpen(false);
      setEditData(null);
      setError(null);
      setSaveLoading(false);
      fetchData();
    } catch (error) {
      console.error("❌ Error saat menyimpan data:", error);
      setError(error.message || "Terjadi kesalahan saat menyimpan data");
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Konfirmasi Hapus",
      "Yakin ingin menghapus data ini?",
      async () => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🗑️ Soft deleting item with ID: ${id}`);
          }
          await service.softDelete(id);
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Item with ID ${id} soft deleted successfully`);
          }
          fetchData();
        } catch (error) {
          console.error(`❌ Error soft deleting item ${id}:`, error);
        }
      }
    );
  };

  const handleRestore = async (id) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Restoring item with ID: ${id}`);
      }
      await service.restore(id);
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Item with ID ${id} restored successfully`);
      }
      fetchData();
    } catch (error) {
      console.error(`❌ Error restoring item ${id}:`, error);
    }
  };

  const handleForceDelete = async (id) => {
    showConfirm(
      "Konfirmasi Hapus Permanen",
      "Yakin ingin menghapus permanen data ini? Tindakan ini tidak dapat dibatalkan.",
      async () => {
        await service.forceDelete(id);
        fetchData();
      }
    );
  };

  const handleSort = (col) => {
    if (sortState.col !== col) {
      setSortState({ col, dir: 'asc' });
    } else if (sortState.dir === 'asc') {
      setSortState({ col, dir: 'desc' });
    } else {
      setSortState({ col, dir: 'asc' });
    }
  };

  const getValue = (obj, path) => {
    if (path === "role") {
      if (obj.roles && obj.roles.length > 0) {
        return obj.roles[0].name;
      }
      return obj[path] || "";
    }
    return path.split(".").reduce((o, k) => (o ? o[k] : ""), obj);
  };

  const getSortIcon = (col) => {
    if (sortState.col !== col) return null;
    return sortState.dir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <div className="p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-6">
              <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                Master Data
              </div>
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                  {title}
                </h1>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder={showTrashed ? "Cari data yang dihapus..." : "Cari..."}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      id="showTrashed"
                      checked={showTrashed}
                      onCheckedChange={setShowTrashed}
                    />
                    <Label htmlFor="showTrashed" className="text-sm text-gray-600 cursor-pointer">
                      Tampilkan yang dihapus
                    </Label>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={fetchData} 
                    disabled={loading}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    + {title}
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {columns.map((col) => (
                        <th 
                          key={col.key} 
                          className={`px-4 py-4 text-sm font-semibold ${
                            col.key === 'actions' ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100'
                          }`}
                          style={{ 
                            textAlign: col.align || 'left',
                            width: col.width,
                            minWidth: col.minWidth
                          }}
                          onClick={() => col.key !== 'actions' && handleSort(col.key)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {col.key !== 'actions' && getSortIcon(col.key)}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-4 text-sm font-semibold text-center min-w-[120px]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                          Memuat data...
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-b-0">
                          {columns.map((col) => (
                            <td 
                              key={col.key} 
                              className="px-4 py-4 text-sm"
                              style={{ 
                                textAlign: col.align || 'left',
                                wordWrap: 'break-word',
                                maxWidth: col.maxWidth
                              }}
                            >
                              {col.key === 'id' ? (
                                <span className="font-semibold">{getValue(item, col.key)}</span>
                              ) : (
                                getValue(item, col.key)
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-4 text-center">
                            <div className="flex gap-2 justify-center">
                              {!showTrashed ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                                  >
                                    Hapus
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(item.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                                  >
                                    Pulihkan
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleForceDelete(item.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                                  >
                                    Hapus Permanen
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {data.length > 0 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">
                        Menampilkan {currentPage * itemsPerPage - itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data{showTrashed ? ' yang dihapus' : ''}
                      </span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value={5}>5 per halaman</option>
                        <option value={10}>10 per halaman</option>
                        <option value={25}>25 per halaman</option>
                        <option value={50}>50 per halaman</option>
                      </select>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Sebelumnya
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === pageNum
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {customEditComponent === "RolePermissionEditor" ? (
        <div className={`fixed inset-0 bg-black/50 z-50 ${isModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4`}>
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <RolePermissionEditor
                role={editData}
                onSave={(updatedRole) => {
                  setIsModalOpen(false);
                  setEditData(null);
                  fetchData();
                }}
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditData(null);
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <MasterFormModal
          key={editData ? `edit-${editData.id}` : 'add'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditData(null);
            setError(null);
            setSaveLoading(false);
          }}
          onSave={handleSave}
          editData={editData}
          fields={fields}
          title={editData ? `Edit ${title}` : `Tambah ${title}`}
          saveLoading={saveLoading}
          error={error}
        />
      )}
      
      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
}
