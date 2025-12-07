import { request } from './request';

/**
 * Get canvas image by item ID and convert to preview image
 * @param {number} itemId - The item barang ID
 * @returns {Promise<string|null>} - Returns the preview image path or null if failed
 */
export async function getCanvasPreviewByItemId(itemId) {
  try {
    const response = await request(`/item-barang/${itemId}/canvas-image`, { method: 'GET' });
    if (!response || !response.canvas_image) return null;
    const previewImagePath = await convertBase64ToPreview(itemId, response.canvas_image);
    return previewImagePath;
  } catch (error) {
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
    const blob = await base64ToBlob(base64Image);
    const fileName = `canvas-preview-ItemId-${itemId}.jpg`;
    if (window.electronAPI && window.electronAPI.saveCanvasFile) {
      try {
        const reader = new FileReader();
        const dataURL = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const result = await window.electronAPI.saveCanvasFile(dataURL, fileName);
        if (result.success && typeof window !== 'undefined') {
          window.canvasPreviewCacheBuster = Date.now();
          try {
            window.dispatchEvent(new CustomEvent('canvasPreviewSaved', { detail: { itemId } }));
          } catch (_) {}
        }
      } catch (_) {}
    } else {
      try {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (typeof window !== 'undefined') {
          window.canvasPreviewCacheBuster = Date.now();
          try {
            window.dispatchEvent(new CustomEvent('canvasPreviewSaved', { detail: { itemId } }));
          } catch (_) {}
        }
      } catch (_) {}
    }
    const previewUrl = URL.createObjectURL(blob);
    return previewUrl;
  } catch (_) {
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
  const buster = typeof window !== 'undefined' && window.canvasPreviewCacheBuster ? window.canvasPreviewCacheBuster : Date.now();
  return `/canvas-previews/canvas-preview-ItemId-${itemId}.jpg?cb=${buster}`;
}

/**
 * Check if preview image exists for an item
 * @param {number} itemId - The item barang ID
 * @returns {Promise<boolean>} - Whether the preview image exists
 */
export async function previewImageExists(itemId) {
  try {
    const buster = typeof window !== 'undefined' && window.canvasPreviewCacheBuster ? window.canvasPreviewCacheBuster : Date.now();
    const baseUrl = `/canvas-previews/canvas-preview-ItemId-${itemId}.jpg?cb=${buster}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(baseUrl, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
    clearTimeout(timeout);
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
    if (window.canvasPreviewUrls) {
      Object.values(window.canvasPreviewUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      window.canvasPreviewUrls = {};
    }
    const timestamp = Date.now();
    window.canvasPreviewCacheBuster = timestamp;
    if (window.electronAPI && typeof window.electronAPI.clearCanvasPreviews === 'function') {
      window.electronAPI.clearCanvasPreviews();
    }
  } catch (error) {
    
  }
}
