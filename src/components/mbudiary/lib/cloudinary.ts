const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function uploadImageToCloudinary(
  file: File
): Promise<string> {
  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_UPLOAD_PRESET
  ) {
    throw new Error(
      'Konfigurasi Cloudinary belum tersedia.'
    );
  }

  const formData = new FormData();

  formData.append('file', file);
  formData.append(
    'upload_preset',
    CLOUDINARY_UPLOAD_PRESET
  );

  const response = await fetch(
    CLOUDINARY_UPLOAD_URL,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    let message =
      'Gagal mengunggah gambar ke Cloudinary.';

    try {
      const errorData =
        await response.json();

      message =
        errorData?.error?.message ||
        message;
    } catch {
      // Ignore JSON parsing error.
    }

    throw new Error(message);
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error(
      'Cloudinary tidak mengembalikan URL gambar.'
    );
  }

  return data.secure_url;
}

export async function uploadImagesToCloudinary(
  files: File[]
): Promise<string[]> {
  if (!files.length) {
    return [];
  }

  return Promise.all(
    files.map((file) =>
      uploadImageToCloudinary(file)
    )
  );
}