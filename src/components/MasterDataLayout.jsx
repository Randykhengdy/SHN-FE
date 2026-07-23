import React, { useEffect, useState, useMemo } from "react";
import MasterFormModal from "./MasterFormModal";
import Header from "./Header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RefreshCw, ChevronUp, ChevronDown, MoreVertical } from "lucide-react";
import RolePermissionEditor from "./RolePermissionEditor";
import { useAlert } from "@/hooks/useAlert";
import { useAppContext } from "@/context/AppContext";

export default function MasterDataLayout({
  title,
  columns,
  fields,
  service,
  customEditComponent,
  customActions,
  customHeaderButtons,
  customHeaderContent,
  getRowClassName,
  validate,
  preprocess,
  filterConfig,
  modalSize,
  selection,
  renderRow,
  menuCode = 'MASTER_DATA',
  canDelete: customCanDelete,
  canUpdate: customCanUpdate,
  extraFilters = {},
  customFilterSection = null,
}) {
  const { showConfirm, showAlert, AlertComponent } = useAlert();
  const { hasPermission } = useAppContext();
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
  const [filterValue, setFilterValue] = useState(filterConfig?.defaultValue || "semua");
  const [activeRowDropdown, setActiveRowDropdown] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveRowDropdown(null);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const [hiddenColumns, setHiddenColumns] = useState([]);

  const displayedColumns = useMemo(() => {
    return columns.filter(col => !hiddenColumns.includes(col.key));
  }, [columns, hiddenColumns]);
  const canCreate = hasPermission && hasPermission(menuCode, 'Create');
  const canUpdate = customCanUpdate !== undefined ? customCanUpdate : (hasPermission && hasPermission(menuCode, 'Update'));
  const canDelete = customCanDelete !== undefined ? customCanDelete : (hasPermission && hasPermission(menuCode, 'Delete'));

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const extraFiltersStr = JSON.stringify(extraFilters);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const filters = extraFilters ? JSON.parse(extraFiltersStr) : {};
      if (filterConfig && filterValue && String(filterValue).toLowerCase() !== 'semua') {
        filters[filterConfig.param || 'tipe_gudang'] = filterValue;
      }
      const response = showTrashed
        ? await service.getTrashedPaginated(currentPage, itemsPerPage, debouncedSearchTerm, sortState.col, sortState.dir)
        : await service.getPaginated(currentPage, itemsPerPage, debouncedSearchTerm, sortState.col, sortState.dir, filters);
      const rows = response.data || [];
      setData(rows);
      const serverTotal = response.pagination?.total || response.meta?.total || response.total || response.data?.length || 0;
      setTotalItems(serverTotal);

      if (response.pagination?.last_page) {
        setLastPageFromAPI(response.pagination.last_page);
      } else {
        setLastPageFromAPI(0);
      }
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
    setLoading(false);
  }, [showTrashed, currentPage, itemsPerPage, debouncedSearchTerm, sortState.col, sortState.dir, service, filterValue, extraFiltersStr]);

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
      let processedFormData = { ...formData };

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
        if (typeof preprocess === 'function') {
          processedFormData = preprocess(processedFormData, editData) || processedFormData;
        }
        await service.update(editData.id, processedFormData);
        console.log("✅ Data berhasil diupdate:", processedFormData);
      } else {
        if (typeof validate === 'function') {
          const msg = validate(processedFormData);
          if (msg) {
            setError(msg);
            setSaveLoading(false);
            return;
          }
        }
        if (typeof preprocess === 'function') {
          processedFormData = preprocess(processedFormData, null) || processedFormData;
        }
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
        try {
          await service.forceDelete(id);
          fetchData();
        } catch (error) {
          console.error("Force delete error:", error);
          showAlert("Gagal Menghapus", error.message || "Data tidak dapat dihapus karena terkait dengan data lain.", "error");
        }
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
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </span>
                    {title}
                  </h1>

                  {/* Custom Header Content (e.g. Tabs/Toggles) */}
                  {customHeaderContent && (
                    <div className="mt-2 sm:mt-0 sm:ml-2">
                      {customHeaderContent}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <input
                    type="text"
                    placeholder={showTrashed ? "Cari data yang dihapus..." : "Cari..."}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex-1 min-w-[200px]"
                  />
                  {filterConfig && (
                    <div className="relative group">
                      <select
                        value={filterValue}
                        onChange={(e) => {
                          setFilterValue(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer appearance-none pr-8 group-hover:border-blue-400 group-hover:shadow-sm"
                      >
                        {(filterConfig.options || [
                          { value: 'semua', label: 'Semua' },
                          { value: 'gudang', label: 'Gudang' },
                          { value: 'rak', label: 'Rak' },
                          { value: 'bin', label: 'Bin' },
                        ]).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 group-hover:text-blue-500 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  )}
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
                  {/* Column Visibility Dropdown */}
                  <div className="relative group/col-dropdown">
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <span className="flex items-center gap-2">
                        Kolom
                        <ChevronDown size={16} className="text-gray-500" />
                      </span>
                    </Button>

                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover/col-dropdown:opacity-100 group-hover/col-dropdown:visible transition-all duration-200 z-50 transform origin-top-right scale-95 group-hover/col-dropdown:scale-100 flex flex-col p-2 gap-1 overflow-y-auto max-h-[60vh]">
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">
                        Tampilkan Kolom
                      </div>
                      {columns.map((col) => {
                        if (col.key === 'actions' || !col.label) return null;
                        const isChecked = !hiddenColumns.includes(col.key);
                        return (
                          <label
                            key={col.key}
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer select-none transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  if (columns.filter(c => c.key !== 'actions' && !hiddenColumns.includes(c.key)).length <= 1) {
                                    return;
                                  }
                                  setHiddenColumns([...hiddenColumns, col.key]);
                                } else {
                                  setHiddenColumns(hiddenColumns.filter(k => k !== col.key));
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2.5 cursor-pointer accent-blue-600"
                            />
                            {col.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative group/dropdown">
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <span className="flex items-center gap-2">
                        Aksi Lainnya
                        <ChevronDown size={16} className="text-gray-500" />
                      </span>
                    </Button>

                    <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 z-50 transform origin-top-right scale-95 group-hover/dropdown:scale-100 flex flex-col p-2 gap-1 overflow-y-auto max-h-[80vh]">

                      {/* 1. Tambah Action (if has permission) */}
                      {canCreate && (
                        <button
                          onClick={(e) => {
                            handleAdd();
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur();
                            }
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Tambah {title}
                        </button>
                      )}

                      {/* 2. Refresh Button */}
                      <button
                        onClick={(e) => {
                          fetchData();
                          if (document.activeElement instanceof HTMLElement) {
                            document.activeElement.blur();
                          }
                        }}
                        disabled={loading}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <RefreshCw className={`h-4 w-4 mr-3 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>

                      {/* Custom Header Buttons loop */}
                      {customHeaderButtons && customHeaderButtons.map((button, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            button.onClick(e, fetchData);
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur();
                            }
                          }}
                          disabled={button.disabled}
                          className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${button.disabled
                            ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                            : button.className?.includes("bg-red") || button.className?.includes("text-red")
                              ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                              : button.className?.includes("bg-green") || button.className?.includes("text-green")
                                ? "text-green-700 hover:bg-green-50 hover:text-green-800"
                                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                        >
                          {button.icon && (
                            <span className={`mr-3 ${button.disabled ? 'opacity-50' : ''
                              }`}>
                              {React.cloneElement(button.icon, {
                                className: `h-4 w-4 ${button.icon.props.className || ''}`
                              })}
                            </span>
                          )}
                          {button.label}
                        </button>
                      ))}

                    </div>
                  </div>
                </div>
              </div>
            </div>

            {customFilterSection && (
              <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm p-4 mb-4">
                {customFilterSection}
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="overflow-auto min-h-[250px]">
                <table className="w-full border-separate border-spacing-0 rounded-lg">
                  <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm">
                    <tr className="border-b border-gray-200 shadow-sm">
                      {selection ? (
                        <th
                          className={`px-4 py-3 text-sm font-semibold cursor-default text-center min-w-[64px]`}
                          style={{ width: '4rem', minWidth: '4rem' }}
                        >
                          {selection.headerLabel || 'Pilih'}
                        </th>
                      ) : null}
                      {displayedColumns.map((col) => (
                        <th
                          key={col.key}
                          className={`px-4 py-3 text-sm font-semibold group whitespace-nowrap ${col.key === 'actions' ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100/80 hover:text-blue-600 transition-colors duration-200'
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
                      <th className="px-4 py-3 text-sm font-semibold text-left min-w-[120px] whitespace-nowrap hover:text-blue-600 transition-colors duration-200">
                        <span className="inline-flex items-center gap-1 justify-start">
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
                          {selection ? (
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                              <div className="h-4 w-4 bg-gray-200 rounded"></div>
                            </td>
                          ) : null}
                          {Array(displayedColumns.length).fill(0).map((_, colIndex) => (
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
                        <td colSpan={(displayedColumns.length + 1) + (selection ? 1 : 0)} className="px-6 py-16 text-center">
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
                      data.map((item, index) => {
                        const baseClassName = `border-b border-gray-100 last:border-b-0 hover:bg-blue-50/70 hover:border-l-4 hover:border-l-blue-500 transition-all duration-200 group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`;
                        const customClassName = getRowClassName ? getRowClassName(item, index) : '';

                        const renderActionsCell = () => {
                          const hasActions = (!showTrashed && customActions && customActions.length > 0) || canUpdate || canDelete;
                          if (!hasActions) return <td className="px-4 py-3 text-left"></td>;

                          const isOpen = activeRowDropdown === item.id;
                          const openUpward = index >= data.length - 2 && data.length > 2;

                          return (
                            <td className={`px-4 py-3 text-left relative ${isOpen ? 'z-50' : ''}`}>
                              <div className="relative inline-block text-left">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveRowDropdown(isOpen ? null : item.id);
                                  }}
                                  className="h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100/80 rounded-md border border-gray-300 transition-colors"
                                >
                                  <MoreVertical size={16} className="text-gray-500" />
                                </Button>

                                {isOpen && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 py-1 ${openUpward ? 'bottom-full mb-1 origin-bottom-right' : 'top-full mt-1 origin-top-right'
                                      }`}
                                    style={{
                                      minWidth: '12rem',
                                    }}
                                  >
                                    {!showTrashed && customActions && customActions.map((action, idx) => {
                                      if (typeof action.visible === 'function' && !action.visible(item)) return null;

                                      const computedIcon = typeof action.icon === 'function' ? action.icon(item) : action.icon;
                                      const computedLabel = typeof action.label === 'function' ? action.label(item) : action.label;
                                      const computedClassName = typeof action.className === 'function' ? action.className(item) : action.className;

                                      const isDanger = computedClassName?.includes("bg-red") || computedClassName?.includes("text-red");
                                      const isWarning = computedClassName?.includes("bg-orange") || computedClassName?.includes("text-orange");

                                      let itemClass = "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 text-left";
                                      if (isDanger) {
                                        itemClass = "flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 text-left";
                                      } else if (isWarning) {
                                        itemClass = "flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors duration-150 text-left";
                                      }

                                      return (
                                        <button
                                          key={idx}
                                          onClick={(e) => {
                                            setActiveRowDropdown(null);
                                            action.onClick(item, fetchData);
                                          }}
                                          className={itemClass}
                                        >
                                          {computedIcon && (
                                            <span className="mr-2.5 flex-shrink-0 text-gray-500">
                                              {React.cloneElement(computedIcon, { className: "h-4 w-4" })}
                                            </span>
                                          )}
                                          <span>{computedLabel}</span>
                                        </button>
                                      );
                                    })}

                                    {!showTrashed ? (
                                      <>
                                        {canUpdate && (
                                          <button
                                            onClick={(e) => {
                                              setActiveRowDropdown(null);
                                              handleEdit(item);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 text-left"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                          </button>
                                        )}
                                        {canDelete && (
                                          <button
                                            onClick={(e) => {
                                              setActiveRowDropdown(null);
                                              handleDelete(item.id);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 text-left"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Hapus
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {canDelete && (
                                          <button
                                            onClick={(e) => {
                                              setActiveRowDropdown(null);
                                              handleRestore(item.id);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors duration-150 text-left"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Pulihkan
                                          </button>
                                        )}
                                        {canDelete && (
                                          <button
                                            onClick={(e) => {
                                              setActiveRowDropdown(null);
                                              handleForceDelete(item.id);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 text-left"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Hapus Permanen
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        };

                        const renderSelectionCell = () => {
                          if (!selection) return null;
                          const visible = typeof selection.visible === 'function' ? selection.visible(item) : true;
                          if (!visible) return <td className="px-4 py-3"></td>;
                          const checked = typeof selection.isSelected === 'function' ? !!selection.isSelected(item) : false;
                          return (
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => selection.onToggle && selection.onToggle(item)}
                                className="h-4 w-4 cursor-pointer accent-blue-600"
                              />
                            </td>
                          );
                        };

                        if (renderRow) {
                          return (
                            <React.Fragment key={item.id}>
                              {renderRow({
                                item,
                                index,
                                baseClassName,
                                customClassName,
                                renderActionsCell,
                                renderSelectionCell,
                                columns,
                                getValue,
                                showTrashed,
                                permissions: { canUpdate, canDelete },
                                handlers: { handleEdit, handleDelete, handleRestore, handleForceDelete }
                              })}
                            </React.Fragment>
                          );
                        }

                        const isDropdownOpen = activeRowDropdown === item.id;
                        return (
                          <tr
                            key={item.id}
                            className={`${baseClassName} ${customClassName} ${isDropdownOpen ? 'relative z-30' : ''}`}
                            style={isDropdownOpen ? { zIndex: 30, position: 'relative' } : undefined}
                          >
                            {renderSelectionCell()}
                            {displayedColumns.map((col) => {
                              // Gunakan custom getValue jika ada, jika tidak gunakan default
                              const value = col.getValue
                                ? col.getValue(item)
                                : getValue(item, col.key);
                              // Gunakan custom getCellClassName jika ada
                              const cellClassName = col.getCellClassName
                                ? col.getCellClassName(item)
                                : '';

                              let displayValue = value;
                              if (col.render) {
                                displayValue = col.render(value, item);
                              } else if (col.format === 'datetime' && value) {
                                const d = new Date(value);
                                if (!isNaN(d.getTime())) {
                                  displayValue = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
                                }
                              } else if (col.format === 'number' && typeof value === 'number') {
                                displayValue = value.toLocaleString('id-ID');
                              } else if (col.format === 'boolean') {
                                displayValue = value ? 'Ya' : 'Tidak';
                              }

                              return (
                                <td
                                  key={col.key}
                                  className={`px-4 py-3 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-150 ${cellClassName}`}
                                  style={{
                                    textAlign: col.align || 'left',
                                    wordWrap: 'break-word',
                                    maxWidth: col.maxWidth
                                  }}
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                            {renderActionsCell()}
                          </tr>
                        );
                      })
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
                      {(() => {
                        if (!selection) return null;
                        const selectedCount = Number(selection.selectedCount || 0);
                        return (
                          <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
                            Dipilih: <span className="font-semibold">{selectedCount}</span>
                          </span>
                        );
                      })()}
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
                      {(() => {
                        if (!selection || !(selection.batchAction && Number(selection.selectedCount || 0) > 0)) return null;
                        return (
                          <Button
                            variant="outline"
                            onClick={() => selection.batchAction()}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-all duration-200 hover:shadow-sm"
                          >
                            Cetak QR Batch
                          </Button>
                        );
                      })()}
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
                              className={`px-3.5 py-1.5 text-sm font-medium border rounded-md transition-all duration-200 ${currentPage === page
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
      {
        customEditComponent === "RolePermissionEditor" ? (
          <div className={`fixed inset-0 bg-black/50 z-50 ${isModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4`}>
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
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
            size={modalSize}
          />
        )
      }

      {/* Alert Component */}
      <AlertComponent />
    </div >
  );
}
