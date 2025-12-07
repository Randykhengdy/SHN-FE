import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

export default function PageHeader({
  title,
  backText = "Kembali",
  saveText = "Simpan",
  onBack,
  onSave,
  saving = false,
  className = ""
}) {
  return (
    <div className={`mb-6 flex items-center justify-between ${className}`}>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {backText}
          </Button>
        )}
        {onSave && (
          <Button onClick={onSave} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : saveText}
          </Button>
        )}
      </div>
    </div>
  );
}
