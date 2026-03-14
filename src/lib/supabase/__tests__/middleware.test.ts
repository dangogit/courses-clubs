import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

// Must import after mock setup
const { updateSession } = await import("../middleware");

function makeRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authenticated users", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      });
    });

    it("allows access to protected routes", async () => {
      const response = await updateSession(makeRequest("/courses"));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("allows access to public routes", async () => {
      const response = await updateSession(makeRequest("/login"));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });

  describe("unauthenticated users", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "No session" },
      });
    });

    it("redirects to /login from protected routes", async () => {
      const response = await updateSession(makeRequest("/courses"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?next=%2Fcourses"
      );
    });

    it("includes nested path in next param", async () => {
      const response = await updateSession(
        makeRequest("/courses/123/lesson/456")
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain(
        "next=%2Fcourses%2F123%2Flesson%2F456"
      );
    });

    it("does not redirect on / (public)", async () => {
      const response = await updateSession(makeRequest("/"));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("does not redirect on /login (public)", async () => {
      const response = await updateSession(makeRequest("/login"));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("does not redirect on /auth/callback (public)", async () => {
      const response = await updateSession(makeRequest("/auth/callback"));

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("redirects from /profile (protected)", async () => {
      const response = await updateSession(makeRequest("/profile"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("redirects from /settings (protected)", async () => {
      const response = await updateSession(makeRequest("/settings"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
    });

    it("preserves query string in next param", async () => {
      const response = await updateSession(
        makeRequest("/courses?filter=ai&page=2")
      );

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/login?next=%2Fcourses%3Ffilter%3Dai%26page%3D2"
      );
    });

    it("redirects from /login/admin (not in public list)", async () => {
      const response = await updateSession(makeRequest("/login/admin"));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login?next=");
    });
  });
});
