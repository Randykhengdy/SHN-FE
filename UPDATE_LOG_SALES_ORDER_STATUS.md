# Update Log: Sales Order Process Status Refactor
**Date:** 2026-01-19
**Context:** Refactoring Sales Order status logic (single source of truth: `process_status`).

## 🚨 BREAKING CHANGES (API Concerns)

### 1. Response Body Changes (JSON)
Field `status` telah **DIHAPUS** dari object Sales Order. Semua logic status sekarang menggunakan field `process_status`.

**Old Response (Example):**
```json
{
    "id": 1,
    "nomor_so": "SO-202601001",
    "status": "open",              // ❌ REMOVED
    "process_status": "submit",    // ✅ USE THIS
    ...
}
```

**New Response (Example):**
```json
{
    "id": 1,
    "nomor_so": "SO-202601001",
    "process_status": "submit",    // ✅ Primary Status Field
    ...
}
```

### 2. Enum Values (`process_status`)
Value valid untuk `process_status` telah diperbarui. `in_progress` dihapus. `cancel` ditambahkan kembali.

| Value | Deskripsi | Note |
|-------|-----------|------|
| `submit` | Sales Order baru dibuat / aktif | Menggantikan `pending` / `open` / `in_progress` |
| `pending` | Menunggu konfirmasi (Mismatch Qty) | Status khusus trigger dari WO Planning |
| `partial_wo` | Sebagian item sudah masuk WO | Menandakan progres WO berjalan (Cek `partial_wo_status`) |
| `complete` | Semua item sudah selesai diproses | Menggantikan `closed` |
| `delete_requested` | User request hapus SO | Status sementara sebelum approval |
| `deleted` | SO berhasil dihapus (soft delete) | Status akhir penghapusan |
| `cancel` | SO dibatalkan (void) | Beda dengan deleted (batal tapi record ada) |

### 3. PHP Enum Class
Telah dibuat PHP Enum Class untuk standardisasi di backend: `App\Enums\SalesOrderProcessStatus`.

```php
enum SalesOrderProcessStatus: string
{
    case SUBMIT = 'submit';
    case PARTIAL_WO = 'partial_wo';
    case COMPLETE = 'complete';
    case DELETED = 'deleted';
    case DELETE_REQUESTED = 'delete_requested';
    case PENDING = 'pending';
    case CANCEL = 'cancel';
}
```

### 4. New Attribute: `partial_wo_status`
Atribut baru ditambahkan ke `trx_sales_order` untuk memperjelas status `partial_wo`.

**Enum: `App\Enums\PartialWOStatus`**
*   `partial_wo`: Partial WO berjalan normal.
*   `cancel`: Partial WO dibatalkan.

---

## 🛠 API Endpoint Updates

### 1. List Sales Orders (`GET /api/sales-order`)
*   **Filter `status` (Query Param):** ❌ **DIHAPUS**. Tidak ada backward compatibility. Gunakan `process_status`.
*   **Filter `process_status` (Query Param):** Gunakan ini untuk filter langsung (e.g., `?process_status=submit`).
*   **Response `status_counts`:** Key object berubah mengikuti enum baru.

### 2. Request Delete SO (`POST /api/sales-order/{id}/request-delete`)
*   **Logic:** Hanya bisa request delete jika `process_status` adalah `submit` atau `partial_wo`.
*   **Effect:** Mengubah `process_status` menjadi `delete_requested`.

### 3. Approve Delete SO (`PATCH /api/sales-order/{id}/approve-delete`)
*   **Effect:** Mengubah `process_status` menjadi `deleted` dan melakukan soft delete (`deleted_at` terisi).

### 4. Reject Delete SO (`PATCH /api/sales-order/{id}/reject-delete`)
*   **Effect:** Mengembalikan `process_status` menjadi `submit`.

### 5. Work Order Status Update (`PATCH /api/work-order-planning/{id}/status`)
Update status di WO akan otomatis mentrigger update status di SO parentnya:
*   WO `draft` -> SO `submit`
*   WO `On Progress` -> SO `partial_wo`
*   WO `completed` -> SO `complete`
*   WO `cancelled` -> SO `cancel`

## 📝 Database Migration Summary
*   Dropped column: `trx_sales_order.status`
*   Modified column: `trx_sales_order.process_status` (Added `cancel`, removed `in_progress` from allowed list, added `partial_wo`)
*   Data Migration:
    *   Old `status=closed` -> `process_status=complete`
    *   Old `process_status=in_progress` -> `process_status=submit` (Conceptually, though migrated to partial_wo previously)
