import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAlert } from "@/hooks/useAlert";
import {
    ArrowLeft,
    Package,
    MapPin,
    CheckCircle2,
    Loader2,
    ScanLine,
    RotateCcw,
    History,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { woActualService } from "@/services/woActualService";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

const BASE_URL = API_ENDPOINTS.itemBarang;

export default function ReturnToRackPage() {
    const navigate = useNavigate();
    const { showAlert, AlertComponent } = useAlert();

    // Input refs
    const itemInputRef = useRef(null);
    const rakInputRef = useRef(null);

    // State
    const [itemKode, setItemKode] = useState("");
    const [rakInput, setRakInput] = useState("");
    const [catatan, setCatatan] = useState("");
    const [itemData, setItemData] = useState(null);
    const [rakData, setRakData] = useState(null);
    const [isLoadingItem, setIsLoadingItem] = useState(false);
    const [isLoadingRak, setIsLoadingRak] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Auto-focus item input on mount
    useEffect(() => {
        itemInputRef.current?.focus();
    }, []);

    // Load history
    const loadHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const res = await woActualService.getReturnHistory({ per_page: 20 });
            if (res && res.data) {
                setHistory(res.data);
            }
        } catch (err) {
            console.error("Error loading history:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Lookup item barang by kode
    const lookupItem = useCallback(async (kode) => {
        if (!kode.trim()) return;
        setIsLoadingItem(true);
        setItemData(null);

        try {
            const res = await request(`${BASE_URL}/qr-data-by-kode/${encodeURIComponent(kode.trim())}`, { method: 'GET' });
            if (res && res.data) {
                setItemData(res.data);
                // Auto-focus rak input after successful item lookup
                setTimeout(() => rakInputRef.current?.focus(), 100);
            } else {
                showAlert("Item tidak ditemukan", `Kode barang "${kode}" tidak ditemukan di database.`, "error");
                setItemKode("");
                itemInputRef.current?.focus();
            }
        } catch (err) {
            showAlert("Error", err.message || "Gagal mencari item barang", "error");
            setItemKode("");
            itemInputRef.current?.focus();
        } finally {
            setIsLoadingItem(false);
        }
    }, [showAlert]);

    // Lookup rak by kode or JSON
    const lookupRak = useCallback(async (input) => {
        if (!input.trim()) return;
        setIsLoadingRak(true);
        setRakData(null);

        try {
            let kodeRak = input.trim();

            // Try to parse as JSON (from scanner)
            try {
                const parsed = JSON.parse(kodeRak);
                if (parsed.kode_rak) {
                    kodeRak = parsed.kode_rak;
                }
            } catch {
                // Not JSON, use as-is (manual input of kode_rak)
            }

            const res = await request(`/rak/search-by-kode`, {
                method: 'POST',
                body: JSON.stringify({ kode: kodeRak })
            });

            if (res && res.data) {
                setRakData(res.data);
            } else {
                showAlert("Rak tidak ditemukan", `Kode rak "${kodeRak}" tidak ditemukan di database.`, "error");
                setRakInput("");
                rakInputRef.current?.focus();
            }
        } catch (err) {
            showAlert("Error", err.message || "Gagal mencari rak", "error");
            setRakInput("");
            rakInputRef.current?.focus();
        } finally {
            setIsLoadingRak(false);
        }
    }, [showAlert]);

    // Handle Enter key on item input
    const handleItemKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            lookupItem(itemKode);
        }
    };

    // Handle Enter key on rak input
    const handleRakKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            lookupRak(rakInput);
        }
    };

    // Save return to rack
    const handleSave = async () => {
        if (!itemData || !rakData) {
            showAlert("Data belum lengkap", "Silakan scan/input item barang dan rak terlebih dahulu.", "error");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                item_barang_id: itemData.id,
                rak_id: rakData.id,
                catatan: catatan || null,
            };

            const res = await woActualService.returnToRack(payload);
            if (res && (res.success || res.data)) {
                showAlert("Berhasil!", `Item ${itemData.kode_barang} berhasil dikembalikan ke rak ${rakData.kode}.`, "success");
                // Reset form
                resetForm();
                // Reload history
                loadHistory();
            } else {
                showAlert("Gagal", res?.message || "Gagal menyimpan data", "error");
            }
        } catch (err) {
            showAlert("Error", err.message || "Gagal mengembalikan barang ke rak", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setItemKode("");
        setRakInput("");
        setCatatan("");
        setItemData(null);
        setRakData(null);
        setTimeout(() => itemInputRef.current?.focus(), 100);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Alert Component */}
            <AlertComponent />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            Kembalikan Barang ke Rak
                        </h1>
                        <p className="text-sm text-gray-500">
                            Scan kode item barang → scan kode rak → simpan
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 space-y-6">
                {/* Step 1: Scan/Input Item Barang */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${itemData ? 'bg-green-500' : 'bg-blue-500'}`}>
                                {itemData ? '✓' : '1'}
                            </div>
                            <Package className="w-4 h-4" />
                            Scan / Input Kode Item Barang
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    ref={itemInputRef}
                                    value={itemKode}
                                    onChange={(e) => setItemKode(e.target.value)}
                                    onKeyDown={handleItemKeyDown}
                                    placeholder="Scan QR atau ketik kode barang, lalu tekan Enter"
                                    disabled={isLoadingItem || !!itemData}
                                    className="font-mono"
                                />
                            </div>
                            {!itemData && (
                                <Button
                                    onClick={() => lookupItem(itemKode)}
                                    disabled={isLoadingItem || !itemKode.trim()}
                                    size="icon"
                                    variant="secondary"
                                >
                                    {isLoadingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                                </Button>
                            )}
                            {itemData && (
                                <Button
                                    onClick={() => {
                                        setItemData(null);
                                        setItemKode("");
                                        setTimeout(() => itemInputRef.current?.focus(), 100);
                                    }}
                                    size="icon"
                                    variant="outline"
                                    title="Reset item"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {/* Item Info */}
                        {itemData && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-800 text-sm">Item ditemukan</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div><span className="text-gray-500">Kode:</span> <span className="font-mono font-semibold">{itemData.kode_barang}</span></div>
                                    <div><span className="text-gray-500">Jenis:</span> {itemData.jenis_barang?.nama || '-'}</div>
                                    <div><span className="text-gray-500">Bentuk:</span> {itemData.bentuk_barang?.nama || '-'}</div>
                                    <div><span className="text-gray-500">Grade:</span> {itemData.grade_barang?.nama || '-'}</div>
                                    {itemData.rak && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Rak saat ini:</span>{' '}
                                            <Badge variant="outline" className="text-xs">{itemData.rak.kode} - {itemData.rak.nama_rak}</Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Scan/Input Rak */}
                <Card className={!itemData ? 'opacity-50 pointer-events-none' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${rakData ? 'bg-green-500' : itemData ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                {rakData ? '✓' : '2'}
                            </div>
                            <MapPin className="w-4 h-4" />
                            Scan / Input Kode Rak
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    ref={rakInputRef}
                                    value={rakInput}
                                    onChange={(e) => setRakInput(e.target.value)}
                                    onKeyDown={handleRakKeyDown}
                                    placeholder="Scan QR rak atau ketik kode rak, lalu tekan Enter"
                                    disabled={isLoadingRak || !!rakData || !itemData}
                                    className="font-mono"
                                />
                            </div>
                            {!rakData && (
                                <Button
                                    onClick={() => lookupRak(rakInput)}
                                    disabled={isLoadingRak || !rakInput.trim()}
                                    size="icon"
                                    variant="secondary"
                                >
                                    {isLoadingRak ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                                </Button>
                            )}
                            {rakData && (
                                <Button
                                    onClick={() => {
                                        setRakData(null);
                                        setRakInput("");
                                        setTimeout(() => rakInputRef.current?.focus(), 100);
                                    }}
                                    size="icon"
                                    variant="outline"
                                    title="Reset rak"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {/* Rak Info */}
                        {rakData && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-800 text-sm">Rak ditemukan</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <div><span className="text-gray-500">Kode:</span> <span className="font-mono font-semibold">{rakData.kode}</span></div>
                                    <div><span className="text-gray-500">Nama:</span> {rakData.nama_rak || '-'}</div>
                                    {rakData.gudang && (
                                        <div><span className="text-gray-500">Gudang:</span> {rakData.gudang.nama_gudang || '-'}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 3: Optional notes + Save */}
                <Card className={(!itemData || !rakData) ? 'opacity-50 pointer-events-none' : ''}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${(itemData && rakData) ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                3
                            </div>
                            Catatan & Simpan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <Label className="text-sm text-gray-500">Catatan (opsional)</Label>
                            <Textarea
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Catatan tambahan..."
                                rows={2}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !itemData || !rakData}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Simpan
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={resetForm}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* History */}
                <Card>
                    <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Riwayat Pengembalian
                                {history.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">{history.length}</Badge>
                                )}
                            </div>
                            {isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CardTitle>
                    </CardHeader>
                    {isHistoryOpen && (
                        <CardContent>
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            ) : history.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Belum ada riwayat pengembalian</p>
                            ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {history.map((item) => (
                                        <div key={item.id} className="border rounded-lg p-3 text-sm">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-0.5">
                                                    <div className="font-mono font-semibold">{item.item_barang?.kode_barang || '-'}</div>
                                                    <div className="text-gray-500">
                                                        → Rak: <span className="font-semibold">{item.rak?.kode || '-'}</span>
                                                        {item.rak?.nama_rak && ` (${item.rak.nama_rak})`}
                                                    </div>
                                                    {item.catatan && <div className="text-gray-400 italic">{item.catatan}</div>}
                                                </div>
                                                <div className="text-right text-xs text-gray-400 whitespace-nowrap ml-3">
                                                    <div>{item.returned_by_user?.name || 'Unknown'}</div>
                                                    <div>{item.returned_at ? new Date(item.returned_at).toLocaleString('id-ID') : '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
}
