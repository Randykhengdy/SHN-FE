// Inisialisasi Fabric.js canvas
const canvas = new fabric.Canvas('c');

// Set canvas to full size
function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  // Use offsetWidth/offsetHeight to ensure it fills parent
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  canvas.setWidth(containerWidth);
  canvas.setHeight(containerHeight);
  canvas.renderAll();
}

// Initial resize
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', resizeCanvas);

// Variabel untuk menyimpan objek plat dasar
let baseRect = null;

// --- Pan (geser view) dengan mouse scroll wheel ---
let isPanning = false;
let lastPanPoint = { x: 0, y: 0 };
let minimapVisible = false;
let minimapCanvas = null;
let minimapCtx = null;
let minimapContainer = null;
let viewportIndicator = null;

// Variabel untuk menyimpan daftar potongan dan labelnya
let cuts = [];

// --- Context Menu (klik kanan) untuk hapus objek ---
let contextMenu = document.createElement('div');
contextMenu.style.position = 'fixed';
contextMenu.style.display = 'none';
contextMenu.style.background = '#fff';
contextMenu.style.border = '1px solid #ccc';
contextMenu.style.padding = '8px 0';
contextMenu.style.zIndex = 2000;
contextMenu.innerHTML = '<div style="padding:6px 24px;cursor:pointer;" class="rotateObjBtn">Rotate 90°</div><div style="padding:6px 24px;cursor:pointer;" class="deleteObjBtn">Hapus</div>';
document.body.appendChild(contextMenu);

let contextTarget = null;

// Get current shape type
function getShapeType() {
  return localStorage.getItem('workshopShapeType') || '2D';
}

// Fungsi untuk membuat atau update plat dasar
function setBasePlate() {
  // Ambil input dalam cm, konversi ke mm
  const widthCm = parseFloat(document.getElementById('baseWidth').value);
  const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('baseHeight').value); // Fixed height for 1D
  const color = document.getElementById('baseColor').value;

  // Konversi ke mm (jika ingin presisi, tapi untuk canvas, kita pakai skala pixel)
  // const widthMm = widthCm * 10;
  // const heightMm = heightCm * 10;

  // Skala agar muat di canvas (misal: 1 cm = 5 px)
  const scale = 5;
  const widthPx = widthCm * scale;
  const heightPx = heightCm * scale;

  // Hapus plat dasar lama jika ada
  if (baseRect) {
    canvas.remove(baseRect);
  }

  // Buat plat dasar baru
  baseRect = new fabric.Rect({
    left: 50 + widthPx / 2,
    top: 50 + heightPx / 2,
    width: widthPx,
    height: heightPx,
    fill: color,
    selectable: false,
    originX: 'center',
    originY: 'center'
  });
  canvas.add(baseRect);
  canvas.sendToBack(baseRect);
  if (minimapVisible) updateMinimap();

  // Label ukuran lebar (kanan)
  baseRectLabelW = new fabric.Text(`${widthCm} cm`, {
    left: 50 + widthPx + 10,
    top: 50 + heightPx / 2,
    fontSize: 18,
    fill: '#333',
    originY: 'middle',
    selectable: false,
    evented: false
  });
  
  // Label ukuran tinggi (atas) - only for 2D
  if (getShapeType() === '2D') {
    baseRectLabelH = new fabric.Text(`${heightCm} cm`, {
      left: 50 + widthPx / 2,
      top: 50 - 24,
      fontSize: 18,
      fill: '#333',
      originX: 'center',
      originY: 'middle',
      selectable: false,
      evented: false
    });
    canvas.add(baseRectLabelH);
  }
  
  canvas.add(baseRectLabelW);
  canvas.requestRenderAll();
  updateRemainingWeight();
}

// Fungsi untuk auto-create base plate sesuai konfigurasi Work Order
function autoCreateBasePlate(config) {
  console.log('Auto-creating base plate with config:', config);
  
  // Set nilai input sesuai konfigurasi
  document.getElementById('baseWidth').value = config.baseWidth || 100;
  if (config.type === '2D') {
    document.getElementById('baseHeight').value = config.baseHeight || 150;
  }
  
  // Buat base plate secara otomatis
  setBasePlate();
  
  console.log('Base plate auto-created successfully');
}

// Fungsi untuk auto-create cut sesuai konfigurasi Work Order
// Fungsi ini tidak dipanggil otomatis, hanya untuk manual trigger
function autoCreateCut(config) {
  console.log('Auto-creating cut with config:', config);
  
  // Set nilai input cut sesuai konfigurasi
  document.getElementById('cutWidth').value = config.cutWidth || 20;
  if (config.type === '2D') {
    document.getElementById('cutHeight').value = config.cutHeight || 30;
  }
  
  // Buat cut secara otomatis
  if (config.type === '1D') {
    addCutAuto();
  } else {
    addCutHorizontal();
  }
  
  console.log('Cut auto-created successfully');
}

// Fungsi untuk auto-configure workshop berdasarkan konfigurasi Work Order
function autoConfigureWorkshopFromConfig(config) {
  console.log('Auto-configuring workshop from config:', config);
  
  // Set shape type
  localStorage.setItem('workshopShapeType', config.type);
  
  // Update UI berdasarkan shape type
  if (config.type === '1D') {
    // Hide height fields for 1D (shaft)
    document.querySelectorAll('.height-field').forEach(field => {
      field.style.display = 'none';
    });
    
    // Hide horizontal and vertical cut buttons for 1D
    document.getElementById('addCutHorizontalBtn').style.display = 'none';
    document.getElementById('addCutVerticalBtn').style.display = 'none';
    
    // Show auto cut button for 1D
    document.getElementById('addCutAuto').style.display = 'block';
    
    // Update labels for 1D
    document.querySelector('label[for="baseWidth"]').textContent = 'Base Length (cm):';
    document.querySelector('label[for="cutWidth"]').textContent = 'Cut Length (cm):';
    document.querySelector('#setBase').textContent = 'Create Base Shaft';
    
  } else {
    // Show all fields for 2D (plate)
    document.querySelectorAll('.height-field').forEach(field => {
      field.style.display = 'block';
    });
    
    // Show horizontal and vertical cut buttons for 2D
    document.getElementById('addCutHorizontalBtn').style.display = 'block';
    document.getElementById('addCutVerticalBtn').style.display = 'block';
    
    // Hide auto cut button for 2D
    document.getElementById('addCutAuto').style.display = 'none';
    
    // Update labels for 2D
    document.querySelector('label[for="baseWidth"]').textContent = 'Base Width (cm):';
    document.querySelector('label[for="cutWidth"]').textContent = 'Cut Width (cm):';
    document.querySelector('#setBase').textContent = 'Create Base Plate';
  }
  
  // Auto-create base plate saja di awal (tanpa cut)
  if (config.autoCreateBase) {
    setTimeout(() => {
      autoCreateBasePlate(config);
      console.log('Base plate auto-created successfully');
    }, 100);
  }
}

