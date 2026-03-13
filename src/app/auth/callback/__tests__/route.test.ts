import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    })
  ),
}));

function makeRequest(url: string) {
  return new Request(url);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exchanges code and redirects to / on success", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      makeRequest("http://localhost:3000/auth/callback?code=valid-code")
    );

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("respects the next query parameter for redirect target", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      makeRequest(
        "http://localhost:3000/auth/callback?code=valid-code&next=/courses/1"
      )
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/courses/1"
    );
  });

  it("redirects to /login with error when code is missing", async () => {
    const response = await GET(
      makeRequest("http://localhost:3000/auth/callback")
    );

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/login?error=");
  });

  it("redirects to /login with error when exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid code" },
    });

    const response = await GET(
      makeRequest("http://localhost:3000/auth/callback?code=bad-code")
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location")!;
    expect(location).toContain("/login?error=");
  });
});
