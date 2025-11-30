import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { roleService } from "@/services/master-data";
import { useAppContext } from "@/context/AppContext";
import PageLayout from "@/components/PageLayout";

export default function RolePage() {
  const { hasPermission } = useAppContext();
  const canRead = hasPermission && hasPermission('USER_MANAGEMENT', 'Read');
  if (!canRead) {
    return (
      <PageLayout title="Role" category="USER MANAGEMENT">
        <div className="p-6">
          <div className="p-6 border rounded-md bg-gray-50 text-center text-gray-600">
            Anda tidak memiliki akses Read untuk User Management
          </div>
        </div>
      </PageLayout>
    );
  }
  return (
    <MasterDataLayout
      title="Role"
      subtitle="Master Data"
      service={roleService}
      menuCode="USER_MANAGEMENT"
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
