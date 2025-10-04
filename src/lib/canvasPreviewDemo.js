// Demo script to test canvas preview functionality
import { getCanvasPreviewByItemId } from './canvasUtils';

/**
 * Demo function to test canvas preview with your sample data
 */
export async function demoCanvasPreview() {
  console.log('🎬 Starting Canvas Preview Demo...');
  
  // Your sample data
  const sampleItems = [
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
  
  console.log('📋 Sample items:', sampleItems);
  
  for (const item of sampleItems) {
    console.log(`\n🔄 Processing: ${item.nama} (ID: ${item.id})`);
    console.log(`📏 Ukuran: ${item.ukuran}`);
    console.log(`📐 Sisa Luas: ${item.sisa_luas} mm²`);
    
    try {
      // Test the canvas preview generation
      const previewPath = await getCanvasPreviewByItemId(item.id);
      
      if (previewPath) {
        console.log(`✅ Preview generated successfully!`);
        console.log(`🖼️ Preview path: ${previewPath}`);
        console.log(`🔗 Preview URL: /canvas-previews/canvas-preview-ItemId-${item.id}.jpg`);
      } else {
        console.log(`⚠️ No canvas image available for this item`);
      }
    } catch (error) {
      console.error(`❌ Error processing item ${item.id}:`, error);
    }
  }
  
  console.log('\n🎉 Canvas Preview Demo completed!');
  console.log('\n💡 Tips:');
  console.log('- Check the PlatPreviewModal to see the generated previews');
  console.log('- Use browser dev tools to inspect the generated blob URLs');
  console.log('- The previews are generated from base64 canvas images from the API');
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.demoCanvasPreview = demoCanvasPreview;
}
