import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const roasterFileRouter = {
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) {
        throw new UploadThingError("You must be signed in to upload.");
      }

      const user = await database.user.findUnique({
        where: { externalAuthId: userId },
        select: { roasterId: true },
      });

      if (!user?.roasterId) {
        throw new UploadThingError(
          "No roaster profile linked. Complete onboarding first."
        );
      }

      return { roasterId: user.roasterId };
    })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type RoasterFileRouter = typeof roasterFileRouter;
