import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SearchSelect = ({
  label,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  value,
  onValueChange,
  options = [],
  loading = false,
  error,
  disabled = false,
  required = false,
  className = "",
  displayKey = "label",
  valueKey = "value",
  searchKey = "label",
  usePortal = false,
  dropdownMaxHeight = 288 // 18rem
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const portalRef = useRef(null);
  const [portalStyle, setPortalStyle] = useState({});

  // Filter options based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option => {
        const searchValue = option[searchKey];
        return searchValue && 
               typeof searchValue === 'string' && 
               searchValue.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredOptions(filtered);
    }
  }, [searchQuery, options, searchKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (usePortal) {
        // For portal, check if click is outside both trigger and portal
        const clickedInsideTrigger = triggerRef.current && triggerRef.current.contains(event.target);
        const clickedInsidePortal = portalRef.current && portalRef.current.contains && portalRef.current.contains(event.target);
        if (!clickedInsideTrigger && !clickedInsidePortal) {
          setIsOpen(false);
          setSearchQuery("");
        }
      } else {
        // For regular dropdown, check if click is outside dropdown container
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearchQuery("");
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, usePortal]);

  const selectedOption = options.find(option => option[valueKey] === value);

  const handleSelect = (option) => {
    onValueChange(option[valueKey]);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onValueChange("");
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative" ref={triggerRef}>
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-between text-left font-normal ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50'
          } ${error ? 'border-red-500' : ''}`}
          onClick={() => {
            if (disabled) return;
            const next = !isOpen;
            setIsOpen(next);
            if (next && usePortal && triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              setPortalStyle({
                position: 'fixed',
                top: `${rect.bottom + 4}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                zIndex: 1000
              });
            }
          }}
          disabled={disabled}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption[displayKey] : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <X
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </div>
        </Button>

        {isOpen && !usePortal && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden" style={{ maxHeight: dropdownMaxHeight }}>
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: dropdownMaxHeight - 40 }}>
              {loading ? (
                <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">{searchQuery ? "Tidak ada data yang ditemukan" : "Tidak ada data"}</div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option[valueKey] || index}
                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${value === option[valueKey] ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}
                    onClick={() => handleSelect(option)}
                  >
                    {option[displayKey]}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {isOpen && usePortal && createPortal(
          <div 
            ref={portalRef} 
            style={portalStyle}
            className="z-[9999]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden" style={{ maxHeight: dropdownMaxHeight }}>
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-8 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: dropdownMaxHeight - 40 }}>
                {loading ? (
                  <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                ) : filteredOptions.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">{searchQuery ? "Tidak ada data yang ditemukan" : "Tidak ada data"}</div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <div
                      key={option[valueKey] || index}
                      className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 ${value === option[valueKey] ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(option);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      {option[displayKey]}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SearchSelect;
