import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "../src/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the provided label", () => {
    render(<StatusBadge label="React island ready" />);

    expect(screen.getByText("React island ready")).toBeInTheDocument();
  });
});
