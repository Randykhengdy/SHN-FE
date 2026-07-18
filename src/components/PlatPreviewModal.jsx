import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Package, Eye, Loader2 } from 'lucide-react';
import { getCanvasPreviewByItemId } from '@/lib/canvasUtils';
import { request } from '@/lib/request';
import PlatShaftCanvas from '@/components/PlatShaftCanvas';

const PlatPreviewModal = ({
  isOpen,
  onClose,
  currentItemData,
  calculateRequiredArea,
  onItemSelect
}) => {
  const navigate = useNavigate();
  const [generatingPreviews, setGeneratingPreviews] = useState({});
  const [previewImages, setPreviewImages] = useState({});
  const [showCanvas, setShowCanvas] = useState(false);
  const [selectedCanvasItem, setSelectedCanvasItem] = useState(null);

  const [previewItems, setPreviewItems] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPreviewItems = async (searchVal = '') => {
    if (!currentItemData) return;
    setLoadingPreview(true);
    try {
      const response = await request(`/work-order-planning/get-saran-plat-dasar?per_page=50&page=1`, {
        method: 'POST',
        body: JSON.stringify({
          jenis_barang_id: currentItemData.jenis_barang_id,
          bentuk_barang_id: currentItemData.bentuk_barang_id,
          grade_barang_id: currentItemData.grade_barang_id,
          tebal: parseFloat(currentItemData.tebal) || 0,
          panjang: parseFloat(currentItemData.panjang) || 0,
          lebar: parseFloat(currentItemData.lebar) || 0,
          per_page: 50,
          page: 1,
          item_barang_group_id: currentItemData.item_barang_group_id || null,
          diameter_luar: parseFloat(currentItemData.diameter_luar) || 0,
          diameter_dalam: parseFloat(currentItemData.diameter_dalam) || 0,
          diameter: parseFloat(currentItemData.diameter) || 0,
          sisi1: parseFloat(currentItemData.sisi1) || 0,
          sisi2: parseFloat(currentItemData.sisi2) || 0,
          jenis_potongan: 'potongan',
          search: searchVal || null
        })
      });
      setPreviewItems(response.data || []);
    } catch (error) {
      console.error('Error fetching preview items:', error);
      setPreviewItems([]);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentItemData) {
      setSearchQuery('');
      fetchPreviewItems('');
    }
  }, [isOpen, currentItemData]);

  const handleSearch = () => {
    fetchPreviewItems(searchQuery);
  };

  useEffect(() => {
    const handler = (e) => {
      const id = e?.detail?.itemId;
      if (id) {
        refreshPreviewForItem(id);
      }
    };
    window.addEventListener('canvasPreviewSaved', handler);
    return () => window.removeEventListener('canvasPreviewSaved', handler);
  }, []);

  // Generate canvas previews when modal opens
  useEffect(() => {
    if (isOpen && previewItems && previewItems.length > 0) {
      generateAllPreviews();
    }
  }, [isOpen, previewItems]);

  // Refresh previews when modal reopens (in case user came back from canvas)
  useEffect(() => {
    if (isOpen) {
      // Clear existing previews to force regeneration
      setPreviewImages({});
      setGeneratingPreviews({});

      // Regenerate previews if we have items
      // Avoid duplicate generation here; first effect handles regeneration
    }
  }, [isOpen]);

  const generateAllPreviews = async () => {
    for (const item of previewItems) {
      if (!item.id) continue;
      await generatePreviewForItem(item.id);
    }
  };

  const generatePreviewForItem = async (itemId) => {
    if (generatingPreviews[itemId]) {
      return;
    }
    console.log(`🔍 Starting preview generation for item ${itemId}`);
    setGeneratingPreviews(prev => ({ ...prev, [itemId]: true }));

    try {
      console.log(`🚀 Fetching preview for item ${itemId} (localStorage first)`);
      console.log(`📞 Calling getCanvasPreviewByItemId(${itemId})...`);
      const previewPath = await getCanvasPreviewByItemId(itemId);
      console.log(`📞 getCanvasPreviewByItemId returned:`, previewPath);

      if (previewPath) {
        setPreviewImages(prev => ({ ...prev, [itemId]: previewPath }));
        console.log(`✅ Preview ready for item ${itemId}`);
      } else {
        console.log(`❌ No preview path returned for item ${itemId}`);
      }
    } catch (error) {
      console.error(`❌ Error generating preview for item ${itemId}:`, error);
    } finally {
      setGeneratingPreviews(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCanvasClose = () => {
    setShowCanvas(false);
    setSelectedCanvasItem(null);
    // Refresh previews when returning from canvas
    console.log('Canvas closed, refreshing all previews...');
    setPreviewImages({});
    setGeneratingPreviews({});
    if (previewItems && previewItems.length > 0) {
      setTimeout(() => {
        generateAllPreviews();
      }, 800);
    }
  };

  const refreshPreviewForItem = async (itemId) => {
    console.log(`🔄 Refreshing preview for item ${itemId}...`);
    await generatePreviewForItem(itemId);
  };

  if (!isOpen || !currentItemData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Preview Plat Dasar</h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentItemData.panjang}×{currentItemData.lebar}×{currentItemData.tebal}mm •
              Luas dibutuhkan: {calculateRequiredArea(currentItemData).toLocaleString()} mm²
            </p>
          </div>

          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <Input
              type="text"
              placeholder="Cari kode barang, nama, dsb..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSearch}>Cari</Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
          {loadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data preview...</p>
              </div>
            </div>
          ) : previewItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada data plat dasar yang tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {previewItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Preview Image Placeholder */}
                      <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                        {generatingPreviews[item.id] ? (
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                            <p className="text-xs text-gray-500">Generating Preview...</p>
                          </div>
                        ) : previewImages[item.id] ? (
                          <img
                            src={previewImages[item.id]}
                            alt={`Canvas Preview ${item.nama || item.id}`}
                            className="rounded-md"
                            style={{
                              width: '90%',
                              height: '90%',
                              objectFit: 'contain'
                            }}
                            onError={async (e) => {
                              console.error('Preview image failed to load:', previewImages[item.id]);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                              console.log(`🔄 Image failed to load for item ${item.id}, attempting to generate new preview...`);
                              try {
                                const previewPath = await getCanvasPreviewByItemId(item.id);
                                if (previewPath) {
                                  setPreviewImages(prev => ({ ...prev, [item.id]: previewPath }));
                                  console.log(`✅ Generated new preview after image load failure for item ${item.id}`);
                                }
                              } catch (error) {
                                console.error(`❌ Failed to generate new preview for item ${item.id}:`, error);
                              }
                            }}
                          />
                        ) : null}

                        {/* Fallback placeholder */}
                        <div
                          className="text-center absolute inset-0 flex items-center justify-center"
                          style={{ display: previewImages[item.id] ? 'none' : 'flex' }}
                        >
                          <div className="text-center">
                            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">
                              {generatingPreviews[item.id] ? 'Generating...' : 'No Preview Available'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Item Name */}
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">
                          {item.nama || `Plat ${item.id}`}
                        </h3>
                        {item.kode_barang && (
                          <p className="text-[11px] font-mono text-gray-500 bg-gray-50 p-1 rounded mt-1 border border-gray-100 break-all">
                            {item.kode_barang}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {item.ukuran} mm
                        </p>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Quantity:</span>
                        <Badge variant="outline" className="text-xs">
                          {item.qty || 1}
                        </Badge>
                      </div>

                      {/* Sisa */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Sisa:</span>
                        <Badge
                          variant={item.sisa_luas > 0 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {item.sisa_luas?.toLocaleString() || 0} mm²
                        </Badge>
                      </div>


                      {/* Action Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          // Open canvas as modal instead of navigating
                          setSelectedCanvasItem(item);
                          setShowCanvas(true);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Lihat Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canvas Modal */}
      {showCanvas && selectedCanvasItem && (
        <PlatShaftCanvas
          isOpen={showCanvas}
          onClose={handleCanvasClose}
          selectedItem={selectedCanvasItem}
          workOrderItem={currentItemData}
          workOrderId={currentItemData?.id}
          onCanvasSaved={(savedItem) => {
            // Handle canvas save - refresh preview for the specific item that was saved
            console.log('Canvas saved, refreshing preview for item:', savedItem);
            if (savedItem && savedItem.id) {
              refreshPreviewForItem(savedItem.id);
            } else {
              // Fallback: refresh all previews if no specific item info
              console.log('No specific item info, refreshing all previews...');
              setPreviewImages({});
              setGeneratingPreviews({});
              if (previewItems && previewItems.length > 0) {
                generateAllPreviews();
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default PlatPreviewModal;
