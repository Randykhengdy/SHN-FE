import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { roleService } from "@/services/master-data";
import CustomAlert from "@/components/modals/CustomAlert";

export default function RolePermissionEditor({ role, onSave, onCancel }) {
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [menus, setMenus] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [availableCombos, setAvailableCombos] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "", type: "warning" });

  // Available permissions
  const permissions = [
    { id: 1, name: "Create", key: "create" },
    { id: 2, name: "Read", key: "read" },
    { id: 3, name: "Update", key: "update" },
    { id: 4, name: "Delete", key: "delete" },
  ];

  const showAlert = (title, message, type = "warning") => {
    setAlertConfig({ title, message, type });
    setAlertOpen(true);
  };

  useEffect(() => {
    // Set role name from the passed role data
    if (role?.name) {
      setRoleName(role.name);
    } else {
      setRoleName("");
    }
    if (role?.role_code) {
      setRoleCode(String(role.role_code));
    } else {
      setRoleCode("");
    }
    loadData();
  }, [role?.id, role?.name]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load menu-permission mappings (limit 1000) and derive menus + available combos
      const mappings = await roleService.getMenuPermissionMappings(1000);
      const menuMap = new Map();
      const combos = new Set();
      (Array.isArray(mappings) ? mappings : []).forEach((row) => {
        const m = row.menu || {};
        const p = row.permission || {};
        const menuId = Number(row.menu_id || m.id);
        const permId = Number(row.permission_id || p.id);
        if (menuId) {
          if (!menuMap.has(menuId)) {
            menuMap.set(menuId, { id: menuId, nama_menu: m.nama_menu || m.nama || m.name || `Menu ${menuId}` });
          }
          if (permId) {
            combos.add(`${menuId}-${permId}`);
          }
        }
      });
      setMenus(Array.from(menuMap.values()));
      setAvailableCombos(combos);

      // Load existing role permissions (already normalized to {menu_id, permission_id})
      if (role?.id) {
        const existing = await roleService.getRoleMenuPermissions(role.id);
        setRolePermissions(Array.isArray(existing) ? existing : []);
      } else {
        setRolePermissions([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      showAlert("Error", "Gagal memuat data", "error");
      // Set empty arrays on error
      setMenus([]);
      setRolePermissions([]);
      setAvailableCombos(new Set());
    } finally {
      setLoading(false);
    }
  };

  const isPermissionChecked = (menuId, permissionId) => {
    if (!Array.isArray(rolePermissions)) {
      return false;
    }
    return rolePermissions.some(
      (rp) => Number(rp.menu_id) === Number(menuId) && Number(rp.permission_id) === Number(permissionId)
    );
  };

  const handlePermissionChange = (menuId, permissionId, checked) => {
    const available = availableCombos.has(`${menuId}-${permissionId}`);
    if (!available) return;
    if (checked) {
      // Add permission
      setRolePermissions(prev => {
        const currentPermissions = Array.isArray(prev) ? prev : [];
        return [
          ...currentPermissions,
          { menu_id: menuId, permission_id: permissionId }
        ];
      });
    } else {
      // Remove permission
      setRolePermissions(prev => {
        const currentPermissions = Array.isArray(prev) ? prev : [];
        return currentPermissions.filter(rp => !(rp.menu_id === menuId && rp.permission_id === permissionId));
      });
    }
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      showAlert("Error", "Nama role harus diisi", "error");
      return;
    }

    setSaving(true);
    try {
      // Save role info + mappings
      const roleData = { name: roleName, role_code: roleCode, mappings: rolePermissions };
      let updatedRole;

      if (role?.id) {
        // Update existing role
        await roleService.update(role.id, roleData);
        updatedRole = { ...role, name: roleName };
      } else {
        // Create new role
        if (!roleCode.trim()) {
          showAlert("Error", "Kode role harus diisi", "error");
          setSaving(false);
          return;
        }
        const response = await roleService.create({ ...roleData, role_code: roleCode });
        updatedRole = response.data;
      }

      // Mappings telah dikirim dalam body update/create
      onSave(updatedRole);
    } catch (error) {
      console.error("Error saving role:", error);
      showAlert("Error", "Gagal menyimpan role", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 pb-3 border-b">
        <h2 className="text-xl font-semibold">{role?.id ? "Edit Role" : "Tambah Role"}</h2>
      </div>
      <CustomAlert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="roleCode" className="text-sm font-medium text-gray-700 mb-1">Kode Role *</Label>
          <Input
            id="roleCode"
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value)}
            placeholder="Masukkan kode role"
            className="w-full"
            disabled={!!role?.id}
          />
        </div>
        
        {/* Role Name Input - Outside Card */}
        <div className="space-y-2">
          <Label htmlFor="roleName" className="text-sm font-medium text-gray-700 mb-1">Nama Role *</Label>
          <Input
            id="roleName"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Masukkan nama role"
            className="w-full"
          />
        </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Menu</TableHead>
                  {permissions.map((permission) => (
                    <TableHead key={permission.id} className="text-center w-20">
                      {permission.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
                             <TableBody>
                 {menus.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={permissions.length + 1} className="text-center text-gray-500">
                       Tidak ada menu yang tersedia
                     </TableCell>
                   </TableRow>
                 ) : (
                   menus.map((menu) => (
                     <TableRow key={menu.id}>
                       <TableCell className="font-medium">
                         {menu.nama_menu || menu.name || 'Unknown Menu'}
                       </TableCell>
                      {permissions.map((permission) => (
                        <TableCell key={permission.id} className="text-center">
                          {availableCombos.has(`${menu.id}-${permission.id}`) ? (
                            <Checkbox
                              checked={isPermissionChecked(menu.id, permission.id)}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(menu.id, permission.id, checked)
                              }
                            />
                          ) : null}
                        </TableCell>
                      ))}
                     </TableRow>
                   ))
                 )}
               </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
    </>
  );
}
