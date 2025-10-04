# Canvas Preview Functionality

## Overview
This module provides functionality to generate canvas preview images from item barang data using the `/api/item-barang/{itemBarangId}/canvas` API endpoint.

## Files

### `canvasUtils.js`
Main utility file containing:
- `getCanvasPreviewByItemId(itemId)` - Fetches canvas data and generates preview
- `generateCanvasPreview(itemId, canvasData)` - Creates canvas preview image
- `getPreviewImageUrl(itemId)` - Returns preview image URL
- `previewImageExists(itemId)` - Checks if preview exists

### `canvasPreviewTest.js`
Test utility for development:
- `testCanvasPreview(itemIds)` - Test preview generation for specific items
- `generateSamplePreviews()` - Generate previews for sample data

## Usage

### In Components
```javascript
import { getCanvasPreviewByItemId, getPreviewImageUrl } from '@/lib/canvasUtils';

// Generate preview for item ID 1
const previewPath = await getCanvasPreviewByItemId(1);

// Get preview URL
const previewUrl = getPreviewImageUrl(1);
```

### Testing (Browser Console)
```javascript
// Test specific item IDs
testCanvasPreview([1, 11]);

// Generate previews for sample data
generateSamplePreviews();
```

## API Integration

### Endpoint
- **GET** `/api/item-barang/{itemBarangId}/canvas-image`
- Returns canvas image as base64 encoded string
- Response format: `{ "canvas_image": "data:image/jpeg;base64,..." }`

### Canvas Data Format
The utility supports multiple canvas data formats:

#### Shapes Format
```json
{
  "shapes": [
    {
      "type": "rectangle",
      "x": 10,
      "y": 20,
      "width": 100,
      "height": 50
    }
  ]
}
```

#### Objects Format (Fabric.js style)
```json
{
  "objects": [
    {
      "type": "rect",
      "left": 10,
      "top": 20,
      "width": 100,
      "height": 50,
      "fill": "#007bff"
    }
  ]
}
```

## Preview Image Generation

### Process
1. Fetch canvas image (base64) from API
2. Convert base64 string to blob
3. Create object URL from blob
4. Generate preview URL for display

### Output
- Preview images are generated as blob URLs from base64 data
- Format: `canvas-preview-ItemId-{id}.jpg`
- Original image quality preserved from API response
- Direct conversion from base64 to displayable image

## Integration with PlatPreviewModal

The `PlatPreviewModal` component automatically:
- Generates previews when modal opens
- Shows loading state during generation
- Displays generated preview images
- Provides fallback for failed generations
- Allows manual preview generation

## Error Handling

- API errors are logged and handled gracefully
- Failed preview generations show placeholder
- Missing canvas data shows appropriate message
- Network errors are caught and reported

## Development Notes

- Preview generation is asynchronous
- Multiple previews can be generated simultaneously
- Generated previews are cached in component state
- Test utilities are available in browser console
- Canvas data format is flexible and extensible