document.getElementById('setBase').addEventListener('click', setBasePlate);


// Add native event listeners for panning on the canvas background with minimap
canvas.upperCanvasEl.addEventListener('mousedown', function(e) {
  if (e.button === 1) { // Middle mouse button
    isPanning = true;
    lastPanPoint = { x: e.clientX, y: e.clientY };
    canvas.selection = false;
    canvas.defaultCursor = 'grabbing';
    showMinimap();
    e.preventDefault();
  }
});
canvas.upperCanvasEl.addEventListener('mousemove', function(e) {
  if (isPanning) {
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    const vpt = canvas.viewportTransform;
    vpt[4] += deltaX;
    vpt[5] += deltaY;
    canvas.setViewportTransform(vpt);
    
    lastPanPoint = { x: e.clientX, y: e.clientY };
    updateMinimap();
    e.preventDefault();
  }
});
canvas.upperCanvasEl.addEventListener('mouseup', function(e) {
  if (e.button === 1) {
    isPanning = false;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    hideMinimap();
    e.preventDefault();
  }
});

// Zoom in/out dengan mouse scroll
canvas.on('mouse:wheel', function(opt) {
  let delta = opt.e.deltaY;
  let zoom = canvas.getZoom();
  zoom *= 0.999 ** delta;
  if (zoom > 3) zoom = 3;
  if (zoom < 0.2) zoom = 0.2;

  // Fokus zoom pada posisi kursor
  const pointer = canvas.getPointer(opt.e);
  canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);

  opt.e.preventDefault();
  opt.e.stopPropagation();
});

// --- Modal Edit Plat Dasar ---
const editModal = document.getElementById('editModal');
const modalBaseColor = document.getElementById('modalBaseColor');
const rotate90Btn = document.getElementById('rotate90');
const closeModalBtn = document.getElementById('closeModal');

// Helper: set focus style
function setBaseFocus(focused) {
  if (baseRect) {
    baseRect.set({
      stroke: focused ? 'blue' : null,
      strokeWidth: focused ? 4 : 0
    });
    canvas.requestRenderAll();
  }
}

// Fokus & drag saat single click
canvas.on('mouse:down', function(opt) {
  if (canvas.getObjects().length === 0) return;
  if (opt.e.button === 2) { // right click
    opt.e.preventDefault();
    if (opt.target) {
      contextTarget = opt.target;
      contextMenu.style.left = opt.e.clientX + 'px';
      contextMenu.style.top = opt.e.clientY + 'px';
      contextMenu.style.display = 'block';
    } else {
      contextMenu.style.display = 'none';
      contextTarget = null;
    }
    return;
  } else {
    // Jika klik di luar context menu, sembunyikan
    if (contextMenu.style.display === 'block') {
      contextMenu.style.display = 'none';
      contextTarget = null;
    }
  }
  if (opt.target === baseRect) {
    setBaseFocus(true);
    baseRect.set({ selectable: true, evented: true });
    // Hide all cut labels
    for (const cut of cuts) {
      cut.labelW.set({ visible: false });
      if (cut.labelH) cut.labelH.set({ visible: false });
    }
    canvas.sendToBack(baseRect);
    canvas.requestRenderAll();
  } else if (cuts.some(cut => cut.rect === opt.target)) {
    // If a cut is clicked, set it as active object
    if (canvas.getActiveObject() !== opt.target) {
      canvas.setActiveObject(opt.target);
    }
    // Show only the selected cut's labels, hide others
    for (const cut of cuts) {
      if (cut.rect === opt.target) {
        const rect = cut.rect;
        const widthPx = rect.width * rect.scaleX;
        const heightPx = rect.height * rect.scaleY;
        cut.labelW.set({
          left: rect.left,
          top: rect.top - heightPx/2 - 20,
          visible: true
        });
        if (cut.labelH) {
          cut.labelH.set({
            left: rect.left + widthPx/2 + 10,
            top: rect.top,
            visible: true
          });
        }
      } else {
        cut.labelW.set({ visible: false });
        if (cut.labelH) cut.labelH.set({ visible: false });
      }
    }
    canvas.requestRenderAll();
  } else if (!opt.target) {
    // Only clear selection if there is an active object
    if (canvas.getActiveObject()) {
      canvas.discardActiveObject();
      setBaseFocus(false);
      // Hide all cut labels
      for (const cut of cuts) {
        cut.labelW.set({ visible: false });
        if (cut.labelH) cut.labelH.set({ visible: false });
      }
      canvas.requestRenderAll();
    }
  } else {
    setBaseFocus(false);
    // Hide all cut labels
    for (const cut of cuts) {
      cut.labelW.set({ visible: false });
      if (cut.labelH) cut.labelH.set({ visible: false });
    }
    canvas.requestRenderAll();
  }
});

// Double click untuk edit
canvas.on('mouse:dblclick', function(opt) {
  if (opt.target === baseRect) {
    modalBaseColor.value = baseRect.fill;
    editModal.style.display = 'block';
  }
});

// Enable drag jika fokus
canvas.on('selection:created', function(opt) {
  if (opt.target === baseRect) {
    baseRect.set({ selectable: true, evented: true });
  }
});
canvas.on('selection:cleared', function() {
  setBaseFocus(false);
});

// Ganti warna plat dasar dari modal
modalBaseColor.addEventListener('input', function() {
  if (baseRect) {
    baseRect.set('fill', modalBaseColor.value);
    canvas.requestRenderAll();
  }
});

// Rotate 90 derajat
rotate90Btn.addEventListener('click', function() {
  if (baseRect) {
    let angle = baseRect.angle || 0;
    baseRect.set('angle', angle + 90);
    canvas.requestRenderAll();
  }
});

// Tutup modal
closeModalBtn.addEventListener('click', function() {
  editModal.style.display = 'none';
});

