import React, { useEffect, useState } from "react";
import MasterFormModal from "./MasterFormModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, ChevronUp, ChevronDown } from "lucide-react";

export default function MasterDataLayout({
  title,
  columns,
  fields,
  service,
}) {
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

  const fetchData = async () => {
    setLoading(true);
    try {
      if (showTrashed) {
        const response = await service.getTrashedPaginated(
          currentPage, 
          itemsPerPage, 
          searchTerm, 
          sortState.col, 
          sortState.dir
        );
        setData(response.data);
        setTotalItems(response.meta?.total || response.data.length);
      } else {
        const response = await service.getPaginated(
          currentPage, 
          itemsPerPage, 
          searchTerm, 
          sortState.col, 
          sortState.dir
        );
        setData(response.data);
        setTotalItems(response.meta?.total || response.data.length);
      }
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [showTrashed, currentPage, itemsPerPage, searchTerm, sortState]);

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
      if (editData) {
        await service.update(editData.id, formData);
        console.log("✅ Data berhasil diupdate:", formData);
      } else {
        await service.create(formData);
        console.log("✅ Data berhasil ditambahkan:", formData);
      }
      setIsModalOpen(false);
      setEditData(null); // Clear edit data
      fetchData();
    } catch (error) {
      console.error("❌ Error saat menyimpan data:", error);
      // Tampilkan error message yang spesifik dari API
      setError(error.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus data ini?")) {
      await service.softDelete(id);
      fetchData();
    }
  };

  const handleRestore = async (id) => {
    await service.restore(id);
    fetchData();
  };

  const handleForceDelete = async (id) => {
    if (confirm("Yakin ingin menghapus permanen data ini?")) {
      await service.forceDelete(id);
      fetchData();
    }
  };

  const handleSort = (col) => {
    if (sortState.col !== col) {
      setSortState({ col, dir: 'asc' });
    } else if (sortState.dir === 'asc') {
      setSortState({ col, dir: 'desc' });
    } else if (sortState.dir === 'desc') {
      setSortState({ col, dir: 'asc' });
    }
    // Server-side sorting will be handled by useEffect
  };

  const getSortedData = () => {
    if (!sortState.col) return data;
    
    return [...data].sort((a, b) => {
      const aVal = getValue(a, sortState.col);
      const bVal = getValue(b, sortState.col);
      
      if (sortState.dir === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  // Server-side pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearForm = () => {
    setEditData(null);
    setError(null);
  };

  const getValue = (obj, path) => {
    return path.split(".").reduce((o, k) => (o ? o[k] : ""), obj);
  };

  const getSortIcon = (col) => {
    if (sortState.col !== col) return null;
    return sortState.dir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const getAlignmentStyle = (col) => {
    const alignment = col.align || 'left';
    return { textAlign: alignment };
  };

  const getColumnWidth = (col) => {
    if (col.width) return { width: col.width };
    if (col.minWidth) return { minWidth: col.minWidth };
    
    // Default widths based on column key
    switch (col.key) {
      case 'id':
        return { minWidth: '5rem' };
      case 'kode':
        return { minWidth: '8rem' };
      default:
        return {};
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Main Card Container */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
              Master Data
            </div>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800" style={{ color: '#2c3e50' }}>
                {title}
              </h1>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder={showTrashed ? "Cari data yang dihapus..." : "Cari..."}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 cursor-pointer">
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
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleAdd}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors"
                >
                  <span>+ {title}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200" style={{ backgroundColor: '#f8f8f8' }}>
                    {columns.map((col) => (
                      <th 
                        key={col.key} 
                        className={`px-4 py-4 text-sm font-semibold cursor-pointer hover:bg-gray-100 transition-colors ${
                          col.key === 'actions' ? 'cursor-default' : ''
                        }`}
                        style={{ 
                          color: '#333333', 
                          ...getAlignmentStyle(col),
                          ...getColumnWidth(col)
                        }}
                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                      >
                        <div style={{ ...getAlignmentStyle(col), display: 'flex', alignItems: 'center', gap: '4px', justifyContent: getAlignmentStyle(col).textAlign === 'center' ? 'center' : getAlignmentStyle(col).textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                          {col.label}
                          {col.key !== 'actions' && getSortIcon(col.key)}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-4 text-sm font-semibold" style={{ color: '#333333', textAlign: 'center', minWidth: '120px' }}>
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
                    data.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        {columns.map((col) => (
                          <td key={col.key} className={`px-4 py-4 text-sm`} style={{ 
                            color: '#333333', 
                            ...getAlignmentStyle(col),
                            wordWrap: 'break-word',
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            maxWidth: col.maxWidth || 'none'
                          }}>
                            {col.key === 'id' ? (
                              <span className="font-semibold" style={{ color: '#333333' }}>
                                {getValue(item, col.key)}
                              </span>
                            ) : (
                              getValue(item, col.key)
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-4" style={{ textAlign: 'center' }}>
                          <div className="flex gap-2">
                            {!showTrashed ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                  className="text-white px-4 py-2 cursor-pointer transition-colors duration-200"
                                  style={{ 
                                    backgroundColor: '#fcd34d', 
                                    borderColor: '#fcd34d',
                                    ':hover': { backgroundColor: '#f59e0b' }
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f59e0b';
                                    e.target.style.borderColor = '#f59e0b';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#fcd34d';
                                    e.target.style.borderColor = '#fcd34d';
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-white px-4 py-2 cursor-pointer transition-colors duration-200"
                                  style={{ 
                                    backgroundColor: '#ef4444', 
                                    borderColor: '#ef4444'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#dc2626';
                                    e.target.style.borderColor = '#dc2626';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ef4444';
                                    e.target.style.borderColor = '#ef4444';
                                  }}
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
                                  className="text-white px-4 py-2 cursor-pointer transition-colors duration-200"
                                  style={{ 
                                    backgroundColor: '#10b981', 
                                    borderColor: '#10b981'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#059669';
                                    e.target.style.borderColor = '#059669';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#10b981';
                                    e.target.style.borderColor = '#10b981';
                                  }}
                                >
                                  Pulihkan
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleForceDelete(item.id)}
                                  className="text-white px-4 py-2 cursor-pointer transition-colors duration-200"
                                  style={{ 
                                    backgroundColor: '#ef4444', 
                                    borderColor: '#ef4444'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#dc2626';
                                    e.target.style.borderColor = '#dc2626';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#ef4444';
                                    e.target.style.borderColor = '#ef4444';
                                  }}
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
              
              {/* Pagination Controls */}
              {data.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Menampilkan {currentPage * itemsPerPage - itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} data{showTrashed ? ' yang dihapus' : ''}
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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
                        onClick={() => handlePageChange(currentPage - 1)}
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
                            onClick={() => handlePageChange(pageNum)}
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
                        onClick={() => handlePageChange(currentPage + 1)}
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

      <MasterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={editData}
        fields={fields}
        title={editData ? `Edit ${title}` : `Tambah ${title}`}
        saveLoading={saveLoading}
        error={error}
        onSaveSuccess={clearForm}
      />
    </div>
  );
}
