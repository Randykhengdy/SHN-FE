import React, { useEffect, useState } from "react";
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
}) {
  const [form, setForm] = useState({});
  const [options, setOptions] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [openDropdowns, setOpenDropdowns] = useState({});

  useEffect(() => {
    const loadOptions = async () => {
      const newOptions = {};
      for (const field of fields) {
        if (field.type === "select") {
          if (field.optionsService) {
            // Load options from service
            try {
              const res = await field.optionsService.getAll();
              newOptions[field.name] = res.data;
            } catch (error) {
              console.error(`Error loading options for ${field.name}:`, error);
              newOptions[field.name] = [];
            }
          } else if (field.options) {
            // Use static options array
            newOptions[field.name] = field.options;
          }
        }
      }
      setOptions(newOptions);
    };
    
    if (isOpen) {
      loadOptions();
    }
  }, [fields, isOpen]);

  useEffect(() => {
    const initialForm = {};
    fields.forEach((field) => {
      // Skip fields that should be hidden on edit
      if (editData && field.hideOnEdit) {
        return;
      }
      
      if (editData) {
        // For select fields, handle role mapping
        if (field.type === "select") {
          if (field.name === "role") {
            // Handle role field - user data has roles array with id and name
            if (editData.roles && editData.roles.length > 0) {
              // Use the first role from the roles array
              initialForm[field.name] = String(editData.roles[0].id);
            } else if (editData[field.name]) {
                          // Fallback to direct role field if roles array doesn't exist
            const roleOption = options[field.name]?.find(
              option => option[field.optionLabel || "name"] === editData[field.name]
            );
              initialForm[field.name] = roleOption ? String(roleOption.id) : "";
            } else {
              initialForm[field.name] = "";
            }
          } else {
            // For other select fields, handle both static and service options
            const option = options[field.name]?.find(opt => {
              if (opt.value !== undefined) {
                return String(opt.value) === String(editData[field.name]);
              } else {
                return String(opt.id) === String(editData[field.name]);
              }
            });
            initialForm[field.name] = option ? String(option.id || option.value) : String(editData[field.name] || "");
          }
        } else {
          initialForm[field.name] = editData[field.name] || "";
        }
      } else {
        initialForm[field.name] = "";
      }
    });
    setForm(initialForm);
  }, [editData, fields, options]); // Add options dependency

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
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
      <DialogContent className="sm:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => {
            // Skip fields that should be hidden on edit
            if (editData && field.hideOnEdit) {
              return null;
            }
            
            return (
            <div key={field.name} className="grid grid-cols-1 gap-2">
              <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
              </Label>

              {field.type === "select" ? (
                <div className="relative dropdown-container">
                  <button
                    type="button"
                    className={`flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 ${
                      openDropdowns[field.name] 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-white'
                    }`}
                    onClick={() => {
                      console.log("🔥 Button clicked for field:", field.name);
                      // Close other dropdowns and toggle current one
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
                            return option ? (option.label || option[field.optionLabel || "name"]) : `Pilih ${field.label}`;
                          })()
                        : `Pilih ${field.label}`}
                    </span>
                    <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
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
                        {options[field.name]
                          ?.filter(option => 
                            !searchTerms[field.name] || 
                            (option.label || option[field.optionLabel || "name"])
                              .toLowerCase()
                              .includes(searchTerms[field.name].toLowerCase())
                          )
                          ?.map((option) => (
                            <div
                              key={option.id || option.value}
                              className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${
                                form[field.name] === String(option.id || option.value) ? 'bg-blue-50 text-blue-600' : ''
                              }`}
                              onClick={() => {
                                handleSelectChange(field.name, String(option.id || option.value));
                                setOpenDropdowns(prev => ({ ...prev, [field.name]: false }));
                                setSearchTerms(prev => ({ ...prev, [field.name]: "" }));
                              }}
                            >
                              {option.label || option[field.optionLabel || "name"]}
                            </div>
                          ))}
                        {options[field.name]
                          ?.filter(option => 
                            !searchTerms[field.name] || 
                            (option.label || option[field.optionLabel || "name"])
                              .toLowerCase()
                              .includes(searchTerms[field.name].toLowerCase())
                          )?.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Tidak ada data ditemukan
                          </div>
                        )}
                      </div>
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
                  required={editData && field.hideOnEdit ? false : field.required}
                  maxLength={field.maxLength}
                />
              )}
            </div>
          );
          })}

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
