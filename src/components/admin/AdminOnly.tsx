'use client';

import { useAdmin } from "@/contexts/AdminContext";
import type { ReactNode } from "react";

export default function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return <>{children}</>;
}
