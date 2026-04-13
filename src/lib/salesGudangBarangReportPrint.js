import { format } from 'date-fns';

/**
 * Format currency in Rupiah without Rp prefix
 */
const formatCurrency = (number) => {
  if (number === undefined || number === null) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

const formatDecimal2 = (number) => {
  if (number === undefined || number === null) return '0.00';
  return Number(number).toFixed(2);
};

export const printSalesGudangBarangReport = (groupedData, startDate, endDate) => {
  const periodeStart = format(new Date(startDate), "dd-MM-yyyy");
  const periodeEnd = format(new Date(endDate), "dd-MM-yyyy");

  const todayStr = format(new Date(), "EEEE, d MMMM yyyy");

  // Get Gudang Keys
  const gudangNames = Object.keys(groupedData).sort();

  let totalKeseluruhanBerat = 0;
  let totalKeseluruhanJumlah = 0;
  let totalKeseluruhanModal = 0;
  let totalKeseluruhanLaba = 0;

  // Render Rows Grouped By Gudang
  const tableRowsRendering = gudangNames.map(gudangName => {
    const items = groupedData[gudangName];

    let rowsHtml = `
      <tr>
        <td colspan="9" class="gudang-header" style="text-align: left; font-weight: bold; padding-top: 10px; padding-bottom: 5px;">
          Gudang : ${gudangName}
        </td>
      </tr>
    `;

    let subTotalBerat = 0;
    let subTotalJumlah = 0;
    let subTotalModal = 0;
    let subTotalLaba = 0;

    if (!items || items.length === 0) {
      rowsHtml += `
        <tr>
          <td valign="top" align="left">-</td>
          <td valign="top" align="center">-</td>
          <td valign="top" align="center">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
          <td valign="top" align="right">-</td>
        </tr>
      `;
    } else {
      items.forEach(item => {
        const itemQty = item.qty || 0;
        const itemKg = Number(item.total_kg || 0);
        const itemHargaPerKg = Number(item.harga_per_kg || 0);
        const itemJumlah = Number(item.jumlah || 0);
        const itemHPP = Number(item.hpp_rata || 0);
        const itemModal = Number(item.modal || 0);
        const itemLaba = Number(item.laba_kotor || 0);

        subTotalBerat += itemKg;
        subTotalJumlah += itemJumlah;
        subTotalModal += itemModal;
        subTotalLaba += itemLaba;

        rowsHtml += `
          <tr>
            <td valign="top" align="left">${item.item_barang_group || ''}</td>
            <td valign="top" align="center">${item.status || ''}</td>
            <td valign="top" align="center">${formatCurrency(itemQty)}</td>
            <td valign="top" align="right">${formatDecimal2(itemKg)}</td>
            <td valign="top" align="right">${formatCurrency(itemHargaPerKg)}</td>
            <td valign="top" align="right">${formatCurrency(itemJumlah)}</td>
            <td valign="top" align="right">${formatCurrency(itemHPP)}</td>
            <td valign="top" align="right">${formatCurrency(itemModal)}</td>
            <td valign="top" align="right">${formatCurrency(itemLaba)}</td>
          </tr>
        `;
      });
    }

    totalKeseluruhanBerat += subTotalBerat;
    totalKeseluruhanJumlah += subTotalJumlah;
    totalKeseluruhanModal += subTotalModal;
    totalKeseluruhanLaba += subTotalLaba;

    rowsHtml += `
      <tr class="subtotal-row">
        <td colspan="3" align="right" style="font-weight: bold; border-top: 1px dotted #000; padding-right: 20px;">${gudangName}</td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatDecimal2(subTotalBerat)}</td>
        <td align="right" style="border-top: 1px dotted #000;"></td>
        <td align="right" style="font-weight: bold; border-top: 1px dotted #000;">${formatCurrency(subTotalJumlah)}</td>
        <td align="right" style="border-top: 1px dotted #000;"></td>
        <td align="right" style="border-top: 1px dotted #000;">${formatCurrency(subTotalModal)}</td>
        <td align="right" style="border-top: 1px dotted #000;">${formatCurrency(subTotalLaba)}</td>
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
      <title>Penjualan / Gudang / Barang</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          margin: 0;
          padding: 60px 20px 20px 20px; /* Top padding for fixed toolbar */
          background-color: #f5f5f5;
          color: #000;
        }
        .report-page {
          background-color: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 21cm; /* A4 landscape width */
          margin: 0 auto;
          width: 29.7cm; /* A4 landscape width */
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
          position: relative; /* for absolute top-right info */
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
          padding: 3px 2px;
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
        <span class="toolbar-title">Print Preview - Penjualan / Gudang / Barang</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>

      <div class="report-page">
        <div class="header">
          <div class="top-right-info">
            <div>${todayStr}</div>
            <div>Halaman : 001</div>
          </div>
          <h1>Penjualan / Gudang / Barang</h1>
          <div class="periode">Periode ${periodeStart} s.d. ${periodeEnd}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="32%" align="left">Nama Barang</th>
              <th width="8%" align="center">Status</th>
              <th width="5%" align="center">Qty</th>
              <th width="8%" align="right">Total Kg.</th>
              <th width="10%" align="right">Harga/Kg.</th>
              <th width="12%" align="right">Jumlah</th>
              <th width="8%" align="right">HPP</th>
              <th width="10%" align="right">Modal</th>
              <th width="10%" align="right">Laba Kotor</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsRendering}
            <tr class="grand-total-row">
              <td colspan="3" align="center">GRAND TOTAL</td>
              <td align="right">${formatDecimal2(totalKeseluruhanBerat)}</td>
              <td align="center"></td>
              <td align="right">${formatCurrency(totalKeseluruhanJumlah)}</td>
              <td align="center"></td>
              <td align="right">${formatCurrency(totalKeseluruhanModal)}</td>
              <td align="right">${formatCurrency(totalKeseluruhanLaba)}</td>
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
