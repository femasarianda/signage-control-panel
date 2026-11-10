const KEY = 'deviceId';

/** ID device diambil dari ?device=<id>, lalu diingat supaya reload tidak perlu parameter lagi. */
export function loadDeviceId() {
  try {
    const fromUrl = new URLSearchParams(location.search).get('device');
    if (fromUrl) {
      localStorage.setItem(KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveDeviceId(id) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* abaikan: localStorage bisa tidak tersedia */
  }
}

export function clearDeviceId() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
  history.replaceState(null, '', location.pathname);
}
