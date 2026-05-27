import { format } from 'date-fns';

const formatDecimal2 = (n) => (n === undefined || n === null ? '0.00' : Number(n).toFixed(2));

/**
 * Print Report Stock Opname / Gudang / Barang
 *
 * data[] = [{
 *   gudang_id, gudang,
 *   rows: [{ nama_barang, status, saldo_qty, saldo_kg, stok_fisik, selisih, catatan }]
 * }]
 *
 * Layout:
 *   Gudang : A-16              ← group header
 *     ALUMINIUM AS 6061... | UTUH | 0 | 0.15 | 0 | 0 |
 *   GRAND TOTAL
 */
export const printStockOpnameReport = (data, startDate, endDate) => {
  const periodeStart = startDate ? format(new Date(startDate), 'dd-MM-yyyy') : '-';
  const periodeEnd   = endDate   ? format(new Date(endDate),   'dd-MM-yyyy') : '-';
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let gtSaldoQty = 0, gtSaldoKg = 0, gtFisik = 0, gtSelisih = 0;

  const gudangBlocks = (data || []).map((grup) => {
    const rows = grup.rows || [];
    let stSaldoQty = 0, stSaldoKg = 0, stFisik = 0, stSelisih = 0;

    const rowHtml = rows.map((row) => {
      const selisih = Number(row.selisih ?? 0);
      stSaldoQty += Number(row.saldo_qty  ?? 0);
      stSaldoKg  += Number(row.saldo_kg   ?? 0);
      stFisik    += Number(row.stok_fisik ?? 0);
      stSelisih  += selisih;

      const selisihClass = selisih > 0 ? 'lebih' : selisih < 0 ? 'kurang' : '';
      const selisihLabel = selisih > 0 ? `+${selisih}` : String(selisih);

      return `
        <tr>
          <td align="left"  >${row.nama_barang  || ''}</td>
          <td align="center">${row.status        || ''}</td>
          <td align="right" >${row.saldo_qty     ?? 0}</td>
          <td align="right" >${formatDecimal2(row.saldo_kg)}</td>
          <td align="right" >${row.stok_fisik    ?? 0}</td>
          <td align="right" class="${selisihClass}">${selisihLabel}</td>
          <td align="left"  >${row.catatan       || ''}</td>
        </tr>
      `;
    }).join('');

    gtSaldoQty += stSaldoQty;
    gtSaldoKg  += stSaldoKg;
    gtFisik    += stFisik;
    gtSelisih  += stSelisih;

    const stSelisihLabel = stSelisih > 0 ? `+${stSelisih}` : String(stSelisih);
    const stSelisihClass = stSelisih > 0 ? 'lebih' : stSelisih < 0 ? 'kurang' : '';

    return `
      <tr class="gudang-header">
        <td colspan="7" style="font-weight:bold; padding:7px 4px 3px 4px;">Gudang : ${grup.gudang || '-'}</td>
      </tr>
      ${rowHtml}
      <tr class="subtotal-row">
        <td colspan="2" align="right" style="font-style:italic; font-size:9px; border-top:1px dotted #888; padding-right:8px;">${grup.gudang}</td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${stSaldoQty}</td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${formatDecimal2(stSaldoKg)}</td>
        <td align="right" style="font-weight:bold; border-top:1px dotted #888;">${stFisik}</td>
        <td align="right" class="${stSelisihClass}" style="font-weight:bold; border-top:1px dotted #888;">${stSelisihLabel}</td>
        <td style="border-top:1px dotted #888;"></td>
      </tr>
    `;
  }).join('');

  const gtSelisihLabel = gtSelisih > 0 ? `+${gtSelisih}` : String(gtSelisih);
  const gtSelisihClass = gtSelisih > 0 ? 'lebih' : gtSelisih < 0 ? 'kurang' : '';

  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Stock Opname / Gudang / Barang</title>
      <style>
        body { font-family:'Courier New',Courier,monospace; font-size:9px; margin:0; padding:60px 20px 20px; background:#f5f5f5; }
        .report-page { background:white; padding:25px 35px; box-shadow:0 0 10px rgba(0,0,0,.1); min-height:21cm; margin:0 auto; width:36cm; }
        .toolbar { position:fixed; top:0; left:0; right:0; height:50px; background:#1e293b; color:white; display:flex; align-items:center; padding:0 20px; gap:10px; z-index:1000; }
        .toolbar-title { font-family:sans-serif; font-size:14px; font-weight:bold; margin-right:auto; }
        .btn { padding:6px 15px; border-radius:4px; border:none; cursor:pointer; font-weight:bold; font-family:sans-serif; font-size:12px; }
        .btn-print { background:#2563eb; color:white; } .btn-close { background:#ef4444; color:white; }
        .header { text-align:center; margin-bottom:14px; position:relative; }
        .header h1 { font-size:13px; margin:0 0 4px; text-decoration:underline; font-family:sans-serif; }
        .header .periode { font-size:11px; font-weight:bold; font-family:sans-serif; }
        .top-right-info { position:absolute; top:0; right:0; text-align:right; font-family:sans-serif; font-size:10px; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        th { border-top:2px solid #000; border-bottom:2px solid #000; padding:4px 3px; text-align:center; font-weight:bold; font-size:9px; }
        th.group-header { border-bottom:1px solid #555; }
        th.sub-header   { border-top:none; border-bottom:2px solid #000; }
        td { padding:2px 3px; font-size:9px; }
        .gudang-header td { background:#f0f0f0; }
        .subtotal-row td { padding-top:2px; padding-bottom:5px; }
        .grand-total-row td { border-top:2px solid #000; border-bottom:2px double #000; font-weight:bold; padding:4px 3px; }
        .lebih  { color:#15803d; font-weight:bold; }
        .kurang { color:#dc2626; font-weight:bold; }
        @media print {
          .toolbar { display:none!important; }
          body { padding:0; background:white; }
          .report-page { padding:0; box-shadow:none; width:100%; }
          @page { size:A3 landscape; margin:1cm; }
        }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Stock Opname / Gudang / Barang</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Stock Opname / Gudang / Barang</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" width="35%" style="vertical-align:bottom;" align="left">Nama Barang</th>
              <th rowspan="2" width="7%"  style="vertical-align:bottom;">Status</th>
              <th colspan="2" class="group-header" width="20%">Saldo Sistem</th>
              <th rowspan="2" width="9%"  style="vertical-align:bottom;">Stok Fisik</th>
              <th rowspan="2" width="9%"  style="vertical-align:bottom;">Selisih</th>
              <th rowspan="2" width="20%" style="vertical-align:bottom;" align="left">Catatan</th>
            </tr>
            <tr>
              <th class="sub-header">Qty</th>
              <th class="sub-header">Kg</th>
            </tr>
          </thead>
          <tbody>
            ${gudangBlocks || '<tr><td colspan="7" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
            <tr class="grand-total-row">
              <td colspan="2" align="center">GRAND TOTAL</td>
              <td align="right">${gtSaldoQty}</td>
              <td align="right">${formatDecimal2(gtSaldoKg)}</td>
              <td align="right">${gtFisik}</td>
              <td align="right" class="${gtSelisihClass}">${gtSelisihLabel}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(documentHtml);
  w.document.close();
};
