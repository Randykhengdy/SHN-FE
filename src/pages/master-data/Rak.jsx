import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { rakService, gudangService } from "@/services/master-data";

export default function RakPage() {
  const [selectedRaks, setSelectedRaks] = useState([]);

  return (
    <MasterDataLayout
      title="Rak"
      subtitle="Master Data"
      service={rakService}
      selection={{
        visible: () => true,
        isSelected: (item) => !!selectedRaks.find((r) => r.id === item.id),
        onToggle: (item) => {
          setSelectedRaks((prev) => {
            const exists = prev.find((r) => r.id === item.id);
            if (exists) {
              return prev.filter((r) => r.id !== item.id);
            }
            return [...prev, item];
          });
        },
        headerLabel: "Pilih",
        selectedCount: selectedRaks.length,
        batchAction: async () => {
          const { openRackQRPDFBatch } = await import("@/lib/pdfUtils");
          await openRackQRPDFBatch(selectedRaks);
        }
      }}
      fields={[
        { name: "kode", label: "Kode", maxLength: 16, required: true, disabledOnEdit: true },
        { name: "nama_rak", label: "Nama Rak", maxLength: 64, required: true },
        {
          name: "gudang_id",
          label: "Gudang",
          type: "asyncSelect",
          required: true,
          mapFromEdit: (edit) => edit?.gudang_id || edit?.gudang?.id || "",
          prefetchById: (id) => gudangService.getById(id),
          fetchOptions: async (q, page) => {
            const res = await gudangService.getPaginated(page || 1, 50, q || "", "nama_gudang", "asc", { tipe_gudang: "gudang" });
            const list = res?.data || [];
            return list.map((it) => ({
              value: String(it.id),
              label: it.nama_gudang || it.nama || String(it.id)
            }));
          },
          displayKey: "label",
          valueKey: "value"
        },
        { name: "kapasitas", label: "Kapasitas", type: "number", step: 0.01 }
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "kode", label: "Kode", align: "center", width: "8rem", maxWidth: "8rem" },
        { key: "nama_rak", label: "Nama Rak", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        { key: "gudang.nama_gudang", label: "Gudang", align: "center", width: "12rem", maxWidth: "12rem" },
        { key: "kapasitas", label: "Kapasitas", align: "center", width: "10rem", maxWidth: "10rem" }
      ]}
      customActions={[
        {
          label: "QR Rak",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 4h3v3h-3v-3zM14 14h7v7h-7v-7z" />
            </svg>
          ),
          onClick: async (item) => {
            const { openRackQRPDFPreview } = await import("@/lib/pdfUtils");
            const parentGudang = item.gudang || null;
            await openRackQRPDFPreview(item, parentGudang);
          }
        }
      ]}
    />
  );
}
