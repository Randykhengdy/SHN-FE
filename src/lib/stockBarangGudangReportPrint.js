import { format } from 'date-fns';

const formatCurrency = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const formatDecimal2 = (number) => {
  if (number === undefined || number === null) return '0.00';
  return Number(number).toFixed(2);
};

/**
 * Print Report Stock / Barang / Gudang (NEW report)
 *
 * data[] = [
 *   {
 *     nama_group, status, hpp_kg,
 *     gudangs: [{ gudang_id, nama_gudang, awal_qty, awal_kg, masuk_qty, masuk_kg,
 *                 keluar_qty, keluar_kg, saldo_qty, saldo_kg, nilai_stock }]
 *   }
 * ]
 *
 * Layout: item jadi header row, gudang jadi data rows, subtotal per item, grand total bawah
 */
export const printStockBarangGudangReport = (data, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), 'dd-MM-yyyy');
  const periodeEnd   = format(new Date(endDate),   'dd-MM-yyyy');
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let gtAwalQty = 0, gtAwalKg = 0;
  let gtMasukQty = 0, gtMasukKg = 0;
  let gtKeluarQty = 0, gtKeluarKg = 0;
  let gtSaldoQty = 0, gtSaldoKg = 0;
  let gtNilaiStock = 0;

  const bodyRows = (data || []).map((item) => {
    const namaGroup = item.nama_group || '';
    const status    = item.status     || '';
    const hppKg     = item.hpp_kg     || 0;
    const gudangs   = item.gudangs    || [];

    const headerLabel = `${namaGroup},  ${status},  HPP / KG : ${formatCurrency(hppKg)}`;

    const gudangRows = gudangs.map((g) => {
      gtAwalQty    += Number(g.awal_qty    || 0);
      gtAwalKg     += Number(g.awal_kg     || 0);
      gtMasukQty   += Number(g.masuk_qty   || 0);
      gtMasukKg    += Number(g.masuk_kg    || 0);
      gtKeluarQty  += Number(g.keluar_qty  || 0);
      gtKeluarKg   += Number(g.keluar_kg   || 0);
      gtSaldoQty   += Number(g.saldo_qty   || 0);
      gtSaldoKg    += Number(g.saldo_kg    || 0);
      gtNilaiStock += Number(g.nilai_stock || 0);

      return `
        <tr>
          <td valign="top" align="left" style="padding-left:12px;">${g.nama_gudang || ''}</td>
          <td valign="top" align="right">${formatDecimal2(g.awal_qty)}</td>
          <td valign="top" align="right">${formatDecimal2(g.awal_kg)}</td>
          <td valign="top" align="right">${formatDecimal2(g.masuk_qty)}</td>
          <td valign="top" align="right">${formatDecimal2(g.masuk_kg)}</td>
          <td valign="top" align="right">${formatDecimal2(g.keluar_qty)}</td>
          <td valign="top" align="right">${formatDecimal2(g.keluar_kg)}</td>
          <td valign="top" align="right">${formatDecimal2(g.saldo_qty)}</td>
          <td valign="top" align="right">${formatDecimal2(g.saldo_kg)}</td>
          <td valign="top" align="right">${formatCurrency(g.nilai_stock)}</td>
        </tr>
      `;
    }).join('');

    return `
      <tr class="item-header">
        <td colspan="10" style="font-weight:bold; padding:7px 4px 2px 4px; border-top:1px solid #ccc;">
          ${headerLabel}
        </td>
      </tr>
      ${gudangRows}
    `;
  }).join('');


  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Stock / Barang / Gudang</title>
      <style>
        body { font-family:'Courier New',Courier,monospace; font-size:10px; margin:0; padding:60px 20px 20px; background:#f5f5f5; }
        .report-page { background:white; padding:30px 40px; box-shadow:0 0 10px rgba(0,0,0,.1); min-height:21cm; margin:0 auto; width:37cm; }
        .toolbar { position:fixed; top:0; left:0; right:0; height:50px; background:#1e293b; color:white; display:flex; align-items:center; padding:0 20px; gap:10px; z-index:1000; }
        .toolbar-title { font-family:sans-serif; font-size:14px; font-weight:bold; margin-right:auto; }
        .btn { padding:6px 15px; border-radius:4px; border:none; cursor:pointer; font-weight:bold; font-family:sans-serif; font-size:12px; }
        .btn-print { background:#2563eb; color:white; } .btn-close { background:#ef4444; color:white; }
        .header { text-align:center; margin-bottom:16px; position:relative; }
        .header h1 { font-size:14px; margin:0 0 4px; text-decoration:underline; font-family:sans-serif; }
        .header .periode { font-size:11px; font-weight:bold; font-family:sans-serif; }
        .top-right-info { position:absolute; top:0; right:0; text-align:right; font-family:sans-serif; font-size:10px; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        th { border-top:2px solid #000; border-bottom:2px solid #000; padding:4px 3px; text-align:center; font-weight:bold; font-size:10px; }
        th.group-header { border-bottom:1px solid #555; padding-bottom:2px; }
        th.sub-header { border-top:none; border-bottom:2px solid #000; padding-top:2px; }
        td { padding:2px 3px; font-size:10px; }
        .item-header td { background:#f8f8f8; }
        .grand-total-row td { border-top:2px solid #000; border-bottom:2px double #000; font-weight:bold; padding:4px 3px; }
        @media print { .toolbar { display:none!important; } body { padding:0; background:white; } .report-page { padding:0; box-shadow:none; width:100%; } @page { size:A3 landscape; margin:1cm; } }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Stock / Barang / Gudang</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Stock / Barang / Gudang</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" width="24%" align="left" style="vertical-align:bottom;">Nama Gudang</th>
              <th colspan="2" class="group-header" width="14%">Awal Qty &amp; Kg.</th>
              <th colspan="2" class="group-header" width="14%">Masuk Qty &amp; Kg.</th>
              <th colspan="2" class="group-header" width="14%">Keluar Qty &amp; Kg.</th>
              <th colspan="2" class="group-header" width="14%">Saldo Qty &amp; Kg.</th>
              <th rowspan="2" width="10%" style="vertical-align:bottom;">Nilai Stock</th>
            </tr>
            <tr>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
            <tr class="grand-total-row">
              <td align="center">GRAND TOTAL</td>
              <td align="right">${formatDecimal2(gtAwalQty)}</td><td align="right">${formatDecimal2(gtAwalKg)}</td>
              <td align="right">${formatDecimal2(gtMasukQty)}</td><td align="right">${formatDecimal2(gtMasukKg)}</td>
              <td align="right">${formatDecimal2(gtKeluarQty)}</td><td align="right">${formatDecimal2(gtKeluarKg)}</td>
              <td align="right">${formatDecimal2(gtSaldoQty)}</td><td align="right">${formatDecimal2(gtSaldoKg)}</td>
              <td align="right">${formatCurrency(gtNilaiStock)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(documentHtml);
  w.document.close();
};
