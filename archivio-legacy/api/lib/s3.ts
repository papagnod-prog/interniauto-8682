import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

/** Salva un file su Tigris e restituisce il percorso pubblico servito da /api/media/... */
export async function putMedia(key: string, body: Uint8Array, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `/api/media/${key}`;
}

export async function getMedia(key: string) {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
  const bytes = await res.Body?.transformToByteArray();
  return bytes ? { bytes, contentType: res.ContentType ?? "application/octet-stream" } : null;
}
