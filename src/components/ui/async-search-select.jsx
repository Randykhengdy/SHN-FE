import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Search, X } from "lucide-react";

export default function AsyncSearchSelect({
  label,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  value,
  onValueChange,
  fetchOptions,
  displayKey = "label",
  valueKey = "value",
  className = "",
  required = false,
  disabled = false,
  pageSize = 10
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const debounceRef = useRef(null);
  const listRef = useRef(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const cacheRef = useRef({});
  const requestKeyRef = useRef(0);

  const selectedOption = options.find((o) => o[valueKey] === value);

  const load = async (q = "", page = 1, append = false) => {
    try {
      if (append && (loadingMore || loading)) return;
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      const cache = cacheRef.current[q] || { list: [], lastPage: 0, hasMore: true };
      if (!append && cache.list.length > 0) {
        setOptions(cache.list);
        hasMoreRef.current = cache.hasMore;
        pageRef.current = cache.lastPage;
        setHasLoaded(true);
        setLoading(false);
        return;
      }
      const currentKey = ++requestKeyRef.current;
      const rows = await fetchOptions(q, page);
      const list = Array.isArray(rows) ? rows : [];
      if (currentKey !== requestKeyRef.current) return;
      if (append) {
        const existingKeys = new Set(options.map((o) => o[valueKey]));
        const merged = [...options];
        list.forEach((r) => {
          const key = r[valueKey];
          if (!existingKeys.has(key)) merged.push(r);
        });
        setOptions(merged);
        cacheRef.current[q] = {
          list: merged,
          lastPage: page,
          hasMore: list.length >= pageSize
        };
      } else {
        setOptions(list);
        cacheRef.current[q] = {
          list,
          lastPage: page,
          hasMore: list.length >= pageSize
        };
      }
      hasMoreRef.current = cacheRef.current[q].hasMore;
      setHasLoaded(true);
    } catch (e) {
      setError(e?.message || "Gagal memuat data");
      setOptions([]);
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      pageRef.current = 1;
      hasMoreRef.current = true;
      load(searchQuery, 1, false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pageRef.current = 1;
      hasMoreRef.current = true;
      load(searchQuery, 1, false);
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchQuery, isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [isOpen]);

  const onListScroll = (e) => {
    const el = e.currentTarget;
    if (!hasMoreRef.current || loadingMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      pageRef.current += 1;
      // If cached pages already cover this page, skip fetch
      const cache = cacheRef.current[searchQuery] || { list: [], lastPage: 0 };
      if (pageRef.current <= cache.lastPage) return;
      load(searchQuery, pageRef.current, true);
    }
  };

  const handleSelect = (opt) => {
    onValueChange(opt[valueKey]);
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
          className={`w-full h-10 px-3 rounded-md justify-between text-left font-normal overflow-hidden ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          onClick={() => {
            if (disabled) return;
            const next = !isOpen;
            setIsOpen(next);
            if (next) {
              setLoading(true);
              setError("");
              setHasLoaded(false);
              // keep current options; let loader cover empty state to avoid flicker
            }
          }}
          disabled={disabled}
        >
          <span className={`${value ? 'text-gray-900 text-sm' : 'text-gray-500 text-sm'} truncate`}>
            {selectedOption ? selectedOption[displayKey] : placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden" style={{ maxHeight: 288 }}>
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto pb-3" style={{ maxHeight: 248 }} onScroll={onListScroll} ref={listRef}>
              {loading || !hasLoaded ? (
                <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
              ) : error ? (
                <div className="p-3 text-center text-red-600 text-sm">{error}</div>
              ) : options.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">{searchQuery ? 'Tidak ada data yang ditemukan' : 'Tidak ada data'}</div>
              ) : (
                options.map((option, idx) => (
                  <div
                    key={option[valueKey] || idx}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${value === option[valueKey] ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}
                    onClick={() => handleSelect(option)}
                  >
                    {option[displayKey]}
                  </div>
                ))
              )}
              {loadingMore && (
                <div className="p-2 text-center text-gray-500 text-xs">Memuat...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
