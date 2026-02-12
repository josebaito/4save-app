import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const f = createUploadthing();

const auth = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UploadThingError('Unauthorized');
  }
  return { userId: session.user.id, role: session.user.type };
};

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '8MB', maxFileCount: 10 } })
    .middleware(async () => auth())
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  videoUploader: f({ video: { maxFileSize: '128MB', maxFileCount: 5 } })
    .middleware(async () => auth())
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
