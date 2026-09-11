import { prisma } from "@/lib/db";
import crypto from "crypto";

// In-memory fallback / quick LRU cache for ultra-fast serving
const memoryCache = new Map<string, { buffer: Buffer; mimeType: string; createdAt: number }>();

/**
 * Clean up old memory cache entries (> 2 hours old)
 */
function sweepMemoryCache() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, item] of memoryCache.entries()) {
    if (item.createdAt < cutoff) {
      memoryCache.delete(id);
    }
  }
}

/**
 * Save a temporary image buffer to storage (Prisma DB + In-Memory cache).
 * Returns the unique temporary image ID.
 */
export async function saveTempImage(
  buffer: Buffer,
  mimeType: string = "image/png"
): Promise<string> {
  const id = `temp-img-${crypto.randomUUID()}`;
  
  // 1. Put in memory cache for immediate same-instance access
  memoryCache.set(id, {
    buffer,
    mimeType,
    createdAt: Date.now(),
  });

  // 2. Persist to PostgreSQL if available
  try {
    if (prisma && (prisma as any).tempImage) {
      await (prisma as any).tempImage.create({
        data: {
          id,
          data: buffer,
          mimeType,
        },
      });
    }
  } catch (err) {
    console.warn("[TempImageStore] DB persist warning (using memory store fallback):", err);
  }

  // Periodic memory sweep
  if (Math.random() < 0.05) {
    sweepMemoryCache();
  }

  return id;
}

/**
 * Retrieve a temporary image by ID.
 */
export async function getTempImage(
  id: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // 1. Check in-memory cache
  const cached = memoryCache.get(id);
  if (cached) {
    return { buffer: cached.buffer, mimeType: cached.mimeType };
  }

  // 2. Lookup in PostgreSQL
  try {
    if (prisma && (prisma as any).tempImage) {
      const record = await (prisma as any).tempImage.findUnique({
        where: { id },
      });
      if (record) {
        const buffer = Buffer.from(record.data);
        // Re-populate memory cache
        memoryCache.set(id, { buffer, mimeType: record.mimeType, createdAt: Date.now() });
        return { buffer, mimeType: record.mimeType };
      }
    }
  } catch (err) {
    console.warn("[TempImageStore] DB lookup error:", err);
  }

  return null;
}

/**
 * Delete a temporary image by ID.
 */
export async function deleteTempImage(id: string): Promise<void> {
  memoryCache.delete(id);
  try {
    if (prisma && (prisma as any).tempImage) {
      await (prisma as any).tempImage.delete({
        where: { id },
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Delete multiple temporary images by IDs.
 */
export async function deleteTempImages(ids: string[]): Promise<void> {
  for (const id of ids) {
    memoryCache.delete(id);
  }
  try {
    if (prisma && (prisma as any).tempImage) {
      await (prisma as any).tempImage.deleteMany({
        where: { id: { in: ids } },
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Purge all temporary images older than 2 hours.
 */
export async function purgeExpiredTempImages(): Promise<void> {
  sweepMemoryCache();
  try {
    if (prisma && (prisma as any).tempImage) {
      const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await (prisma as any).tempImage.deleteMany({
        where: { createdAt: { lt: cutoff } },
      }).catch(() => {});
    }
  } catch {}
}

import { uploadBase64ToCloudinary, uploadBufferToCloudinary } from "./cloudinary";
import cloudinary from "./cloudinary";

/**
 * Resolves all temporary image references in question records,
 * deduplicates unique assets, uploads each unique asset once to Cloudinary,
 * replaces references with permanent Cloudinary HTTPS URLs, and cleans up temp records.
 */
export async function resolveAndUploadQuestionImages(questions: any[]): Promise<any[]> {
  if (!Array.isArray(questions) || questions.length === 0) return questions;

  const tempIdMap = new Map<string, string>();
  const uniqueTempUrls = new Set<string>();

  // 1. Collect all unique temporary image references
  for (const q of questions) {
    const urls = [q.imageUrl, ...(q.images || [])].filter(Boolean) as string[];
    for (const u of urls) {
      if (
        typeof u === "string" &&
        (u.includes("/api/temp-images/") || u.startsWith("temp-img-") || u.startsWith("data:image/"))
      ) {
        uniqueTempUrls.add(u);
      }
    }
  }

  // 2. Upload unique images to Cloudinary (with safe fallback)
  const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (isCloudinaryConfigured) {
    for (const tempUrl of uniqueTempUrls) {
      try {
        if (tempUrl.startsWith("data:image/")) {
          const publicId = `assessment_img_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
          const cUrl = await uploadBase64ToCloudinary(tempUrl, "achariya-online-exam-portal", publicId);
          tempIdMap.set(tempUrl, cUrl);
        } else {
          const tempId = tempUrl.split("/").pop()!;
          const tempFile = await getTempImage(tempId);
          if (tempFile && tempFile.buffer) {
            const publicId = `assessment_img_${Date.now()}_${tempId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
            const cUrl = await uploadBufferToCloudinary(tempFile.buffer, "achariya-online-exam-portal", publicId);
            tempIdMap.set(tempUrl, cUrl);
          }
        }
      } catch (uploadErr: any) {
        console.warn("[TempImageStore] Cloudinary upload notice (retaining original):", uploadErr?.message || uploadErr);
      }
    }
  } else {
    console.info("[TempImageStore] Cloudinary not configured in environment, retaining direct image references.");
  }

  // 3. Update questions with permanent Cloudinary URLs
  const updatedQuestions = questions.map((q) => {
    let newImageUrl = q.imageUrl;
    if (q.imageUrl && tempIdMap.has(q.imageUrl)) {
      newImageUrl = tempIdMap.get(q.imageUrl)!;
    }

    const newImages = (q.images || []).map((imgUrl: string) =>
      tempIdMap.has(imgUrl) ? tempIdMap.get(imgUrl)! : imgUrl
    );

    const { imagePending, imageGenerating, requiresReview, ...rest } = q;
    return {
      ...rest,
      imageUrl: newImageUrl || newImages[0] || undefined,
      images: newImages,
    };
  });

  // 4. Cleanup temporary records
  const tempIdsToDelete = Array.from(uniqueTempUrls)
    .filter((u) => u.includes("/api/temp-images/") || u.startsWith("temp-img-"))
    .map((u) => u.split("/").pop()!);
  if (tempIdsToDelete.length > 0) {
    await deleteTempImages(tempIdsToDelete).catch(() => {});
  }

  return updatedQuestions;
}

