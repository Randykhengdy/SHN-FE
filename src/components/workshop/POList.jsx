import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function POList({ onSelectPO }) {
  const [poList, setPoList] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("poList")) || [];
    const notCut = stored.filter((po) => !po.statusPotong);
    setPoList(notCut);
  }, []);

  return (
    <Card className="p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Daftar PO Belum Dipotong</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No PO</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {poList.length > 0 ? (
            poList.map((po, idx) => (
              <TableRow key={idx}>
                <TableCell>{po.noPO}</TableCell>
                <TableCell>{po.tanggal}</TableCell>
                <TableCell>{po.item}</TableCell>
                <TableCell>{po.qty}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => onSelectPO(po)}>
                    Input Potong
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                Tidak ada PO yang tersedia
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
