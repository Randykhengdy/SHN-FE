import React, { useState, useEffect } from "react";
import WorkshopControlPanel from "@/components/workshop/WorkshopControlPanel";
import WorkshopCanvas from "@/components/workshop/WorkshopCanvas";
import ShapeTypeModal from "@/components/workshop/ShapeTypeModal";

export default function WorkshopPage() {
  const [shapeType, setShapeType] = useState(null); // '1D' | '2D'
  const [hasBase, setHasBase] = useState(false)
  const [basePlate, setBasePlate] = useState({
    width: 300,
    height: 150,
    weight: 0,
    color: "#555555",
  });
  const [cuts, setCuts] = useState([]);
  const [remainingWeight, setRemainingWeight] = useState(0);
  const [showShapeTypeModal, setShowShapeTypeModal] = useState(true);

  // tampilkan modal pilih shape di load pertama
  useEffect(() => {
    setShowShapeTypeModal(true);
  }, []);

  // helper: hitung berat sisa
  const recomputeRemaining = (nextCuts) => {
    const weight = parseFloat(basePlate.weight) || 0;
    if (!weight) return setRemainingWeight(0);

    if (shapeType === "1D") {
      const used = nextCuts.reduce((acc, c) => acc + ((c.width || 0) / (basePlate.width || 1)) * weight, 0);
      setRemainingWeight(Math.max(weight - used, 0));
    } else {
      const baseArea = (basePlate.width || 0) * (basePlate.height || 0) || 1;
      const used = nextCuts.reduce((acc, c) => {
        const h = c.height || 0;
        return acc + ((c.width || 0) * h) / baseArea * weight;
      }, 0);
      setRemainingWeight(Math.max(weight - used, 0));
    }
  };

  // reset potongan saat Create Base
  const handleCreateBase = () => {
    setCuts([]);
    setHasBase(true);                                     // ⬅️ NEW
    setRemainingWeight(parseFloat(basePlate.weight) || 0);
  };

  // fungsi scan tempat kosong agar tidak tumpuk
  const packCut = (newCutCm, existingCuts) => {
    const SCALE = 5;
    const PAD = 10;
    const step = 5; // px

    const baseWpx = (basePlate.width || 0) * SCALE;
    const baseHpx = (shapeType === "1D" ? (basePlate.height || 10) : (basePlate.height || 0)) * SCALE;

    const w = (newCutCm.width || 0) * SCALE;
    const h = ((shapeType === "1D" ? basePlate.height : newCutCm.height) || 0) * SCALE;

    const minX = PAD, minY = PAD;
    const maxX = PAD + baseWpx - w;
    const maxY = PAD + baseHpx - h;

    // overlap check helper
    const overlaps = (x, y) => {
      return existingCuts.some((c) => {
        const cw = (c.width || 0) * SCALE;
        const ch = ((shapeType === "1D" ? basePlate.height : c.height) || 0) * SCALE;
        const cx = c.x ?? PAD;
        const cy = c.y ?? PAD;
        return !(x + w <= cx || cx + cw <= x || y + h <= cy || cy + ch <= y);
      });
    };

    for (let yy = minY; yy <= maxY; yy += step) {
      for (let xx = minX; xx <= maxX; xx += step) {
        if (!overlaps(xx, yy)) {
          return { x: xx, y: yy };
        }
      }
    }
    return null; // tidak ada ruang
  };

  const handleAddCut = (cutInput) => {
    // lengkapi height untuk 1D
    if (!hasBase) {                                       // ⬅️ NEW
      alert("Buat base terlebih dahulu (Create Base).");
      return;
    }
    const normalized = {
      width: Number(cutInput.width || 0),
      height: shapeType === "1D" ? basePlate.height : Number(cutInput.height || 0),
      color: cutInput.color || "#ff9900",
    };

    const pos = packCut(normalized, cuts);
    if (!pos) {
      alert("Tidak ada ruang kosong yang cukup di plat dasar!");
      return;
    }

    const nextCuts = [...cuts, { ...normalized, ...pos }];
    setCuts(nextCuts);
    recomputeRemaining(nextCuts);
  };

  // load/save simple (opsional nanti kita sesuaikan)
  const onSaveProgress = () => {
    localStorage.setItem(
      "workshopProgress",
      JSON.stringify({ shapeType, basePlate, cuts, remainingWeight })
    );
    alert("Progress disimpan!");
  };
  

  const onLoadProgress = () => {
    const raw = localStorage.getItem("workshopProgress");
    if (!raw) return alert("Tidak ada data tersimpan");
    try {
      const parsed = JSON.parse(raw);
      setShapeType(parsed.shapeType || "2D");
      setBasePlate(parsed.basePlate || basePlate);
      setCuts(parsed.cuts || []);
      setRemainingWeight(parsed.remainingWeight || 0);
    } catch {
      alert("Gagal memuat data.");
    }
  };

  // belum implement download PDF di step ini
  const onDownloadPDF = () => alert("Download PDF akan kita aktifkan setelah migrasi stabil.");

  // saat pilih shape di modal, JANGAN auto-create base
  if (!shapeType) {
    return (
      <ShapeTypeModal
        isOpen={showShapeTypeModal}
        onSelect={(t) => {
          setShapeType(t);
          setShowShapeTypeModal(false);
          setHasBase(false);                              // ⬅️ pastikan base belum ada
          setBasePlate((prev) => ({
            ...prev,
            width: t === "1D" ? 100 : 300,
            height: t === "1D" ? 10 : 150,
          }));
          setCuts([]);                                    // bersihkan potongan lama
          setRemainingWeight(0);
        }}
        onClose={() => setShowShapeTypeModal(false)}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-1rem)] p-4 gap-4">
      <WorkshopControlPanel
        basePlate={basePlate}
        setBasePlate={setBasePlate}
        onCreateBase={handleCreateBase}
        onAddCut={handleAddCut}
        onSaveProgress={onSaveProgress}
        onLoadProgress={onLoadProgress}
        onDownloadPDF={onDownloadPDF}
        onShowLayers={() => alert(`Jumlah potongan: ${cuts.length}`)}
        hasBase={hasBase}                                  // ⬅️ pass state
        remainingWeight={remainingWeight.toFixed(2)}
      />
      <WorkshopCanvas
        shapeType={shapeType}
        basePlate={basePlate}
        cuts={cuts}
        hasBase={hasBase}                                  // ⬅️ pass state
      />
    </div>
  );
}
