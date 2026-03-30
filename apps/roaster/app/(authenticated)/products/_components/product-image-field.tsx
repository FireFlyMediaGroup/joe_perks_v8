"use client";

import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { useId, useState } from "react";

import { RoasterUploadButton } from "@/lib/uploadthing";

interface ProductImageFieldProps {
  readonly imageUrl: string;
  readonly onImageUrlChange: (url: string) => void;
  readonly uploadThingEnabled: boolean;
}

export function ProductImageField({
  imageUrl,
  onImageUrlChange,
  uploadThingEnabled,
}: ProductImageFieldProps) {
  const urlInputId = useId();
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={urlInputId}>Product image</Label>
      {uploadThingEnabled ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <RoasterUploadButton
              endpoint="productImage"
              onClientUploadComplete={(res) => {
                setUploadError(null);
                const first = res[0];
                const url =
                  first &&
                  typeof first === "object" &&
                  "url" in first &&
                  typeof first.url === "string"
                    ? first.url
                    : undefined;
                if (url) {
                  onImageUrlChange(url);
                }
              }}
              onUploadError={(err) => {
                setUploadError(err.message);
              }}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <Input
              id={urlInputId}
              inputMode="url"
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder="Or paste image URL (https://…)"
              type="url"
              value={imageUrl}
            />
            <p className="text-muted-foreground text-xs">
              JPEG, PNG, or WebP up to 4&nbsp;MB. Upload or paste a URL.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Input
            id={urlInputId}
            inputMode="url"
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder="https://…"
            type="url"
            value={imageUrl}
          />
          <p className="text-muted-foreground text-xs">
            Optional direct URL. Set{" "}
            <code className="font-mono text-[0.8rem]">UPLOADTHING_TOKEN</code>{" "}
            in the roaster environment to enable uploads.
          </p>
        </>
      )}
      {uploadError ? (
        <p className="text-destructive text-sm" role="alert">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}
