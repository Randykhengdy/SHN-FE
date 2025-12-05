## What I’ll Implement
- Add a pre-save validation step in Work Order Planning using the new endpoint `POST /api/work-order-planning/validate-so-coverage`.
- Block the save if validation fails and show a clear mismatch summary to the user.
- Allow save when validation returns `valid: true`.

## Technical Changes
- Create a small service function in `salesOrderService` or a new `workOrderPlanningService`:
  - `validateSoCoverage({ id_sales_order, items })` → calls `/api/work-order-planning/validate-so-coverage`.
- In `WO Planning` add flow inside the save handler:
  - Build the payload from current form state:
    - `id_sales_order`: selected SO id
    - `items`: array of `{ sales_order_item_id, quantity }` derived from WO items
  - Call `validateSoCoverage` first.
  - If `data.valid === false`: 
    - Show a modal with a table of `mismatches` (fields: `sales_order_item_id`, `expected_qty`, `combined_qty`, `difference`, existing/incoming qty, and item descriptors like `jenis_barang`, `bentuk_barang`, `grade_barang`).
    - Prevent submission.
  - If `data.valid === true`: continue to existing save logic.

## UI/UX
- Reuse the existing alert/modal components (e.g., `CustomAlert` or a simple table modal) to present mismatches.
- Clear messaging:
  - Title: “Validasi WO Gagal”
  - Message: “Jumlah item WO melebihi/kurang dari SO. Perbaiki sebelum menyimpan.”
- Provide a “Tutup” button only (no force-save).

## Error Handling
- Network/endpoint error → show error alert and keep user on the form.
- Defensive parsing: support both `{ success, data: { valid } }` and raw shape.

## Code Touch Points
- Add service method for validation.
- Update WO Planning page save handler to call validation before save.
- Add modal component (inline) to render mismatches.

## Confirmation
- After approval, I’ll implement the service, wire the pre-save call, add the modal, and verify with a sample payload.
