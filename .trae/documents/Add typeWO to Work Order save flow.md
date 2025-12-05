## Goal
Include `typeWO` in Work Order Planning save payload with values: `Normal`, `Pending`, `Batal`, and drive it from the validation modals.

## Changes
- Add `typeWO` to Work Order state with default `Normal`.
- Inject `typeWO` into the payload built in `proceedSave()`.
- Update validation modals so users can choose the WO type when validation fails:
  - Catatan Required modal: add buttons
    - Pending → set `typeWO = 'Pending'`, then open confirm save modal
    - Batal → set `typeWO = 'Batal'`, then open confirm save modal
    - Tutup → just close modal
  - Mismatch modal: same buttons and behavior as above
- When validation passes: keep `typeWO = 'Normal'` and proceed to confirm save.
- Confirm modal summary: include current `typeWO` for clarity.

## Payload Example
{"wo_unique_id":"WO-TEMP-123","id_sales_order":123,"id_pelanggan":45,"id_gudang":3,"status":"pending","typeWO":"Pending","tanggal_wo":"2025-12-05","prioritas":"normal","handover_method":"pickup","items":[{"wo_item_unique_id":"WOITEM-001","sales_order_item_id":1001,"qty":2,"satuan":"PCS"}]}

## Touch Points
- `src/pages/work-order/add.jsx`: state (`typeWO`), modal actions (set `typeWO`), payload build in `proceedSave()`, confirm modal message.

## Error Handling
- If `typeWO` is not recognized, default to `Normal`.
- Keep existing validation guards and Catatan requirement logic.

## After
- Saving WO always includes `typeWO` matching user choice or default `Normal`.