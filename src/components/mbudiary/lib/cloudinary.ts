const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/* =========================================================
   COMPRESS OPTIONS INTERFACE
   ========================================================= */
export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
}

/* =========================================================
   COMPRESS IMAGE (CLIENT-SIDE)
   ========================================================= */

async function compressImage(file: File, options?: CompressOptions): Promise<File> {
  // Setting Default (MbuDiary): Max 1080px, Quality 0.8, Max 250KB
  const maxDim = options?.maxDimension ?? 1080;
  const imgQuality = options?.quality ?? 0.8;
  const maxBytes = options?.maxSizeBytes ?? 250 * 1024;

  // Lewati file non-gambar, SVG, atau GIF animasi agar animasinya tidak rusak
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml'
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      // Jika file asli sudah kecil (<= maxBytes) dan dimensinya sudah aman, lewati kompresi
      if (
        file.size <= maxBytes &&
        width <= maxDim &&
        height <= maxDim
      ) {
        resolve(file);
        return;
      }

      // Resize proporsional berdasarkan maxDim
      if (width > maxDim || height > maxDim) {
        const scale = Math.min(
          maxDim / width,
          maxDim / height
        );
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        resolve(file);
        return;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // Jika hasil WebP lebih besar dari aslinya, gunakan file asli
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '.webp'),
            {
              type: 'image/webp',
              lastModified: Date.now(),
            }
          );

          resolve(compressedFile);
        },
        'image/webp',
        imgQuality
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    image.src = objectUrl;
  });
}

/* =========================================================
   SINGLE IMAGE UPLOAD
   ========================================================= */

export async function uploadImageToCloudinary(file: File, options?: CompressOptions): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Konfigurasi Cloudinary belum tersedia.');
  }

  const compressedFile = await compressImage(file, options);

  console.log(
    `[Cloudinary] ${file.name}: ${(file.size / 1024).toFixed(0)} KB → ${(compressedFile.size / 1024).toFixed(0)} KB`
  );

  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Gagal mengunggah gambar ke Cloudinary.';
    try {
      const errorData = await response.json();
      message = errorData?.error?.message || message;
    } catch {
      // Ignore JSON parsing error
    }
    throw new Error(message);
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error('Cloudinary tidak mengembalikan URL gambar.');
  }

  // Sisipkan optimasi otomatis f_auto,q_auto pada CDN delivery URL
  return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
}

/* =========================================================
   MULTIPLE IMAGE UPLOAD
   ========================================================= */

export async function uploadImagesToCloudinary(files: File[], options?: CompressOptions): Promise<string[]> {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadImageToCloudinary(file, options)));
}