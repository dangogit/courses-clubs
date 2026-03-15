import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AdminProvider, useAdmin } from "../AdminContext";

// ── Mock useUserRole ──

const mockUseUserRole = vi.fn();

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => mockUseUserRole(),
}));

// ── Helpers ──

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AdminProvider, null, children)
    );
  };
}

describe("AdminContext", () => {
  it("isAdminUser is false for member role", () => {
    mockUseUserRole.mockReturnValue({ data: "member" });

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("isAdminUser is true for admin role", () => {
    mockUseUserRole.mockReturnValue({ data: "admin" });

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAdminUser).toBe(true);
    expect(result.current.isAdmin).toBe(false); // not toggled yet
  });

  it("isAdminUser is true for moderator role", () => {
    mockUseUserRole.mockReturnValue({ data: "moderator" });

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAdminUser).toBe(true);
  });

  it("toggleAdmin enables admin mode for admin users", () => {
    mockUseUserRole.mockReturnValue({ data: "admin" });

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAdmin).toBe(false);

    act(() => result.current.toggleAdmin());

    expect(result.current.isAdmin).toBe(true);
  });

  it("toggleAdmin does nothing for non-admin users", () => {
    mockUseUserRole.mockReturnValue({ data: "member" });

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.toggleAdmin());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAdminUser).toBe(false);
  });

  it("isAdminUser is false when role data is undefined (loading)", () => {
    mockUseUserRole.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useAdmin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });
});
