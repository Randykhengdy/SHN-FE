import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { salesPersonService } from "@/services/master-data/salesPersonService";

const ReportDateRangeModal = ({ open, onOpenChange, title, onGenerate, loading, showToggleBarang = false, showSalesPerson = false }) => {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [tampilkanBarang, setTampilkanBarang] = useState(true);
  const [salesPersons, setSalesPersons] = useState([]);
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState("");

  useEffect(() => {
    if (open && showSalesPerson) {
      const fetchSalesPersons = async () => {
        try {
          const resp = await salesPersonService.getAll();
          if (resp && resp.data) {
            setSalesPersons(resp.data);
          } else if (Array.isArray(resp)) {
            setSalesPersons(resp);
          }
        } catch (e) {
          console.error("Gagal mengambil master data sales person:", e);
        }
      };
      fetchSalesPersons();
    }
  }, [open, showSalesPerson]);

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(dateFrom, dateTo, tampilkanBarang, selectedSalesPersonId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <DialogTitle>{title || "Generate Report"}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateFrom" className="text-right">
              Dari
            </Label>
            <Input
              id="dateFrom"
              type="date"
              className="col-span-3"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dateTo" className="text-right">
              Sampai
            </Label>
            <Input
              id="dateTo"
              type="date"
              className="col-span-3"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {showSalesPerson && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salesPerson" className="text-right">
                Sales Person
              </Label>
              <select
                id="salesPerson"
                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedSalesPersonId}
                onChange={(e) => setSelectedSalesPersonId(e.target.value)}
              >
                <option value="">Semua Sales Person</option>
                {salesPersons.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.nama_sales}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showToggleBarang && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tampilkanBarang" className="text-right">
                Tampilkan Barang
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="tampilkanBarang"
                  checked={tampilkanBarang}
                  onCheckedChange={setTampilkanBarang}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleGenerate} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDateRangeModal;
