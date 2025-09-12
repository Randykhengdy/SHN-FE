import React, { useEffect, useState, useMemo } from "react";
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = showTrashed 
        ? await service.getTrashedPaginated(currentPage, itemsPerPage, debouncedSearchTerm, sortState.col, sortState.dir)
        : await service.getPaginated(currentPage, itemsPerPage, debouncedSearchTerm, sortState.col, sortState.dir);
      
      setData(response.data || []);
      setTotalItems(
        response.pagination?.total || 
        response.meta?.total || 
        response.total || 
        response.data?.length || 
        0
      );
      
      if (response.pagination?.last_page) {
        setLastPageFromAPI(response.pagination.last_page);
      } else {
        setLastPageFromAPI(0);
      }
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
    setLoading(false);
  }, [showTrashed, currentPage, itemsPerPage, debouncedSearchTerm, sortState.col, sortState.dir, service]);

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
    if (sortState.col !== col) {
      return <span className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"><ChevronUp size={14} /></span>;
    }
    return sortState.dir === 'asc' ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-blue-500" />;
  };

  // Gunakan last_page dari response.pagination jika tersedia, jika tidak hitung dari totalItems
  const [lastPageFromAPI, setLastPageFromAPI] = useState(0);
  const totalPages = useMemo(() => 
    lastPageFromAPI > 0 ? lastPageFromAPI : Math.ceil(totalItems / itemsPerPage), 
    [lastPageFromAPI, totalItems, itemsPerPage]
  );

  // Memoize pagination info to prevent unnecessary re-renders
  const paginationInfo = useMemo(() => ({
    start: currentPage * itemsPerPage - itemsPerPage + 1,
    end: Math.min(currentPage * itemsPerPage, totalItems),
    total: totalItems,
    showTrashed
  }), [currentPage, itemsPerPage, totalItems, showTrashed]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md border border-gray-200/60">
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="mb-6">
              <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                Master Data
              </div>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                  {title}
                </h1>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder={showTrashed ? "Cari data yang dihapus..." : "Cari..."}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex-1 min-w-[240px]"
                  />
                  <div className="flex items-center gap-2 ml-2">
                    <Switch
                      id="showTrashed"
                      checked={showTrashed}
                      onCheckedChange={setShowTrashed}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <Label htmlFor="showTrashed" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                      Tampilkan yang dihapus
                    </Label>
                  </div>
                  <Button 
                      variant="outline" 
                      onClick={fetchData} 
                      disabled={loading}
                      className="border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:shadow-sm active:scale-95 group"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                      Refresh
                    </Button>
                  <Button
                     onClick={handleAdd}
                     className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden"
                   >
                     <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-12 bg-white opacity-0 group-hover:opacity-20 group-hover:-translate-x-full"></span>
                     <span className="flex items-center gap-1">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                       </svg>
                       {title}
                     </span>
                   </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0 rounded-lg overflow-hidden">
                  <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm">
                    <tr className="border-b border-gray-200 shadow-sm">
                      {columns.map((col) => (
                        <th 
                          key={col.key} 
                          className={`px-4 py-3 text-sm font-semibold group ${
                            col.key === 'actions' ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100/80 hover:text-blue-600 transition-colors duration-200'
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
                      <th className="px-4 py-3 text-sm font-semibold text-center min-w-[120px] hover:text-blue-600 transition-colors duration-200">
                        <span className="inline-flex items-center gap-1 justify-center">
                          Aksi
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(5).fill(0).map((_, index) => (
                        <tr key={`skeleton-${index}`} className={`animate-pulse border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          {Array(columns.length).fill(0).map((_, colIndex) => (
                            <td key={`skeleton-cell-${index}-${colIndex}`} className="px-4 py-4 whitespace-nowrap">
                              <div 
                                className={`h-4 ${colIndex === 0 ? 'w-8' : 'w-full max-w-[120px]'} bg-gray-200 rounded`}
                                style={{ 
                                  width: colIndex === 0 ? '40px' : '80%',
                                  opacity: 1 - (index * 0.1)
                                }}
                              ></div>
                            </td>
                          ))}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <div className="flex gap-2 justify-center">
                              <div className="h-8 w-16 bg-gray-200 rounded"></div>
                              <div className="h-8 w-16 bg-gray-200 rounded"></div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="bg-gray-100 p-3 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                            <span className="text-gray-500 text-lg font-medium">
                              {showTrashed ? 'Tidak ada data yang dihapus' : 'Tidak ada data'}
                            </span>
                            <p className="text-gray-400 text-sm max-w-md">
                              {showTrashed ? 'Semua data masih aktif dan tersedia.' : 'Silakan tambahkan data baru dengan mengklik tombol di atas.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                        data.map((item, index) => (
                          <tr 
                            key={item.id} 
                            className={`border-b border-gray-100 last:border-b-0 hover:bg-blue-50/70 hover:border-l-4 hover:border-l-blue-500 transition-all duration-200 group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                          {columns.map((col) => (
                            <td 
                              key={col.key} 
                              className="px-4 py-3 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-150"
                              style={{ 
                                textAlign: col.align || 'left',
                                wordWrap: 'break-word',
                                maxWidth: col.maxWidth
                              }}
                            >
                              {getValue(item, col.key)}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-2 justify-center opacity-90 group-hover:opacity-100 transition-opacity duration-200">
                              {!showTrashed ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-white border-yellow-400 transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-yellow-300 focus:ring-offset-1"
                                  >
                                    <span className="flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white border-red-500 transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-red-300 focus:ring-offset-1"
                                  >
                                    <span className="flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Hapus
                                    </span>
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestore(item.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white border-green-500 transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-green-300 focus:ring-offset-1"
                                  >
                                    <span className="flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                      Pulihkan
                                    </span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleForceDelete(item.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white border-red-500 transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-red-300 focus:ring-offset-1"
                                  >
                                    <span className="flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Hapus Permanen
                                    </span>
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
                  <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 rounded-b-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                        Menampilkan <span className="font-semibold text-blue-600">{paginationInfo.start}-{paginationInfo.end}</span> dari <span className="font-semibold text-blue-600">{paginationInfo.total}</span> data{paginationInfo.showTrashed ? ' yang dihapus' : ''}
                      </span>
                      <div className="relative group">
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer appearance-none pr-8 group-hover:border-blue-400 group-hover:shadow-sm"
                        >
                          <option value={5}>5 per halaman</option>
                          <option value={10}>10 per halaman</option>
                          <option value={25}>25 per halaman</option>
                          <option value={50}>50 per halaman</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 group-hover:text-blue-500 transition-colors duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pagination buttons - always show if there's data */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200 flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Sebelumnya
                      </button>
                      
                      {/* Render pagination buttons in a more compact way */}
                      {(() => {
                        // Array to store page numbers to display
                        const pagesToShow = [];
                        
                        // Always show first page
                        pagesToShow.push(1);
                        
                        // Calculate range around current page
                        const rangeStart = Math.max(2, currentPage - 1);
                        const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
                        
                        // Add ellipsis after first page if needed
                        if (rangeStart > 2) {
                          pagesToShow.push('ellipsis1');
                        }
                        
                        // Add pages around current page
                        for (let i = rangeStart; i <= rangeEnd; i++) {
                          pagesToShow.push(i);
                        }
                        
                        // Add ellipsis before last page if needed
                        if (rangeEnd < totalPages - 1) {
                          pagesToShow.push('ellipsis2');
                        }
                        
                        // Always show last page if more than 1 page
                        if (totalPages > 1) {
                          pagesToShow.push(totalPages);
                        }
                        
                        // Return the pagination buttons
                        return pagesToShow.map((page, index) => {
                          // Render ellipsis
                          if (page === 'ellipsis1' || page === 'ellipsis2') {
                            return (
                              <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-sm text-gray-500 font-medium">
                                •••
                              </span>
                            );
                          }
                          
                          // Render page button
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3.5 py-1.5 text-sm font-medium border rounded-md transition-all duration-200 ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200 flex items-center gap-1"
                      >
                        Selanjutnya
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
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
