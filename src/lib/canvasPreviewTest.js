// Test utility for canvas preview functionality
import { getCanvasPreviewByItemId, getPreviewImageUrl, convertBase64ToPreview } from './canvasUtils';

/**
 * Test function to generate preview for specific item IDs
 * This can be called from browser console for testing
 */
export async function testCanvasPreview(itemIds = [1, 11]) {
  console.log('🧪 Testing canvas preview generation...');
  
  for (const itemId of itemIds) {
    console.log(`\n📋 Testing item ID: ${itemId}`);
    
    try {
      const previewPath = await getCanvasPreviewByItemId(itemId);
      
      if (previewPath) {
        console.log(`✅ Preview generated: ${previewPath}`);
        console.log(`🔗 Preview URL: ${getPreviewImageUrl(itemId)}`);
      } else {
        console.log(`❌ Failed to generate preview for item ${itemId}`);
      }
    } catch (error) {
      console.error(`❌ Error testing item ${itemId}:`, error);
    }
  }
  
  console.log('\n🏁 Canvas preview test completed!');
}

/**
 * Generate previews for the sample data from the API response
 */
export async function generateSamplePreviews() {
  const sampleData = [
    {
      "id": 11,
      "nama": "Elektronik CANAL U A",
      "ukuran": "1000.00 x 186.00 x 50.00",
      "sisa_luas": "506478.00"
    },
    {
      "id": 1,
      "nama": "TV LED 32 inch",
      "ukuran": "1500.00 x 1500.00 x 50.00",
      "sisa_luas": "540000.00"
    }
  ];
  
  console.log('🎨 Generating previews for sample data...');
  
  for (const item of sampleData) {
    console.log(`\n📦 Processing: ${item.nama} (ID: ${item.id})`);
    
    try {
      const previewPath = await getCanvasPreviewByItemId(item.id);
      
      if (previewPath) {
        console.log(`✅ Preview generated: ${previewPath}`);
      } else {
        console.log(`⚠️ No canvas data found for item ${item.id}`);
      }
    } catch (error) {
      console.error(`❌ Error processing item ${item.id}:`, error);
    }
  }
  
  console.log('\n🎉 Sample preview generation completed!');
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.testCanvasPreview = testCanvasPreview;
  window.generateSamplePreviews = generateSamplePreviews;
}
