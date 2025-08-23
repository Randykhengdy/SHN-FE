import React, { useState, useEffect } from "react";
import FormInput from "@/components/FormInput";

export default function JenisBarangModal({ isOpen, onClose, onSave, editData }) {
  const [form, setForm] = useState({ kode: "", nama_jenis: "" });

  useEffect(() => {
    if (editData) {
      setForm({
        kode: editData.kode || "",
        nama_jenis: editData.nama_jenis || ""
      });
    } else {
      setForm({ kode: "", nama_jenis: "" });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">
          {editData ? "Edit Jenis Barang" : "Tambah Jenis Barang"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <FormInput
              label="Kode"
              id="kode"
              name="kode"
              value={form.kode}
              onChange={handleChange}
              required
              maxLength={8}
            />
          </div>
          
          <div className="mb-6">
            <FormInput
              label="Nama Jenis"
              id="nama_jenis"
              name="nama_jenis"
              value={form.nama_jenis}
              onChange={handleChange}
              required
              maxLength={32}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </form>
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>
      </div>
    </div>
  );
}