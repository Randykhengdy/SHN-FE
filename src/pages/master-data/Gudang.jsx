import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gudangService } from "@/services/master-data";
import { getGudang, getGudangById } from "@/services/masterDataService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function GudangPage() {
  const [childOpen, setChildOpen] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [childRows, setChildRows] = useState([]);
  const [childLoading, setChildLoading] = useState(false);
  const [selectedRaks, setSelectedRaks] = useState([]);

  const openChildren = async (item) => {
    const tipe = String(item.tipe_gudang || "");
    if (tipe === "Gudang") {
      setChildTitle(`Rak di ${item.nama_gudang || item.nama_rak || item.nama}`);
      setChildOpen(true);
      setChildLoading(true);
      try {
        const res = await gudangService.getAll({ tipe_gudang: "Rak", parent_id: item.id });
        setChildRows(res?.data || res || []);
      } finally {
        setChildLoading(false);
      }
    }
  };

  return (
    <>
    <MasterDataLayout
      title="Gudang"
      subtitle="Master Data"
      service={gudangService}
      selection={{
        visible: (item) => String(item.tipe_gudang || "") === "Rak",
        isSelected: (item) => !!selectedRaks.find(r => r.id === item.id),
        onToggle: (item) => {
          setSelectedRaks(prev => {
            const exists = prev.find(r => r.id === item.id);
            if (exists) return prev.filter(r => r.id !== item.id);
            return [...prev, item];
          });
        },
        headerLabel: "Pilih",
        selectedCount: selectedRaks.length,
        batchAction: async () => {
          try {
            const { openRackQRPDFBatch } = await import("@/lib/pdfUtils");
            await openRackQRPDFBatch(selectedRaks);
          } catch (_) {}
        }
      }}
      filterConfig={{
        param: 'tipe_gudang',
        defaultValue: 'semua',
        options: [
          { value: 'semua', label: 'Semua' },
          { value: 'gudang', label: 'Gudang' },
          { value: 'rak', label: 'Rak' },
        ]
      }}
      validate={(form) => {
        const errs = [];
        if (!form.tipe_gudang) errs.push('Tipe Gudang');
        if (form.tipe_gudang === 'rak' && (!form.gudang_id || String(form.gudang_id).trim() === '')) errs.push('Gudang');
        if (form.tipe_gudang === 'bin' && (!form.rak_id || String(form.rak_id).trim() === '')) errs.push('Rak');
        if (errs.length) return `Field wajib: ${errs.join(', ')}`;
        return null;
      }}
      preprocess={(form) => {
        const t = form.tipe_gudang;
        if (t) form.tipe_gudang = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
        const tipeLower = t ? String(t).toLowerCase() : '';
        if (tipeLower === 'rak') {
          form.parent_id = form.gudang_id || '';
          delete form.gudang_id;
          delete form.rak_id;
        } else if (tipeLower === 'gudang') {
          form.parent_id = '';
          delete form.gudang_id;
          delete form.rak_id;
        }
        return form;
      }}
      fields={[
        { name: "kode", label: "Kode", maxLength: 8, required: true },
        { name: "nama_gudang", label: "Nama Gudang", maxLength: 64, required: true },
        { name: "telepon_hp", label: "Telepon/HP", maxLength: 20 },
        { name: "tipe_gudang", label: "Tipe Gudang", type: "select", required: true, disabledOnEdit: true, options: [
          { value: "gudang", label: "Gudang" },
          { value: "rak", label: "Rak" },
        ], mapFromEdit: (edit) => (edit?.tipe_gudang ? String(edit.tipe_gudang).toLowerCase() : ""), editLabel: (edit) => (edit?.tipe_gudang || ''), onChangeForm: (form, val) => {
          const next = { ...form };
          if (val === 'gudang') { next.gudang_id = ''; }
          return next;
        } },
        { name: "gudang_id", label: "Gudang", type: "select", optionLabel: "nama_gudang", required: true, mapFromEdit: (edit) => {
          const tipe = edit?.tipe_gudang ? String(edit.tipe_gudang).toLowerCase() : '';
          return tipe === 'rak' ? (edit?.parent_id || '') : '';
        }, prefetchById: (id) => getGudangById(id), optionsLoader: async (_form, p) => {
          const res = await getGudang({ tipe_gudang: "Gudang", page: (p?.page || 1), per_page: (p?.perPage || 100), search: (p?.search || "") });
          return res.data || [];
        }, showIf: (f) => f.tipe_gudang === "rak" },
        
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", headerAlign: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", headerAlign: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_gudang", label: "Nama Gudang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "tipe_gudang", label: "Tipe", align: "center", headerAlign: "center", width: "8rem", maxWidth: "8rem" },
        { key: "telepon_hp", label: "Telepon/HP", align: "center", headerAlign: "center", width: "12rem", maxWidth: "12rem" },
      ]}
      customActions={[
        {
          label: "Detail",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          ),
          visible: (item) => String(item.tipe_gudang || "") === "Gudang",
          className: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-blue-300 focus:ring-offset-1",
          onClick: async (item) => {
            try {
              setChildTitle(`Rak di ${item.nama_gudang || item.nama}`);
              setChildOpen(true);
              setChildLoading(true);
              const res = await gudangService.getAll({ tipe_gudang: "Rak", parent_id: item.id });
              setChildRows(res?.data || res || []);
            } finally {
              setChildLoading(false);
            }
          }
        },
        {
          label: "QR Rak",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 4h3v3h-3v-3zM14 14h7v7h-7v-7z" />
            </svg>
          ),
          visible: (item) => String(item.tipe_gudang || "") === "Rak",
          className: "bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-500 transition-all duration-200 hover:shadow-md hover:scale-105 focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1",
          onClick: async (item) => {
            try {
              const parent = item.parent_id ? await gudangService.getById(item.parent_id) : null;
              const { openRackQRPDFPreview } = await import("@/lib/pdfUtils");
              await openRackQRPDFPreview(item, parent?.data || parent);
            } catch (_) {}
          }
        }
      ]}
    />
    <Dialog open={childOpen} onOpenChange={setChildOpen}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{childTitle}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {childLoading ? (
            <div className="py-8 text-center text-gray-500">Memuat data...</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon/HP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {childRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-6">Tidak ada data</TableCell>
                </TableRow>
              ) : (
                childRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.kode}</TableCell>
                    <TableCell>{row.nama_gudang || row.nama_rak || row.nama}</TableCell>
                    <TableCell>{row.telepon_hp || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setChildOpen(false)}>Tutup</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
