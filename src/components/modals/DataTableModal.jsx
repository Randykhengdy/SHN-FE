import React, { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DataTableModal = ({ 
  open, 
  onOpenChange, 
  onItemSelect, 
  data = [],
  columns = [],
  title = "Pilih Data",
  searchPlaceholder = "Cari data...",
  selectButtonText = "Pilih"
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data based on search query
  const filteredData = data.filter(item => {
    try {
      return columns.some(column => {
        const value = item[column.key];
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      });
    } catch (error) {
      console.error('Error filtering data:', error);
      return false;
    }
  });

  const handleItemSelect = (item) => {
    onItemSelect(item);
    onOpenChange(false);
    setSearchQuery("");
  };

  const renderCell = (item, column) => {
    try {
      const value = item[column.key];
      
      // Handle badge rendering
      if (column.type === 'badge') {
        const color = column.badgeColor ? column.badgeColor(value) : 'bg-gray-100 text-gray-800';
        return (
          <Badge className={color}>
            {value}
          </Badge>
        );
      }
      
      // Handle custom rendering
      if (column.render) {
        return column.render(value, item);
      }
      
      // Default text rendering
      return value || '-';
    } catch (error) {
      console.error('Error rendering cell:', error);
      return '-';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-content-standard max-h-[80vh] overflow-hidden">
        <DialogHeader className="modal-header-standard">
          <DialogTitle className="page-title">{title}</DialogTitle>
        </DialogHeader>

        <div className="modal-body-standard space-md">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input-standard pl-10"
            />
          </div>

          {/* Table */}
          <Card className="card-standard">
            <CardContent className="p-0">
              <Table className="table-standard">
                <TableHeader className="table-header-standard">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key} className="table-header-cell-standard">
                        {column.label}
                      </TableHead>
                    ))}
                    <TableHead className="table-header-cell-standard text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={item.id || index} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <TableCell key={column.key} className="table-cell-standard">
                          {renderCell(item, column)}
                        </TableCell>
                      ))}
                      <TableCell className="table-cell-standard text-center">
                        <Button
                          size="sm"
                          onClick={() => handleItemSelect(item)}
                          className="btn-primary"
                        >
                          {selectButtonText}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="table-cell-standard text-center text-gray-500 py-8">
                        {searchQuery ? "Tidak ada data yang ditemukan" : "Tidak ada data"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataTableModal;
