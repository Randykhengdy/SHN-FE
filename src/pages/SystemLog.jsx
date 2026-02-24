import React from "react";
import MasterDataLayout from "@/components/MasterDataLayout";
import sysLogService from "@/services/sysLogService";
import { Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAlert } from "@/hooks/useAlert";

export default function SystemLogPage() {
    const { showAlert, showConfirm, AlertComponent } = useAlert();

    const handleClearAll = async (fetchData) => {
        showConfirm(
            "Hapus Semua Log",
            "Apakah Anda yakin ingin menghapus SEMUA log? Tindakan ini tidak dapat dibatalkan.",
            async () => {
                try {
                    await sysLogService.clearAll();
                    if (fetchData) fetchData();
                } catch (error) {
                    console.error("Clear logs error:", error);
                    showAlert("Error", "Gagal menghapus log: " + error.message, "error");
                }
            },
            null,
            "Ya, Hapus Semua",
            "Batal"
        );
    };

    const getLogLevelBadge = (level) => {
        let colors = "bg-gray-100 text-gray-800 border-gray-200";
        switch (level) {
            case "INFO":
                colors = "bg-blue-100 text-blue-700 border-blue-200";
                break;
            case "WARNING":
                colors = "bg-yellow-100 text-yellow-700 border-yellow-200";
                break;
            case "ERROR":
                colors = "bg-red-100 text-red-700 border-red-200";
                break;
            case "CRITICAL":
                colors = "bg-purple-100 text-purple-700 border-purple-200 font-bold animate-pulse";
                break;
            default:
                break;
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}>
                {level}
            </span>
        );
    };

    return (
        <>
            <AlertComponent />
            <MasterDataLayout
                title="System Log"
                subtitle="Help & Troubleshooting"
                service={sysLogService}
                menuCode="SYSTEM_LOG" // Used for permission context
                columns={[
                    {
                        key: "timestamp",
                        label: "Waktu",
                        width: "12rem",
                        getValue: (item) => format(new Date(item.timestamp), "dd MMM yyyy HH:mm:ss", { locale: id })
                    },
                    {
                        key: "log_level",
                        label: "Level",
                        width: "8rem",
                        align: "center",
                        getValue: (item) => getLogLevelBadge(item.log_level)
                    },
                    {
                        key: "modul",
                        label: "Modul",
                        width: "12rem"
                    },
                    {
                        key: "error",
                        label: "Pesan Error",
                        minWidth: "20rem",
                        getCellClassName: () => "break-words whitespace-normal"
                    },
                    {
                        key: "cause",
                        label: "Penyebab",
                        minWidth: "15rem",
                        getCellClassName: () => "text-gray-500 italic break-words whitespace-normal"
                    },
                ]}
                fields={[]} // Read-only, so no fields for add/edit modal
                customHeaderButtons={[
                    {
                        label: "Hapus Semua Log",
                        onClick: (e, fetchData) => handleClearAll(fetchData),
                        icon: <Trash2 size={16} />,
                        className: "bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200",
                    },
                ]}
            />
        </>
    );
}
