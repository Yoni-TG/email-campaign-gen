import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, checkUploadSize } from "./uploads";

function withSize(size: number): File {
  const f = new File([], "x.png", { type: "image/png" });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

describe("checkUploadSize", () => {
  it("returns null at exactly the limit", () => {
    expect(checkUploadSize(withSize(MAX_UPLOAD_BYTES))).toBeNull();
  });

  it("returns null below the limit", () => {
    expect(checkUploadSize(withSize(1024))).toBeNull();
  });

  it("returns a sized error message above the limit", () => {
    const msg = checkUploadSize(withSize(MAX_UPLOAD_BYTES + 1));
    expect(msg).toMatch(/Max 10 MB/);
    expect(msg).toMatch(/File too large/);
  });

  it("formats the actual size in the error message", () => {
    const msg = checkUploadSize(withSize(15 * 1024 * 1024));
    expect(msg).toMatch(/15\.0 MB/);
  });
});
