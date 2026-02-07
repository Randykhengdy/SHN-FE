import React, { useState } from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import { Button } from "@/components/ui/button";
import { itemBarangGroupService, jenisBarangService, bentukBarangService, gradeBarangService } from "@/services/master-data";
import { useAlert } from "@/hooks/useAlert";

export default function ItemBarangGroupPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const { showAlert } = useAlert();

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
        <MasterDataLayout
            title="Item Barang Group"
            subtitle="Master Data"
            service={itemBarangGroupService}
            refreshTrigger={refreshTrigger}
            customHeaderContent={
                <Button
                    onClick={handleGenerateGroup}
                    disabled={isGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generate Group
                        </>
                    )}
                </Button>
            }
            fields={[
                {
                    name: "jenis_barang_id",
                    label: "Jenis Barang",
                    type: "select",
                    required: true,
                    service: jenisBarangService,
                    optionLabel: (item) => `${item.kode} - ${item.nama_jenis}`,
                    optionValue: "id"
                },
                {
                    name: "bentuk_barang_id",
                    label: "Bentuk Barang",
                    type: "select",
                    required: true,
                    service: bentukBarangService,
                    optionLabel: (item) => `${item.kode} - ${item.nama_bentuk}`,
                    optionValue: "id"
                },
                {
                    name: "grade_barang_id",
                    label: "Grade Barang",
                    type: "select",
                    required: true,
                    service: gradeBarangService,
                    optionLabel: (item) => `${item.kode} - ${item.nama}`,
                    optionValue: "id"
                },
                { name: "panjang", label: "Panjang (mm)", type: "number", step: 0.01 },
                { name: "lebar", label: "Lebar (mm)", type: "number", step: 0.01 },
                { name: "tebal", label: "Tebal (mm)", type: "number", step: 0.01 },
                { name: "diameter_luar", label: "Diameter Luar (mm)", type: "number", step: 0.01 },
                { name: "diameter_dalam", label: "Diameter Dalam (mm)", type: "number", step: 0.01 },
                { name: "diameter", label: "Diameter (mm)", type: "number", step: 0.01 },
                { name: "sisi1", label: "Sisi 1 (mm)", type: "number", step: 0.01 },
                { name: "sisi2", label: "Sisi 2 (mm)", type: "number", step: 0.01 },
                { name: "quantity_utuh", label: "Quantity Utuh", type: "number", step: 1 },
                { name: "quantity_potongan", label: "Quantity Potongan", type: "number", step: 1 },
                { name: "sequence", label: "Urutan Tampilan", type: "number", step: 1 },
            ]}
            columns={[
                { key: "id", label: "ID", align: "center", width: "5rem", maxWidth: "5rem" },
                { key: "jenis_barang.nama_jenis", label: "Jenis Barang", align: "left", width: "12rem", maxWidth: "15rem" },
                { key: "bentuk_barang.nama_bentuk", label: "Bentuk Barang", align: "left", width: "12rem", maxWidth: "15rem" },
                { key: "grade_barang.nama", label: "Grade Barang", align: "left", width: "12rem", maxWidth: "15rem" },
                { key: "diameter_luar", label: "DL (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "diameter_dalam", label: "DD (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "diameter", label: "D (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "sisi1", label: "S1 (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "sisi2", label: "S2 (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "tebal", label: "T (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "lebar", label: "L (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "panjang", label: "P (mm)", align: "center", width: "8rem", maxWidth: "8rem", format: "number" },
                { key: "quantity_utuh", label: "Qty Utuh", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
                { key: "quantity_potongan", label: "Qty Potongan", align: "center", width: "10rem", maxWidth: "10rem", format: "number" },
            ]}
        />
    );
}
