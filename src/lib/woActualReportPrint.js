/**
 * Utility to generate and print Realisasi Work Order / Tanggal report
 */

const formatNumber = (value) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const cleanDate = dateStr.substring(0, 10);
  const [year, month, day] = cleanDate.split('-');
  return `${day}-${month}-${year}`;
};

export const printRealisasiWOTanggalReport = (data, dateFrom, dateTo) => {
  // Flatten data so each row represents an item
  const flattenedData = [];

  (data || []).forEach(actual => {
    const items = actual.work_order_actual_items || [];

    // If no items, we still might want to show the header, but report is item-based
    if (items.length === 0) {
      flattenedData.push({
        tanggal: actual.tanggal_actual || actual.created_at,
        nomorSo: actual.nomor_so || '-',
        namaBarang: '-',
        status: '-',
        dimensi: '-',
        qtySo: 0,
        beratSo: 0,
        qtyActual: 0,
        beratActual: 0,
        tanggalClose: actual.tanggal_actual || '-',
      });
      return;
    }

    items.forEach(item => {
      const planningItem = item.work_order_planning_item || {};
      const itemBarangGroup = planningItem.item_barang_group || {};
      const platDasar = planningItem.plat_dasar || {};

      // Calculate Dimension
      let dimensiString = "";
      if (planningItem.diameter) {
        dimensiString = `Ø ${planningItem.diameter} x ${planningItem.panjang || ''}`;
      } else {
        const arr = [planningItem.tebal, planningItem.lebar, planningItem.panjang].filter(v => v !== null && v !== undefined && v !== "");
        dimensiString = arr.join(" x ");
      }

      const namaBarang = itemBarangGroup.nama_group_barang || platDasar.nama_barang || '-';
      const statusPotongan = planningItem.jenis_potongan || '-';

      flattenedData.push({
        tanggal: actual.tanggal_actual || actual.created_at,
        nomorSo: actual.nomor_so || '-',
        namaBarang: namaBarang,
        status: statusPotongan.toUpperCase(),
        dimensi: dimensiString || '-',
        qtySo: parseFloat(planningItem.qty || 0),
        beratSo: parseFloat(planningItem.berat || 0),
        qtyActual: parseFloat(item.qty_actual || 0),
        beratActual: parseFloat(item.berat_actual || 0),
        tanggalClose: actual.tanggal_actual || '-',
      });
    });
  });

  // Group by Tanggal (since the report header says "Realisasi Work Order / Tanggal")
  const groupedData = flattenedData.reduce((acc, row) => {
    const date = row.tanggal ? row.tanggal.substring(0, 10) : '';
    if (!acc[date]) acc[date] = [];
    acc[date].push(row);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedData).sort();

  const calculateGrandTotals = () => {
    return flattenedData.reduce((acc, row) => {
      acc.qtySo += row.qtySo;
      acc.beratSo += row.beratSo;
      acc.qtyActual += row.qtyActual;
      acc.beratActual += row.beratActual;
      return acc;
    }, { qtySo: 0, beratSo: 0, qtyActual: 0, beratActual: 0 });
  };

  const grandTotals = calculateGrandTotals();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Realisasi Work Order / Tanggal</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          margin: 0;
          padding: 60px 20px 20px 20px;
          background-color: #f5f5f5;
        }
        .report-page {
          background-color: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          min-height: 29.7cm;
          margin: 0 auto;
          width: 25.7cm; /* Landscape A4 */
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
          vertical-align: top;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
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
        <span class="toolbar-title">Print Preview - Realisasi WO / Tanggal</span>
        <button class="btn btn-print" onclick="window.print()">Print Sekarang</button>
        <button class="btn btn-close" onclick="window.close()">Tutup Preview</button>
      </div>

      <div class="report-page">
        <div class="header">
          <h1>Realisasi Work Order / Tanggal</h1>
          <div class="periode">Periode : ${formatDate(dateFrom)} s.d. ${formatDate(dateTo)}</div>
          <div class="halaman">Halaman : 001</div>
        </div>

      <table>
        <thead>
          <tr>
            <th width="80">Tanggal</th>
            <th width="120">Nomor SO</th>
            <th>Nama Barang</th>
            <th width="80">Status</th>
            <th width="150">Dimensi Potong</th>
            <th width="80" class="text-right">Jumlah<br>SO</th>
            <th width="80" class="text-right">Berat (kg)<br>SO</th>
            <th width="80" class="text-right">Jumlah<br>WO Act</th>
            <th width="80" class="text-right">Berat (kg)<br>WO Act</th>
            <th width="80" class="text-center">Tg. Close</th>
          </tr>
        </thead>
        <tbody>
  `;

  sortedDates.forEach(date => {
    const rows = groupedData[date];
    const subTotals = rows.reduce((acc, row) => {
      acc.qtySo += row.qtySo;
      acc.beratSo += row.beratSo;
      acc.qtyActual += row.qtyActual;
      acc.beratActual += row.beratActual;
      return acc;
    }, { qtySo: 0, beratSo: 0, qtyActual: 0, beratActual: 0 });

    rows.forEach((row, index) => {
      html += `
        <tr>
          <td>${index === 0 ? formatDate(row.tanggal) : ''}</td>
          <td>${row.nomorSo}</td>
          <td>${row.namaBarang}</td>
          <td>${row.status}</td>
          <td>${row.dimensi}</td>
          <td class="text-right">${formatNumber(row.qtySo)}</td>
          <td class="text-right">${formatNumber(row.beratSo)}</td>
          <td class="text-right">${formatNumber(row.qtyActual)}</td>
          <td class="text-right">${formatNumber(row.beratActual)}</td>
          <td class="text-center">${formatDate(row.tanggalClose)}</td>
        </tr>
      `;
    });

    html += `
      <tr class="subtotal-row">
        <td colspan="5" class="text-right">Sub Total ${formatDate(date)}</td>
        <td class="text-right">${formatNumber(subTotals.qtySo)}</td>
        <td class="text-right">${formatNumber(subTotals.beratSo)}</td>
        <td class="text-right">${formatNumber(subTotals.qtyActual)}</td>
        <td class="text-right">${formatNumber(subTotals.beratActual)}</td>
        <td></td>
      </tr>
    `;
  });

  html += `
      <tr class="grandtotal-row">
        <td colspan="5" class="text-right">Grand Total</td>
        <td class="text-right">${formatNumber(grandTotals.qtySo)}</td>
        <td class="text-right">${formatNumber(grandTotals.beratSo)}</td>
        <td class="text-right">${formatNumber(grandTotals.qtyActual)}</td>
        <td class="text-right">${formatNumber(grandTotals.beratActual)}</td>
        <td></td>
      </tr>
    </tbody>
      </table>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert("Please allow popups to open the print preview.");
  }
};
