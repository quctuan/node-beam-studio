import { expect, test } from "vitest";
import { beamWorkspaceContrastColor } from "./beam-workspace";

test("workspace dots remain legible across custom fills and editor themes", () => {
  for (const color of ["#F6F7F8", "#FFFFFF", "#00FF00", "#FFFF00"]) {
    expect(beamWorkspaceContrastColor(color, "dark")).toBe("#000000");
    expect(beamWorkspaceContrastColor(color, "light")).toBeUndefined();
  }
  for (const color of ["#17191F", "#000000", "#0000FF", "#700033"]) {
    expect(beamWorkspaceContrastColor(color, "light")).toBe("#FFFFFF");
    expect(beamWorkspaceContrastColor(color, "dark")).toBeUndefined();
  }
});