// --- Undo (Ctrl+Z) ---
let canvasHistory = [];
let isRestoring = false;

function saveHistory() {
  if (!isRestoring) {
    canvasHistory.push(JSON.stringify(canvas.toDatalessJSON()));
    // Batasi history agar tidak membengkak
    if (canvasHistory.length > 50) canvasHistory.shift();
  }
}

function undo() {
  if (canvasHistory.length > 1) {
    isRestoring = true;
    canvasHistory.pop(); // Hapus state sekarang
    const prev = canvasHistory[canvasHistory.length - 1];
    canvas.loadFromJSON(prev, () => {
      canvas.renderAll();
      isRestoring = false;
    });
  }
}

document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault();
    undo();
  }
});

// Simpan history setiap ada perubahan
canvas.on('object:added', saveHistory);
canvas.on('object:modified', saveHistory);
canvas.on('object:removed', saveHistory);

// Simpan state awal
canvas.on('after:render', function() {
  if (canvasHistory.length === 0) saveHistory();
});

// --- Notifikasi popup ---
function showNotification(msg) {
  let notif = document.createElement('div');
  notif.innerText = msg;
  notif.style.position = 'fixed';
  notif.style.left = '50%';
  notif.style.top = '20%';
  notif.style.transform = 'translate(-50%, 0)';
  notif.style.background = '#fff';
  notif.style.border = '1px solid #f00';
  notif.style.padding = '16px 32px';
  notif.style.zIndex = 3000;
  notif.style.fontSize = '18px';
  notif.style.boxShadow = '0 2px 10px #0002';
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);
}

// Helper: cek overlap dua rect
function isOverlap(r1, r2) {
  return !(
    r1.left + r1.width <= r2.left ||
    r2.left + r2.width <= r1.left ||
    r1.top + r1.height <= r2.top ||
    r2.top + r2.height <= r1.top
  );
}

// --- Remaining Weight Calculation ---
function updateRemainingWeight() {
  const baseWidth = parseFloat(document.getElementById('baseWidth').value);
  const baseHeight = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('baseHeight').value); // Fixed height for 1D
  const baseWeight = parseFloat(document.getElementById('baseWeight').value);
  const baseArea = baseWidth * baseHeight;
  if (!baseRect || !baseArea || !baseWeight) {
    document.getElementById('remainingWeight').innerText = '0';
    return;
  }
  // Sum area of all cuts
  let cutArea = 0;
  for (const cut of cuts) {
    // Each cut's width/height in px, convert to cm (scale = 5)
    const widthCm = cut.rect.width / 5;
    const heightCm = cut.rect.height / 5;
    cutArea += widthCm * heightCm;
  }
  const remainingArea = Math.max(baseArea - cutArea, 0);
  const remainingWeight = (baseWeight * (remainingArea / baseArea)).toFixed(2);
  document.getElementById('remainingWeight').innerText = remainingWeight;
}

// Update remaining weight on relevant events
['baseWidth', 'baseHeight', 'baseWeight'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateRemainingWeight);
});

// --- Save cutting report to localStorage ---
function saveCutReport(type, cutData) {
  const baseWidth = parseFloat(document.getElementById('baseWidth').value);
  const baseHeight = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('baseHeight').value); // Fixed height for 1D
  const baseWeight = parseFloat(document.getElementById('baseWeight').value);
  const remainingWeight = document.getElementById('remainingWeight').innerText;
  const now = new Date();
  const report = {
    date: now.toISOString(),
    baseWidth,
    baseHeight,
    baseWeight,
    remainingWeight,
    type, // 'manual' or 'auto'
    ...cutData
  };
  let cutReportList = JSON.parse(localStorage.getItem('cutReportList')||'[]');
  cutReportList.push(report);
  localStorage.setItem('cutReportList', JSON.stringify(cutReportList));
}

// --- Manual Add Cut (default position) ---
function addCut() {
  const widthCm = parseFloat(document.getElementById('cutWidth').value);
  const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('cutHeight').value); // Fixed height for 1D
  const color = document.getElementById('cutColor').value;
  const scale = 5;
  const widthPx = widthCm * scale;
  const heightPx = heightCm * scale;
  if (!baseRect) {
    showNotification('Buat plat dasar terlebih dahulu!');
    return;
  }
  // Area plat dasar
  const baseLeft = baseRect.left - baseRect.width/2;
  const baseTop = baseRect.top - baseRect.height/2;
  const baseRight = baseLeft + baseRect.width;
  const baseBottom = baseTop + baseRect.height;
  // Ambil semua potongan yang ada di dalam plat dasar
  let existingRects = cuts.map(cut => ({
    left: cut.rect.left - cut.rect.width/2,
    top: cut.rect.top - cut.rect.height/2,
    width: cut.rect.width,
    height: cut.rect.height
  }));
  // Cari posisi kosong (scan dari kiri atas)
  let found = false;
  let posX, posY;
  outer: for (let y = baseTop; y <= baseBottom - heightPx; y += 5) {
    for (let x = baseLeft; x <= baseRight - widthPx; x += 5) {
      let newRect = { left: x, top: y, width: widthPx, height: heightPx };
      let overlap = existingRects.some(r => isOverlap(r, newRect));
      if (!overlap) {
        posX = x + widthPx/2;
        posY = y + heightPx/2;
        found = true;
        break outer;
      }
    }
  }
  if (!found) {
    showNotification('Tidak ada ruang kosong yang cukup di plat dasar!');
    return;
  }
  // Buat potongan baru di posisi yang ditemukan
  const cutRect = new fabric.Rect({
    left: posX,
    top: posY,
    width: widthPx,
    height: heightPx,
    fill: color,
    selectable: true,
    originX: 'center',
    originY: 'center'
  });
  cutRect.createdAt = Date.now();
  cutRect.cutId = generateCutId();
  
  // Label ukuran lebar (atas)
  const labelW = new fabric.Text(`${widthCm} cm`, {
    left: posX,
    top: posY - heightPx/2 - 20,
    fontSize: 16,
    fill: '#333',
    originX: 'center',
    originY: 'middle',
    selectable: false,
    evented: false,
    visible: false
  });
  
  // Label ukuran tinggi (kanan) - only for 2D
  let labelH = null;
  if (getShapeType() === '2D') {
    labelH = new fabric.Text(`${heightCm} cm`, {
      left: posX + widthPx/2 + 10,
      top: posY,
      fontSize: 16,
      fill: '#333',
      originY: 'middle',
      selectable: false,
      evented: false,
      visible: false
    });
    canvas.add(cutRect, labelW, labelH);
    cuts.push({rect: cutRect, labelW, labelH});
  } else {
    // For 1D, only add width label
    canvas.add(cutRect, labelW);
    cuts.push({rect: cutRect, labelW, labelH: null});
  }
  
  updateRemainingWeight();
  if (minimapVisible) updateMinimap();
  saveCutReport('manual', {widthCm, heightCm, color});
}

