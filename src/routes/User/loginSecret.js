import { querySecretInfo } from "../../services/api";

let secretKey = "";
let secretIv = "";
let secretInitialized = false;
let secretPromise;

async function loadSecret() {
  try {
    const response = await querySecretInfo();
    if (response?.status !== 200) {
      return false;
    }

    const body = await response.json();
    const secret = JSON.parse(atob(body.data));
    const hasKey = Boolean(secret.key);
    const hasIv = Boolean(secret.iv);
    if (hasKey !== hasIv) {
      return false;
    }
    secretKey = secret.key || "";
    secretIv = secret.iv || "";
    secretInitialized = true;
    return true;
  } catch (error) {
    // The submit path retries once when the initial request is still unavailable.
  }
  return false;
}

export async function ensureSecret() {
  if (secretInitialized) {
    return true;
  }

  if (!secretPromise) {
    secretPromise = loadSecret();
  }
  const loaded = await secretPromise;
  if (!loaded && !secretInitialized) {
    secretPromise = loadSecret();
    await secretPromise;
  }
  return secretInitialized;
}

export function getSecret() {
  return { key: secretKey, iv: secretIv };
}
