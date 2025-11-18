import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders heading", () => {
    render(<HomePage />);
    // Main brutalist title
    expect(screen.getByText(/HERMES/)).toBeInTheDocument();
    // Subtitle/tagline
    expect(screen.getByText(/URL COMPRESSION TERMINAL/i)).toBeInTheDocument();
  });
});
