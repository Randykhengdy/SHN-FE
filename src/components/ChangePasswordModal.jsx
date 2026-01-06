import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/userService";
import { useAlert } from "@/hooks/useAlert";
import { getUserInfo } from "@/lib/jwtUtils";

export default function ChangePasswordModal({ isOpen, onClose, userId, userName }) {
  const { showAlert, AlertComponent } = useAlert();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      
      // If userId is provided, use it (Admin mode)
      // If not, get current user info (Self mode)
      if (userId) {
        setTargetUser({ id: userId, name: userName || "User" });
      } else {
        const userInfo = getUserInfo();
        if (userInfo) {
          setTargetUser(userInfo);
        }
      }
    }
  }, [isOpen, userId, userName]);

  const handlePasswordChange = async () => {
    if (!newPassword) {
      showAlert("Validasi Gagal", "Password tidak boleh kosong", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert("Validasi Gagal", "Konfirmasi password tidak sesuai", "warning");
      return;
    }
    
    if (!targetUser || !targetUser.id) {
      showAlert("Error", "Informasi user tidak ditemukan", "error");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(targetUser.id, newPassword, confirmPassword);
      showAlert("Berhasil", "Password berhasil diubah", "success");
      
      // Close modal after successful change after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      showAlert("Gagal", e.message || "Gagal mengubah password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ganti Password {targetUser ? `- ${targetUser.name || targetUser.username}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="global-new-password">Password Baru</Label>
              <Input
                id="global-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="global-confirm-password">Konfirmasi Password</Label>
              <Input
                id="global-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan ulang password baru"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={handlePasswordChange} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Alert component specific to this modal */}
      <AlertComponent />
    </>
  );
}
