import { request } from './request';

/**
 * Get canvas image by item ID and convert to preview image
 * @param {number} itemId - The item barang ID
 * @returns {Promise<string|null>} - Returns the preview image path or null if failed
 */
export async function getCanvasPreviewByItemId(itemId) {
  try {
    console.log(`🖼️ Fetching canvas image for item ID: ${itemId}`);
    
    // Hit the API to get canvas image (base64)
    const response = await request(`/item-barang/${itemId}/canvas-image`, {
      method: 'GET'
    });
    
    console.log('Canvas image API response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', response ? Object.keys(response) : 'null');
    
    // Check if response has canvas image data
    if (!response) {
      console.log(`⚠️ No response received for item ID: ${itemId}`);
      return null;
    }
    
    if (!response.canvas_image) {
      console.log(`⚠️ No canvas_image field in response for item ID: ${itemId}`);
      console.log('Available fields:', Object.keys(response));
      return null;
    }
    
    console.log(`✅ Found canvas_image data for item ID: ${itemId}`);
    console.log(`Canvas image data length: ${response.canvas_image.length}`);
    
    // Convert base64 to blob and create preview
    const previewImagePath = await convertBase64ToPreview(itemId, response.canvas_image);
    
    console.log(`Preview image path returned: ${previewImagePath}`);
    return previewImagePath;
    
  } catch (error) {
    console.error(`❌ Error fetching canvas image for item ID ${itemId}:`, error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return null;
  }
}

/**
 * Convert base64 canvas image to preview image
 * @param {number} itemId - The item barang ID
 * @param {string} base64Image - The base64 encoded canvas image
 * @returns {Promise<string>} - Returns the preview image path
 */
export async function convertBase64ToPreview(itemId, base64Image) {
  try {
    console.log(`🔄 Converting base64 to preview for item ID: ${itemId}`);
    console.log(`Base64 data length: ${base64Image.length}`);
    console.log(`Base64 starts with: ${base64Image.substring(0, 50)}...`);
    
    // Convert base64 to blob
    console.log(`🔄 Converting base64 to blob...`);
    const blob = await base64ToBlob(base64Image);
    console.log(`✅ Blob created:`, {
      size: blob.size,
      type: blob.type
    });
    
    // Save the file to the public canvas-previews folder using Electron API
    const fileName = `canvas-preview-ItemId-${itemId}.jpg`;
    const filePath = `canvas-previews/${fileName}`;
    
    console.log(`🔄 Checking Electron API availability...`);
    console.log(`window.electronAPI:`, !!window.electronAPI);
    console.log(`window.electronAPI.saveCanvasFile:`, !!(window.electronAPI && window.electronAPI.saveCanvasFile));
    console.log(`Available Electron API methods:`, window.electronAPI ? Object.keys(window.electronAPI) : 'none');
    
    // Try to save using Electron API if available (using saveCanvasFile like the canvas page)
    if (window.electronAPI && window.electronAPI.saveCanvasFile) {
      try {
        console.log(`🔄 Converting blob to dataURL for Electron...`);
        // Convert blob to dataURL for Electron (like the canvas page does)
        const reader = new FileReader();
        const dataURL = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        console.log(`🔄 Calling Electron saveCanvasFile...`);
        const result = await window.electronAPI.saveCanvasFile(dataURL, fileName);
        console.log(`Electron saveCanvasFile result:`, result);
        
        if (result.success) {
          console.log(`✅ Saved preview file to public folder: ${fileName}`);
        } else {
          console.warn(`⚠️ Failed to save preview file: ${result.error}`);
        }
      } catch (electronError) {
        console.warn(`⚠️ Electron save failed: ${electronError.message}`);
        console.error('Electron error details:', electronError);
      }
    } else {
      console.log(`📁 Electron API not available, trying alternative save method...`);
      
      // Alternative method: Create a download link to save the file
      try {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ Triggered download for preview file: ${fileName}`);
      } catch (downloadError) {
        console.warn(`⚠️ Download method failed: ${downloadError.message}`);
      }
    }
    
    // Create object URL for immediate display
    console.log(`🔄 Creating object URL for display...`);
    const previewUrl = URL.createObjectURL(blob);
    console.log(`✅ Object URL created: ${previewUrl}`);
    
    console.log(`✅ Generated preview for item ID ${itemId}: ${filePath}`);
    console.log(`📐 Preview maintains original image dimensions`);
    
    return previewUrl; // Return the blob URL for immediate use
    
  } catch (error) {
    console.error('Error converting base64 to preview:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return null;
  }
}

/**
 * Convert base64 string to blob
 * @param {string} base64 - Base64 encoded image string
 * @returns {Promise<Blob>} - Returns the blob
 */
async function base64ToBlob(base64) {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create blob
  return new Blob([bytes], { type: 'image/jpeg' });
}

/**
 * Generate canvas preview image and save to public folder (legacy function for JSON canvas data)
 * @param {number} itemId - The item barang ID
 * @param {Object} canvasData - The canvas data object
 * @returns {Promise<string>} - Returns the preview image path
 */
export async function generateCanvasPreview(itemId, canvasData) {
  try {
    // Create a simple canvas representation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (you can adjust this based on your needs)
    canvas.width = 400;
    canvas.height = 300;
    
    // Fill background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw canvas content based on canvasData
    if (canvasData && canvasData.shapes) {
      drawCanvasShapes(ctx, canvasData.shapes, canvas.width, canvas.height);
    } else if (canvasData && canvasData.objects) {
      drawCanvasObjects(ctx, canvasData.objects, canvas.width, canvas.height);
    } else {
      // Draw a placeholder if no specific shapes found
      drawPlaceholder(ctx, canvas.width, canvas.height);
    }
    
    // Add title
    ctx.fillStyle = '#495057';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Item ID: ${itemId}`, canvas.width / 2, 25);
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          // Create object URL for the preview
          const previewUrl = URL.createObjectURL(blob);
          
          // Save to public folder (this is a simplified approach)
          // In a real app, you might want to upload this to a server
          const previewPath = `/canvas-previews/canvas-preview-ItemId-${itemId}.jpg`;
          
          console.log(`✅ Generated preview for item ID ${itemId}: ${previewPath}`);
          resolve(previewPath);
        } else {
          console.error('Failed to generate blob from canvas');
          resolve(null);
        }
      }, 'image/jpeg', 0.8);
    });
    
  } catch (error) {
    console.error('Error generating canvas preview:', error);
    return null;
  }
}

