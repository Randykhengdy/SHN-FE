import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { gudangService } from "@/services/master-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function GudangPage() {
  const [childOpen, setChildOpen] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [childRows, setChildRows] = useState([]);
  const [childLoading, setChildLoading] = useState(false);

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
    } else if (tipe === "Rak") {
      setChildTitle(`Bin di ${item.nama_gudang || item.nama_rak || item.nama}`);
      setChildOpen(true);
      setChildLoading(true);
      try {
        const res = await gudangService.getAll({ tipe_gudang: "Bin", parent_id: item.id });
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
      filterConfig={{
        param: 'tipe_gudang',
        defaultValue: 'semua',
        options: [
          { value: 'semua', label: 'Semua' },
          { value: 'gudang', label: 'Gudang' },
          { value: 'rak', label: 'Rak' },
          { value: 'bin', label: 'Bin' },
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
        } else if (tipeLower === 'bin') {
          form.parent_id = form.rak_id || '';
          delete form.rak_id;
          delete form.gudang_id;
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
          { value: "bin", label: "Bin" },
        ], mapFromEdit: (edit) => (edit?.tipe_gudang ? String(edit.tipe_gudang).toLowerCase() : ""), editLabel: (edit) => (edit?.tipe_gudang || ''), onChangeForm: (form, val) => {
          const next = { ...form };
          if (val === 'gudang') { next.gudang_id = ''; next.rak_id = ''; }
          else if (val === 'rak') { next.rak_id = ''; }
          return next;
        } },
        { name: "gudang_id", label: "Gudang", type: "select", optionLabel: "nama_gudang", required: true, mapFromEdit: (edit) => {
          const tipe = edit?.tipe_gudang ? String(edit.tipe_gudang).toLowerCase() : '';
          return tipe === 'rak' ? (edit?.parent_id || '') : '';
        }, prefetchById: (id) => gudangService.getById(id), optionsLoader: async () => gudangService.getAll({ tipe_gudang: "Gudang" }), showIf: (f) => f.tipe_gudang === "rak", dropdownExtra: ({ options }) => (
          <div className="text-xs text-gray-500">Pilih gudang induk untuk rak ini{options.length === 0 ? ", tidak ada gudang tersedia" : ""}.</div>
        ) },
        { name: "rak_id", label: "Rak", type: "select", optionLabel: "nama_gudang", required: true, mapFromEdit: (edit) => {
          const tipe = edit?.tipe_gudang ? String(edit.tipe_gudang).toLowerCase() : '';
          return tipe === 'bin' ? (edit?.parent_id || '') : '';
        }, prefetchById: (id) => gudangService.getById(id), optionsLoader: async () => gudangService.getAll({ tipe_gudang: "Rak" }), showIf: (f) => f.tipe_gudang === "bin", dropdownExtra: ({ options }) => (
          <div className="text-xs text-gray-500">Pilih rak induk untuk bin ini{options.length === 0 ? ", tidak ada rak tersedia" : ""}.</div>
        ) },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_gudang", label: "Nama Gudang", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "tipe_gudang", label: "Tipe", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "telepon_hp", label: "Telepon/HP", align: "center", width: "12rem", maxWidth: "12rem" },
      ]}
      customActions={[
        {
          label: "Detail",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          ),
          visible: (item) => String(item.tipe_gudang || "") !== "Bin",
          onClick: openChildren,
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