// Fungsi addCutAuto yang diperbaiki untuk auto-create dari Work Order
function addCutAuto() {
  const widthCm = parseFloat(document.getElementById('cutWidth').value);
  const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('cutHeight').value); // Fixed height for 1D
  const color = document.getElementById('cutColor').value;
  
  if (!baseRect) {
    showNotification('Buat plat dasar terlebih dahulu!');
    return;
  }
  
  const scale = 5;
  const widthPx = widthCm * scale;
  const heightPx = heightCm * scale;
  
  // Area plat dasar
  const baseLeft = baseRect.left - baseRect.width/2;
  const baseTop = baseRect.top - baseRect.height/2;
  const baseRight = baseLeft + baseRect.width;
  const baseBottom = baseTop + baseRect.height;
  
  // Cari posisi yang tepat untuk cut
  let posX, posY;
  
  if (getShapeType() === '1D') {
    // Untuk 1D (shaft), posisikan cut horizontal di tengah base shaft
    // Default horizontal: cut sejajar dengan panjang shaft
    posX = baseRect.left;
    posY = baseRect.top;
    
    // Jika ada cut sebelumnya, posisikan di sebelahnya
    if (cuts.length > 0) {
      const lastCut = cuts[cuts.length - 1];
      const lastCutRight = lastCut.rect.left + lastCut.rect.width/2;
      posX = lastCutRight + widthPx/2 + 5; // 5px gap
      
      // Jika melebihi base shaft, reset ke awal
      if (posX + widthPx/2 > baseRect.left + baseRect.width/2) {
        posX = baseRect.left - baseRect.width/2 + widthPx/2;
      }
    }
  } else {
    // Untuk 2D, posisikan cut di tengah base plate
    posX = baseRect.left;
    posY = baseRect.top;
  }
  
  // Buat potongan baru
  const cutRect = new fabric.Rect({
    left: posX,
    top: posY,
    width: widthPx,
    height: heightPx,
    fill: color,
    selectable: true,
    originX: 'center',
    originY: 'center'
  });
  
  cutRect.createdAt = Date.now();
  cutRect.cutId = generateCutId();
  
  // Label ukuran lebar
  const labelW = new fabric.Text(`${widthCm} cm`, {
    left: posX,
    top: posY - heightPx/2 - 20,
    fontSize: 16,
    fill: '#333',
    originX: 'center',
    originY: 'middle',
    selectable: false,
    evented: false,
    visible: false
  });
  
  // Label ukuran tinggi (hanya untuk 2D)
  let labelH = null;
  if (getShapeType() === '2D') {
    labelH = new fabric.Text(`${heightCm} cm`, {
      left: posX + widthPx/2 + 10,
      top: posY,
      fontSize: 16,
      fill: '#333',
      originX: 'center',
      originY: 'middle',
      selectable: false,
      evented: false,
      visible: false
    });
  }
  
  // Tambahkan ke canvas
  canvas.add(cutRect);
  canvas.add(labelW);
  if (labelH) canvas.add(labelH);
  
  // Simpan ke array cuts
  cuts.push({
    rect: cutRect,
    labelW: labelW,
    labelH: labelH,
    createdAt: cutRect.createdAt,
    cutId: cutRect.cutId
  });
  
  // Update canvas
  canvas.requestRenderAll();
  updateRemainingWeight();
  
  // Save to history
  saveHistory();
  
  // Show notification
  if (getShapeType() === '1D') {
    showNotification(`Cut horizontal berhasil ditambahkan: ${widthCm} cm`);
  } else {
    showNotification(`Cut berhasil ditambahkan: ${widthCm} × ${heightCm} cm`);
  }
}

// Wrap addCutAuto and addCut to save report
const origAddCutAuto = addCutAuto;
addCutAuto = function() {
  const widthCm = parseFloat(document.getElementById('cutWidth').value);
  const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('cutHeight').value); // Fixed height for 1D
  const color = document.getElementById('cutColor').value;
  origAddCutAuto.apply(this, arguments);
  saveCutReport('auto', {widthCm, heightCm, color});
};

const origAddCut = typeof addCut === 'function' ? addCut : null;
if (origAddCut) {
  addCut = function() {
    const widthCm = parseFloat(document.getElementById('cutWidth').value);
    const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('cutHeight').value); // Fixed height for 1D
    const color = document.getElementById('cutColor').value;
    origAddCut.apply(this, arguments);
    saveCutReport('manual', {widthCm, heightCm, color});
  };
}

