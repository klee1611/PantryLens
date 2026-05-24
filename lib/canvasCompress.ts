const MAX_PX = 1024;
const QUALITY = 0.75;

export function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // FileReader.readAsDataURL is more reliable than createObjectURL on iOS Safari.
    // createObjectURL blobs fail to decode in Image elements on some iOS versions
    // when the source file is large (typical for iPhone camera photos).
    const fileReader = new FileReader();

    fileReader.onerror = () => reject(new Error('Failed to read file'));

    fileReader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to decode image'));

      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > MAX_PX || height > MAX_PX) {
            const ratio = Math.min(MAX_PX / width, MAX_PX / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image compression failed'));
                return;
              }
              const outReader = new FileReader();
              outReader.onerror = () => reject(new Error('Failed to encode result'));
              outReader.onloadend = () =>
                resolve((outReader.result as string).split(',')[1]);
              outReader.readAsDataURL(blob);
            },
            'image/jpeg',
            QUALITY,
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = dataUrl;
    };

    fileReader.readAsDataURL(file);
  });
}
