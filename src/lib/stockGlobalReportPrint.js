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
 * Print Report Stock Barang Global / Semua Gudang
 *
 * data[] = [{ nama_group, status, awal_qty, awal_kg, masuk_qty, masuk_kg,
 *              keluar_qty, keluar_kg, saldo_qty, saldo_kg, hpp_kg, nilai_stock }]
 *
 * Layout sesuai referensi: flat list, kolom Qty & Kg digabung per grup kolom,
 * grand total di paling bawah.
 */
export const printStockGlobalReport = (data, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), 'dd-MM-yyyy');
  const periodeEnd   = format(new Date(endDate),   'dd-MM-yyyy');
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let gtAwalQty = 0, gtAwalKg = 0;
  let gtMasukQty = 0, gtMasukKg = 0;
  let gtKeluarQty = 0, gtKeluarKg = 0;
  let gtSaldoQty = 0, gtSaldoKg = 0;
  let gtNilaiStock = 0;

  const rows = (data || []).map((row) => {
    gtAwalQty    += Number(row.awal_qty    || 0);
    gtAwalKg     += Number(row.awal_kg     || 0);
    gtMasukQty   += Number(row.masuk_qty   || 0);
    gtMasukKg    += Number(row.masuk_kg    || 0);
    gtKeluarQty  += Number(row.keluar_qty  || 0);
    gtKeluarKg   += Number(row.keluar_kg   || 0);
    gtSaldoQty   += Number(row.saldo_qty   || 0);
    gtSaldoKg    += Number(row.saldo_kg    || 0);
    gtNilaiStock += Number(row.nilai_stock || 0);

    return `
      <tr>
        <td valign="top" align="left">${row.nama_group || ''}</td>
        <td valign="top" align="center">${row.status || ''}</td>
        <td valign="top" align="right">${formatDecimal2(row.awal_qty)}</td>
        <td valign="top" align="right">${formatDecimal2(row.awal_kg)}</td>
        <td valign="top" align="right">${formatDecimal2(row.masuk_qty)}</td>
        <td valign="top" align="right">${formatDecimal2(row.masuk_kg)}</td>
        <td valign="top" align="right">${formatDecimal2(row.keluar_qty)}</td>
        <td valign="top" align="right">${formatDecimal2(row.keluar_kg)}</td>
        <td valign="top" align="right">${formatDecimal2(row.saldo_qty)}</td>
        <td valign="top" align="right">${formatDecimal2(row.saldo_kg)}</td>
        <td valign="top" align="right">${formatCurrency(row.hpp_kg)}</td>
        <td valign="top" align="right">${formatCurrency(row.nilai_stock)}</td>
      </tr>
    `;
  }).join('');

  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Stock Barang Global / Semua Gudang</title>
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
        th.group-header { border-bottom:1px solid #000; }
        th.sub-header { border-top:none; }
        td { padding:2px 3px; font-size:10px; }
        .grand-total-row td { border-top:2px solid #000; border-bottom:2px double #000; font-weight:bold; padding:4px 3px; }
        @media print {
          .toolbar { display:none!important; }
          body { padding:0; background:white; }
          .report-page { padding:0; box-shadow:none; width:100%; }
          @page { size:A3 landscape; margin:1cm; }
        }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Stock Barang Global / Semua Gudang</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Stock Barang Global / Semua Gudang</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" width="28%" align="left" style="vertical-align:bottom;">Nama Barang</th>
              <th rowspan="2" width="6%"  style="vertical-align:bottom;">Status</th>
              <th colspan="2" class="group-header" width="13%">Awal Qty &amp; Kg.</th>
              <th colspan="2" class="group-header" width="13%">Masuk Qty &amp; Kg.</th>
              <th colspan="2" class="group-header" width="13%">Keluar Qty &amp; Kg.</th>
              <th colspan="2" class="group-header" width="13%">Saldo Qty &amp; Kg.</th>
              <th rowspan="2" width="7%"  style="vertical-align:bottom;">HPP/Kg.</th>
              <th rowspan="2" width="9%"  style="vertical-align:bottom;">Nilai Stock</th>
            </tr>
            <tr>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
              <th class="sub-header">Qty</th><th class="sub-header">Kg</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr class="grand-total-row">
              <td colspan="2" align="center">GRAND TOTAL</td>
              <td align="right">${formatDecimal2(gtAwalQty)}</td><td align="right">${formatDecimal2(gtAwalKg)}</td>
              <td align="right">${formatDecimal2(gtMasukQty)}</td><td align="right">${formatDecimal2(gtMasukKg)}</td>
              <td align="right">${formatDecimal2(gtKeluarQty)}</td><td align="right">${formatDecimal2(gtKeluarKg)}</td>
              <td align="right">${formatDecimal2(gtSaldoQty)}</td><td align="right">${formatDecimal2(gtSaldoKg)}</td>
              <td align="right"></td>
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
