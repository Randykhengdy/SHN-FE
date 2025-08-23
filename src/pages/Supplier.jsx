import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { supplierService } from "@/services/supplierService";

export default function SupplierPage() {
  return (
    <MasterDataLayout
      title="Supplier"
      subtitle="Master Data"
      service={supplierService}
      fields={[
        { name: "kode", label: "Kode", maxLength: 16 },
        { name: "nama_supplier", label: "Nama Supplier", maxLength: 64 },
        { name: "kota", label: "Kota", maxLength: 32 },
        { name: "telepon_hp", label: "Telepon/HP", maxLength: 32 },
        { name: "contact_person", label: "Contact Person", maxLength: 32 },
      ]}
      columns={[
        { key: "id", label: "ID" },
        { key: "kode", label: "Kode" },
        { key: "nama_supplier", label: "Nama Supplier" },
        { key: "kota", label: "Kota" },
        { key: "telepon_hp", label: "Telepon/HP" },
        { key: "contact_person", label: "Contact Person" },
      ]}
    />
  );
}
