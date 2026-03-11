type BarkoderCordovaSuccess<T> = (value: T) => void;
type BarkoderCordovaError = (error: unknown) => void;

type BarkoderCordovaPlugin = Record<string, (...args: unknown[]) => void>;

export interface PluginListenerHandle {
  remove: () => Promise<void>;
}

export enum DecodingSpeed {
  fast,
  normal,
  slow,
  rigorous,
}

export enum BarkoderCameraPosition {
  BACK,
  FRONT,
}

export enum BarkoderResolution {
  HD,
  FHD,
  UHD,
}

export enum BarcodeType {
  aztec,
  aztecCompact,
  qr,
  qrMicro,
  code128,
  code93,
  code39,
  codabar,
  code11,
  msi,
  upcA,
  upcE,
  upcE1,
  ean13,
  ean8,
  pdf417,
  pdf417Micro,
  datamatrix,
  code25,
  interleaved25,
  itf14,
  iata25,
  matrix25,
  datalogic25,
  coop25,
  code32,
  telepen,
  dotcode,
  idDocument,
  databar14,
  databarLimited,
  databarExpanded,
  postalIMB,
  postnet,
  planet,
  australianPost,
  royalMail,
  kix,
  japanesePost,
  maxiCode,
  ocrText,
}

export enum BarkoderARMode {
  off,
  interactiveDisabled,
  interactiveEnabled,
  nonInteractive,
}

export enum BarkoderAROverlayRefresh {
  smooth,
  normal,
}

export enum BarkoderARLocationType {
  none,
  tight,
  boundingBox,
}

export enum BarkoderARHeaderShowMode {
  never,
  always,
  onSelected,
}

export enum IdDocumentMasterChecksumType {
  disabled,
  enabled,
}

export class BarkoderConfig {
  decoder?: DekoderConfig;
  imageResultEnabled?: boolean;
  locationInImageResultEnabled?: boolean;
  locationInPreviewEnabled?: boolean;
  pinchToZoomEnabled?: boolean;
  regionOfInterestVisible?: boolean;
  beepOnSuccessEnabled?: boolean;
  vibrateOnSuccessEnabled?: boolean;

  constructor(config: Partial<BarkoderConfig>) {
    Object.assign(this, config);
  }
}

export class DekoderConfig {
  [key: string]: unknown;

  constructor(config: Partial<DekoderConfig>) {
    Object.assign(this, config);
  }
}

export class BarcodeConfig {
  enabled?: boolean;

  constructor(config: Partial<BarcodeConfig>) {
    Object.assign(this, config);
  }
}

export class BarcodeConfigWithLength {
  enabled?: boolean;
  minLength?: number;
  maxLength?: number;

  constructor(config: Partial<BarcodeConfigWithLength>) {
    Object.assign(this, config);
  }
}

export class BarcodeConfigWithDpmMode {
  enabled?: boolean;
  dpmMode?: number;
  minLength?: number;
  maxLength?: number;

  constructor(config: Partial<BarcodeConfigWithDpmMode>) {
    Object.assign(this, config);
  }
}

export class Code39BarcodeConfig {
  enabled?: boolean;
  minLength?: number;
  maxLength?: number;

  constructor(config: Partial<Code39BarcodeConfig>) {
    Object.assign(this, config);
  }
}

export class IdDocumentBarcodeConfig {
  enabled?: boolean;
  masterChecksum?: IdDocumentMasterChecksumType;

  constructor(config: Partial<IdDocumentBarcodeConfig>) {
    Object.assign(this, config);
  }
}

export class BarkoderResult {
  decoderResults: DecoderResult[];
  resultThumbnailsAsBase64?: string[] | null;
  resultImageAsBase64?: string | null;

  constructor(resultMap: Record<string, unknown>) {
    const decoderResultsRaw = resultMap.decoderResults;
    this.decoderResults = Array.isArray(decoderResultsRaw)
      ? decoderResultsRaw.map((result) => new DecoderResult(result as Record<string, unknown>))
      : [];

    const thumbnails = resultMap.resultThumbnailsAsBase64;
    this.resultThumbnailsAsBase64 = Array.isArray(thumbnails)
      ? thumbnails
          .map((thumbnail) => this.convertToBase64(thumbnail as string | null | undefined))
          .filter((thumbnail): thumbnail is string => thumbnail !== null)
      : null;

    this.resultImageAsBase64 = this.convertToBase64(
      resultMap.resultImageAsBase64 as string | null | undefined,
    );
  }

