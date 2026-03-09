import { Barkoder, type BarkoderResult, type PluginListenerHandle } from '../plugins/barkoder';

const isNativePlatform = typeof window !== 'undefined' && !!window.cordova;

let registered = false;
let resultListener: PluginListenerHandle | null = null;
let closeListener: PluginListenerHandle | null = null;
let hiddenInitializationElement: HTMLElement | null = null;
let deviceReadyPromise: Promise<void> | null = null;

const resultSubscribers = new Set<(result: BarkoderResult) => void>();
const closeSubscribers = new Set<() => void>();

const getLicenseKey = (): string => {
  return import.meta.env.VITE_BARKODER_LICENSE_KEY ?? '';
};

const waitForDeviceReady = async (): Promise<void> => {
  if (!isNativePlatform) {
    return;
  }

  if (window.Barkoder) {
    return;
  }

  if (!deviceReadyPromise) {
    deviceReadyPromise = new Promise<void>((resolve) => {
      const onReady = () => resolve();
      document.addEventListener('deviceready', onReady, { once: true });
      window.setTimeout(resolve, 4000);
    });
  }

  return deviceReadyPromise;
};

const ensureListeners = async (): Promise<void> => {
  if (!isNativePlatform) {
    return;
  }

  if (!resultListener) {
    resultListener = await Barkoder.addListener('barkoderResultEvent', (result: BarkoderResult) => {
      resultSubscribers.forEach((subscriber) => subscriber(result));
    });
  }

  if (!closeListener) {
    closeListener = await Barkoder.addListener('barkoderCloseButtonTappedEvent', () => {
      closeSubscribers.forEach((subscriber) => subscriber());
    });
  }
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

const getHiddenInitializationElement = (): HTMLElement => {
  if (!hiddenInitializationElement) {
    hiddenInitializationElement = document.createElement('div');
    hiddenInitializationElement.style.position = 'fixed';
    hiddenInitializationElement.style.left = '200vw';
    hiddenInitializationElement.style.top = '200vh';
    hiddenInitializationElement.style.width = '2px';
    hiddenInitializationElement.style.height = '2px';
    hiddenInitializationElement.style.opacity = '0';
    hiddenInitializationElement.style.pointerEvents = 'none';
  }

  if (document.body && !hiddenInitializationElement.isConnected) {
    document.body.appendChild(hiddenInitializationElement);
  }

  return hiddenInitializationElement;
};

const getValidBounds = async (element: HTMLElement): Promise<DOMRect> => {
  let rect = element.getBoundingClientRect();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (rect.width > 1 && rect.height > 1) {
      return rect;
    }
    await sleep(50);
    rect = element.getBoundingClientRect();
  }

  return rect;
};

const initializeWithBounds = async (
  element: HTMLElement,
  options?: { fullscreen?: boolean },
): Promise<void> => {
  const rect = await getValidBounds(element);
  const fullscreen = options?.fullscreen ?? true;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = fullscreen ? Math.max(rect.width, viewportWidth) : rect.width;
  const height = fullscreen ? Math.max(rect.height, viewportHeight) : rect.height;
  const x = fullscreen ? 0 : rect.left;
  const y = fullscreen ? 0 : rect.top;

  await Barkoder.initialize({
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
  });

  await sleep(120);
};

const ensureRegistered = async (): Promise<void> => {
  if (registered) {
    return;
  }

  const licenseKey = getLicenseKey();
  await Barkoder.registerWithLicenseKey({ licenseKey });
  registered = true;
};

export const barkoderService = {
  isNativePlatform,

  async ensureReady(
    element: HTMLElement,
    options?: { fullscreen?: boolean },
  ): Promise<boolean> {
    if (!isNativePlatform) {
      return false;
    }

    await waitForDeviceReady();
    await ensureRegistered();
    await initializeWithBounds(element, { fullscreen: options?.fullscreen ?? true });
    await ensureListeners();
    return true;
  },

  async ensureImageScanReady(): Promise<boolean> {
    if (!isNativePlatform) {
      return false;
    }

    await waitForDeviceReady();
    await ensureRegistered();
    await initializeWithBounds(getHiddenInitializationElement(), { fullscreen: false });
    await ensureListeners();
    return true;
  },

  async subscribeResults(callback: (result: BarkoderResult) => void): Promise<() => void> {
    resultSubscribers.add(callback);
    await ensureListeners();

    return () => {
      resultSubscribers.delete(callback);
    };
  },

  subscribeClose(callback: () => void): () => void {
    closeSubscribers.add(callback);
    return () => {
      closeSubscribers.delete(callback);
    };
  },
};
