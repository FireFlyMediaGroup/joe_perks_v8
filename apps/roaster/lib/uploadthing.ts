import { generateUploadButton } from "@uploadthing/react";
import type { ReactElement } from "react";

import type { RoasterFileRouter } from "@/app/api/uploadthing/core";

export interface RoasterUploadButtonProps {
  endpoint: "productImage";
  onClientUploadComplete?: (
    res: Array<{
      url?: string;
    }>
  ) => void;
  onUploadError?: (err: Error) => void;
}

const renderUploadButton =
  generateUploadButton<RoasterFileRouter>() as unknown as (
    props: RoasterUploadButtonProps
  ) => ReactElement;

export function RoasterUploadButton(props: RoasterUploadButtonProps) {
  return renderUploadButton(props);
}
