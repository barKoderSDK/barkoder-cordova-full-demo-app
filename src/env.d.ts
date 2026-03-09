/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BARKODER_LICENSE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface BarkoderCordovaGlobal {
  [key: string]: (...args: unknown[]) => void;
}

interface CordovaCameraConstants {
  DestinationType: { DATA_URL: number };
  EncodingType: { JPEG: number };
  MediaType: { PICTURE: number };
  PictureSourceType: { PHOTOLIBRARY: number };
}

interface CordovaCamera {
  getPicture(
    success: (imageData: string) => void,
    fail: (message: string) => void,
    options?: Record<string, unknown>,
  ): void;
}

interface SocialSharingPlugin {
  shareWithOptions(
    options: Record<string, unknown>,
    success?: (result: unknown) => void,
    failure?: (error: unknown) => void,
  ): void;
}

interface Window {
  Barkoder?: BarkoderCordovaGlobal;
  Camera?: CordovaCameraConstants;
  cordova?: {
    platformId?: string;
  };
  device?: {
    uuid?: string;
  };
  plugins?: {
    socialsharing?: SocialSharingPlugin;
  };
}

interface Navigator {
  camera?: CordovaCamera;
}
