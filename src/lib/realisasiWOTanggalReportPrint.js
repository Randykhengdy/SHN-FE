import { format } from 'date-fns';

const fmt2 = (n) => {
  if (n === undefined || n === null) return '0.00';
  return Number(n).toFixed(2);
};

/**
 * Cetak Report Realisasi Work Order / Tanggal
 * Format: SO header row (tanggal + no_bukti), lalu item rows (pelanggan rowspan + detail)
 * Ø pada dimensi_potong adalah simbol diameter dari backend — tampilkan apa adanya.
 */
export const printRealisasiWOTanggalReport = (data, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), 'dd-MM-yyyy');
  const periodeEnd   = format(new Date(endDate),   'dd-MM-yyyy');
  const todayStr     = format(new Date(), "EEEE, d MMMM yyyy");

  // Group by no_bukti, urutan tetap sesuai API
  const orderedKeys = [];
  const grouped     = {};
  (data || []).forEach((row) => {
    const key = row.no_bukti ?? '-';
    if (!grouped[key]) { grouped[key] = []; orderedKeys.push(key); }
    grouped[key].push(row);
  });

  let grandQtySO = 0, grandKgSO = 0, grandQtyWO = 0, grandKgWO = 0;

  const bodyRows = orderedKeys.map((noBukti) => {
    const items     = grouped[noBukti];
    const firstItem = items[0];
    const N         = items.length;

    let subQtySO = 0, subKgSO = 0, subQtyWO = 0, subKgWO = 0;

    // Item rows: pelanggan rowspan N (first item only), sisanya ikut
    const itemHtml = items.map((item, i) => {
      const qtySO = Number(item.qty_so    ?? 0);
      const kgSO  = Number(item.kg_so     ?? 0);
      const qtyWO = Number(item.qty_actual ?? 0);
      const kgWO  = Number(item.kg_actual  ?? 0);

      subQtySO += qtySO; subKgSO += kgSO;
      subQtyWO += qtyWO; subKgWO += kgWO;

      if (i === 0) {
        return `
          <tr>
            <td align="left" rowspan="${N}">${item.nama_pelanggan ?? '-'}</td>
            <td align="left">${item.nama_barang ?? '-'}</td>
            <td align="center">${item.status ?? '-'}</td>
            <td align="center">${item.dimensi_potong ?? '-'}</td>
            <td align="center">${qtySO}</td>
            <td align="right">${fmt2(kgSO)}</td>
            <td align="center">${qtyWO}</td>
            <td align="right">${fmt2(kgWO)}</td>
            <td align="center">${item.tg_close ?? '-'}</td>
          </tr>`;
      } else {
        return `
          <tr>
            <td align="left">${item.nama_barang ?? '-'}</td>
            <td align="center">${item.status ?? '-'}</td>
            <td align="center">${item.dimensi_potong ?? '-'}</td>
            <td align="center">${qtySO}</td>
            <td align="right">${fmt2(kgSO)}</td>
            <td align="center">${qtyWO}</td>
            <td align="right">${fmt2(kgWO)}</td>
            <td align="center">${item.tg_close ?? '-'}</td>
          </tr>`;
      }
    }).join('');

    grandQtySO += subQtySO; grandKgSO += subKgSO;
    grandQtyWO += subQtyWO; grandKgWO += subKgWO;

    // Sub-total baris (hanya jika > 1 item)
    const subRow = N > 1 ? `
      <tr class="subtotal-row">
        <td colspan="4" align="right" style="font-weight:bold;font-style:italic;">Sub Total ${noBukti}</td>
        <td align="center" style="font-weight:bold;">${subQtySO}</td>
        <td align="right"  style="font-weight:bold;">${fmt2(subKgSO)}</td>
        <td align="center" style="font-weight:bold;">${subQtyWO}</td>
        <td align="right"  style="font-weight:bold;">${fmt2(subKgWO)}</td>
        <td></td>
      </tr>` : '';

    return `
      <!-- SO Header row -->
      <tr class="so-header-row">
        <td align="center" rowspan="${N + 1}" style="font-weight:bold;">${firstItem.tanggal ?? '-'}</td>
        <td colspan="8" align="left" style="font-weight:bold; padding-left:4px;">${noBukti}</td>
      </tr>
      ${itemHtml}
      ${subRow}`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Realisasi Work Order / Tanggal</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      margin: 0;
      padding: 60px 20px 20px 20px;
      background-color: #f5f5f5;
      color: #000;
    }
    .report-page {
      background-color: white;
      padding: 40px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      min-height: 21cm;
      margin: 0 auto;
      width: 29.7cm;
    }
    .toolbar {
      position: fixed; top: 0; left: 0; right: 0; height: 50px;
      background-color: #333; color: white;
      display: flex; align-items: center; padding: 0 20px; gap: 10px;
      z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .toolbar-title { font-family: sans-serif; font-size: 14px; font-weight: bold; margin-right: auto; }
    .btn { padding: 6px 15px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; font-family: sans-serif; font-size: 12px; }
    .btn-print { background-color: #2563eb; color: white; }
    .btn-print:hover { background-color: #1d4ed8; }
    .btn-close  { background-color: #ef4444; color: white; }
    .btn-close:hover  { background-color: #dc2626; }
    .header { text-align: center; margin-bottom: 20px; position: relative; }
    .header h1 { font-size: 16px; margin: 0 0 5px 0; text-decoration: underline; }
    .header .periode { margin-top: 5px; font-weight: bold; }
    .top-right-info { position: absolute; top: 0; right: 0; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th {
      border-top: 2px solid #000; border-bottom: 2px solid #000;
      padding: 5px 3px; text-align: center; font-weight: bold;
    }
    td { padding: 3px 3px; vertical-align: top; }
    .so-header-row td { background-color: #f0f0f0; border-top: 1px solid #999; }
    .subtotal-row td { border-top: 1px dotted #666; }
    .grand-total-row td {
      border-top: 2px solid #000; border-bottom: 2px double #000;
      font-weight: bold; padding-top: 5px; padding-bottom: 5px;
    }
    @media print {
      .toolbar { display: none !important; }
      body { padding: 0; background-color: white; }
      .report-page { padding: 0; box-shadow: none; width: 100%; min-height: auto; }
      @page { size: A4 landscape; margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="toolbar-title">Print Preview - Realisasi Work Order / Tanggal</span>
    <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
    <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
  </div>
  <div class="report-page">
    <div class="header">
      <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
      <h1>Realisasi Work Order / Tanggal</h1>
      <div class="periode">Periode ${periodeStart} s.d. ${periodeEnd}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th width="8%"  rowspan="2">Tanggal</th>
          <th width="15%" rowspan="2" style="text-align:left;">Pelanggan</th>
          <th width="22%" rowspan="2" style="text-align:left;">Nama Barang</th>
          <th width="7%"  rowspan="2">Status</th>
          <th width="10%" rowspan="2">Dimensi Potong</th>
          <th width="11%" colspan="2">Qty &amp; Kg. SO</th>
          <th width="11%" colspan="2">Qty &amp; Kg. WO/Real</th>
          <th width="8%"  rowspan="2">Tg. Close</th>
        </tr>
        <tr>
          <th>Qty</th><th align="right">Kg</th>
          <th>Qty</th><th align="right">Kg</th>
        </tr>
      </thead>
      <tbody>
        ${bodyRows || '<tr><td colspan="10" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
        <tr class="grand-total-row">
          <td colspan="4" align="center">GRAND TOTAL</td>
          <td align="center">-</td>
          <td align="center">${grandQtySO}</td>
          <td align="right">${fmt2(grandKgSO)}</td>
          <td align="center">${grandQtyWO}</td>
          <td align="right">${fmt2(grandKgWO)}</td>
          <td align="center">-</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
};
