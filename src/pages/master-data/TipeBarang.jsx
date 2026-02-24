import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { tipeBarangService } from "@/services/master-data";
import { Download } from "lucide-react";

const CheckIcon = () => (
    <span className="text-green-600 font-bold">✓</span>
);

// Preprocess function to convert checkbox values to proper booleans
const preprocessTipeBarang = (formData, editData) => {
    const dimensionFields = [
        'diameter_luar', 'diameter_dalam', 'diameter', 'sisi1', 'sisi2', 'tebal', 'lebar', 'panjang',
        'cancut_diameter_luar', 'cancut_diameter_dalam', 'cancut_diameter', 'cancut_sisi1', 'cancut_sisi2', 'cancut_tebal', 'cancut_lebar', 'cancut_panjang'
    ];

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
            customHeaderButtons={[
                {
                    label: "Download Template",
                    icon: <Download className="h-4 w-4" />,
                    onClick: async () => {
                        try {
                            await tipeBarangService.downloadTemplate();
                        } catch (error) {
                            console.error("Download template failed:", error);
                        }
                    },
                    className: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
                }
            ]}
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
                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="pb-2 text-left font-semibold text-gray-700">Dimensi</th>
                                            <th className="pb-2 text-center font-semibold text-gray-700">Gunakan</th>
                                            <th className="pb-2 text-center font-semibold text-gray-700">Bisa Potong</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {[
                                            { id: 'diameter_luar', label: 'Diameter Luar', cancutId: 'cancut_diameter_luar' },
                                            { id: 'diameter_dalam', label: 'Diameter Dalam', cancutId: 'cancut_diameter_dalam' },
                                            { id: 'diameter', label: 'Diameter', cancutId: 'cancut_diameter' },
                                            { id: 'sisi1', label: 'Sisi 1', cancutId: 'cancut_sisi1' },
                                            { id: 'sisi2', label: 'Sisi 2', cancutId: 'cancut_sisi2' },
                                            { id: 'tebal', label: 'Tebal', cancutId: 'cancut_tebal' },
                                            { id: 'lebar', label: 'Lebar', cancutId: 'cancut_lebar' },
                                            { id: 'panjang', label: 'Panjang', cancutId: 'cancut_panjang' }
                                        ].map((dim) => (
                                            <tr key={dim.id} className="hover:bg-gray-100/50 transition-colors">
                                                <td className="py-2 pr-4 font-medium text-gray-600 italic">
                                                    {dim.label}
                                                </td>
                                                <td className="py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        id={dim.id}
                                                        checked={getChecked(dim.id)}
                                                        onChange={(e) => handleCheckboxChange(dim.id, e.target.checked)}
                                                        className="h-5 w-5 cursor-pointer accent-blue-600 align-middle"
                                                    />
                                                </td>
                                                <td className="py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        id={dim.cancutId}
                                                        checked={getChecked(dim.cancutId)}
                                                        onChange={(e) => handleCheckboxChange(dim.cancutId, e.target.checked)}
                                                        disabled={!getChecked(dim.id)}
                                                        className={`h-5 w-5 cursor-pointer accent-green-600 align-middle ${!getChecked(dim.id) ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="mt-4 text-xs text-gray-500 italic">
                                    * Centang kolom "Gunakan" untuk mengaktifkan field dimensi, dan centang "Bisa Potong" jika dimensi tersebut boleh memiliki nilai potongan.
                                </p>
                            </div>
                        );
                    }
                },
            ]}
            columns={[
                { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
                { key: "name", label: "Nama Tipe", align: "left", minWidth: "12rem", maxWidth: "18rem" },
                { key: "desc", label: "Deskripsi", align: "left", minWidth: "15rem", maxWidth: "25rem" },
                { key: "diameter_luar", label: "DL", align: "center", width: "3.5rem" },
                { key: "diameter_dalam", label: "DD", align: "center", width: "3.5rem" },
                { key: "diameter", label: "D", align: "center", width: "3.5rem" },
                { key: "sisi1", label: "S1", align: "center", width: "3.5rem" },
                { key: "sisi2", label: "S2", align: "center", width: "3.5rem" },
                { key: "tebal", label: "T", align: "center", width: "3.5rem" },
                { key: "lebar", label: "L", align: "center", width: "3.5rem" },
                { key: "panjang", label: "P", align: "center", width: "3.5rem" },
            ]}
            renderRow={({ item, index, baseClassName, customClassName, renderActionsCell, columns, getValue }) => {
                const dims = [
                    'diameter_luar', 'diameter_dalam', 'diameter', 'sisi1', 'sisi2', 'tebal', 'lebar', 'panjang'
                ];
                const cancuts = [
                    'cancut_diameter_luar', 'cancut_diameter_dalam', 'cancut_diameter', 'cancut_sisi1', 'cancut_sisi2', 'cancut_tebal', 'cancut_lebar', 'cancut_panjang'
                ];

                return (
                    <React.Fragment key={item.id}>
                        {/* Row 1: Gunakan */}
                        <tr className={`${baseClassName} ${customClassName} border-b-0 ${index % 2 !== 0 ? 'bg-gray-50/80' : 'bg-white'}`}>
                            <td rowSpan={2} className="px-4 py-3 text-sm text-gray-600 text-center border-r border-gray-200 italic">
                                {getValue(item, "id")}
                            </td>
                            <td rowSpan={2} className="px-4 py-3 text-sm text-gray-600 font-medium border-r border-gray-100">
                                {getValue(item, "name")}
                            </td>
                            <td rowSpan={2} className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">
                                <div className="max-w-[25rem] truncate text-xs text-gray-500" title={item.desc}>
                                    {item.desc || "-"}
                                </div>
                            </td>
                            {dims.map(dim => (
                                <td key={dim} className={`px-4 py-2 text-sm text-center border-r border-gray-50/50 ${index % 2 !== 0 ? 'bg-gray-50/20' : ''}`}>
                                    {item[dim] ? <CheckIcon /> : <span className="text-gray-200">-</span>}
                                </td>
                            ))}
                            <td rowSpan={2} className="px-4 py-3 border-l border-gray-100">
                                {renderActionsCell()}
                            </td>
                        </tr>
                        {/* Row 2: Bisa Potong */}
                        <tr className={`${baseClassName} ${customClassName} ${index % 2 !== 0 ? 'bg-gray-50/80' : 'bg-white'}`}>
                            {cancuts.map((cc, i) => (
                                <td key={cc} className={`px-4 py-2 text-sm text-center border-r border-gray-50/50 ${!item[dims[i]] ? 'bg-gray-200/5' : ''}`}>
                                    {item[cc] ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1 rounded border border-green-200">
                                            <span>CUT</span>
                                        </span>
                                    ) : (
                                        <span className="text-gray-200 text-[10px]">-</span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    </React.Fragment>
                );
            }}
        />
    );
}
