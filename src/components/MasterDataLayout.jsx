import React, { useEffect, useState } from "react";
import MasterFormModal from "./MasterFormModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function MasterDataLayout({
  title,
  columns,
  fields,
  service,
}) {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showTrashed, setShowTrashed] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = showTrashed
        ? await service.getOnlyTrashed()
        : await service.getAll();
      setData(response.data);
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [showTrashed]);

  const handleAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditData(item);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editData) {
        await service.update(editData.id, formData);
      } else {
        await service.create(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus data ini?")) {
      await service.softDelete(id);
      fetchData();
    }
  };

  const handleRestore = async (id) => {
    await service.restore(id);
    fetchData();
  };

  const handleForceDelete = async (id) => {
    if (confirm("Yakin ingin menghapus permanen data ini?")) {
      await service.forceDelete(id);
      fetchData();
    }
  };

  const getValue = (obj, path) => {
    return path.split(".").reduce((o, k) => (o ? o[k] : ""), obj);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="showTrashed"
              checked={showTrashed}
              onCheckedChange={setShowTrashed}
            />
            <Label htmlFor="showTrashed">Tampilkan yang dihapus</Label>
          </div>
          <Button variant="outline" onClick={fetchData}>
            Refresh
          </Button>
          <Button onClick={handleAdd}>Tambah</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 border text-left">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-4">
                  Memuat data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-4">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 border">
                      {getValue(item, col.key)}
                    </td>
                  ))}
                  <td className="px-4 py-2 border space-x-2">
                    {!showTrashed ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          Hapus
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item.id)}
                        >
                          Pulihkan
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleForceDelete(item.id)}
                        >
                          Hapus Permanen
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MasterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editData={editData}
        fields={fields}
        title={editData ? `Edit ${title}` : `Tambah ${title}`}
      />
    </div>
  );
}
