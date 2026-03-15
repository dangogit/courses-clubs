import { createContext, useContext, useState, type ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";

interface AdminContextType {
  /** True when admin mode is active (user is admin AND has toggled editing on) */
  isAdmin: boolean;
  /** True when the user's DB role is admin or moderator */
  isAdminUser: boolean;
  toggleAdmin: () => void;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  isAdminUser: false,
  toggleAdmin: () => {},
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { data: role } = useUserRole();
  const isAdminUser = role === "admin" || role === "moderator";
  const [adminMode, setAdminMode] = useState(false);

  return (
    <AdminContext.Provider
      value={{
        isAdmin: isAdminUser && adminMode,
        isAdminUser,
        toggleAdmin: () => {
          if (isAdminUser) setAdminMode((v) => !v);
        },
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
