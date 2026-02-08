# API Changes: Dimension Attributes for Sales Order Item

**Date:** 2026-02-08  
**Impact:** Sales Order API endpoints  
**Breaking Change:** No (new fields are optional/nullable)

---

## Overview

Sales Order Items now support additional dimension attributes to handle different item types (pipes, shafts, etc.) beyond standard plate dimensions (panjang/lebar/tebal).

---

## New Fields Added

| Field | Type | Description |
|-------|------|-------------|
| `diameter_luar` | decimal(10,2) | Outer diameter (for pipes/tubes) |
| `diameter_dalam` | decimal(10,2) | Inner diameter (for pipes/tubes) |
| `diameter` | decimal(10,2) | Diameter (for round shafts) |
| `sisi1` | decimal(10,2) | Side 1 (for square/rectangular shafts) |
| `sisi2` | decimal(10,2) | Side 2 (for square/rectangular shafts) |

> **Note:** All dimension fields are now **nullable** including `panjang`, `lebar`, `tebal`

---

## Request Format

### POST/PUT `/api/sales-order`

```json
{
  "items": [
    {
      "jenis_barang_id": 1,
      "bentuk_barang_id": 1,
      "grade_barang_id": 1,
      "panjang": 6000,
      "lebar": 1200,
      "tebal": 10,
      "diameter_luar": null,
      "diameter_dalam": null,
      "diameter": null,
      "sisi1": null,
      "sisi2": null,
      "qty": 10,
      "harga": 150000,
      "satuan": "dimensi",
      "jenis_potongan": "utuh"
    }
  ]
}
```

---

## Dimension Usage by Item Type

| Item Type | Dimensions Used |
|-----------|-----------------|
| **Plat** | panjang, lebar, tebal |
| **Pipa/Tube** | panjang, tebal, diameter_luar, diameter_dalam |
| **Shaft Bulat** | panjang, diameter |
| **Shaft Kotak** | panjang, sisi1, sisi2 |
| **Shaft Segi** | panjang, sisi1, (sisi2 optional) |

---

## Response Format

```json
{
  "sales_order_items": [
    {
      "id": 1,
      "panjang": "6000.00",
      "lebar": "1200.00",
      "tebal": "10.00",
      "diameter_luar": null,
      "diameter_dalam": null,
      "diameter": null,
      "sisi1": null,
      "sisi2": null,
      "item_barang_group": {
        "nama_group_barang": "STAINLESS STEEL PLAT 304 10x1200x6000"
      }
    }
  ]
}
```

---

## TypeScript Interface Update

```typescript
interface SalesOrderItem {
  // ... existing fields ...
  panjang: string | null;
  lebar: string | null;
  tebal: string | null;
  diameter_luar: string | null;   // NEW
  diameter_dalam: string | null;  // NEW
  diameter: string | null;        // NEW
  sisi1: string | null;           // NEW
  sisi2: string | null;           // NEW
}
```

---

## Migration

**File:** `2026_02_08_142300_add_dimension_fields_to_sales_order_item_table.php`

Adds 5 nullable decimal columns to `trx_sales_order_item` table.

---

## Summary

✅ All dimension fields are **nullable**  
✅ Existing requests continue to work  
✅ Frontend can send dimension fields based on item type  
✅ Response includes all dimension fields
