import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SaranViewModal({ isOpen, onClose, saranData, itemInfo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Detail Item Barang
            </h2>
            {itemInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Jenis: {itemInfo.jenisBarang?.nama_jenis_barang || itemInfo.jenisBarang?.nama || 'N/A'} | 
                Bentuk: {itemInfo.bentukBarang?.nama_bentuk_barang || itemInfo.bentukBarang?.nama || 'N/A'}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {saranData && saranData.length > 0 ? (
            <div className="space-y-4">
              {saranData.map((saran, index) => (
                <Card key={saran.saranItemId || index} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-600">
                      Item Barang #{index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Nama Item
                        </Label>
                        <Input 
                          value={saran.itemName || 'N/A'} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Quantity
                        </Label>
                        <Input 
                          value={saran.quantity || 0} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                Tidak ada data item barang
              </div>
              <p className="text-gray-500 text-sm">
                Belum ada item barang untuk work order ini
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}