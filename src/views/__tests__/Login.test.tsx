import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "../Login";

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...rest} data-priority={priority ? "true" : undefined} />;
  },
}));

// Mock Supabase client
const mockSignInWithOAuth = vi.fn();
const mockSignInWithOtp = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

// Mock Sonner toast
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

describe("Login view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("error");
    mockSearchParams.delete("next");
  });

  it("renders club logo and name", () => {
    render(<LoginForm />);

    expect(screen.getByAltText("Brainers Club")).toBeInTheDocument();
    expect(screen.getByText("Brainers Club")).toBeInTheDocument();
  });

  it("renders Google OAuth button", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("button", { name: /google/i })
    ).toBeInTheDocument();
  });

  it("renders Magic Link email form", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("אימייל")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /שלח קישור התחברות/ })
    ).toBeInTheDocument();
  });

  it("shows error toast when URL has error param", () => {
    mockSearchParams.set("error", "ההתחברות נכשלה");

    render(<LoginForm />);

    expect(mockToastError).toHaveBeenCalledWith("שגיאה", {
      description: "ההתחברות נכשלה",
    });
  });

  it("calls signInWithOAuth on Google button click", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expect.stringContaining("/auth/callback"),
        },
      });
    });
  });

  it("shows error toast when Google login fails", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      error: { message: "Provider not configured" },
    });

    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("שגיאה בהתחברות", {
        description: "Provider not configured",
      });
    });
  });

  it("calls signInWithOtp on magic link form submit", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("אימייל"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /שלח קישור התחברות/ })
    );

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          emailRedirectTo: expect.stringContaining("/auth/callback"),
        },
      });
    });
  });

  it("shows success message after magic link sent", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("אימייל"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /שלח קישור התחברות/ })
    );

    await waitFor(() => {
      expect(screen.getByText("שלחנו קישור התחברות")).toBeInTheDocument();
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("הקישור נשלח!", {
      description: "בדקו את תיבת המייל שלכם",
    });
  });

  it("shows error toast when magic link fails", async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("אימייל"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /שלח קישור התחברות/ })
    );

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("שגיאה בשליחת קישור", {
        description: "Rate limit exceeded",
      });
    });
  });

  it("shows send again button after magic link sent", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("אימייל"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /שלח קישור התחברות/ })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "שלח שוב" })
      ).toBeInTheDocument();
    });
  });

  it("email input has autoComplete attribute", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("אימייל")).toHaveAttribute(
      "autocomplete",
      "email"
    );
  });

  it("forwards next param in Google OAuth redirectTo", async () => {
    mockSearchParams.set("next", "/courses/1");
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expect.stringContaining(
            "/auth/callback?next=%2Fcourses%2F1"
          ),
        },
      });
    });
  });

  it("forwards next param in magic link emailRedirectTo", async () => {
    mockSearchParams.set("next", "/courses/1");
    mockSignInWithOtp.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("אימייל"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /שלח קישור התחברות/ })
    );

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: {
          emailRedirectTo: expect.stringContaining(
            "/auth/callback?next=%2Fcourses%2F1"
          ),
        },
      });
    });
  });

  it("uses plain callback URL when no next param", async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expect.stringMatching(/\/auth\/callback$/),
        },
      });
    });
  });
});
