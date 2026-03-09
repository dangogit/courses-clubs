'use client';

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface Field {
  key: string;
  label: string;
  placeholder?: string;
}

interface AddItemDialogProps {
  title: string;
  fields: Field[];
  onAdd: (values: Record<string, string>) => void;
  trigger?: ReactNode;
}

export default function AddItemDialog({ title, fields, onAdd, trigger }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(values);
    setValues({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) ?? (
            <Button size="sm" className="gap-1.5 rounded-full gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4" /> {title}
            </Button>
          )
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <Input
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                dir="auto"
              />
            </div>
          ))}
          <Button type="submit" className="w-full rounded-full">הוסף</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
