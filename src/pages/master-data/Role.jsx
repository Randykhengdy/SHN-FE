import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { roleService } from "@/services/master-data";

export default function RolePage() {
  return (
    <MasterDataLayout
      title="Role"
      subtitle="Master Data"
      service={roleService}
      fields={[
        { name: "name", label: "Nama Role", maxLength: 32 },
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "name", label: "Nama Role", align: "left", minWidth: "15rem", maxWidth: "25rem" },
      ]}
      customEditComponent="RolePermissionEditor"
    />
  );
}
