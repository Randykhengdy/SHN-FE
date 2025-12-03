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
      // If no search query, show all data
      if (!searchQuery || searchQuery.trim() === '') {
        return true;
      }
      
      return columns.some(column => {
        const value = item[column.key];
        if (value !== null && value !== undefined) {
          // Convert value to string for searching (handles numbers, strings, etc.)
          const valueStr = String(value).toLowerCase();
          return valueStr.includes(searchQuery.toLowerCase());
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
      <DialogContent className="modal-content-standard max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="modal-header-standard flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="page-title">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 px-6 pb-6">
          {/* Search */}
          <div className="relative flex-shrink-0 mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input-standard pl-10 pr-4"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>

          {/* Table with scroll */}
          <Card className="card-standard flex-1 min-h-0 flex flex-col border">
            <CardContent className="p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Table Container with scroll */}
                <div 
                  className="flex-1 overflow-y-auto overflow-x-auto relative"
                  style={{ 
                    scrollbarWidth: 'auto',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}
                >
                  <Table className="table-standard w-full">
                    <TableHeader className="table-header-standard sticky top-0 bg-white z-10 border-b">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataTableModal;
