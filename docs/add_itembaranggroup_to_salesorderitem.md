# API Changes: ItemBarangGroup Integration in Sales Order

**Date:** 2026-02-08  
**Impact:** Sales Order API endpoints  
**Breaking Change:** No (backward compatible - new field is auto-populated)

---

## Overview

Sales Order Items now automatically link to `ItemBarangGroup`. The backend automatically finds or creates the appropriate group based on item attributes. **Frontend does NOT need to send `item_barang_group_id`** - it's handled automatically.

---

## What Changed

### Response Structure

All Sales Order API responses now include `item_barang_group` data in items:

**Before:**
```json
{
  "sales_order_items": [
    {
      "id": 1,
      "panjang": 6000,
      "lebar": 1200,
      "tebal": 10,
      "jenis_barang_id": 1,
      "bentuk_barang_id": 1,
      "grade_barang_id": 1,
      "jenis_barang": { ... },
      "bentuk_barang": { ... },
      "grade_barang": { ... }
    }
  ]
}
```

**After:**
```json
{
  "sales_order_items": [
    {
      "id": 1,
      "item_barang_group_id": 5,
      "panjang": 6000,
      "lebar": 1200,
      "tebal": 10,
      "jenis_barang_id": 1,
      "bentuk_barang_id": 1,
      "grade_barang_id": 1,
      "jenis_barang": { ... },
      "bentuk_barang": { ... },
      "grade_barang": { ... },
      "item_barang_group": {
        "id": 5,
        "jenis_barang_id": 1,
        "bentuk_barang_id": 1,
        "grade_barang_id": 1,
        "panjang": "6000.00",
        "lebar": "1200.00",
        "tebal": "10.00",
        "diameter_luar": null,
        "diameter_dalam": null,
        "diameter": null,
        "sisi1": null,
        "sisi2": null,
        "quantity_utuh": 50,
        "quantity_potongan": 15,
        "nama_group_barang": "STAINLESS STEEL PLAT 304 6000x1200x10"
      }
    }
  ]
}
```

---

## Frontend Action Required

### ✅ No Changes to Request Body

**You do NOT need to change your POST/PUT requests.** Continue sending the same data:

```json
POST /api/sales-order
{
  "items": [
    {
      "jenis_barang_id": 1,
      "bentuk_barang_id": 1,
      "grade_barang_id": 1,
      "panjang": 6000,
      "lebar": 1200,
      "tebal": 10,
      "qty": 10,
      "harga": 150000,
      "satuan": "dimensi",
      "jenis_potongan": "utuh"
    }
  ]
}
```

> **Note:** DO NOT send `item_barang_group_id` - it's auto-assigned by backend

---

## Affected Endpoints

| Endpoint | Method | Changes |
|----------|--------|---------|
| `/api/sales-order` | GET | Response includes `item_barang_group` |
| `/api/sales-order/{id}` | GET | Response includes `item_barang_group` |
| `/api/sales-order` | POST | Response includes `item_barang_group` |
| `/api/sales-order/{id}` | PUT/PATCH | Response includes `item_barang_group` |
| `/api/sales-order/delete-requests` | GET | Response includes `item_barang_group` |
| `/api/sales-order/for-wo-planning` | GET | Response includes `item_barang_group` |

---

## TypeScript Interface Updates

```typescript
// Add to SalesOrderItem interface
interface SalesOrderItem {
  // ... existing fields ...
  item_barang_group_id: number;        // NEW
  item_barang_group?: ItemBarangGroup; // NEW
}

// NEW Interface
interface ItemBarangGroup {
  id: number;
  jenis_barang_id: number;
  bentuk_barang_id: number;
  grade_barang_id: number;
  panjang: string | null;
  lebar: string | null;
  tebal: string | null;
  diameter_luar: string | null;
  diameter_dalam: string | null;
  diameter: string | null;
  sisi1: string | null;
  sisi2: string | null;
  quantity_utuh: number;
  quantity_potongan: number;
  nama_group_barang: string;  // Auto-generated
}
```

---

## Example Usage

### Display Group Name
```jsx
<TableCell>
  {item.item_barang_group?.nama_group_barang || 'N/A'}
</TableCell>
```

### Show Available Stock
```jsx
<div>
  Stock Utuh: {item.item_barang_group?.quantity_utuh || 0}
  Stock Potongan: {item.item_barang_group?.quantity_potongan || 0}
</div>
```

---

## FAQ

**Q: Do I need to send `item_barang_group_id` in requests?**  
A: No, it's automatically assigned by backend.

**Q: What is `nama_group_barang`?**  
A: Auto-generated name: `JENIS BENTUK GRADE DimensionsString`  
Example: `STAINLESS STEEL PLAT 304 6000x1200x10`

**Q: Do I need to update my forms?**  
A: No changes needed. Group assignment is transparent.

---

## Summary

✅ **No breaking changes** - existing code continues to work  
✅ **No request changes** - don't send `item_barang_group_id`  
✅ **New response field** - `item_barang_group` object included  
✅ **Optional enhancement** - display `nama_group_barang` in UI
