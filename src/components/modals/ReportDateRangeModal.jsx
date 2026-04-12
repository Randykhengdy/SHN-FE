import React, { useState } from "react";
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
import { Calendar } from "lucide-react";

const ReportDateRangeModal = ({ open, onOpenChange, title, onGenerate, loading }) => {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(dateFrom, dateTo);
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