  private convertToBase64(data: string | null | undefined): string | null {
    if (!data) {
      return null;
    }
    return data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`;
  }
}

export class DecoderResult {
  barcodeType: number;
  barcodeTypeName: string;
  textualData: string;
  locationPoints?: Array<{ x: number; y: number }>;

  constructor(resultMap: Record<string, unknown>) {
    this.barcodeType = Number(resultMap.barcodeType ?? -1);
    this.barcodeTypeName = String(resultMap.barcodeTypeName ?? '');
    this.textualData = String(resultMap.textualData ?? '');
    this.locationPoints = Array.isArray(resultMap.locationPoints)
      ? (resultMap.locationPoints as Array<{ x: number; y: number }>)
      : undefined;
  }
}

const resultEventSubscribers = new Set<(result: BarkoderResult) => void>();
const closeEventSubscribers = new Set<() => void>();

const getPlugin = (): BarkoderCordovaPlugin => {
  const plugin = window.Barkoder as BarkoderCordovaPlugin | undefined;
  if (!plugin) {
    throw new Error('Cordova Barkoder plugin is not available.');
  }
  return plugin;
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('Unknown Barkoder error');
};

const invoke = <T = unknown>(method: string, args: unknown[] = []): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    try {
      const plugin = getPlugin();
      const nativeMethod = plugin[method];

      if (typeof nativeMethod !== 'function') {
        reject(new Error(`Barkoder method "${method}" is not available.`));
        return;
      }

      nativeMethod(
        ...args,
        ((value: T) => resolve(value)) as BarkoderCordovaSuccess<T>,
        ((error: unknown) => reject(normalizeError(error))) as BarkoderCordovaError,
      );
    } catch (error) {
      reject(normalizeError(error));
    }
  });

const emitResultEvent = (rawPayload: unknown): void => {
  try {
    const result = rawPayload instanceof BarkoderResult
      ? rawPayload
      : new BarkoderResult((rawPayload ?? {}) as Record<string, unknown>);
    resultEventSubscribers.forEach((subscriber) => subscriber(result));
  } catch (error) {
    console.error('Failed to parse Barkoder result payload', error);
  }
};

const resolveSoon = (resolve: () => void): void => {
  window.setTimeout(resolve, 0);
};

export const Barkoder = {
  addListener(
    eventName: 'barkoderResultEvent' | 'barkoderCloseButtonTappedEvent',
    listener: ((result: BarkoderResult) => void) | (() => void),
  ): Promise<PluginListenerHandle> {
    if (eventName === 'barkoderResultEvent') {
      resultEventSubscribers.add(listener as (result: BarkoderResult) => void);
      return Promise.resolve({
        remove: async () => {
          resultEventSubscribers.delete(listener as (result: BarkoderResult) => void);
        },
      });
    }

    closeEventSubscribers.add(listener as () => void);
    return Promise.resolve({
      remove: async () => {
        closeEventSubscribers.delete(listener as () => void);
      },
    });
  },

  initialize({ width, height, x, y }: { width: number; height: number; x: number; y: number }) {
    return invoke<void>('initialize', [width, height, x, y]);
  },

  registerWithLicenseKey({ licenseKey }: { licenseKey: string }) {
    return invoke<void>('registerWithLicenseKey', [licenseKey]);
  },

  startScanning() {
    return new Promise<void>((resolve, reject) => {
      try {
        const plugin = getPlugin();
        let settled = false;

        plugin.startScanning(
          (payload: unknown) => {
            emitResultEvent(payload);
            if (!settled) {
              settled = true;
              resolve();
            }
          },
          (error: unknown) => {
            if (!settled) {
              settled = true;
              reject(normalizeError(error));
            } else {
              console.error('Barkoder scanning error', error);
            }
          },
        );

        if (!settled) {
          settled = true;
          resolveSoon(resolve);
        }
      } catch (error) {
        reject(normalizeError(error));
      }
    });
  },

  stopScanning() {
    return invoke<void>('stopScanning');
  },

  pauseScanning() {
    return invoke<void>('pauseScanning');
  },

  scanImage({ base64 }: { base64: string }) {
    return new Promise<void>((resolve, reject) => {
      try {
        const plugin = getPlugin();
        let settled = false;
        plugin.scanImage(
          base64,
          (payload: unknown) => {
            emitResultEvent(payload);
            if (!settled) {
              settled = true;
              resolve();
            }
          },
          (error: unknown) => {
            if (!settled) {
              settled = true;
              reject(normalizeError(error));
            } else {
              console.error('Barkoder image scanning error', error);
            }
          },
        );
        if (!settled) {
          settled = true;
          resolveSoon(resolve);
        }
      } catch (error) {
        reject(normalizeError(error));
      }
    });
  },

  configureBarkoder({ barkoderConfig }: { barkoderConfig: BarkoderConfig }) {
    return invoke<void>('configureBarkoder', [barkoderConfig]);
  },

  setZoomFactor({ value }: { value: number }) {
    return invoke<void>('setZoomFactor', [value]);
  },

  setFlashEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setFlashEnabled', [enabled]);
  },

  setCloseSessionOnResultEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setCloseSessionOnResultEnabled', [enabled]);
  },

  setImageResultEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setImageResultEnabled', [enabled]);
  },

  setLocationInImageResultEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setLocationInImageResultEnabled', [enabled]);
  },

  setRegionOfInterest({ left, top, width, height }: { left: number; top: number; width: number; height: number }) {
    return invoke<void>('setRegionOfInterest', [left, top, width, height]);
  },

  setLocationInPreviewEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setLocationInPreviewEnabled', [enabled]);
  },

  setPinchToZoomEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setPinchToZoomEnabled', [enabled]);
  },

  setRegionOfInterestVisible({ value }: { value: boolean }) {
    return invoke<void>('setRegionOfInterestVisible', [value]);
  },

  setBarkoderResolution({ value }: { value: BarkoderResolution }) {
    return invoke<void>('setBarkoderResolution', [value]);
  },

  setBeepOnSuccessEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setBeepOnSuccessEnabled', [enabled]);
  },

  setVibrateOnSuccessEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setVibrateOnSuccessEnabled', [enabled]);
  },

  setDecodingSpeed({ value }: { value: DecodingSpeed }) {
    return invoke<void>('setDecodingSpeed', [value]);
  },

  setBarcodeTypeEnabled({ type, enabled }: { type: BarcodeType; enabled: boolean }) {
    return invoke<void>('setBarcodeTypeEnabled', [type, enabled]);
  },

  setMulticodeCachingEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setMulticodeCachingEnabled', [enabled]);
  },

  setMulticodeCachingDuration({ value }: { value: number }) {
    return invoke<void>('setMulticodeCachingDuration', [value]);
  },

  setMaximumResultsCount({ value }: { value: number }) {
    return invoke<void>('setMaximumResultsCount', [value]);
  },

  setBarcodeThumbnailOnResultEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setBarcodeThumbnailOnResultEnabled', [enabled]);
  },

  setThresholdBetweenDuplicatesScans({ value }: { value: number }) {
    return invoke<void>('setThresholdBetweenDuplicatesScans', [value]);
  },

  setUpcEanDeblurEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setUpcEanDeblurEnabled', [enabled]);
  },

  setMisshaped1DEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setMisshaped1DEnabled', [enabled]);
  },

  setEnableVINRestrictions({ value }: { value: boolean }) {
    return invoke<void>('setEnableVINRestrictions', [value]);
  },

  setDatamatrixDpmModeEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setDatamatrixDpmModeEnabled', [enabled]);
  },

  setCustomOption({ option, value }: { option: string; value: number }) {
    return invoke<void>('setCustomOption', [option, value]);
  },

  setEnableComposite({ value }: { value: number }) {
    return invoke<void>('setEnableComposite', [value]);
  },

  setCamera({ value }: { value: BarkoderCameraPosition }) {
    return invoke<void>('setCamera', [value]);
  },

  setARMode({ value }: { value: BarkoderARMode }) {
    return invoke<void>('setARMode', [value]);
  },

  setAROverlayRefresh({ value }: { value: BarkoderAROverlayRefresh }) {
    return invoke<void>('setAROverlayRefresh', [value]);
  },

  setARSelectedLocationColor({ value }: { value: string }) {
    return invoke<void>('setARSelectedLocationColor', [value]);
  },

  setARNonSelectedLocationColor({ value }: { value: string }) {
    return invoke<void>('setARNonSelectedLocationColor', [value]);
  },

  setARLocationType({ value }: { value: BarkoderARLocationType }) {
    return invoke<void>('setARLocationType', [value]);
  },

  setARDoubleTapToFreezeEnabled({ enabled }: { enabled: boolean }) {
    return invoke<void>('setARDoubleTapToFreezeEnabled', [enabled]);
  },

  setARHeaderShowMode({ value }: { value: BarkoderARHeaderShowMode }) {
    return invoke<void>('setARHeaderShowMode', [value]);
  },

  async getVersion(): Promise<Record<string, unknown>> {
    const value = await invoke<unknown>('getVersion');
    if (typeof value === 'string' || typeof value === 'number') {
      return { version: value };
    }
    return (value ?? {}) as Record<string, unknown>;
  },

  async getLibVersion(): Promise<Record<string, unknown>> {
    const value = await invoke<unknown>('getLibVersion');
    if (typeof value === 'string' || typeof value === 'number') {
      return { libVersion: value };
    }
    return (value ?? {}) as Record<string, unknown>;
  },
};

export const emitBarkoderCloseButtonTappedEvent = () => {
  closeEventSubscribers.forEach((subscriber) => subscriber());
};
