const CANCELLED_CAMERA_MESSAGES = ['cancel', 'no image selected'];

const isCancelledCameraMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();
  return CANCELLED_CAMERA_MESSAGES.some((value) => normalized.includes(value));
};

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const base64 = dataUrl.split(',')[1] ?? '';
      if (!base64) {
        reject(new Error('Could not read selected image.'));
        return;
      }
      resolve(base64.replace(/\s/g, ''));
    };
    reader.onerror = () => {
      reject(new Error('Failed to read selected image.'));
    };
    reader.readAsDataURL(file);
  });

const pickImageUsingFileInput = (): Promise<string | null> =>
  new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const base64 = await readFileAsBase64(file);
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    input.onerror = () => {
      reject(new Error('Unable to open gallery picker.'));
    };

    document.body.appendChild(input);
    input.click();
    window.setTimeout(() => {
      input.remove();
    }, 1000);
  });

export const pickGalleryImageAsBase64 = async (): Promise<string | null> => {
  const camera = navigator.camera;
  if (window.cordova && camera) {
    return new Promise<string | null>((resolve, reject) => {
      camera.getPicture(
        (imageData: string) => {
          const normalizedBase64 = String(imageData ?? '')
            .replace(/^data:[^;]+;base64,/, '')
            .replace(/\s/g, '');

          if (!normalizedBase64) {
            resolve(null);
            return;
          }
          resolve(normalizedBase64);
        },
        (message: string) => {
          if (!message || isCancelledCameraMessage(message)) {
            resolve(null);
            return;
          }
          reject(new Error(message));
        },
        {
          quality: 95,
          destinationType: window.Camera?.DestinationType?.DATA_URL ?? 0,
          sourceType: window.Camera?.PictureSourceType?.PHOTOLIBRARY ?? 0,
          mediaType: window.Camera?.MediaType?.PICTURE ?? 0,
          encodingType: window.Camera?.EncodingType?.JPEG ?? 0,
          correctOrientation: true,
        },
      );
    });
  }

  return pickImageUsingFileInput();
};
