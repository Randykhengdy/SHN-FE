import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { userService } from "@/services/userService";
import { roleService } from "@/services/master-data/roleService";
import { useAppContext } from "@/context/AppContext";
import PageLayout from "@/components/PageLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlert } from "@/hooks/useAlert";
import { Lock } from "lucide-react";

export default function UsersPage() {
  const { hasPermission } = useAppContext();
  const { showAlert, AlertComponent } = useAlert();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canRead = hasPermission && hasPermission('USER_MANAGEMENT', 'Read');
  const canUpdate = hasPermission && hasPermission('USER_MANAGEMENT', 'Update');

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

  const handlePasswordChange = async () => {
    if (!newPassword) {
      showAlert("Validasi Gagal", "Password tidak boleh kosong", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Validasi Gagal", "Konfirmasi password tidak sesuai", "warning");
      return;
    }
    
    setLoading(true);
    try {
      await userService.changePassword(selectedUser.id, newPassword, confirmPassword);
      showAlert("Berhasil", "Password berhasil diubah", "success");
      setPasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUser(null);
    } catch (e) {
      showAlert("Gagal", e.message || "Gagal mengubah password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          { name: "password", label: "Password", type: "password", maxLength: 100, required: false, hideOnEdit: true },
          { 
            name: "is_can_delete_item_barang", 
            label: "Akses Hapus Item Barang", 
            type: "custom",
            defaultValue: "0",
            mapFromEdit: (data) => data.is_can_delete_item_barang ? "1" : "0",
            render: ({ form, handleSelectChange }) => (
              <div 
                className="flex items-center h-10 px-3 mt-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer select-none" 
                onClick={() => handleSelectChange('is_can_delete_item_barang', form.is_can_delete_item_barang === "1" ? "0" : "1")}
              >
                <input
                  type="checkbox"
                  id="is_can_delete_item_barang"
                  name="is_can_delete_item_barang"
                  checked={form.is_can_delete_item_barang === "1"}
                  onChange={(e) => {
                    handleSelectChange('is_can_delete_item_barang', e.target.checked ? "1" : "0");
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label 
                  htmlFor="is_can_delete_item_barang" 
                  className="ml-2 text-sm text-gray-700 cursor-pointer w-full" 
                  onClick={(e) => e.stopPropagation()}
                >
                  Ya, izinkan hapus item
                </label>
              </div>
            )
          }
        ]}
        columns={[
          { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
          { key: "name", label: "Nama", align: "left", minWidth: "15rem", maxWidth: "25rem" },
          { key: "username", label: "Username", align: "left", minWidth: "12rem", maxWidth: "20rem" },
          { key: "email", label: "Email", align: "left", minWidth: "20rem", maxWidth: "30rem" },
          { key: "role", label: "Role", align: "left", minWidth: "12rem", maxWidth: "20rem" },
        ]}
        customActions={canUpdate ? [
          {
            label: "Ganti Password",
            icon: <Lock className="h-3.5 w-3.5" />,
            className: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500",
            onClick: (item) => {
              setSelectedUser(item);
              setNewPassword("");
              setConfirmPassword("");
              setPasswordModalOpen(true);
            }
          }
        ] : []}
      />
      
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ganti Password - {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Konfirmasi Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan ulang password baru"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handlePasswordChange} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertComponent />
    </>
  );
}
