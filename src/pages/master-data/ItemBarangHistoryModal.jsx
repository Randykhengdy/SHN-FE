import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { request } from "@/lib/request";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";

export default function ItemBarangHistoryModal({ onClose, item }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item?.id) {
      fetchHistory();
    }
  }, [item]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await request(`/item-barang/${item.id}/history`);
      if (response.success) {
        setHistory(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching item history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <DialogTitle>Riwayat Penggunaan: {item?.nama_item_barang}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <span className="mt-4 text-gray-600 font-medium">Memuat data riwayat...</span>
            </div>
          ) : history.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Nomor WO</TableHead>
                    <TableHead className="font-bold">Ukuran Request</TableHead>
                    <TableHead className="text-center font-bold">Berat Actual</TableHead>
                    <TableHead className="text-center font-bold">Saldo Sisa</TableHead>
                    <TableHead className="text-center font-bold">Tanggal Actual</TableHead>
                    <TableHead className="text-center font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="font-medium text-gray-900">{row.customer || "-"}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">{row.nomor_wo || "-"}</TableCell>
                      <TableCell className="text-gray-600">{row.ukuran_barang_request || "-"}</TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {row.berat_actual ? `${row.berat_actual.toLocaleString()} kg` : "-"}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-gray-700">
                        {row.saldo_berat_sisa ? `${row.saldo_berat_sisa.toLocaleString()} kg` : "-"}
                      </TableCell>
                      <TableCell className="text-center text-gray-500">
                        {row.tanggal_actual || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={row.status === "Actualized" ? "success" : "secondary"}
                          className={row.status === "Actualized" 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-blue-100 text-blue-700 border-blue-200"
                          }
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-24 text-gray-500 bg-white rounded-lg border">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-600">Tidak Ada Riwayat</p>
              <p className="text-sm">Belum ada catatan penggunaan untuk item ini.</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
