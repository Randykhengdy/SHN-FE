import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { jenisTransaksiKasService, jenisBiayaService } from "@/services/master-data";

const today = () => new Date().toISOString().split("T")[0];

export default function JenisTransaksiKasPage() {
  return (
    <MasterDataLayout
      title="Jenis Transaksi Kas"
      subtitle="Master Data"
      service={jenisTransaksiKasService}
      fields={[
        {
          name: "tanggal",
          label: "Tanggal",
          type: "date",
          required: true,
          defaultValue: today,
        },
        { name: "jenis_biaya_id", label: "Jenis Biaya", type: "select",
          optionsService: jenisBiayaService,
          optionLabel: "jenis_biaya",
          required: true,
        },
        { name: "keterangan", label: "Keterangan" },
        { name: "jumlah", label: "Jumlah", type: "number", required: true },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        {
          key: "tanggal",
          label: "Tanggal",
          align: "center",
          width: "9rem",
          getValue: (item) => {
            if (!item.tanggal) return "-";
            const d = new Date(item.tanggal);
            return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
          }
        },
        {
          key: "jenis_biaya.jenis_biaya",
          label: "Jenis Biaya",
          align: "left",
          minWidth: "15rem",
          maxWidth: "20rem"
        },
        { key: "keterangan", label: "Keterangan", align: "left", minWidth: "15rem", maxWidth: "20rem" },
        {
          key: "jumlah",
          label: "Jumlah",
          align: "right",
          width: "10rem",
          maxWidth: "10rem",
          getValue: (item) => {
            if (!item.jumlah) return "-";
            return Number(item.jumlah).toLocaleString("id-ID");
          }
        },
      ]}
    />
  );
}
