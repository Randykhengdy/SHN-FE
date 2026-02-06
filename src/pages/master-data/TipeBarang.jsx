import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { tipeBarangService } from "@/services/master-data";

const CheckIcon = () => (
    <span className="text-green-600 font-bold">✓</span>
);

// Preprocess function to convert checkbox values to proper booleans
const preprocessTipeBarang = (formData, editData) => {
    const dimensionFields = ['diameter_luar', 'diameter_dalam', 'diameter', 'sisi1', 'sisi2', 'tebal', 'lebar', 'panjang'];

    const processed = { ...formData };
    dimensionFields.forEach(field => {
        // If field exists in formData, use it (converted to boolean)
        if (processed[field] !== undefined) {
            processed[field] = !!processed[field];
        }
        // Otherwise, if editing, preserve the original value from editData
        else if (editData && editData[field] !== undefined) {
            processed[field] = !!editData[field];
        }
        // If neither exist, default to false
        else {
            processed[field] = false;
        }
    });

    return processed;
};

export default function TipeBarangPage() {
    return (
        <MasterDataLayout
            title="Tipe Barang"
            subtitle="Master Data"
            service={tipeBarangService}
            preprocess={preprocessTipeBarang}
            fields={[
                { name: "name", label: "Nama Tipe", maxLength: 255, colSpan: 2 },
                { name: "desc", label: "Deskripsi", maxLength: 500, colSpan: 2 },

                // All dimension checkboxes in one custom field
                {
                    name: "dimensions",
                    label: "Dimensi yang Digunakan",
                    type: "custom",
                    colSpan: 2,
                    render: ({ form, handleChange, editData }) => {
                        // Helper function to get checkbox state
                        const getChecked = (fieldName) => {
                            // If form has the field, use it
                            if (form[fieldName] !== undefined) {
                                return !!form[fieldName];
                            }
                            // Otherwise check editData
                            if (editData && editData[fieldName] !== undefined) {
                                return !!editData[fieldName];
                            }
                            return false;
                        };

                        // Helper to handle checkbox change and ensure form state is updated
                        const handleCheckboxChange = (fieldName, checked) => {
                            handleChange({ target: { name: fieldName, value: checked } });
                        };

                        return (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="diameter_luar"
                                        checked={getChecked('diameter_luar')}
                                        onChange={(e) => handleCheckboxChange('diameter_luar', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="diameter_luar" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Diameter Luar
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="diameter_dalam"
                                        checked={getChecked('diameter_dalam')}
                                        onChange={(e) => handleCheckboxChange('diameter_dalam', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="diameter_dalam" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Diameter Dalam
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="diameter"
                                        checked={getChecked('diameter')}
                                        onChange={(e) => handleCheckboxChange('diameter', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="diameter" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Diameter
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="sisi1"
                                        checked={getChecked('sisi1')}
                                        onChange={(e) => handleCheckboxChange('sisi1', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="sisi1" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Sisi 1
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="sisi2"
                                        checked={getChecked('sisi2')}
                                        onChange={(e) => handleCheckboxChange('sisi2', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="sisi2" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Sisi 2
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="tebal"
                                        checked={getChecked('tebal')}
                                        onChange={(e) => handleCheckboxChange('tebal', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="tebal" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Tebal
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="lebar"
                                        checked={getChecked('lebar')}
                                        onChange={(e) => handleCheckboxChange('lebar', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="lebar" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Lebar
                                    </label>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="panjang"
                                        checked={getChecked('panjang')}
                                        onChange={(e) => handleCheckboxChange('panjang', e.target.checked)}
                                        className="h-5 w-5 cursor-pointer accent-blue-600"
                                    />
                                    <label htmlFor="panjang" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Panjang
                                    </label>
                                </div>
                            </div>
                        );
                    }
                },
            ]}
            columns={[
                { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
                { key: "name", label: "Nama Tipe", align: "left", minWidth: "12rem", maxWidth: "18rem" },
                { key: "desc", label: "Deskripsi", align: "left", minWidth: "15rem", maxWidth: "25rem" },
                {
                    key: "diameter_luar",
                    label: "DL",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.diameter_luar ? <CheckIcon /> : "-"
                },
                {
                    key: "diameter_dalam",
                    label: "DD",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.diameter_dalam ? <CheckIcon /> : "-"
                },
                {
                    key: "diameter",
                    label: "D",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.diameter ? <CheckIcon /> : "-"
                },
                {
                    key: "sisi1",
                    label: "S1",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.sisi1 ? <CheckIcon /> : "-"
                },
                {
                    key: "sisi2",
                    label: "S2",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.sisi2 ? <CheckIcon /> : "-"
                },
                {
                    key: "tebal",
                    label: "T",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.tebal ? <CheckIcon /> : "-"
                },
                {
                    key: "lebar",
                    label: "L",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.lebar ? <CheckIcon /> : "-"
                },
                {
                    key: "panjang",
                    label: "P",
                    align: "center",
                    width: "3rem",
                    getValue: (item) => item.panjang ? <CheckIcon /> : "-"
                },
            ]}
        />
    );
}
