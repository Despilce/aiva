import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure upload settings
const uploadConfig = {
  resource_type: "auto",
  allowed_formats: ["jpg", "jpeg", "png", "gif"],
  transformation: [
    { quality: "auto:good" }, // Automatically optimize quality
    { fetch_format: "auto" }, // Automatically choose best format
    { flags: "preserve_transparency" },
  ],
  max_bytes: 10 * 1024 * 1024, // 10MB limit
};

// Wrapper function for uploading with our custom config
export const uploadImage = (imageString) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(imageString, uploadConfig, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

export { cloudinary };
