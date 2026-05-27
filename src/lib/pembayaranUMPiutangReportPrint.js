import { format } from 'date-fns';

/**
 * Format currency in Rupiah without Rp prefix
 */
const formatCurrency = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID').format(number);
};

export const printPembayaranUMPiutangReport = (groupedData, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), "dd-MM-yyyy");
  const periodeEnd = format(new Date(endDate), "dd-MM-yyyy");

  const todayStr = format(new Date(), "EEEE, d MMMM yyyy");

  // Get Date Keys (already sorted from backend)
  const dateKeys = Object.keys(groupedData);

  let grandTotalUangMuka = 0;
  let grandTotalPembayaran = 0;

  // Render Rows Grouped By Date
  const tableRowsRendering = dateKeys.map(dateKey => {
    const payments = groupedData[dateKey];

    let rowsHtml = `
      <tr>
        <td colspan="9" class="date-header" style="text-align: left; font-weight: bold; padding-top: 6px; padding-bottom: 2px;">
          ${dateKey}
        </td>
      </tr>
    `;

    let subTotalUangMuka = 0;
    let subTotalPembayaran = 0;

    if (!payments || payments.length === 0) {
      rowsHtml += `
        <tr>
          <td valign="top" align="center">-</td>
          <td valign="top" align="left">-</td>
          <td valign="top" align="left">-</td>
          <td valign="top" align="left">-</td>
          <td valign="top" align="center">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="center">-</td>
          <td valign="top" align="left">-</td>
        </tr>
      `;
    } else {
      payments.forEach((item, index) => {
        const uangMuka = Number(item.uang_muka || 0);
        const pembayaran = Number(item.pembayaran || 0);

        subTotalUangMuka += uangMuka;
        subTotalPembayaran += pembayaran;

        rowsHtml += `
          <tr>
            <td valign="top" align="left">${index === 0 ? '' : ''}</td>
            <td valign="top" align="left">${item.no_bukti || '-'}</td>
            <td valign="top" align="left">${item.pelanggan || ''}</td>
            <td valign="top" align="left">${item.peruntukan || ''}</td>
            <td valign="top" align="center">${item.tanggal_invoice || ''}</td>
            <td valign="top" align="right">${uangMuka > 0 ? formatCurrency(uangMuka) : ''}</td>
            <td valign="top" align="right">${pembayaran > 0 ? formatCurrency(pembayaran) : ''}</td>
            <td valign="top" align="center">${item.jenis || ''}</td>
            <td valign="top" align="left">${item.keterangan || ''}</td>
          </tr>
        `;
      });
    }

    grandTotalUangMuka += subTotalUangMuka;
    grandTotalPembayaran += subTotalPembayaran;

    rowsHtml += `
      <tr class="subtotal-row">
        <td colspan="5" align="right" style="font-weight: bold; border-top: 1px dotted #000; padding-right: 10px;">SUB TOTAL -> ${dateKey}</td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatCurrency(subTotalUangMuka)}</td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatCurrency(subTotalPembayaran)}</td>
        <td colspan="2" style="border-top: 1px dotted #000;"></td>
      </tr>
    `;

    return rowsHtml;
  }).join("");

  const documentHtml = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pembayaran Penjualan Uang Muka & Piutang</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 10px;
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
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background-color: #333;
          color: white;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 10px;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .toolbar-title {
          font-family: sans-serif;
          font-size: 14px;
          font-weight: bold;
          margin-right: auto;
        }
        .btn {
          padding: 6px 15px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-family: sans-serif;
          font-size: 12px;
          transition: background 0.2s;
        }
        .btn-print { background-color: #2563eb; color: white; }
        .btn-print:hover { background-color: #1d4ed8; }
        .btn-close { background-color: #ef4444; color: white; }
        .btn-close:hover { background-color: #dc2626; }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          position: relative;
        }
        .header h1 {
          font-size: 16px;
          margin: 0 0 5px 0;
          text-decoration: underline;
        }
        .header .periode {
          margin-top: 5px;
          font-weight: bold;
        }
        .top-right-info {
          position: absolute;
          top: 0;
          right: 0;
          text-align: right;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          table-layout: auto;
        }
        th {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 5px 2px;
          text-align: center;
          font-weight: bold;
        }
        td {
          padding: 2px 2px;
        }
        .grand-total-row td {
          border-top: 2px solid #000;
          border-bottom: 2px double #000;
          font-weight: bold;
          padding-top: 5px;
          padding-bottom: 5px;
        }
        @media print {
          .toolbar { display: none !important; }
          body { padding: 0; background-color: white; }
          .report-page { 
            padding: 0; 
            box-shadow: none; 
            width: 100%; 
            min-height: auto;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview - Pembayaran Penjualan Uang Muka & Piutang</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>

      <div class="report-page">
        <div class="header">
          <div class="top-right-info">
            <div>${todayStr}</div>
            <div>Halaman : 001</div>
          </div>
          <h1>Pembayaran Penjualan Uang Muka & Piutang</h1>
          <div class="periode">Periode ${periodeStart} s.d. ${periodeEnd}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="8%" align="center">Tanggal</th>
              <th width="13%" align="left">No.Bukti</th>
              <th width="15%" align="left">Pelanggan</th>
              <th width="13%" align="left">Peruntukan</th>
              <th width="8%" align="center">Tanggal</th>
              <th width="11%" align="right">Uang Muka</th>
              <th width="11%" align="right">Pembayaran</th>
              <th width="8%" align="center">Jenis</th>
              <th width="13%" align="left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsRendering}
            <tr class="grand-total-row">
              <td colspan="5" align="center">GRAND TOTAL</td>
              <td align="right">${formatCurrency(grandTotalUangMuka)}</td>
              <td align="right">${formatCurrency(grandTotalPembayaran)}</td>
              <td colspan="2"></td>
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
