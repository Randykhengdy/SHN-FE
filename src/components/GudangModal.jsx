import React, { useState, useEffect } from "react";
import FormInput from "@/components/FormInput";

export default function GudangModal({ isOpen, onClose, onSave, editData }) {
  const [form, setForm] = useState({
    kode: "",
    nama_gudang: "",
    telepon_hp: ""
  });

  useEffect(() => {
    if (editData) {
      setForm({
        kode: editData.kode || "",
        nama_gudang: editData.nama_gudang || "",
        telepon_hp: editData.telepon_hp || ""
      });
    } else {
      setForm({
        kode: "",
        nama_gudang: "",
        telepon_hp: ""
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
        <h2 className="text-xl font-semibold mb-4">
          {editData ? "Edit Gudang" : "Tambah Gudang"}
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

          <div className="mb-4">
            <FormInput
              label="Nama Gudang"
              id="nama_gudang"
              name="nama_gudang"
              value={form.nama_gudang}
              onChange={handleChange}
              required
              maxLength={64}
            />
          </div>

          <div className="mb-6">
            <FormInput
              label="Telepon / HP"
              id="telepon_hp"
              name="telepon_hp"
              value={form.telepon_hp}
              onChange={handleChange}
              required
              maxLength={20}
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