function addCutHorizontal() {
  const widthCm = parseFloat(document.getElementById('cutWidth').value);
  const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('cutHeight').value); // Fixed height for 1D
  const color = document.getElementById('cutColor').value;
  const scale = 5;
  const widthPx = widthCm * scale;
  const heightPx = heightCm * scale;
  if (!baseRect) {
    showNotification('Buat plat dasar terlebih dahulu!');
    return;
  }
  // Area plat dasar
  const baseLeft = baseRect.left - baseRect.width/2;
  const baseTop = baseRect.top - baseRect.height/2;
  const baseRight = baseLeft + baseRect.width;
  const baseBottom = baseTop + baseRect.height;
  let existingRects = cuts.map(cut => ({
    left: cut.rect.left - cut.rect.width/2,
    top: cut.rect.top - cut.rect.height/2,
    width: cut.rect.width,
    height: cut.rect.height
  }));
  // Scan horizontal: kiri ke kanan, lalu turun baris
  let found = false;
  let posX, posY;
  outer: for (let y = baseTop; y <= baseBottom - heightPx; y += 5) {
    for (let x = baseLeft; x <= baseRight - widthPx; x += 5) {
      let newRect = { left: x, top: y, width: widthPx, height: heightPx };
      let overlap = existingRects.some(r => isOverlap(r, newRect));
      if (!overlap) {
        posX = x + widthPx/2;
        posY = y + heightPx/2;
        found = true;
        break outer;
      }
    }
  }
  if (!found) {
    showNotification('Tidak ada ruang kosong yang cukup di plat dasar!');
    return;
  }
  // Buat potongan baru di posisi yang ditemukan
  const cutRect = new fabric.Rect({
    left: posX,
    top: posY,
    width: widthPx,
    height: heightPx,
    fill: color,
    selectable: true,
    originX: 'center',
    originY: 'center'
  });
  cutRect.createdAt = Date.now();
  cutRect.cutId = generateCutId();
  const labelW = new fabric.Text(`${widthCm} cm`, {
    left: posX,
    top: posY - heightPx/2 - 20,
    fontSize: 16,
    fill: '#333',
    originX: 'center',
    originY: 'middle',
    selectable: false,
    evented: false,
    visible: false
  });
  
  // Label ukuran tinggi (kanan) - only for 2D
  let labelH = null;
  if (getShapeType() === '2D') {
    labelH = new fabric.Text(`${heightCm} cm`, {
      left: posX + widthPx/2 + 10,
      top: posY,
      fontSize: 16,
      fill: '#333',
      originY: 'middle',
      selectable: false,
      evented: false,
      visible: false
    });
    canvas.add(cutRect, labelW, labelH);
    cuts.push({rect: cutRect, labelW, labelH});
  } else {
    // For 1D, only add width label
    canvas.add(cutRect, labelW);
    cuts.push({rect: cutRect, labelW, labelH: null});
  }
  
  updateRemainingWeight();
  if (minimapVisible) updateMinimap();
  saveCutReport('manual', {widthCm, heightCm, color});
}

function addCutVertical() {
  const widthCm = parseFloat(document.getElementById('cutWidth').value);
  const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('cutHeight').value); // Fixed height for 1D
  const color = document.getElementById('cutColor').value;
  const scale = 5;
  const widthPx = widthCm * scale;
  const heightPx = heightCm * scale;
  if (!baseRect) {
    showNotification('Buat plat dasar terlebih dahulu!');
    return;
  }
  // Area plat dasar
  const baseLeft = baseRect.left - baseRect.width/2;
  const baseTop = baseRect.top - baseRect.height/2;
  const baseRight = baseLeft + baseRect.width;
  const baseBottom = baseTop + baseRect.height;
  let existingRects = cuts.map(cut => ({
    left: cut.rect.left - cut.rect.width/2,
    top: cut.rect.top - cut.rect.height/2,
    width: cut.rect.width,
    height: cut.rect.height
  }));
  // Scan vertical: atas ke bawah, lalu geser kolom
  let found = false;
  let posX, posY;
  outer: for (let x = baseLeft; x <= baseRight - widthPx; x += 5) {
    for (let y = baseTop; y <= baseBottom - heightPx; y += 5) {
      let newRect = { left: x, top: y, width: widthPx, height: heightPx };
      let overlap = existingRects.some(r => isOverlap(r, newRect));
      if (!overlap) {
        posX = x + widthPx/2;
        posY = y + heightPx/2;
        found = true;
        break outer;
      }
    }
  }
  if (!found) {
    showNotification('Tidak ada ruang kosong yang cukup di plat dasar!');
    return;
  }
  // Buat potongan baru di posisi yang ditemukan
  const cutRect = new fabric.Rect({
    left: posX,
    top: posY,
    width: widthPx,
    height: heightPx,
    fill: color,
    selectable: true,
    originX: 'center',
    originY: 'center'
  });
  cutRect.createdAt = Date.now();
  cutRect.cutId = generateCutId();
  const labelW = new fabric.Text(`${widthCm} cm`, {
    left: posX,
    top: posY - heightPx/2 - 20,
    fontSize: 16,
    fill: '#333',
    originX: 'center',
    originY: 'middle',
    selectable: false,
    evented: false,
    visible: false
  });
  
  // Label ukuran tinggi (kanan) - only for 2D
  let labelH = null;
  if (getShapeType() === '2D') {
    labelH = new fabric.Text(`${heightCm} cm`, {
      left: posX + widthPx/2 + 10,
      top: posY,
      fontSize: 16,
      fill: '#333',
      originY: 'middle',
      selectable: false,
      evented: false,
      visible: false
    });
    canvas.add(cutRect, labelW, labelH);
    cuts.push({rect: cutRect, labelW, labelH});
  } else {
    // For 1D, only add width label
    canvas.add(cutRect, labelW);
    cuts.push({rect: cutRect, labelW, labelH: null});
  }
  
  updateRemainingWeight();
  if (minimapVisible) updateMinimap();
  saveCutReport('manual', {widthCm, heightCm, color});
}

document.getElementById('addCutHorizontalBtn').addEventListener('click', addCutHorizontal);
document.getElementById('addCutVerticalBtn').addEventListener('click', addCutVertical);

// Show/hide labels on selection
canvas.on('selection:created', function(opt) {
  // Hide all labels first
  for (const cut of cuts) {
    cut.labelW.set({ visible: false });
    if (cut.labelH) cut.labelH.set({ visible: false });
  }
  // If a cut is selected, show its labels and position them
  for (const cut of cuts) {
    if (opt.target === cut.rect) {
      const rect = cut.rect;
      const widthPx = rect.width * rect.scaleX;
      const heightPx = rect.height * rect.scaleY;
      // Width label above
      cut.labelW.set({
        left: rect.left,
        top: rect.top - heightPx/2 - 20,
        visible: true
      });
      // Height label to the right
      if (cut.labelH) {
        cut.labelH.set({
          left: rect.left + widthPx/2 + 10,
          top: rect.top,
          visible: true
        });
      }
      canvas.requestRenderAll();
      break;
    }
  }
});
canvas.on('selection:updated', function(opt) {
  // Same as selection:created
  for (const cut of cuts) {
    cut.labelW.set({ visible: false });
    if (cut.labelH) cut.labelH.set({ visible: false });
  }
  for (const cut of cuts) {
    if (opt.target === cut.rect) {
      const rect = cut.rect;
      const widthPx = rect.width * rect.scaleX;
      const heightPx = rect.height * rect.scaleY;
      cut.labelW.set({
        left: rect.left,
        top: rect.top - heightPx/2 - 20,
        visible: true
      });
      if (cut.labelH) {
        cut.labelH.set({
          left: rect.left + widthPx/2 + 10,
          top: rect.top,
          visible: true
        });
      }
      canvas.requestRenderAll();
      break;
    }
  }
});
canvas.on('selection:cleared', function() {
  // Hide all labels
  for (const cut of cuts) {
    cut.labelW.set({ visible: false });
    if (cut.labelH) cut.labelH.set({ visible: false });
  }
  setBaseFocus(false);
  canvas.requestRenderAll();
});

