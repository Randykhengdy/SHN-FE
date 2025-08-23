// Sidebar toggle and active state

document.addEventListener('DOMContentLoaded', function() {
  const sidebarLinks = document.querySelectorAll('.sidebar a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Sidebar toggle for mobile
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      document.body.classList.toggle('sidebar-open');
    });
  }

  // --- PO Report functionality for report.html ---
  if (document.getElementById('poReportTableWrapper')) {
    function getPlatTypes() {
      // Sync with po.js platTypes
      return [
        { kode: "A1100", ketebalan: 1.2, harga: 500000 },
        { kode: "A5052", ketebalan: 1.5, harga: 650000 },
        { kode: "A6061", ketebalan: 2.0, harga: 700000 },
        { kode: "A2024", ketebalan: 2.5, harga: 900000 },
        { kode: "A7075", ketebalan: 3.0, harga: 1200000 },
        { kode: "A3003", ketebalan: 1.0, harga: 550000 }
      ];
    }

    function populateJenisFilter() {
      const select = document.getElementById('filterPoJenis');
      if (!select) return;
      select.innerHTML = '<option value="">Semua</option>';
      getPlatTypes().forEach(pt => {
        const opt = document.createElement('option');
        opt.value = pt.kode;
        opt.textContent = pt.kode;
        select.appendChild(opt);
      });
    }

    function renderPOReport() {
      const wrapper = document.getElementById('poReportTableWrapper');
      const start = document.getElementById('filterPoStart').value;
      const end = document.getElementById('filterPoEnd').value;
      const jenis = document.getElementById('filterPoJenis').value;
      const status = document.getElementById('filterPoStatus').value;
      let poList = JSON.parse(localStorage.getItem('poList')||'[]');
      // Filter by date (based on noPO date part)
      if (start) {
        poList = poList.filter(po => {
          const dateStr = po.noPO.split('-')[2];
          return dateStr >= start.replace(/-/g, '');
        });
      }
      if (end) {
        poList = poList.filter(po => {
          const dateStr = po.noPO.split('-')[2];
          return dateStr <= end.replace(/-/g, '');
        });
      }
      // Filter by jenis
      if (jenis) {
        poList = poList.filter(po => po.items.some(item => item.jenis === jenis));
      }
      // Filter by status
      if (status) {
        poList = poList.filter(po => (po.status||'').toLowerCase() === status.toLowerCase());
      }
      // Render table
      let html = '<div class="table-scroll-x"><table><thead><tr>' +
        '<th>No PO</th><th>Tanggal</th><th>Jumlah Item</th><th>Jenis Plat</th><th>Total Harga</th><th>Status</th>' +
        '</tr></thead><tbody>';
      if (poList.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;color:#888;">Tidak ada data</td></tr>';
      } else {
        poList.forEach(po => {
          // Extract date from noPO
          const dateStr = po.noPO.split('-')[2];
          const date = dateStr ? `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}` : '';
          // Jenis plat summary
          const jenisList = [...new Set(po.items.map(i => i.jenis))].join(', ');
          html += `<tr><td>${po.noPO}</td><td>${date}</td><td>${po.items.length}</td><td>${jenisList}</td><td>Rp ${po.total.toLocaleString()}</td><td>${po.status||''}</td></tr>`;
        });
      }
      html += '</tbody></table></div>';
      wrapper.innerHTML = html;
    }

    populateJenisFilter();
    renderPOReport();
    document.getElementById('filterPoBtn').addEventListener('click', renderPOReport);
  }

  // --- Report Pemotongan (Cutting) ---
  if (document.getElementById('potongReportTable')) {
    function renderPotongReport() {
      const tableDiv = document.getElementById('potongReportTable');
      const visualDiv = document.getElementById('potongReportVisual');
      let cutList = JSON.parse(localStorage.getItem('cutReportList')||'[]');
      if (!Array.isArray(cutList)) cutList = [];
      // Sort by date descending
      cutList.sort((a,b)=>b.date.localeCompare(a.date));
      // Visual summary
      const totalCuts = cutList.length;
      const totalBasePlates = new Set(cutList.map(r=>`${r.baseWidth}x${r.baseHeight}`)).size;
      const totalRemaining = cutList.reduce((a,b)=>a+parseFloat(b.remainingWeight||0),0).toFixed(2);
      visualDiv.innerHTML = `<div style="margin-bottom:10px;font-size:1.08em;">
        <strong>Total Cuts:</strong> ${totalCuts} &nbsp; | &nbsp;
        <strong>Unique Base Plates:</strong> ${totalBasePlates} &nbsp; | &nbsp;
        <strong>Total Remaining Weight:</strong> ${totalRemaining} kg
      </div>`;
      // Table
      let html = '<div class="table-scroll-x"><table><thead><tr>' +
        '<th>Date</th><th>Base Size</th><th>Base Weight</th><th>Remaining Weight</th><th>Cut Type</th><th>Cut Size</th><th>Cut Color</th>' +
        '</tr></thead><tbody>';
      if (cutList.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center;color:#888;">No cutting data available</td></tr>';
      } else {
        cutList.forEach(r => {
          const date = new Date(r.date).toLocaleString();
          html += `<tr>
            <td>${date}</td>
            <td>${r.baseWidth} x ${r.baseHeight} cm</td>
            <td>${r.baseWeight} kg</td>
            <td>${r.remainingWeight} kg</td>
            <td>${r.type}</td>
            <td>${r.widthCm} x ${r.heightCm} cm</td>
            <td><span style="display:inline-block;width:28px;height:18px;background:${r.color};border:1px solid #ccc;border-radius:4px;"></span> ${r.color}</td>
          </tr>`;
        });
      }
      html += '</tbody></table></div>';
      tableDiv.innerHTML = html;
    }
    // Render on tab open
    const potongTab = document.querySelector('.report-tab[data-report="potong"]');
    if (potongTab) {
      potongTab.addEventListener('click', renderPotongReport);
    }
    // Also render if already active on load
    if (document.getElementById('report-potong').style.display !== 'none') {
      renderPotongReport();
    }
    // --- Download Excel/CSV ---
    const downloadBtn = document.getElementById('downloadPotongExcel');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        let cutList = JSON.parse(localStorage.getItem('cutReportList')||'[]');
        if (!Array.isArray(cutList) || cutList.length === 0) {
          alert('No cutting data to export!');
          return;
        }
        // CSV header
        let csv = 'Date,Base Size,Base Weight,Remaining Weight,Cut Type,Cut Size,Cut Color\n';
        cutList.forEach(r => {
          const date = new Date(r.date).toLocaleString();
          const baseSize = `${r.baseWidth} x ${r.baseHeight} cm`;
          const baseWeight = r.baseWeight;
          const remaining = r.remainingWeight;
          const type = r.type;
          const cutSize = `${r.widthCm} x ${r.heightCm} cm`;
          const color = r.color;
          csv += `"${date}","${baseSize}","${baseWeight}","${remaining}","${type}","${cutSize}","${color}"
`;
        });
        const blob = new Blob([csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'report_pemotongan.csv';
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      });
    }
  }

  const clearDataMenu = document.getElementById('clearDataMenu');
  if (clearDataMenu) {
    clearDataMenu.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to clear ALL saved data? This cannot be undone.')) {
        localStorage.clear();
        alert('All data has been cleared.');
        location.reload();
      }
    });
  }

  function showCustomConfirm(msg, callback) {
    const dialog = document.getElementById('customConfirm');
    document.getElementById('customConfirmMsg').textContent = msg;
    dialog.style.display = 'flex';
    document.getElementById('customConfirmYes').onclick = () => {
      dialog.style.display = 'none';
      callback(true);
    };
    document.getElementById('customConfirmNo').onclick = () => {
      dialog.style.display = 'none';
      callback(false);
    };
  }

  // Logout logic
  var logoutLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim().toLowerCase() === 'logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      showCustomConfirm('Yakin ingin logout?', function(result) {
        if (result) {
          localStorage.removeItem('isLoggedIn');
          window.location.href = 'login.html';
        }
      });
    });
  }
}); 