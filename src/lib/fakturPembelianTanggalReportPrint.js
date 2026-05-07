import { format } from 'date-fns';

/**
 * Format currency in Rupiah without Rp prefix
 */
const formatCurrency = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID').format(number);
};

export const printFakturPembelianTanggalReport = (groupedData, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), "dd-MM-yyyy");
  const periodeEnd = format(new Date(endDate), "dd-MM-yyyy");

  const todayStr = format(new Date(), "EEEE, d MMMM yyyy");

  const dateKeys = Object.keys(groupedData);

  let grandRpTotal = 0;
  let grandDiscount = 0;
  let grandBiayaLain = 0;
  let grandGrandTotal = 0;
  let grandUangMuka = 0;
  let grandRpPiutang = 0;

  const tableRowsRendering = dateKeys.map(dateKey => {
    const items = groupedData[dateKey];

    let rowsHtml = '';

    let subRpTotal = 0;
    let subDiscount = 0;
    let subBiayaLain = 0;
    let subGrandTotal = 0;
    let subUangMuka = 0;
    let subRpPiutang = 0;

    if (!items || items.length === 0) {
      rowsHtml += `
        <tr>
          <td valign="top" align="center">${dateKey}</td>
          <td valign="top" align="left">-</td>
          <td valign="top" align="left">-</td>
          <td valign="top" align="left">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
        </tr>
      `;
    } else {
      items.forEach((item, index) => {
        const rpTotal = Number(item.rp_total || 0);
        const discount = Number(item.discount || 0);
        const biayaLain = Number(item.biaya_lain || 0);
        const gt = Number(item.grand_total || 0);
        const uangMuka = Number(item.uang_muka || 0);
        const rpPiutang = Number(item.rp_piutang || 0);

        subRpTotal += rpTotal;
        subDiscount += discount;
        subBiayaLain += biayaLain;
        subGrandTotal += gt;
        subUangMuka += uangMuka;
        subRpPiutang += rpPiutang;

        rowsHtml += `
          <tr>
            <td valign="top" align="center">${index === 0 ? dateKey : ''}</td>
            <td valign="top" align="left">${item.no_invoice || '-'}</td>
            <td valign="top" align="left">${item.gudang || ''}</td>
            <td valign="top" align="left">${item.supplier || ''}</td>
            <td valign="top" align="right">${formatCurrency(rpTotal)}</td>
            <td valign="top" align="right">${formatCurrency(discount)}</td>
            <td valign="top" align="right">${formatCurrency(biayaLain)}</td>
            <td valign="top" align="right">${formatCurrency(gt)}</td>
            <td valign="top" align="right">${formatCurrency(uangMuka)}</td>
            <td valign="top" align="right">${formatCurrency(rpPiutang)}</td>
          </tr>
        `;
      });
    }

    grandRpTotal += subRpTotal;
    grandDiscount += subDiscount;
    grandBiayaLain += subBiayaLain;
    grandGrandTotal += subGrandTotal;
    grandUangMuka += subUangMuka;
    grandRpPiutang += subRpPiutang;

    rowsHtml += `
      <tr class="subtotal-row">
        <td colspan="4" align="right" style="font-weight: bold; border-top: 1px dotted #000; padding-right: 10px;">Sub Total ${dateKey}</td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatCurrency(subRpTotal)}</td>
        <td align="right" style="border-top: 1px dotted #000;">${formatCurrency(subDiscount)}</td>
        <td align="right" style="border-top: 1px dotted #000;">${formatCurrency(subBiayaLain)}</td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatCurrency(subGrandTotal)}</td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatCurrency(subUangMuka)}</td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatCurrency(subRpPiutang)}</td>
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
      <title>Faktur Pembelian / Tanggal</title>
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
        <span class="toolbar-title">Print Preview - Faktur Pembelian / Tanggal</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>

      <div class="report-page">
        <div class="header">
          <div class="top-right-info">
            <div>${todayStr}</div>
            <div>Halaman : 001</div>
          </div>
          <h1>Faktur Pembelian / Tanggal</h1>
          <div class="periode">Periode ${periodeStart} s.d. ${periodeEnd}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="8%" align="center">Tanggal</th>
              <th width="11%" align="left">No. Invoice</th>
              <th width="10%" align="left">Gudang</th>
              <th width="14%" align="left">Supplier</th>
              <th width="10%" align="right">Rp. Total</th>
              <th width="8%" align="right">Discount</th>
              <th width="8%" align="right">Biaya Lain</th>
              <th width="10%" align="right">Grand Total</th>
              <th width="9%" align="right">Uang Muka</th>
              <th width="10%" align="right">Rp. Piutang</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsRendering}
            <tr class="grand-total-row">
              <td colspan="4" align="center">Grand Total</td>
              <td align="right">${formatCurrency(grandRpTotal)}</td>
              <td align="right">${formatCurrency(grandDiscount)}</td>
              <td align="right">${formatCurrency(grandBiayaLain)}</td>
              <td align="right">${formatCurrency(grandGrandTotal)}</td>
              <td align="right">${formatCurrency(grandUangMuka)}</td>
              <td align="right">${formatCurrency(grandRpPiutang)}</td>
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