// Cegah scroll browser saat mouse wheel button ditekan di canvas
canvas.upperCanvasEl.addEventListener('mousedown', function(e) {
  if (e.button === 1) {
    e.preventDefault();
  }
});

// Gunakan event contextmenu pada canvas
canvas.upperCanvasEl.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  // Dapatkan posisi mouse relatif ke canvas
  const pointer = canvas.getPointer(e);
  // Cari objek di posisi mouse
  const target = canvas.findTarget(e, false);
  if (target && (target === baseRect || cuts.some(cut => cut.rect === target))) {
    contextTarget = target;
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.style.display = 'block';
  } else {
    contextMenu.style.display = 'none';
    contextTarget = null;
  }
});

document.body.addEventListener('mousedown', function(e) {
  // Jika klik pada menu rotate
  if (e.target.classList.contains('rotateObjBtn')) {
    if (!contextTarget) return;
    let angle = contextTarget.angle || 0;
    contextTarget.set('angle', angle + 90);
    contextMenu.style.display = 'none';
    contextTarget = null;
    canvas.requestRenderAll();
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Jika klik pada menu hapus
  if (e.target.classList.contains('deleteObjBtn')) {
    if (!contextTarget) return;
    if (contextTarget === baseRect) {
      canvas.remove(baseRect);
      baseRect = null;
    } else {
      for (let i = 0; i < cuts.length; i++) {
        if (cuts[i].rect === contextTarget) {
          canvas.remove(cuts[i].rect);
          canvas.remove(cuts[i].labelW);
          if (cuts[i].labelH) canvas.remove(cuts[i].labelH);
          cuts.splice(i, 1);
          break;
        }
        if (cuts[i].labelW === contextTarget || cuts[i].labelH === contextTarget) {
          canvas.remove(cuts[i].rect);
          canvas.remove(cuts[i].labelW);
          if (cuts[i].labelH) canvas.remove(cuts[i].labelH);
          cuts.splice(i, 1);
          break;
        }
      }
    }
    contextMenu.style.display = 'none';
    contextTarget = null;
    canvas.requestRenderAll();
    e.preventDefault();
    e.stopPropagation();
    return;
  } else if (!contextMenu.contains(e.target)) {
    // Klik di luar menu, sembunyikan
    contextMenu.style.display = 'none';
    contextTarget = null;
  }
});

// Tambahkan event listener untuk tombol Tambah Potongan Otomatis
const addCutAutoBtn = document.getElementById('addCutAuto');
addCutAutoBtn.addEventListener('click', addCutAuto);

// When a cut is deleted, update weight
canvas.on('object:removed', function() {
  updateRemainingWeight();
});

// Initial update
updateRemainingWeight();

// --- Draggable config box logic ---
(function() {
  const configBox = document.getElementById('configBox');
  const dragHandle = configBox ? configBox.querySelector('.config-drag-handle') : null;
  if (!configBox || !dragHandle) return;
  let offsetX = 0, offsetY = 0, isDragging = false;
  let startX, startY;

  function onMouseDown(e) {
    isDragging = true;
    startX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    startY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    const rect = configBox.getBoundingClientRect();
    offsetX = startX - rect.left;
    offsetY = startY - rect.top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove, {passive:false});
    document.addEventListener('touchend', onMouseUp);
    e.preventDefault();
  }
  function onMouseMove(e) {
    if (!isDragging) return;
    let clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    let clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
    let left = clientX - offsetX;
    let top = clientY - offsetY;
    // Keep within viewport
    const minLeft = 0;
    const minTop = 0;
    const maxLeft = window.innerWidth - configBox.offsetWidth;
    const maxTop = window.innerHeight - configBox.offsetHeight;
    left = Math.max(minLeft, Math.min(left, maxLeft));
    top = Math.max(minTop, Math.min(top, maxTop));
    configBox.style.left = left + 'px';
    configBox.style.top = top + 'px';
  }
  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onMouseMove);
    document.removeEventListener('touchend', onMouseUp);
  }
  dragHandle.addEventListener('mousedown', onMouseDown);
  dragHandle.addEventListener('touchstart', onMouseDown, {passive:false});
})();

// --- Save/Load Progress Pemotongan Plat ---
function saveProgress() {
  const json = canvas.toDatalessJSON();
  localStorage.setItem('workshopProgress', JSON.stringify(json));
  showNotification('Progress pemotongan disimpan!');
}

function loadProgress() {
  const json = localStorage.getItem('workshopProgress');
  if (!json) {
    showNotification('Tidak ada progress tersimpan!');
    return;
  }
  canvas.loadFromJSON(JSON.parse(json), () => {
    canvas.renderAll();
    showNotification('Progress pemotongan dimuat!');
  });
}

document.getElementById('saveProgressBtn').addEventListener('click', saveProgress);
document.getElementById('loadProgressBtn').addEventListener('click', loadProgress); 

