import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 data URL or a raw base64 string to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadBase64ToCloudinary(
  base64Data: string,
  folder: string = "achariya-online-exam-portal",
  publicId?: string
): Promise<string> {
  // Normalise: ensure it's a proper data URL for Cloudinary
  const dataUri = base64Data.startsWith("data:")
    ? base64Data
    : `data:image/png;base64,${base64Data}`;

  const options: Record<string, unknown> = {
    folder,
    resource_type: "image",
  };
  if (publicId) options.public_id = publicId;

  const result = await cloudinary.uploader.upload(dataUri, options);
  return result.secure_url;
}

/**
 * Upload a Buffer to Cloudinary.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string = "achariya-online-exam-portal",
  publicId?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: "image",
    };
    if (publicId) options.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export default cloudinary;
