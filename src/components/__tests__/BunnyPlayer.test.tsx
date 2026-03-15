import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BunnyPlayer from "../BunnyPlayer";

describe("BunnyPlayer", () => {
  it("renders an iframe when videoUrl is provided", () => {
    const url = "https://iframe.mediadelivery.net/embed/12345/abc-def";
    render(<BunnyPlayer videoUrl={url} />);

    const iframe = screen.getByTitle("Video player");
    expect(iframe).toBeDefined();
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe.getAttribute("src")).toBe(url);
  });

  it("renders placeholder when videoUrl is null", () => {
    const { container } = render(
      <BunnyPlayer videoUrl={null} durationLabel="25 דק׳" />
    );

    // No iframe should be present
    expect(container.querySelector("iframe")).toBeNull();
    // Should show the Hebrew "click to watch" text
    expect(screen.getByText("לחצו לצפייה")).toBeDefined();
    // Should show duration label
    expect(screen.getByText("25 דק׳")).toBeDefined();
  });

  it("renders placeholder when videoUrl is undefined", () => {
    const { container } = render(<BunnyPlayer />);

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText("לחצו לצפייה")).toBeDefined();
  });

  it("applies theater mode classes to iframe wrapper", () => {
    const url = "https://iframe.mediadelivery.net/embed/12345/abc-def";
    const { container } = render(
      <BunnyPlayer videoUrl={url} theaterMode={true} />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-black/90");
  });

  it("applies theater mode classes to placeholder wrapper", () => {
    const { container } = render(
      <BunnyPlayer videoUrl={null} theaterMode={true} />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-black/90");
  });

  it("hides duration label in placeholder when not provided", () => {
    render(<BunnyPlayer videoUrl={null} />);

    // "לחצו לצפייה" should be present but no duration
    expect(screen.getByText("לחצו לצפייה")).toBeDefined();
    expect(screen.queryByText(/דק׳/)).toBeNull();
  });

  it("renders placeholder for javascript: URL", () => {
    const { container } = render(
      <BunnyPlayer videoUrl="javascript:alert(1)" />
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText("לחצו לצפייה")).toBeDefined();
  });

  it("renders placeholder for non-Bunny HTTPS URL", () => {
    const { container } = render(
      <BunnyPlayer videoUrl="https://evil.com/embed/12345" />
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText("לחצו לצפייה")).toBeDefined();
  });

  it("renders thumbnail placeholder when thumbnailUrl provided and no videoUrl", () => {
    const { container } = render(
      <BunnyPlayer videoUrl={null} thumbnailUrl="https://example.com/thumb.jpg" durationLabel="10 דק׳" />
    );

    expect(container.querySelector("iframe")).toBeNull();
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("https://example.com/thumb.jpg");
    expect(screen.getByText("לחצו לצפייה")).toBeDefined();
    expect(screen.getByText("10 דק׳")).toBeDefined();
  });
});
