'use client';

import { useState, useRef, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Heading2, Link2, Undo, Pencil, X, Check } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  html: string;
  onChange: (html: string) => void;
  className?: string;
}

const TOOLBAR_BUTTONS = [
  { command: "bold", icon: Bold, label: "מודגש" },
  { command: "italic", icon: Italic, label: "נטוי" },
  { command: "insertUnorderedList", icon: List, label: "רשימה" },
  { command: "insertOrderedList", icon: ListOrdered, label: "רשימה ממוספרת" },
  { command: "formatBlock:h3", icon: Heading2, label: "כותרת" },
] as const;

function sanitizeHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  // Remove script tags and event handlers
  div.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  div.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    });
  });
  return div.innerHTML;
}

export default function RichTextEditor({ html, onChange, className }: RichTextEditorProps) {
  const { isAdmin } = useAdmin();
  const [editing, setEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const originalHtml = useRef(html);

  const exec = useCallback((command: string) => {
    if (command.startsWith("formatBlock:")) {
      document.execCommand("formatBlock", false, command.split(":")[1]);
    } else {
      document.execCommand(command, false);
    }
    editorRef.current?.focus();
  }, []);

  const handleLink = useCallback(() => {
    const url = prompt("הזינו כתובת URL:");
    if (url && /^https?:\/\/.+/.test(url)) {
      document.execCommand("createLink", false, url);
      editorRef.current?.focus();
    }
  }, []);

  const save = useCallback(() => {
    if (editorRef.current) {
      const sanitized = sanitizeHtml(editorRef.current.innerHTML);
      onChange(sanitized);
    }
    setEditing(false);
  }, [onChange]);

  const cancel = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = originalHtml.current;
    }
    setEditing(false);
  }, []);

  const startEditing = useCallback(() => {
    originalHtml.current = html;
    setEditing(true);
  }, [html]);

  // Non-admin: render as static HTML
  if (!isAdmin) {
    return (
      <div
        className={cn("prose prose-sm max-w-none text-sm leading-relaxed", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Admin, not editing: show with edit button
  if (!editing) {
    return (
      <div className="relative group/rte">
        <div
          className={cn(
            "prose prose-sm max-w-none text-sm leading-relaxed cursor-pointer border border-dashed border-transparent hover:border-primary/40 rounded-lg p-1 -m-1 transition-all",
            className
          )}
          dangerouslySetInnerHTML={{ __html: html }}
          onClick={startEditing}
        />
        <button
          onClick={startEditing}
          className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-1.5 opacity-0 group-hover/rte:opacity-100 transition-opacity shadow-lg"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Admin, editing: show toolbar + contentEditable
  return (
    <div className="border border-primary/40 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 bg-muted/50 border-b border-border/50 flex-wrap">
        {TOOLBAR_BUTTONS.map(({ command, icon: Icon, label }) => (
          <button
            key={command}
            type="button"
            onClick={() => exec(command)}
            title={label}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <button
          type="button"
          onClick={handleLink}
          title="הוסף קישור"
          className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => document.execCommand("undo")}
          title="בטל"
          className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Undo className="h-3.5 w-3.5" />
        </button>

        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={cancel} className="h-7 px-2 text-xs gap-1">
          <X className="h-3 w-3" /> ביטול
        </Button>
        <Button size="sm" onClick={save} className="h-7 px-2 text-xs gap-1">
          <Check className="h-3 w-3" /> שמור
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        dir="auto"
        dangerouslySetInnerHTML={{ __html: html }}
        className={cn(
          "prose prose-sm max-w-none text-sm leading-relaxed p-4 min-h-[120px] outline-none focus:ring-0",
          "[&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside",
          "[&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2",
          "[&_a]:text-primary [&_a]:underline",
          className
        )}
      />
    </div>
  );
}
