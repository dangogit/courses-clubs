'use client';

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

interface EditableImageProps {
  src: string;
  alt: string;
  onChange: (newSrc: string) => void;
  className?: string;
  imgClassName?: string;
}

export default function EditableImage({ src, alt, onChange, className, imgClassName }: EditableImageProps) {
  const { isAdmin } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(URL.createObjectURL(file));
  };

  return (
    <div className={cn("relative group/img", className)}>
      <img src={src} alt={alt} className={imgClassName} />
      {isAdmin && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click(); }}
            className="absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="bg-background/90 rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-bold shadow-lg">
              <ImagePlus className="h-4 w-4 text-primary" />
              שנה תמונה
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}