/**
 * Draw shapes from canvas data
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} shapes - Array of shapes
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function drawCanvasShapes(ctx, shapes, canvasWidth, canvasHeight) {
  shapes.forEach((shape, index) => {
    ctx.save();
    
    // Set color based on shape type or index
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];
    ctx.fillStyle = colors[index % colors.length];
    ctx.strokeStyle = colors[index % colors.length];
    ctx.lineWidth = 2;
    
    switch (shape.type) {
      case 'rectangle':
        const rectX = (shape.x / 100) * canvasWidth;
        const rectY = (shape.y / 100) * canvasHeight;
        const rectWidth = (shape.width / 100) * canvasWidth;
        const rectHeight = (shape.height / 100) * canvasHeight;
        
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        break;
        
      case 'circle':
        const circleX = (shape.x / 100) * canvasWidth;
        const circleY = (shape.y / 100) * canvasHeight;
        const circleRadius = (shape.radius / 100) * Math.min(canvasWidth, canvasHeight);
        
        ctx.beginPath();
        ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'line':
        const lineX1 = (shape.x1 / 100) * canvasWidth;
        const lineY1 = (shape.y1 / 100) * canvasHeight;
        const lineX2 = (shape.x2 / 100) * canvasWidth;
        const lineY2 = (shape.y2 / 100) * canvasHeight;
        
        ctx.beginPath();
        ctx.moveTo(lineX1, lineY1);
        ctx.lineTo(lineX2, lineY2);
        ctx.stroke();
        break;
        
      default:
        // Draw a generic shape
        const x = (shape.x / 100) * canvasWidth;
        const y = (shape.y / 100) * canvasHeight;
        const width = (shape.width / 100) * canvasWidth;
        const height = (shape.height / 100) * canvasHeight;
        
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
    }
    
    ctx.restore();
  });
}

/**
 * Draw objects from canvas data (for Fabric.js style data)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} objects - Array of objects
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function drawCanvasObjects(ctx, objects, canvasWidth, canvasHeight) {
  objects.forEach((obj, index) => {
    ctx.save();
    
    // Set color based on object type or index
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];
    ctx.fillStyle = obj.fill || colors[index % colors.length];
    ctx.strokeStyle = obj.stroke || colors[index % colors.length];
    ctx.lineWidth = obj.strokeWidth || 2;
    
    if (obj.type === 'rect') {
      const x = (obj.left / 100) * canvasWidth;
      const y = (obj.top / 100) * canvasHeight;
      const width = (obj.width / 100) * canvasWidth;
      const height = (obj.height / 100) * canvasHeight;
      
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
    } else if (obj.type === 'circle') {
      const x = (obj.left / 100) * canvasWidth;
      const y = (obj.top / 100) * canvasHeight;
      const radius = (obj.radius / 100) * Math.min(canvasWidth, canvasHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  });
}

/**
 * Draw placeholder when no specific shapes are found
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function drawPlaceholder(ctx, canvasWidth, canvasHeight) {
  // Draw a simple grid pattern
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 0; x < canvasWidth; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = 0; y < canvasHeight; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }
  
  // Add a center rectangle
  ctx.fillStyle = '#007bff';
  ctx.fillRect(canvasWidth * 0.2, canvasHeight * 0.2, canvasWidth * 0.6, canvasHeight * 0.6);
  
  ctx.strokeStyle = '#0056b3';
  ctx.lineWidth = 2;
  ctx.strokeRect(canvasWidth * 0.2, canvasHeight * 0.2, canvasWidth * 0.6, canvasHeight * 0.6);
}

/**
 * Get preview image URL for an item
 * @param {number} itemId - The item barang ID
 * @returns {string} - The preview image URL
 */
export function getPreviewImageUrl(itemId) {
  return `/canvas-previews/canvas-preview-ItemId-${itemId}.jpg`;
}

/**
 * Check if preview image exists for an item
 * @param {number} itemId - The item barang ID
 * @returns {Promise<boolean>} - Whether the preview image exists
 */
export async function previewImageExists(itemId) {
  try {
    // Check if file exists without cache busting (check actual file existence)
    const baseUrl = `/canvas-previews/canvas-preview-ItemId-${itemId}.jpg`;
    
    const response = await fetch(baseUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Clear canvas preview cache and force fresh API calls
 * This is called when opening the work order menu to ensure fresh previews
 */
export function clearCanvasPreviews() {
  try {
    console.log('🧹 Clearing canvas preview cache...');
    
    // Clear any existing object URLs from memory
    // This forces the browser to fetch fresh images
    if (window.canvasPreviewUrls) {
      Object.values(window.canvasPreviewUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      window.canvasPreviewUrls = {};
    }
    
    // Clear browser cache for canvas-previews folder
    // We'll add a cache-busting parameter to force fresh requests
    const timestamp = Date.now();
    window.canvasPreviewCacheBuster = timestamp;
    
    console.log('✅ Canvas preview cache cleared, fresh API calls will be made');
  } catch (error) {
    console.error('❌ Error clearing canvas preview cache:', error);
  }
}