// --- Show Cut Layers Modal ---
function formatDateTime(dt) {
  const d = new Date(dt);
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
document.getElementById('showLayersBtn').addEventListener('click', function() {
  const modal = document.getElementById('cutLayersModal');
  const listDiv = document.getElementById('cutLayersList');
  // Get all cuts in canvas order (bottom to top)
  const objects = canvas.getObjects();
  // Filter only cut rects (exclude baseRect)
  const cutRects = cuts.map(cut => cut.rect);
  let layers = objects
    .map(obj => {
      const cutIdx = cuts.findIndex(cut => cut.rect === obj);
      if (cutIdx !== -1) {
        return { idx: cutIdx, cut: cuts[cutIdx], obj };
      }
      return null;
    })
    .filter(Boolean);
  // Reverse for descending (newest on top)
  layers = layers.reverse();
  // Build HTML
  let html = '<ol style="padding-left:18px;">';
  layers.forEach((layer, i) => {
    const created = layer.cut.rect.createdAt ? formatDateTime(layer.cut.rect.createdAt) : '-';
    const cutId = layer.cut.rect.cutId || '-';
    const color = layer.cut.rect.fill || '#ccc';
    html += `<li style="margin-bottom:10px; display:flex; align-items:center; gap:12px;">
      <span style="display:inline-block; width:28px; height:18px; background:${color}; border:1px solid #ccc; border-radius:4px;"></span>
      <span style="font-family:monospace; font-size:0.98em; color:#217dbb;">${cutId}</span>
      <span style="color:#888; font-size:0.97em;">${created}</span>
    </li>`;
  });
  html += '</ol>';
  if (layers.length === 0) html = '<div style="color:#888;">Belum ada potongan.</div>';
  listDiv.innerHTML = html;
  modal.style.display = 'flex';
});
document.getElementById('closeLayersBtn').addEventListener('click', function() {
  document.getElementById('cutLayersModal').style.display = 'none';
});
// Helper: generate unique cut id
function generateCutId() {
  return 'CUT-' + Date.now() + '-' + Math.floor(Math.random()*100000);
}
// Patch all cut creation points only if not already patched
if (!window._cutLayerPatchApplied) {
  window._cutLayerPatchApplied = true;
  const origAddCut = addCut;
  addCut = function() {
  const widthCm = parseFloat(document.getElementById('cutWidth').value);
  const heightCm = getShapeType() === '1D' ? 10 : parseFloat(document.getElementById('cutHeight').value); // Fixed height for 1D
  const color = document.getElementById('cutColor').value;
  const scale = 5;
  const widthPx = widthCm * scale;
  const heightPx = heightCm * scale;
  if (!baseRect) {
    showNotification('Buat plat dasar terlebih dahulu!');
    return;
  }
  // Area plat dasar
  const baseLeft = baseRect.left - baseRect.width/2;
  const baseTop = baseRect.top - baseRect.height/2;
  const baseRight = baseLeft + baseRect.width;
  const baseBottom = baseTop + baseRect.height;
  let existingRects = cuts.map(cut => ({
    left: cut.rect.left - cut.rect.width/2,
    top: cut.rect.top - cut.rect.height/2,
    width: cut.rect.width,
    height: cut.rect.height
  }));
  let found = false;
  let posX, posY;
  outer: for (let y = baseTop; y <= baseBottom - heightPx; y += 5) {
    for (let x = baseLeft; x <= baseRight - widthPx; x += 5) {
      let newRect = { left: x, top: y, width: widthPx, height: heightPx };
      let overlap = existingRects.some(r => isOverlap(r, newRect));
      if (!overlap) {
        posX = x + widthPx/2;
        posY = y + heightPx/2;
        found = true;
        break outer;
      }
    }
  }
  if (!found) {
    showNotification('Tidak ada ruang kosong yang cukup di plat dasar!');
    return;
  }
  // Buat potongan baru di posisi yang ditemukan
  const cutRect = new fabric.Rect({
    left: posX,
    top: posY,
    width: widthPx,
    height: heightPx,
    fill: color,
    selectable: true,
    originX: 'center',
    originY: 'center'
  });
    cutRect.createdAt = Date.now();
    cutRect.cutId = generateCutId();
  const labelW = new fabric.Text(`${widthCm} cm`, {
    left: posX,
    top: posY - heightPx/2 - 20,
    fontSize: 16,
    fill: '#333',
    originX: 'center',
    originY: 'middle',
    selectable: false,
    evented: false,
    visible: false
  });
  
  // Label ukuran tinggi (kanan) - only for 2D
  let labelH = null;
  if (getShapeType() === '2D') {
    labelH = new fabric.Text(`${heightCm} cm`, {
      left: posX + widthPx/2 + 10,
      top: posY,
      fontSize: 16,
      fill: '#333',
      originY: 'middle',
      selectable: false,
      evented: false,
      visible: false
    });
    canvas.add(cutRect, labelW, labelH);
    cuts.push({rect: cutRect, labelW, labelH});
  } else {
    // For 1D, only add width label
    canvas.add(cutRect, labelW);
    cuts.push({rect: cutRect, labelW, labelH: null});
  }
  updateRemainingWeight();
  saveCutReport('manual', {widthCm, heightCm, color});
}
  const origAddCutHorizontal = addCutHorizontal;
  addCutHorizontal = function() {
    const before = cuts.length;
    origAddCutHorizontal();
    if (cuts.length > before) {
      cuts[cuts.length-1].rect.createdAt = Date.now();
      cuts[cuts.length-1].rect.cutId = generateCutId();
    }
  }
  const origAddCutVertical = addCutVertical;
  addCutVertical = function() {
    const before = cuts.length;
    origAddCutVertical();
    if (cuts.length > before) {
      cuts[cuts.length-1].rect.createdAt = Date.now();
      cuts[cuts.length-1].rect.cutId = generateCutId();
    }
  }
} 

canvas.on('object:modified', function(opt) {
  // Only for cut rects
  const cutIdx = cuts.findIndex(cut => cut.rect === opt.target);
  if (cutIdx === -1) return;
  const cut = cuts[cutIdx];
  const widthPx = cut.rect.width * (cut.rect.scaleX || 1);
  const heightPx = cut.rect.height * (cut.rect.scaleY || 1);
  if (!baseRect) return;
  // Area plat dasar
  const baseLeft = baseRect.left - baseRect.width/2;
  const baseTop = baseRect.top - baseRect.height/2;
  const baseRight = baseLeft + baseRect.width;
  const baseBottom = baseTop + baseRect.height;
  // Exclude this cut from overlap check
  let existingRects = cuts.filter((c, i) => i !== cutIdx).map(cut => ({
    left: cut.rect.left - cut.rect.width/2,
    top: cut.rect.top - cut.rect.height/2,
    width: cut.rect.width,
    height: cut.rect.height
  }));
  // Scan dari atas ke bawah, lalu geser ke kanan
  let found = false;
  let posX, posY;
  outer: for (let x = baseLeft; x <= baseRight - widthPx; x += 5) {
    for (let y = baseTop; y <= baseBottom - heightPx; y += 5) {
      let newRect = { left: x, top: y, width: widthPx, height: heightPx };
      let overlap = existingRects.some(r => isOverlap(r, newRect));
      if (!overlap) {
        posX = x + widthPx/2;
        posY = y + heightPx/2;
        found = true;
        break outer;
      }
    }
  }
  if (found) {
    cut.rect.left = posX;
    cut.rect.top = posY;
    cut.rect.setCoords();
    canvas.requestRenderAll();
    if (minimapVisible) updateMinimap();
  }
}); 

function initMinimap() {
  // Create minimap container
  minimapContainer = document.createElement('div');
  minimapContainer.id = 'minimap-container';
  minimapContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 200px;
    height: 150px;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #333;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    display: none;
    overflow: hidden;
  `;

  // Create minimap canvas
  minimapCanvas = document.createElement('canvas');
  minimapCanvas.width = 200;
  minimapCanvas.height = 150;
  minimapCanvas.style.cssText = `
    width: 100%;
    height: 100%;
    cursor: crosshair;
  `;
  minimapCtx = minimapCanvas.getContext('2d');

  // Create viewport indicator
  viewportIndicator = document.createElement('div');
  viewportIndicator.style.cssText = `
    position: absolute;
    border: 2px solid #ff4444;
    background: rgba(255, 68, 68, 0.2);
    pointer-events: none;
    z-index: 1001;
  `;

  minimapContainer.appendChild(minimapCanvas);
  minimapContainer.appendChild(viewportIndicator);
  document.body.appendChild(minimapContainer);

  // Add click handler for minimap navigation
  minimapCanvas.addEventListener('click', function(e) {
    const rect = minimapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert minimap coordinates to canvas coordinates
    const canvasX = (x / minimapCanvas.width) * canvas.width - canvas.width / 2;
    const canvasY = (y / minimapCanvas.height) * canvas.height - canvas.height / 2;
    
    // Center the view on the clicked position
    canvas.setViewportTransform([1, 0, 0, 1, -canvasX, -canvasY]);
    canvas.requestRenderAll();
    updateMinimap();
  });
}

function showMinimap() {
  if (!minimapContainer) {
    initMinimap();
  }
  minimapContainer.style.display = 'block';
  minimapVisible = true;
  updateMinimap();
}

function hideMinimap() {
  if (minimapContainer) {
    minimapContainer.style.display = 'none';
    minimapVisible = false;
  }
}

function updateMinimap() {
  if (!minimapVisible || !minimapCtx) return;

  const ctx = minimapCtx;
  const width = minimapCanvas.width;
  const height = minimapCanvas.height;

  // Clear minimap
  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Calculate scale factors
  const scaleX = width / canvas.width;
  const scaleY = height / canvas.height;
  const scale = Math.min(scaleX, scaleY);

  // Calculate offset to center the minimap
  const offsetX = (width - canvas.width * scale) / 2;
  const offsetY = (height - canvas.height * scale) / 2;

  // Draw base plate
  if (baseRect) {
    ctx.fillStyle = '#ddd';
    ctx.fillRect(
      offsetX + (baseRect.left - baseRect.width/2) * scale,
      offsetY + (baseRect.top - baseRect.height/2) * scale,
      baseRect.width * scale,
      baseRect.height * scale
    );
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      offsetX + (baseRect.left - baseRect.width/2) * scale,
      offsetY + (baseRect.top - baseRect.height/2) * scale,
      baseRect.width * scale,
      baseRect.height * scale
    );
  }

  // Draw cuts
  cuts.forEach(cut => {
    const cutWidth = cut.rect.width * (cut.rect.scaleX || 1);
    const cutHeight = cut.rect.height * (cut.rect.scaleY || 1);
    
    ctx.fillStyle = cut.color || '#ff6b6b';
    ctx.fillRect(
      offsetX + (cut.rect.left - cutWidth/2) * scale,
      offsetY + (cut.rect.top - cutHeight/2) * scale,
      cutWidth * scale,
      cutHeight * scale
    );
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      offsetX + (cut.rect.left - cutWidth/2) * scale,
      offsetY + (cut.rect.top - cutHeight/2) * scale,
      cutWidth * scale,
      cutHeight * scale
    );
  });

  // Draw viewport indicator
  const vpt = canvas.viewportTransform;
  const viewportLeft = -vpt[4] / vpt[0];
  const viewportTop = -vpt[5] / vpt[3];
  const viewportWidth = canvas.width / vpt[0];
  const viewportHeight = canvas.height / vpt[3];

  viewportIndicator.style.left = (offsetX + viewportLeft * scale) + 'px';
  viewportIndicator.style.top = (offsetY + viewportTop * scale) + 'px';
  viewportIndicator.style.width = (viewportWidth * scale) + 'px';
  viewportIndicator.style.height = (viewportHeight * scale) + 'px';
  }

// Config sidebar toggle functionality
let configCollapsed = false;

function toggleConfig() {
  const configBox = document.getElementById('configBox');
  const toggleBtn = document.getElementById('configToggleBtn');
  const canvasContainer = document.getElementById('canvas-container');
  
  configCollapsed = !configCollapsed;
  
  if (configCollapsed) {
    configBox.classList.add('collapsed');
    toggleBtn.classList.add('collapsed');
    toggleBtn.classList.remove('expanded');
    canvasContainer.classList.add('full-width');
    toggleBtn.innerHTML = '⚙️';
  } else {
    configBox.classList.remove('collapsed');
    toggleBtn.classList.remove('collapsed');
    toggleBtn.classList.add('expanded');
    canvasContainer.classList.remove('full-width');
    toggleBtn.innerHTML = '✕';
  }
  
  // Save state to localStorage
  localStorage.setItem('workshopConfigCollapsed', configCollapsed);
  
  // Resize canvas after animation
  setTimeout(() => {
    resizeCanvas();
    if (minimapVisible) updateMinimap();
  }, 300);
}

// Initialize config state on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedState = localStorage.getItem('workshopConfigCollapsed');
  if (savedState === 'true') {
    configCollapsed = true;
    const configBox = document.getElementById('configBox');
    const toggleBtn = document.getElementById('configToggleBtn');
    const canvasContainer = document.getElementById('canvas-container');
    
    configBox.classList.add('collapsed');
    toggleBtn.classList.add('collapsed');
    canvasContainer.classList.add('full-width');
    toggleBtn.innerHTML = '⚙️';
  }
  
  // Add event listener to toggle button
  const toggleBtn = document.getElementById('configToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleConfig);
  }
}); 

