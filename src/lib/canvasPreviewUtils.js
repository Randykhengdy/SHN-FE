/**
 * Canvas Preview Utilities
 * Handles finding and encoding canvas preview files with format:
 * canvas-preview-WoItemId-{woItemId}_ItemId-{itemId}.jpg
 */

/**
 * Find canvas preview file for given woItemId and itemId
 * @param {string} woItemId - Work Order Item ID
 * @param {string} itemId - Item ID
 * @returns {Promise<string|null>} - File path if found, null if not found
 */
export const findCanvasPreviewFile = async (woItemId, itemId) => {
  try {
    const fileName = `canvas-preview-WoItemId-${woItemId}_ItemId-${itemId}.jpg`;
    // Remove /public prefix as it's served from root
    const filePath = `/canvas-previews/${fileName}`;
    
    // Check if file exists by trying to fetch it
    const response = await fetch(filePath, { method: 'HEAD' });
    if (response.ok) {
      return filePath;
    }
    
    return null;
  } catch (error) {
    console.warn(`Canvas preview file not found for WoItemId: ${woItemId}, ItemId: ${itemId}`, error);
    return null;
  }
};

/**
 * Convert image file to base64
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string|null>} - Base64 encoded image or null if error
 */
export const imageToBase64 = async (filePath) => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove the data:image/jpeg;base64, prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

/**
 * Get canvas preview as base64 for given woItemId and itemId
 * @param {string} woItemId - Work Order Item ID  
 * @param {string} itemId - Item ID
 * @returns {Promise<string|null>} - Base64 encoded image or null if not found
 */
export const getCanvasPreviewBase64 = async (woItemId, itemId) => {
  try {
    // Priority 1: Check LocalStorage for specific WO Item preview
    if (typeof window !== 'undefined' && window.localStorage) {
      const specificKey = `WO_canvas_preview_woitem_${woItemId}_item_${itemId}`;
      const genericKey = `WO_canvas_preview_item_${itemId}`;
      
      let cachedData = window.localStorage.getItem(specificKey);
      
      // Priority 2: Check LocalStorage for generic Item preview
      if (!cachedData) {
        cachedData = window.localStorage.getItem(genericKey);
      }
      
      if (cachedData) {
        // cachedData is a DataURL (data:image/jpeg;base64,...), we need to strip the prefix
        // because the consumer (processWorkOrderItemsWithCanvasPreviews) adds it back
        const base64 = cachedData.replace(/^data:image\/[a-z]+;base64,/, '');
        console.log(`Canvas preview found in LocalStorage for WoItemId: ${woItemId}, ItemId: ${itemId}`);
        return base64;
      }
    }

    // Legacy file lookup removed to prevent EXE errors as per user request
    console.log(`No canvas preview found in LocalStorage for WoItemId: ${woItemId}, ItemId: ${itemId}`);
    return null;
  } catch (error) {
    console.error('Error getting canvas preview base64:', error);
    return null;
  }
};

/**
 * Process work order items and add canvas previews to saran_plat_dasar
 * @param {Array} items - Work order items array
 * @returns {Promise<Array>} - Items with canvas previews added to saran_plat_dasar
 */
export const processWorkOrderItemsWithCanvasPreviews = async (items) => {
  if (!Array.isArray(items)) {
    return items;
  }

  const processedItems = await Promise.all(
    items.map(async (item) => {
      if (!item.saran_plat_dasar || !Array.isArray(item.saran_plat_dasar)) {
        return item;
      }

      const processedSaranPlat = await Promise.all(
        item.saran_plat_dasar.map(async (saranPlat) => {
          // Check if we have matching woItemId and itemId
          const woItemId = item.wo_item_unique_id;
          const itemId = saranPlat.item_barang_id;
          
          if (woItemId && itemId) {
            const canvasBase64 = await getCanvasPreviewBase64(woItemId, itemId);
            if (canvasBase64) {
              return {
                ...saranPlat,
                canvas_image: `data:image/jpeg;base64,${canvasBase64}`
              };
            }
          }
          
          return saranPlat;
        })
      );

      return {
        ...item,
        saran_plat_dasar: processedSaranPlat
      };
    })
  );

  return processedItems;
};