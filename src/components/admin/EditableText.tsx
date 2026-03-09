'use client';

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  multiline?: boolean;
}

export default function EditableText({ value, onChange, className, as: Tag = "span", multiline = false }: EditableTextProps) {
  const { isAdmin } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (!isAdmin) return <Tag className={className}>{value}</Tag>;

  if (editing) {
    const shared = {
      ref: inputRef as any,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: () => { onChange(draft); setEditing(false); },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) { onChange(draft); setEditing(false); }
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      },
      className: cn("bg-background border border-primary/40 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/30 w-full", className),
      dir: "auto" as const,
    };
    return multiline
      ? <textarea {...shared} rows={3} />
      : <input {...shared} />;
  }

  return (
    <Tag
      className={cn("relative group/edit cursor-pointer border border-dashed border-transparent hover:border-primary/40 rounded-lg px-1 -mx-1 transition-all", className)}
      onClick={() => setEditing(true)}
    >
      {value}
      <Pencil className="inline-block h-3 w-3 mr-1.5 text-primary opacity-0 group-hover/edit:opacity-100 transition-opacity" />
    </Tag>
  );
}
