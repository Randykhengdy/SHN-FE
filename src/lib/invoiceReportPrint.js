/**
 * Utility to generate and print Invoice Penjualan / Tanggal report
 */

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  // Extract only the date part if it's a timestamp (YYYY-MM-DD)
  const cleanDate = dateStr.substring(0, 10);
  const [year, month, day] = cleanDate.split('-');
  return `${day}-${month}-${year}`;
};

export const printInvoicePenjualanTanggalReport = (data, dateFrom, dateTo, tampilkanBarang = true) => {
  const groupedData = data.reduce((acc, item) => {
    // using tanggal_cetak_invoice or created_at
    const date = item.tanggal_cetak_invoice ? item.tanggal_cetak_invoice.substring(0, 10) : '';
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedData).sort();

  const calculateGrandTotals = () => {
    return data.reduce((acc, item) => {
      acc.total += parseFloat(item.total_harga_invoice || 0);
      acc.biayaLain += parseFloat(item.biaya_lain || 0);
      acc.uangMuka += parseFloat(item.uang_muka || 0);
      acc.jumlahDibayar += parseFloat(item.jumlah_dibayar || 0);
      acc.sisaBayar += parseFloat(item.sisa_bayar || 0);
      return acc;
    }, { total: 0, biayaLain: 0, uangMuka: 0, jumlahDibayar: 0, sisaBayar: 0 });
  };

  const grandTotals = calculateGrandTotals();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice Penjualan / Tanggal</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          margin: 0;
          padding: 60px 20px 20px 20px; /* Top padding for fixed toolbar */
          background-color: #f5f5f5;
        }
        .report-page {
          background-color: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 29.7cm; /* A4 height */
          margin: 0 auto;
          width: 25.7cm; /* A4 landscape width minus margins */
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
          margin: 0;
          text-decoration: underline;
        }
        .header .periode {
          margin-top: 5px;
          font-weight: bold;
        }
        .header .halaman {
          position: absolute;
          right: 0;
          top: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          border-top: 2px solid black;
          border-bottom: 2px solid black;
          padding: 5px;
          text-align: left;
          background-color: #f2e9d9;
        }
        td {
          padding: 3px 5px;
          vertical-align: middle;
        }
        .row-border-bottom td {
          border-bottom: 1px dotted #ccc;
        }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .subtotal-row td {
          border-top: 1px solid black;
          font-weight: bold;
        }
        .grandtotal-row td {
          border-top: 2px solid black;
          border-bottom: 2px solid black;
          font-weight: bold;
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
            size: landscape;
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <span class="toolbar-title">Print Preview - Invoice Penjualan / Tanggal</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>

      <div class="report-page">
        <div class="header">
          <h1>Invoice Penjualan / Tanggal</h1>
          <div class="periode">Periode : ${formatDate(dateFrom)} s.d. ${formatDate(dateTo)}</div>
          <div class="halaman">Halaman : 001</div>
        </div>

      <table>
        <thead>
          <tr>
            <th width="80">Tanggal</th>
            <th width="120">Nomor Invoice</th>
            <th width="150">Gudang</th>
            <th>Pelanggan</th>
            <th width="90" class="text-right">Rp. Total</th>
            ${tampilkanBarang ? '<th width="250">Deskripsi / Dimensi</th>' : ''}
            <th width="80" class="text-right">Biaya Lain</th>
            <th width="90" class="text-right">Uang Muka</th>
            <th width="90" class="text-right">Jumlah Dibayar</th>
            <th width="90" class="text-right">Sisa Pmb.</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedDates.forEach(date => {
    const items = groupedData[date];
    const subTotals = items.reduce((acc, item) => {
      acc.total += parseFloat(item.total_harga_invoice || 0);
      acc.biayaLain += parseFloat(item.biaya_lain || 0);
      acc.uangMuka += parseFloat(item.uang_muka || 0);
      acc.jumlahDibayar += parseFloat(item.jumlah_dibayar || 0);
      acc.sisaBayar += parseFloat(item.sisa_bayar || 0);
      return acc;
    }, { total: 0, biayaLain: 0, uangMuka: 0, jumlahDibayar: 0, sisaBayar: 0 });

    items.forEach((item, index) => {
      const podItems = item.invoice_pod_items || [];
      const rowCount = tampilkanBarang ? Math.max(1, podItems.length) : 1;
      const invoiceDate = item.tanggal_cetak_invoice ? item.tanggal_cetak_invoice.substring(0, 10) : '';

      for (let i = 0; i < rowCount; i++) {
        const podItem = podItems[i];
        
        if (i === 0) {
          html += `
            <tr class="${rowCount === 1 ? 'row-border-bottom' : ''}">
              <td rowspan="${rowCount}">${index === 0 ? formatDate(invoiceDate) : ''}</td>
              <td rowspan="${rowCount}">${item.nomor_invoice}</td>
              <td rowspan="${rowCount}">${item.work_order_planning?.gudang?.nama_gudang || ''}</td>
              <td rowspan="${rowCount}">${item.sales_order?.pelanggan?.nama_pelanggan || ''}</td>
              <td class="text-right" rowspan="${rowCount}">${formatCurrency(item.total_harga_invoice)}</td>
              ${tampilkanBarang ? `<td>${podItem ? `${podItem.nama_item} (${podItem.dimensi_potong})` : ''}</td>` : ''}
              <td class="text-right" rowspan="${rowCount}">${formatCurrency(item.biaya_lain)}</td>
              <td class="text-right" rowspan="${rowCount}">${formatCurrency(item.uang_muka)}</td>
              <td class="text-right" rowspan="${rowCount}">${formatCurrency(item.jumlah_dibayar)}</td>
              <td class="text-right" rowspan="${rowCount}">${formatCurrency(item.sisa_bayar)}</td>
            </tr>
          `;
        } else {
          html += `
            <tr class="${i === rowCount - 1 ? 'row-border-bottom' : ''}">
              ${tampilkanBarang ? `<td>${podItem ? `${podItem.nama_item} (${podItem.dimensi_potong})` : ''}</td>` : ''}
            </tr>
          `;
        }
      }
    });

    html += `
      <tr class="subtotal-row">
        <td colspan="4" class="text-right">Sub Total ${formatDate(date)}</td>
        <td class="text-right">${formatCurrency(subTotals.total)}</td>
        ${tampilkanBarang ? '<td></td>' : ''}
        <td class="text-right">${formatCurrency(subTotals.biayaLain)}</td>
        <td class="text-right">${formatCurrency(subTotals.uangMuka)}</td>
        <td class="text-right">${formatCurrency(subTotals.jumlahDibayar)}</td>
        <td class="text-right">${formatCurrency(subTotals.sisaBayar)}</td>
      </tr>
    `;
  });

  html += `
      <tr class="grandtotal-row">
        <td colspan="4" class="text-right">Grand Total</td>
        <td class="text-right">${formatCurrency(grandTotals.total)}</td>
        ${tampilkanBarang ? '<td></td>' : ''}
        <td class="text-right">${formatCurrency(grandTotals.biayaLain)}</td>
        <td class="text-right">${formatCurrency(grandTotals.uangMuka)}</td>
        <td class="text-right">${formatCurrency(grandTotals.jumlahDibayar)}</td>
        <td class="text-right">${formatCurrency(grandTotals.sisaBayar)}</td>
      </tr>
    </tbody>
      </table>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};
