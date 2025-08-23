import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MasterFormModal({
  isOpen,
  onClose,
  editData,
  fields,
  title,
  onSave,
}) {
  const [form, setForm] = useState({});
  const [options, setOptions] = useState({});

  useEffect(() => {
    const loadOptions = async () => {
      const newOptions = {};
      for (const field of fields) {
        if (field.type === "select" && field.optionsService) {
          const res = await field.optionsService.getAll();
          newOptions[field.name] = res.data;
        }
      }
      setOptions(newOptions);
    };
    loadOptions();
  }, [fields]);

  useEffect(() => {
    const initialForm = {};
    fields.forEach((field) => {
      initialForm[field.name] = editData ? editData[field.name] || "" : "";
    });
    setForm(initialForm);
  }, [editData, fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field.name} className="text-right">
                {field.label}
              </Label>

              {field.type === "select" ? (
                <Select
                  value={form[field.name] || ""}
                  onValueChange={(value) => handleSelectChange(field.name, value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={`Pilih ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options[field.name]?.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={String(option.id)}
                      >
                        {option[field.optionLabel || "name"]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type || "text"}
                  value={form[field.name] || ""}
                  onChange={handleChange}
                  className="col-span-3"
                  required
                />
              )}
            </div>
          ))}

          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">{editData ? "Update" : "Simpan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
