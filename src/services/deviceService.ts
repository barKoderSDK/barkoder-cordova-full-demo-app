const DEVICE_FALLBACK_KEY = 'device_uuid_fallback';

const generateFallbackId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getDeviceIdentifier = (): string => {
  if (window.device?.uuid) {
    return window.device.uuid;
  }

  const existing = localStorage.getItem(DEVICE_FALLBACK_KEY);
  if (existing) {
    return existing;
  }

  const generated = generateFallbackId();
  localStorage.setItem(DEVICE_FALLBACK_KEY, generated);
  return generated;
};

