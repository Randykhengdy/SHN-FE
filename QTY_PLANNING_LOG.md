# Qty Planning Documentation

**Date:** 2026-01-20

## Overview
Added `qty_planning` column to `trx_work_order_planning_item` table to distinguish between the quantity allocated from the Sales Order and the actual production quantity (`qty`).

## Reasoning
Previously, the system relied on the production `qty` field to calculate how much of a Sales Order (SO) item had been fulfilled. This created a discrepancy when the actual production quantity differed from the planned allocation.

**Scenario Example:**
- **SO Requirement:** 10 PCS.
- **Plan:** Produce 12 PCS (10 for the SO, 2 for stock/spare).
- **Old Logic:** If we used `qty` (12) to calculate the remaining SO balance, the system would think we fulfilled 12 PCS against a 10 PCS order, potentially causing negative remaining balance or confusion.
- **New Logic:** 
  - `qty_planning`: 10 (Allocated for SO)
  - `qty`: 12 (Physical production)
  - **Remaining SO Balance:** Calculated using `qty_planning` (10), leaving 0 remaining on the SO.

By separating these concerns, we ensure that:
1. **Inventory/Production** tracks `qty` (physical output).
2. **Sales/Order Fulfillment** tracks `qty_planning` (order allocation).

## Changes

### Database
- **Table:** `trx_work_order_planning_item`
- **Column:** `qty_planning` (integer, nullable)
- **Migration:** `2026_01_19_191355_add_qty_planning_to_trx_work_order_planning_item_table.php`

### Backend Logic

#### Work Order Planning Creation (`WorkOrderPlanningController`)
- **Store/Update:** `qty_planning` is now accepted in the request payload.
- **Model:** `WorkOrderPlanningItem` adds `qty_planning` to `$fillable` and `$casts`.
- **Validation:** 
  - `qty_planning` must not be greater than `qty` (in the payload).
  - This ensures you cannot allocate more to the SO than what is being produced (or what is available, depending on frontend mapping).
  - Error Message: "Item ke-X: Qty Planning (Y) tidak boleh lebih besar dari Qty (Z)."

**IMPORTANT: Payload Requirement**
When saving or updating a Work Order (`store` or `update` endpoints), the frontend **MUST** include `qty_planning` in the `items` array.

#### Sales Order for WO Planning API (`SalesOrderController`)
- **Endpoint:** `/api/sales-order/sales-order-for-woplanning`
- **Logic Change:** 
  - The "Remaining Quantity" (`sisa_qty`) calculation now uses `qty_planning` instead of `qty`.
  - Formula: `sisa_qty = sales_order_item.qty - SUM(related_wo_items.qty_planning)`
  - This ensures that if production quantity (`qty`) differs from the allocated SO quantity (e.g., producing extra for stock), the SO remaining balance is calculated correctly based on the allocation (`qty_planning`).

## API Usage Examples

### 1. Store Work Order Planning (POST /api/work-order-planning)

**Request Payload:**
```json
{
  "wo_unique_id": "WO-678E2...",
  "id_sales_order": 15,
  "id_pelanggan": 5,
  "id_gudang": 2,
  "status": "draft",
  "tanggal_wo": "2026-01-20",
  "prioritas": "Normal",
  "handover_method": "pickup",
  "items": [
    {
      "wo_item_unique_id": "WOI-12345",
      "sales_order_item_id": 101,
      "qty": 12,           // Actual production quantity (e.g. 10 for SO + 2 spare)
      "qty_planning": 10,  // Quantity allocated from Sales Order
      "panjang": 100,
      "lebar": 50,
      "pelaksana": [
         { "pelaksana_id": 1, "qty": 12 }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Work Order Planning berhasil ditambahkan",
  "data": {
    "id": 55,
    "nomor_wo": "WO/2026/01/001",
    "work_order_planning_items": [
      {
        "id": 88,
        "work_order_planning_id": 55,
        "sales_order_item_id": 101,
        "qty": 12,
        "qty_planning": 10,  // <--- Returned here
        "panjang": 100,
        "lebar": 50,
        ...
      }
    ],
    ...
  }
}
```

### 2. Get Sales Order for WO Planning (GET /api/sales-order/sales-order-for-woplanning)

**Response Item:**
```json
{
  "id": 101,
  "sales_order_id": 15,
  "qty": 20,          // Total SO Qty
  "sisa_qty": 10,     // Remaining Qty (20 - 10 from previous WO's qty_planning)
  ...
}
```
*Note: `sisa_qty` calculation now strictly subtracts `qty_planning` from total `qty`.*
