import { describe, expect, it } from "vitest";

import { extractUploadedImageUrl } from "./uploadthing-url";

describe("extractUploadedImageUrl", () => {
  it("prefers ufsUrl from the upload response", () => {
    expect(
      extractUploadedImageUrl({
        ufsUrl: "https://utfs.io/f/abc123",
        url: "https://legacy.example/old",
      })
    ).toBe("https://utfs.io/f/abc123");
  });

  it("reads url from onUploadComplete serverData", () => {
    expect(
      extractUploadedImageUrl({
        serverData: { url: "https://abc123.ufs.sh/file.jpg" },
      })
    ).toBe("https://abc123.ufs.sh/file.jpg");
  });
});
