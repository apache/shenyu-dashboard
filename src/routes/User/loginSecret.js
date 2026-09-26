import { querySecretInfo } from "../../services/api";

let secretKey = "";
let secretIv = "";
let secretPromise;

async function loadSecret() {
  try {
    const response = await querySecretInfo();
    if (response?.status !== 200) {
      return false;
    }

    const body = await response.json();
    const secret = JSON.parse(atob(body.data));
    if (secret.key && secret.iv) {
      secretKey = secret.key;
      secretIv = secret.iv;
      return true;
    }
  } catch (error) {
    // The submit path retries once when the initial request is still unavailable.
  }
  return false;
}

export async function ensureSecret() {
  if (secretKey && secretIv) {
    return true;
  }

  if (!secretPromise) {
    secretPromise = loadSecret();
  }
  const loaded = await secretPromise;
  if (!loaded && !(secretKey && secretIv)) {
    secretPromise = loadSecret();
    await secretPromise;
  }
  return Boolean(secretKey && secretIv);
}

export function getSecret() {
  return { key: secretKey, iv: secretIv };
}
