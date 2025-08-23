import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CutReportTable({ selectedPO }) {
  const [cutReports, setCutReports] = useState([]);

  useEffect(() => {
    if (selectedPO) {
      const allReports = JSON.parse(localStorage.getItem("cuttingReports")) || [];
      const filtered = allReports.filter((report) => report.noPO === selectedPO.noPO);
      setCutReports(filtered);
    }
  }, [selectedPO]);

  if (!selectedPO) return null;

  return (
    <Card className="p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        Hasil Potong untuk PO: {selectedPO.noPO}
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ukuran</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cutReports.length > 0 ? (
            cutReports.map((report, idx) => (
              <TableRow key={idx}>
                <TableCell>{report.ukuran}</TableCell>
                <TableCell>{report.qty}</TableCell>
                <TableCell>{report.keterangan || "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                Belum ada hasil potong untuk PO ini.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
