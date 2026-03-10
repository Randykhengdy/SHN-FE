import React, { useState, useRef } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { Button } from "@/components/ui/button";
import { itemBarangGroupService, jenisBarangService, bentukBarangService, gradeBarangService } from "@/services/master-data";
import { useAlert } from "@/hooks/useAlert";
import { Download, Upload } from "lucide-react";

// Module-level variable untuk menyimpan mapping dimensi bentuk barang
let bentukBarangDimensiMap = {};
// Module-level variable untuk menyimpan mapping tipe barang
let bentukBarangTipeMap = {};

export default function ItemBarangGroupPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDimensions, setShowDimensions] = useState(false);
    const { showAlert, AlertComponent } = useAlert();
    const fileInputRef = useRef(null);

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const result = await itemBarangGroupService.importData(file);
            if (result.success) {
                let msg = result.message || 'Import berhasil';
                if (result.data?.error_messages && result.data.error_messages.length > 0) {
                    msg += '\n\nDetail error:\n' + result.data.error_messages.join('\n');
                }
                showAlert('Import Berhasil', msg, result.data?.errors > 0 ? 'warning' : 'success');
                setRefreshTrigger(prev => prev + 1);
            } else {
                showAlert('Import Gagal', result.message || 'Import gagal', 'error');
            }
        } catch (error) {
            console.error('Import failed:', error);
            showAlert('Import Gagal', error.message || 'Import gagal. Periksa console untuk detail.', 'error');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        }
    };

    const handleGenerateGroup = async () => {
        try {
            setIsGenerating(true);
            const response = await itemBarangGroupService.generateGroup();

            if (response?.status) {
                showAlert({
                    title: "Berhasil",
                    message: response.message || "Group berhasil di-generate",
                    type: "success"
                });
                // Trigger refresh of the table
                setRefreshTrigger(prev => prev + 1);
            } else {
                throw new Error(response?.message || "Gagal generate group");
            }
        } catch (error) {
            showAlert({
                title: "Error",
                message: error.message || "Terjadi kesalahan saat generate group",
                type: "error"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <AlertComponent />
            <MasterDataLayout
                title="Item Barang Group"
                subtitle="Master Data"
                service={itemBarangGroupService}
                refreshTrigger={refreshTrigger}
                customHeaderContent={
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showDimensions"
                                checked={showDimensions}
                                onChange={(e) => setShowDimensions(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="showDimensions" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Tampilkan dimensi
                            </label>
                        </div>
                    </div>
                }
                customHeaderButtons={[
                    {
                        label: isGenerating ? "Generating..." : "Generate Group",
                        icon: isGenerating ? (
                            <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        ),
                        onClick: handleGenerateGroup,
                        disabled: isGenerating,
                        className: isGenerating
                            ? "bg-gray-100 cursor-not-allowed text-gray-500 font-medium"
                            : "bg-transparent hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-200"
                    },
                    {
                        label: "Download Template",
                        icon: <Download className="h-4 w-4" />,
                        onClick: async () => {
                            try {
                                await itemBarangGroupService.downloadTemplate();
                            } catch (error) {
                                console.error("Download template failed:", error);
                            }
                        },
                        className: "bg-transparent hover:bg-green-50 text-gray-700 hover:text-green-700 transition-all duration-200"
                    },
                    {
                        label: "Import Data",
                        icon: <Upload className="h-4 w-4" />,
                        onClick: () => fileInputRef.current?.click(),
                        className: "bg-transparent hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-200"
                    }
                ]}
                fields={[
                    {
                        name: "jenis_barang_id",
                        label: "Jenis Barang",
                        type: "select",
                        required: true,
                        optionLabel: "label",
                        optionsLoader: async () => {
                            const res = await jenisBarangService.getAll();
                            const list = res?.data || [];
                            return list.map(it => ({
                                id: it.id,
                                value: String(it.id),
                                label: it.nama_jenis || it.nama || it.kode || String(it.id)
                            }));
                        }
                    },
                    {
                        name: "bentuk_barang_id",
                        label: "Bentuk Barang",
                        type: "select",
                        required: true,
                        optionLabel: "label",
                        optionsLoader: async () => {
                            const res = await bentukBarangService.getAll();
                            const options = (res?.data || []).map(item => ({
                                id: item.id,
                                value: String(item.id),
                                label: (item.nama_bentuk || item.nama || 'Unknown') + ` (${item.dimensi || 'N/A'})`,
                                dimensi: item.dimensi,
                                tipe_barang: item.tipe_barang
                            }));

                            // Build maps
                            bentukBarangDimensiMap = {};
                            bentukBarangTipeMap = {};
                            options.forEach(opt => {
                                if (opt.value) {
                                    bentukBarangDimensiMap[opt.value] = opt.dimensi;
                                    bentukBarangTipeMap[opt.value] = opt.tipe_barang;
                                }
                            });

                            return options;
                        },
                        onChangeForm: (form, val) => {
                            const dimensi = bentukBarangDimensiMap[val] || null;
                            const tipeBarang = bentukBarangTipeMap[val] || null;

                            const updatedForm = {
                                ...form,
                                _bentuk_barang_dimensi: dimensi,
                                _tipe_barang: tipeBarang
                            };

                            if (dimensi === "1D") {
                                updatedForm.lebar = null;
                            }

                            return updatedForm;
                        }
                    },
                    {
                        name: "grade_barang_id",
                        label: "Grade Barang",
                        type: "select",
                        required: true,
                        optionLabel: "label",
                        optionsLoader: async () => {
                            const res = await gradeBarangService.getAll();
                            const list = res?.data || [];
                            return list.map(it => ({
                                id: it.id,
                                value: String(it.id),
                                label: it.nama || it.kode || String(it.id)
                            }));
                        }
                    },
                    // Dynamic dimension fields based on tipe_barang
                    {
                        name: "diameter_luar",
                        label: "Diameter Luar (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.diameter_luar === true,
                        hidden: (form) => form._tipe_barang?.diameter_luar !== true
                    },
                    {
                        name: "diameter_dalam",
                        label: "Diameter Dalam (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.diameter_dalam === true,
                        hidden: (form) => form._tipe_barang?.diameter_dalam !== true
                    },
                    {
                        name: "diameter",
                        label: "Diameter (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.diameter === true,
                        hidden: (form) => form._tipe_barang?.diameter !== true
                    },
                    {
                        name: "sisi1",
                        label: "Sisi 1 (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.sisi1 === true,
                        hidden: (form) => form._tipe_barang?.sisi1 !== true
                    },
                    {
                        name: "sisi2",
                        label: "Sisi 2 (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.sisi2 === true,
                        hidden: (form) => form._tipe_barang?.sisi2 !== true
                    },
                    {
                        name: "tebal",
                        label: "Tebal (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.tebal === true,
                        hidden: (form) => form._tipe_barang?.tebal !== true
                    },
                    {
                        name: "lebar",
                        label: "Lebar (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.lebar === true,
                        hidden: (form) => form._tipe_barang?.lebar !== true
                    },
                    {
                        name: "panjang",
                        label: "Panjang (mm)",
                        type: "number",
                        step: 0.01,
                        required: (form) => form._tipe_barang?.panjang === true,
                        hidden: (form) => form._tipe_barang?.panjang !== true
                    },
                    { name: "quantity_utuh", label: "Quantity Utuh", type: "number", step: 1 },
                    { name: "quantity_potongan", label: "Quantity Potongan", type: "number", step: 1 },
                ]}
                columns={[
                    { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
                    { key: "bentuk_barang.dimensi", label: "Dimensi", align: "center", width: "8rem", maxWidth: "8rem" },
                    { key: "jenis_barang.nama_jenis", label: "Jenis Barang", align: "left", width: "12rem", maxWidth: "15rem" },
                    { key: "bentuk_barang.nama_bentuk", label: "Bentuk Barang", align: "left", width: "12rem", maxWidth: "15rem" },
                    { key: "grade_barang.nama", label: "Grade Barang", align: "left", width: "12rem", maxWidth: "15rem" },
                    { key: "nama_group_barang", label: "Nama Group Barang", align: "left", width: "20rem", maxWidth: "25rem" },
                    // Dimension columns - conditionally shown
                    ...(showDimensions ? [
                        { key: "diameter_luar", label: "DL (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                        { key: "diameter_dalam", label: "DD (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                        { key: "diameter", label: "D (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                        { key: "sisi1", label: "S1 (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                        { key: "sisi2", label: "S2 (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                        { key: "tebal", label: "T (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                        { key: "lebar", label: "L (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                        { key: "panjang", label: "P (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                    ] : []),
                    { key: "quantity_utuh", label: "Qty Utuh", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
                    { key: "quantity_potongan", label: "Qty Potongan", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
                ]}
            />
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".csv,.txt"
                style={{ display: 'none' }}
            />
        </>
    );
}
