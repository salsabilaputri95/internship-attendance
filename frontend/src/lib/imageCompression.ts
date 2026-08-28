/**
 * Client-Side Image Compression Utility
 * Resizes and compresses selfie photos using HTML5 Canvas API
 * Target: Max 1280px dimension, WebP/JPEG format, < 500KB size
 */
export async function compressImage(
  imageSource: Blob | File | string,
  maxWidth = 1080,
  maxHeight = 1080,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const handleLoad = () => {
      let width = img.width;
      let height = img.height;

      // Calculate aspect ratio preserving scale
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Gagal menginisialisasi Canvas Context 2D"));
        return;
      }

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP or JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengompresi gambar"));
            return;
          }

          const compressedFile = new File(
            [blob],
            `selfie_${Date.now()}.jpg`,
            { type: "image/jpeg", lastModified: Date.now() }
          );

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Gagal memuat gambar untuk kompresi"));

    if (typeof imageSource === "string") {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}
