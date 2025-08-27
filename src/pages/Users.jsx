import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { userService } from "@/services/userService";
import { roleService } from "@/services/master-data/roleService";

export default function UsersPage() {
  return (
    <MasterDataLayout
      title="Users"
      subtitle="User Management"
      service={userService}
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
