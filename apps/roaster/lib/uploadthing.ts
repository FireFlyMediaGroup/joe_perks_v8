import { generateUploadButton } from "@uploadthing/react";

import type { RoasterFileRouter } from "@/app/api/uploadthing/core";

export const RoasterUploadButton = generateUploadButton<RoasterFileRouter>();
