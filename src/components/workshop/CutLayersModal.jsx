import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CutLayersModal({ isOpen, onClose, cuts }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Daftar Potongan</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Ukuran</TableHead>
                <TableHead>Berat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuts && cuts.length > 0 ? (
                cuts.map((cut, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {cut.width} x {cut.height}
                    </TableCell>
                    <TableCell>
                      {cut.weight ? `${cut.weight} kg` : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    Belum ada potongan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}