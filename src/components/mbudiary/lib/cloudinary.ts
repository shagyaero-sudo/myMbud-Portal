const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/* =========================================================
   IMAGE COMPRESSION SETTINGS
   ========================================================= */

const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.8;

/* =========================================================
   COMPRESS IMAGE
   ========================================================= */

async function compressImage(
  file: File
): Promise<File> {
  /*
   * Hanya proses file gambar.
   * Kalau bukan gambar, langsung kembalikan file asli.
   */
  if (!file.type.startsWith('image/')) {
    return file;
  }

  /*
   * Jangan melakukan compression kalau file
   * sudah cukup kecil.
   */
  if (
    file.size <=
    1.5 * 1024 * 1024
  ) {
    return file;
  }

  return new Promise(
    (resolve) => {
      const image =
        new Image();

      const objectUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        let width =
          image.naturalWidth;

        let height =
          image.naturalHeight;

        /*
         * Jangan upscale gambar kecil.
         *
         * Kalau dimensinya lebih besar dari
         * 1920px, scale down secara proporsional.
         */
        if (
          width >
            MAX_IMAGE_DIMENSION ||
          height >
            MAX_IMAGE_DIMENSION
        ) {
          const scale =
            Math.min(
              MAX_IMAGE_DIMENSION /
                width,
              MAX_IMAGE_DIMENSION /
                height
            );

          width = Math.round(
            width * scale
          );

          height = Math.round(
            height * scale
          );
        }

        const canvas =
          document.createElement(
            'canvas'
          );

        canvas.width =
          width;

        canvas.height =
          height;

        const context =
          canvas.getContext(
            '2d'
          );

        if (!context) {
          resolve(file);
          return;
        }

        /*
         * Supaya resize gambar tetap
         * terlihat smooth.
         */
        context.imageSmoothingEnabled =
          true;

        context.imageSmoothingQuality =
          'high';

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        /*
         * Convert menjadi WebP.
         *
         * WebP biasanya jauh lebih kecil
         * dibanding JPEG/PNG untuk foto.
         */
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            /*
             * Kalau hasil compression malah
             * lebih besar dari file asli,
             * gunakan file asli.
             */
            if (
              blob.size >=
              file.size
            ) {
              resolve(file);
              return;
            }

            const compressedFile =
              new File(
                [
                  blob,
                ],
                file.name.replace(
                  /\.[^/.]+$/,
                  '.webp'
                ),
                {
                  type:
                    'image/webp',
                  lastModified:
                    Date.now(),
                }
              );

            resolve(
              compressedFile
            );
          },
          'image/webp',
          IMAGE_QUALITY
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        /*
         * Fallback ke file original
         * kalau browser gagal membaca gambar.
         */
        resolve(file);
      };

      image.src =
        objectUrl;
    }
  );
}

/* =========================================================
   SINGLE IMAGE UPLOAD
   ========================================================= */

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

  /*
   * Compress terlebih dahulu sebelum
   * mengirim file ke Cloudinary.
   */
  const compressedFile =
    await compressImage(
      file
    );

  console.log(
    `[Cloudinary] ${file.name}: ${(
      file.size /
      1024 /
      1024
    ).toFixed(2)} MB → ${(
      compressedFile.size /
      1024 /
      1024
    ).toFixed(2)} MB`
  );

  const formData =
    new FormData();

  formData.append(
    'file',
    compressedFile
  );

  formData.append(
    'upload_preset',
    CLOUDINARY_UPLOAD_PRESET
  );

  const response =
    await fetch(
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
        errorData?.error
          ?.message ||
        message;
    } catch {
      // Ignore JSON parsing error.
    }

    throw new Error(
      message
    );
  }

  const data =
    await response.json();

  if (!data.secure_url) {
    throw new Error(
      'Cloudinary tidak mengembalikan URL gambar.'
    );
  }

  return data.secure_url;
}

/* =========================================================
   MULTIPLE IMAGE UPLOAD
   ========================================================= */

export async function uploadImagesToCloudinary(
  files: File[]
): Promise<string[]> {
  if (!files.length) {
    return [];
  }

  return Promise.all(
    files.map((file) =>
      uploadImageToCloudinary(
        file
      )
    )
  );
}