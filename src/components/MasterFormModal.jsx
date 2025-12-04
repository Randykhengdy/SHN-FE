import React, { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuthErrorAlert from "@/components/AuthErrorAlert";

/**
 * MasterFormModal – konfigurasi field dapat menerima opsi lanjutan untuk konten dan perilaku custom
 *
 * Field properties yang didukung (opsional):
 * - type: "select" | "text" | dll
 * - options: Array<{ value, label }>
 * - optionsService: { getAll: () => Promise<{ data: any[] }> }
 * - optionsLoader(form): Promise<any[] | { data: any[] }>
 *   Memuat opsi berdasar state form saat ini (cascading dropdown)
 * - optionLabel: string
 *   Nama properti label pada item opsi ketika tidak menggunakan { value, label }
 * - showIf(form): boolean
 *   Mengontrol visibilitas field berdasar state form
 * - onChangeForm(nextForm, value): object
 *   Mutasi state form ketika nilai field berubah (mis. reset parent saat tipe berubah)
 * - dropdownExtra({ form, options, onSelect }): ReactNode
 *   Render konten tambahan di panel dropdown (catatan, tombol cepat, dsb.)
 *
 * Contoh (Gudang):
 * {
 *   name: "tipe_gudang", type: "select", options: [
 *     { value: "gudang", label: "Gudang" },
 *     { value: "rak", label: "Rak" },
 *     { value: "bin", label: "Bin" },
 *   ],
 *   onChangeForm: (form, val) => ({ ...form, gudang_id: val === 'gudang' ? '' : form.gudang_id, rak_id: val !== 'bin' ? '' : form.rak_id })
 * }
 * {
 *   name: "gudang_id", type: "select", optionLabel: "nama_gudang",
 *   showIf: (f) => f.tipe_gudang === 'rak',
 *   optionsLoader: async () => gudangService.getAll({ tipe: 'gudang' }),
 *   dropdownExtra: ({ options }) => (<div className="text-xs text-gray-500">Pilih gudang induk{options.length ? '' : ', tidak ada gudang'}.</div>)
 * }
 * {
 *   name: "rak_id", type: "select", optionLabel: "nama_rak",
 *   showIf: (f) => f.tipe_gudang === 'bin',
 *   optionsLoader: async () => gudangService.getAll({ tipe: 'rak' })
 * }
 */

export default function MasterFormModal({
  isOpen,
  onClose,
  editData,
  fields,
  title,
  onSave,
  saveLoading = false,
  error = null,
  onSaveSuccess = null,
  size = undefined,
}) {
  const [form, setForm] = useState({});
  const [options, setOptions] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [authError, setAuthError] = useState(false);
  const sizeClass = !size
    ? 'sm:max-w-4xl lg:max-w-6xl'
    : size === 's'
      ? 'max-w-md'
      : size === 'm'
        ? 'max-w-2xl'
        : size === 'l'
          ? 'max-w-4xl'
          : 'max-w-[90vw]';
  const heightClass = size === 'xl' ? 'min-h-[75vh]' : '';

  useEffect(() => {
    if (isOpen && !editData) {
      setForm(prev => (prev && Object.keys(prev).length === 0 ? prev : {}));
      setOptions({});
      setSearchTerms({});
      setOpenDropdowns({});
    }
  }, [isOpen, editData]);

  useEffect(() => {
    const loadOptions = async () => {
      const newOptions = {};
      for (const field of fields) {
        if (field.type === "select") {
          if (editData && field.disabledOnEdit) {
            continue;
          }
          if (field.optionsLoader) {
            const visible = !field.showIf || (typeof field.showIf === 'function' ? !!field.showIf(form) : true);
            if (!visible) {
              continue;
            }
            try {
              const res = await field.optionsLoader(form);
              newOptions[field.name] = (res?.data) || res || [];
            } catch (error) {
              console.error(`❌ Error loading options via loader for ${field.name}:`, error);
              if (error.message?.includes('Token tidak valid') || error.message?.includes('401') || error.message?.includes('Session expired')) {
                setAuthError(true);
              }
              newOptions[field.name] = [];
            }
          } else if (field.optionsService) {
            try {
              const res = await field.optionsService.getAll();
              newOptions[field.name] = res.data || [];
              console.log(`✅ Loaded ${newOptions[field.name].length} options for ${field.name}`);
            } catch (error) {
              console.error(`❌ Error loading options for ${field.name}:`, error);
              if (error.message.includes('Token tidak valid') || error.message.includes('401') || error.message.includes('Session expired')) {
                console.error('🔐 Authentication error - user needs to login again');
                setAuthError(true);
              }
              newOptions[field.name] = [];
            }
          } else if (field.options) {
            newOptions[field.name] = field.options;
          }
        }
      }
      setOptions(newOptions);
    };
    if (isOpen) {
      loadOptions();
    }
  }, [fields, isOpen, form]);


  useEffect(() => {
    if (!isOpen || !editData) return;
    const initialForm = {};
    fields.forEach((field) => {
      if (field.hideOnEdit) return;
      if (typeof field.mapFromEdit === 'function') {
        try {
          // Panggil mapFromEdit tanpa side effects
          const mapped = field.mapFromEdit(editData);
          initialForm[field.name] = mapped !== undefined && mapped !== null ? String(mapped) : "";
        } catch (_) {
          initialForm[field.name] = String(editData[field.name] || "");
        }
      } else if (field.type === "select") {
        if (field.name === "role") {
          if (editData.roles && editData.roles.length > 0) {
            initialForm[field.name] = String(editData.roles[0].id);
          } else {
            initialForm[field.name] = String(editData[field.name] || "");
          }
        } else {
          initialForm[field.name] = String(editData[field.name] || "");
        }
      } else {
        initialForm[field.name] = editData[field.name] || "";
      }
    });
    setForm(initialForm);
  }, [isOpen, editData, fields]);

  // Set lebar menjadi 0 jika dimensi adalah 1D (setelah options di-load)
  useEffect(() => {
    if (!isOpen) return;
    // Cari field bentuk_barang_id dan lebar
    const bentukBarangField = fields.find(f => f.name === 'bentuk_barang_id');
    const lebarField = fields.find(f => f.name === 'lebar');
    
    if (bentukBarangField && lebarField && form.bentuk_barang_id && options.bentuk_barang_id) {
      // Cari dimensi dari options yang sudah di-load
      const selectedOption = options.bentuk_barang_id.find(opt => 
        String(opt.id || opt.value) === String(form.bentuk_barang_id)
      );
      const dimensi = selectedOption?.dimensi;
      
      // Set lebar menjadi 0 jika dimensi adalah 1D dan lebar belum 0
      if (dimensi === "1D") {
        const currentLebar = String(form.lebar || "");
        if (currentLebar !== "0" && currentLebar !== "") {
          setForm(prev => ({ ...prev, lebar: "0", _bentuk_barang_dimensi: dimensi }));
        } else if (!form._bentuk_barang_dimensi) {
          setForm(prev => ({ ...prev, _bentuk_barang_dimensi: dimensi }));
        }
      }
    }
  }, [isOpen, form.bentuk_barang_id, options.bentuk_barang_id]);

  useEffect(() => {
    if (!isOpen || !editData) return;
    const prefetch = async () => {
      for (const field of fields) {
        if (field.type === 'select' && typeof field.prefetchById === 'function') {
          const selectedId = form[field.name];
          if (!selectedId) continue;
          try {
            const res = await field.prefetchById(selectedId);
            const item = res?.data || res;
            if (item) {
              setOptions(prev => {
                const current = prev[field.name] || [];
                const exists = current.some((opt) => String(opt.id || opt.value) === String(selectedId));
                return {
                  ...prev,
                  [field.name]: exists ? current : [item, ...current]
                };
              });
            }
          } catch (_) {}
        }
      }
    };
    prefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value, field) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (field && typeof field.onChangeForm === 'function') {
        try {
          const mutated = field.onChangeForm(next, value);
          if (mutated && typeof mutated === 'object') return mutated;
        } catch (_) {}
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Set lebar menjadi 0 jika hidden (dimensi 1D)
    let submitForm = { ...form };
    const lebarField = fields.find(f => f.name === 'lebar');
    if (lebarField && lebarField.hidden) {
      const isHidden = typeof lebarField.hidden === 'function' ? lebarField.hidden(form) : lebarField.hidden;
      if (isHidden) {
        submitForm.lebar = "0";
      }
    }
    onSave(submitForm);
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log("🎯 Click detected:", event.target);
      // Close all dropdowns if clicking outside any dropdown
      if (!event.target.closest('.dropdown-container')) {
        console.log("🎯 Clicking outside, closing dropdowns");
        setOpenDropdowns({});
        setSearchTerms({}); // Also clear search terms
      } else {
        console.log("🎯 Clicking inside dropdown container");
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenDropdowns({});
        setSearchTerms({});
      }
    };

    if (Object.values(openDropdowns).some(Boolean)) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [openDropdowns]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-none ${sizeClass} ${heightClass} max-h-[90vh] overflow-visible ${size === 'xl' ? 'w-[95vw]' : ''}` }>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {authError && (
            <AuthErrorAlert 
              onRefresh={() => {
                setAuthError(false);
                // Reload options
                const loadOptions = async () => {
                  const newOptions = {};
                  for (const field of fields) {
                    if (field.type === "select" && field.optionsService) {
                      try {
                        const res = await field.optionsService.getAll();
                        newOptions[field.name] = res.data || [];
                      } catch (error) {
                        console.error(`Error reloading options for ${field.name}:`, error);
                        newOptions[field.name] = [];
                      }
                    }
                  }
                  setOptions(newOptions);
                };
                loadOptions();
              }}
              onLogin={() => {
                // Support both hash routing and regular routing
                if (window.location.hash) {
                  window.location.hash = '#/';
                } else {
                  window.location.href = '/';
                }
              }}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => {
              // Skip fields that should be hidden on edit
              if (editData && field.hideOnEdit) {
                return null;
              }
              if (field.showIf && typeof field.showIf === 'function') {
                try {
                  const visible = field.showIf(form);
                  if (!visible) return null;
                } catch (_) {
                  return null;
                }
              }
              
              // Check if field is hidden
              const isHidden = field.hidden && (
                typeof field.hidden === 'function' ? field.hidden(form) : field.hidden
              );
              
              return (
              <div key={field.name} className={`space-y-2 ${field.colSpan === 2 ? 'md:col-span-2' : ''} ${isHidden ? 'hidden' : ''}`}>
              <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
              </Label>

              {field.type === "select" ? (
                <div className="relative dropdown-container">
                  {editData && field.disabledOnEdit ? (
                    <div className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ${'border-gray-300 bg-gray-50'} cursor-default`}>
                      <span>{(field.editLabel && typeof field.editLabel === 'function') ? field.editLabel(editData, form) : (String(editData[field.name] || ''))}</span>
                      <svg className="h-4 w-4 opacity-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  ) : (
                  <button
                    type="button"
                    className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      openDropdowns[field.name] 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-white'
                    } ${editData && field.disabledOnEdit ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-gray-50'}`}
                    disabled={!!(editData && field.disabledOnEdit)}
                    onClick={() => {
                      console.log("🔥 Button clicked for field:", field.name);
                      // Close other dropdowns and toggle current one
                      if (editData && field.disabledOnEdit) return;
                      setOpenDropdowns(prev => {
                        console.log("📋 Previous dropdowns state:", prev);
                        const newState = { [field.name]: !prev[field.name] };
                        console.log("📋 New dropdowns state:", newState);
                        return newState;
                      });
                      // Clear search terms for other fields
                      setSearchTerms(prev => ({
                        ...prev,
                        [field.name]: prev[field.name] || ""
                      }));
                    }}
                  >
                    <span>
                      {form[field.name] 
                        ? (() => {
                            const option = options[field.name]?.find((opt) => {
                              // Handle both static options (value/label) and service options (id/optionLabel)
                              if (opt.value !== undefined) {
                                return String(opt.value) === form[field.name];
                              } else {
                                return String(opt.id) === form[field.name];
                              }
                            });
                            return option ? (option.label || option[field.optionLabel || "name"] || "N/A") : `Pilih ${field.label}`;
                          })()
                        : `Pilih ${field.label}`}
                    </span>
                    <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  )}
                  
                  {openDropdowns[field.name] && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
                      <div className="p-2">
                        <input
                          type="text"
                          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Cari ${field.label.toLowerCase()}...`}
                          value={searchTerms[field.name] || ""}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, [field.name]: e.target.value }))}
                        />
                      </div>
                      <div className="max-h-48 overflow-auto">
                        {options[field.name] && options[field.name].length > 0 ? (
                          options[field.name]
                            ?.filter(option => {
                              if (!searchTerms[field.name]) return true;
                              
                              const optionText = option.label || option[field.optionLabel || "name"];
                              if (!optionText) return false;
                              
                              return optionText
                                .toLowerCase()
                                .includes(searchTerms[field.name].toLowerCase());
                            })
                            ?.map((option) => (
                              <div
                                key={option.id || option.value}
                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${
                                  form[field.name] === String(option.id || option.value) ? 'bg-blue-50 text-blue-600' : ''
                                }`}
                                onClick={() => {
                                  handleSelectChange(field.name, String(option.id || option.value), field);
                                  setOpenDropdowns(prev => ({ ...prev, [field.name]: false }));
                                  setSearchTerms(prev => ({ ...prev, [field.name]: "" }));
                                }}
                              >
                                {option.label || option[field.optionLabel || "name"] || "N/A"}
                              </div>
                            ))
                        ) : null}
                      </div>
                      {field.dropdownExtra && (
                        <div className="border-t px-3 py-2">
                          {field.dropdownExtra({
                            form,
                            options: options[field.name] || [],
                            onSelect: (option) => {
                              handleSelectChange(field.name, String(option.id || option.value), field);
                              setOpenDropdowns(prev => ({ ...prev, [field.name]: false }));
                              setSearchTerms(prev => ({ ...prev, [field.name]: "" }));
                            }
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  value={form[field.name] || ""}
                  onChange={handleChange}
                  className="w-full"
                  required={isHidden ? false : (editData && field.hideOnEdit ? false : field.required)}
                  maxLength={field.maxLength}
                />
              )}
            </div>
          );
          })}
          </div>

          {error && (
            <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-md">
              ❌ {error}
            </div>
          )}
          
          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={saveLoading}>
              {saveLoading ? "Menyimpan..." : (editData ? "Update" : "Simpan")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
