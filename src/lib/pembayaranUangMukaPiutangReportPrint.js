import { format } from 'date-fns';

const formatCurrency = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID').format(Number(number));
};

/**
 * Cetak Report Pembayaran Penjualan Uang Muka & Piutang
 * @param {Array}  data        Flat array dari API
 * @param {string} startDate   YYYY-MM-DD
 * @param {string} endDate     YYYY-MM-DD
 */
export const printPembayaranUangMukaPiutangReport = (data, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), 'dd-MM-yyyy');
  const periodeEnd   = format(new Date(endDate),   'dd-MM-yyyy');
  const todayStr     = format(new Date(), 'EEEE, d MMMM yyyy');

  let grandTotalUM      = 0;
  let grandTotalBayar   = 0;

  // Group by tanggal untuk sub-total per hari (opsional — sesuai gambar referensi)
  // Kita group by tanggal supaya bisa rowspan tanggal & keterangan hari
  const grouped = {};
  (data || []).forEach((row) => {
    const tgl = row.tanggal ?? '-';
    if (!grouped[tgl]) grouped[tgl] = [];
    grouped[tgl].push(row);
  });

  let no = 0;
  const bodyRows = Object.entries(grouped).map(([tanggal, rows]) => {
    const rowspan = rows.length;

    let dayRows = '';
    let subUM    = 0;
    let subBayar = 0;

    rows.forEach((row, i) => {
      const um    = Number(row.uang_muka    ?? 0);
      const bayar = Number(row.pembayaran   ?? 0);
      subUM    += um;
      subBayar += bayar;
      no++;

      const umCell    = um    > 0 ? formatCurrency(um)    : '0';
      const bayarCell = bayar > 0 ? formatCurrency(bayar) : '0';

      if (i === 0) {
        dayRows += `
          <tr>
            <td align="center" rowspan="${rowspan}">${tanggal}</td>
            <td align="left">${row.no_invoice ?? '-'}</td>
            <td align="left">${row.nama_pelanggan ?? '-'}</td>
            <td align="right">${umCell}</td>
            <td align="right">${bayarCell}</td>
            <td align="center">${row.jenis ?? '-'}</td>
            <td align="left">${row.keterangan ?? ''}</td>
          </tr>
        `;
      } else {
        dayRows += `
          <tr>
            <td align="left">${row.no_invoice ?? '-'}</td>
            <td align="left">${row.nama_pelanggan ?? '-'}</td>
            <td align="right">${umCell}</td>
            <td align="right">${bayarCell}</td>
            <td align="center">${row.jenis ?? '-'}</td>
            <td align="left">${row.keterangan ?? ''}</td>
          </tr>
        `;
      }
    });

    grandTotalUM    += subUM;
    grandTotalBayar += subBayar;

    // Sub total per tanggal jika ada lebih dari 1 row di hari itu
    const subRow = rows.length > 1 ? `
      <tr class="subtotal-row">
        <td colspan="3" align="right" style="font-weight:bold; font-style:italic;">Sub Total ${tanggal}</td>
        <td align="right" style="font-weight:bold;">${subUM > 0 ? formatCurrency(subUM) : ''}</td>
        <td align="right" style="font-weight:bold;">${subBayar > 0 ? formatCurrency(subBayar) : ''}</td>
        <td></td>
        <td></td>
      </tr>
    ` : '';

    return dayRows + subRow;
  }).join('');

  const documentHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Pembayaran Penjualan Uang Muka &amp; Piutang</title>
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
        .btn-close:hover { background-color: #dc2626; }
        .header { text-align: center; margin-bottom: 20px; position: relative; }
        .header h1 { font-size: 16px; margin: 0 0 5px 0; text-decoration: underline; }
        .header .periode { margin-top: 5px; font-weight: bold; }
        .top-right-info { position: absolute; top: 0; right: 0; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th {
          border-top: 2px solid #000; border-bottom: 2px solid #000;
          padding: 5px 3px; text-align: center; font-weight: bold;
        }
        td { padding: 3px 3px; }
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
        <span class="toolbar-title">Print Preview - Pembayaran Penjualan Uang Muka &amp; Piutang</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>

      <div class="report-page">
        <div class="header">
          <div class="top-right-info">
            <div>${todayStr}</div>
            <div>Halaman : 001</div>
          </div>
          <h1>Pembayaran Penjualan Uang Muka &amp; Piutang</h1>
          <div class="periode">Periode ${periodeStart} s.d. ${periodeEnd}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="9%"  align="center">Tanggal</th>
              <th width="16%" align="left">No. Invoice</th>
              <th width="22%" align="left">Pelanggan</th>
              <th width="14%" align="right">Uang Muka</th>
              <th width="14%" align="right">Pembayaran</th>
              <th width="12%" align="center">Jenis</th>
              <th width="13%" align="left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows || '<tr><td colspan="7" align="center" style="padding:20px;">Tidak ada data</td></tr>'}
            <tr class="grand-total-row">
              <td colspan="3" align="center">GRAND TOTAL</td>
              <td align="right">${grandTotalUM > 0 ? formatCurrency(grandTotalUM) : '-'}</td>
              <td align="right">${grandTotalBayar > 0 ? formatCurrency(grandTotalBayar) : '-'}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(documentHtml);
  printWindow.document.close();
};
