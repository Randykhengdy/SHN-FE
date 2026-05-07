import { format } from 'date-fns';

const fmt2 = (n) => (n === undefined || n === null ? '0.00' : Number(n).toFixed(2));

/**
 * Print Rekap Kegiatan Pelaksana — layout sesuai screenshot
 *
 * Kolom: Pelaksana | Jenis | Bentuk | Status | Qty | Kilo
 *
 * - Pelaksana hanya ditampilkan di baris data pertama per pelaksana (cell kosong berikutnya)
 * - Jenis hanya ditampilkan di baris data pertama per jenis group
 * - Setelah tiap jenis: subtotal "ARIF, ALUMINIUM"  colspan Bentuk+Status | qty | kilo
 * - Setelah tiap pelaksana: "SUB TOTAL -> ARIF"  colspan 4 | qty | kilo
 * - Akhir: GRAND TOTAL
 */
export const printRekapKegiatanPelaksanaReport = (data, grandTotal, startDate, endDate) => {
  const periodeStart = startDate ? format(new Date(startDate), 'dd-MM-yyyy') : '-';
  const periodeEnd   = endDate   ? format(new Date(endDate),   'dd-MM-yyyy') : '-';
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  const gtQty  = grandTotal?.qty  ?? 0;
  const gtKilo = grandTotal?.kilo ?? 0;

  let allRows = '';

  (data || []).forEach((grup) => {
    const jenisList = grup.jenis_groups || [];
    let pelaksanaShown = false;

    jenisList.forEach((jGroup) => {
      const dataRows = jGroup.rows || [];
      let jenisShown = false;

      dataRows.forEach((row) => {
        const pelaksanaCell = pelaksanaShown
          ? `<td></td>`
          : `<td style="font-weight:bold; vertical-align:top;">${grup.pelaksana || '-'}</td>`;

        const jenisCell = jenisShown
          ? `<td></td>`
          : `<td style="font-weight:bold; vertical-align:top;">${jGroup.jenis || ''}</td>`;

        allRows += `
          <tr>
            ${pelaksanaCell}
            ${jenisCell}
            <td>${row.bentuk || ''}</td>
            <td align="center">${row.status || ''}</td>
            <td align="right">${row.qty ?? 0}</td>
            <td align="right">${fmt2(row.kilo)}</td>
          </tr>`;

        pelaksanaShown = true;
        jenisShown = true;
      });

      // Jenis subtotal: blank Pelaksana, blank Jenis, label colspan 2, qty, kilo
      allRows += `
        <tr style="border-top:1px dotted #aaa;">
          <td></td>
          <td></td>
          <td colspan="2" align="right" style="font-style:italic; font-size:9.5px; padding-right:6px;">
            ${jGroup.subtotal_label || ''}
          </td>
          <td align="right" style="font-weight:bold;">${jGroup.subtotal_qty ?? 0}</td>
          <td align="right" style="font-weight:bold;">${fmt2(jGroup.subtotal_kilo)}</td>
        </tr>`;
    });

    // Pelaksana subtotal: label colspan 4, qty, kilo
    allRows += `
      <tr style="border-top:1px solid #555; border-bottom:1px solid #555;">
        <td colspan="4" align="right" style="font-weight:bold; padding-right:8px;">
          ${grup.subtotal_label || ('SUB TOTAL -&gt; ' + (grup.pelaksana || '').toUpperCase())}
        </td>
        <td align="right" style="font-weight:bold;">${grup.subtotal_qty ?? 0}</td>
        <td align="right" style="font-weight:bold;">${fmt2(grup.subtotal_kilo)}</td>
      </tr>
      <tr style="height:6px;"><td colspan="6"></td></tr>`;
  });

  const documentHtml = `
    <!DOCTYPE html><html lang="id"><head>
      <meta charset="UTF-8">
      <title>Rekap Kegiatan Pelaksana</title>
      <style>
        body { font-family:'Courier New',Courier,monospace; font-size:10px; margin:0;
               padding:60px 20px 20px; background:#f5f5f5; }
        .report-page { background:white; padding:25px 35px;
                       box-shadow:0 0 10px rgba(0,0,0,.1);
                       min-height:21cm; margin:0 auto; width:26cm; }
        .toolbar { position:fixed; top:0; left:0; right:0; height:50px;
                   background:#1e293b; color:white; display:flex;
                   align-items:center; padding:0 20px; gap:10px; z-index:1000; }
        .toolbar-title { font-family:sans-serif; font-size:14px; font-weight:bold; margin-right:auto; }
        .btn { padding:6px 15px; border-radius:4px; border:none; cursor:pointer;
               font-weight:bold; font-family:sans-serif; font-size:12px; }
        .btn-print { background:#2563eb; color:white; }
        .btn-close  { background:#ef4444; color:white; }
        .header { text-align:center; margin-bottom:14px; position:relative; }
        .header h1 { font-size:13px; margin:0 0 4px; text-decoration:underline; font-family:sans-serif; }
        .header .periode { font-size:11px; font-weight:bold; font-family:sans-serif; }
        .top-right-info { position:absolute; top:0; right:0;
                          text-align:right; font-family:sans-serif; font-size:10px; }
        table { width:100%; border-collapse:collapse; }
        th { border-top:2px solid #000; border-bottom:2px solid #000;
             padding:4px 3px; text-align:center; font-weight:bold; font-size:10px; }
        td { padding:2px 3px; font-size:10px; vertical-align:middle; }
        .grand-total-row td { border-top:2px solid #000; border-bottom:2px double #000;
                              font-weight:bold; padding:4px 3px; }
        @media print {
          .toolbar { display:none!important; }
          body { padding:0; background:white; }
          .report-page { padding:0; box-shadow:none; width:100%; }
          @page { size:A4 landscape; margin:1cm; }
        }
      </style>
    </head><body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview – Rekap Kegiatan Pelaksana</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close"  onclick="window.close()">Tutup Preview</button>
      </div>
      <div class="report-page">
        <div class="header">
          <div class="top-right-info"><div>${todayStr}</div><div>Halaman : 001</div></div>
          <h1>Rekap Kegiatan Pelaksana</h1>
          <div class="periode">Periode : ${periodeStart} s.d. ${periodeEnd}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="14%" align="left">Pelaksana</th>
              <th width="16%" align="left">Jenis</th>
              <th width="20%" align="left">Bentuk</th>
              <th width="12%">Status</th>
              <th width="10%">Qty</th>
              <th width="12%">Kilo</th>
            </tr>
          </thead>
          <tbody>
            ${allRows || '<tr><td colspan="6" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
            <tr class="grand-total-row">
              <td colspan="4" align="center">GRAND TOTAL</td>
              <td align="right">${gtQty}</td>
              <td align="right">${fmt2(gtKilo)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(documentHtml);
  w.document.close();
};
