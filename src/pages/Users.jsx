import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { userService } from "@/services/userService";
import { roleService } from "@/services/master-data/roleService";
import { useAppContext } from "@/context/AppContext";
import PageLayout from "@/components/PageLayout";

export default function UsersPage() {
  const { hasPermission } = useAppContext();
  const canRead = hasPermission && hasPermission('USER_MANAGEMENT', 'Read');
  if (!canRead) {
    return (
      <PageLayout title="Users" category="USER MANAGEMENT">
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
      title="Users"
      subtitle="User Management"
      service={userService}
      menuCode="USER_MANAGEMENT"
      fields={[
        { name: "name", label: "Nama", maxLength: 100 },
        { name: "username", label: "Username", maxLength: 100 },
        { name: "email", label: "Email", maxLength: 100, type: "email" },
        { 
          name: "role", 
          label: "Role", 
          type: "select",
          optionsService: roleService,
          optionLabel: "name"
        },
        { name: "password", label: "Password", type: "password", maxLength: 100, required: false, hideOnEdit: true }
      ]}
      columns={[
        { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
        { key: "name", label: "Nama", align: "left", minWidth: "15rem", maxWidth: "25rem" },
        { key: "username", label: "Username", align: "left", minWidth: "12rem", maxWidth: "20rem" },
        { key: "email", label: "Email", align: "left", minWidth: "20rem", maxWidth: "30rem" },
        { key: "role", label: "Role", align: "left", minWidth: "12rem", maxWidth: "20rem" },
      ]}
    />
  );
}
