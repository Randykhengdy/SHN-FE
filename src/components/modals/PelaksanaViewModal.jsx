import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function PelaksanaViewModal({ 
  isOpen, 
  onClose, 
  pelaksanaData = [], 
  itemInfo = null 
}) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch (error) {
      return 'N/A';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Data Pelaksana
            </h2>
            {itemInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Item: {itemInfo.jenisBarang?.nama_jenis_barang || itemInfo.jenisBarang?.nama || 'N/A'} - 
                {itemInfo.bentukBarang?.nama_bentuk_barang || itemInfo.bentukBarang?.nama || 'N/A'}
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
          {pelaksanaData && pelaksanaData.length > 0 ? (
            <div className="space-y-4">
              {pelaksanaData.map((pelaksana, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-600">
                      Pelaksana #{index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Nama Pelaksana
                        </Label>
                        <Input 
                          value={pelaksana.pelaksana_info?.nama_pelaksana || pelaksana.nama || 'N/A'} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Jabatan
                        </Label>
                        <Input 
                          value={pelaksana.pelaksana_info?.jabatan || pelaksana.jabatan || 'N/A'} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Quantity
                        </Label>
                        <Input 
                          value={pelaksana.qty || 0} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Weight (kg)
                        </Label>
                        <Input 
                          value={pelaksana.weight || 0} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Tanggal
                        </Label>
                        <Input 
                          value={formatDate(pelaksana.tanggal)} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Jam Mulai
                        </Label>
                        <Input 
                          value={formatTime(pelaksana.jam_mulai)} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Jam Selesai
                        </Label>
                        <Input 
                          value={formatTime(pelaksana.jam_selesai)} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      {pelaksana.catatan && (
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Catatan
                          </Label>
                          <Input 
                            value={pelaksana.catatan} 
                            disabled 
                            className="bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                Tidak ada data pelaksana
              </div>
              <p className="text-gray-500 text-sm">
                Belum ada pelaksana yang ditugaskan untuk item ini
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