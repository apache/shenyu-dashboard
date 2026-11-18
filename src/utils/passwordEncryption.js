/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { querySecretInfo } from "../services/api";

const ALGORITHM = "RSA-OAEP-256+A256GCM";
const MAX_BODY_BYTES = 64 * 1024;

export class PasswordEncryptionError extends Error {
  constructor(reason) {
    super("Unable to submit encrypted credentials");
    this.messageKey = `SHENYU.PASSWORD.ENCRYPTION.${reason}`;
  }
}

function toBinary(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return binary;
}

function toBase64(bytes) {
  return btoa(toBinary(bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function publicInformation() {
  try {
    const response = await querySecretInfo();
    if (response?.status !== 200) throw new Error();
    const body = await response.json();
    if (body?.code !== 200 || typeof body.data !== "string") throw new Error();
    const info = JSON.parse(atob(body.data)).encryption;
    if (
      info?.version !== 1 ||
      info.algorithm !== ALGORITHM ||
      typeof info.keyId !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(info.keyId) ||
      typeof info.publicKey !== "string" ||
      !info.publicKey ||
      !Number.isSafeInteger(info.serverTime) ||
      !Number.isInteger(info.maxAgeSeconds) ||
      info.maxAgeSeconds < 1 ||
      info.maxAgeSeconds > 3600
    ) {
      throw new Error();
    }
    return info;
  } catch (error) {
    throw new PasswordEncryptionError("UNAVAILABLE");
  }
}

async function encryptWithForge(info, rawKey, iv, additionalData, plaintext) {
  const module = await import("node-forge");
  const forge = module.default || module;
  const publicKey = forge.pki.publicKeyFromAsn1(
    forge.asn1.fromDer(toBinary(fromBase64(info.publicKey))),
  );
  if (publicKey.n.bitLength() < 2048) throw new Error();
  const seed = window.crypto.getRandomValues(new Uint8Array(32));
  try {
    const cipher = forge.cipher.createCipher("AES-GCM", toBinary(rawKey));
    cipher.start({
      iv: toBinary(iv),
      additionalData: toBinary(additionalData),
      tagLength: 128,
    });
    cipher.update(forge.util.createBuffer(toBinary(plaintext)));
    if (!cipher.finish() || cipher.mode.tag.length() !== 16) throw new Error();
    return {
      wrappedKey: btoa(
        publicKey.encrypt(toBinary(rawKey), "RSA-OAEP", {
          md: forge.md.sha256.create(),
          mgf1: { md: forge.md.sha256.create() },
          seed: toBinary(seed),
          label: "",
        }),
      ),
      ciphertext: btoa(cipher.output.getBytes() + cipher.mode.tag.getBytes()),
    };
  } finally {
    seed.fill(0);
  }
}

async function encryptWithSubtle(info, rawKey, iv, additionalData, plaintext) {
  const { subtle } = window.crypto;
  const publicKey = await subtle.importKey(
    "spki",
    fromBase64(info.publicKey),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  if (publicKey.algorithm.modulusLength < 2048) throw new Error();
  const key = await subtle.importKey("raw", rawKey, "AES-GCM", false, [
    "encrypt",
  ]);
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv, additionalData, tagLength: 128 },
    key,
    plaintext,
  );
  const wrappedKey = await subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawKey,
  );
  return {
    wrappedKey: toBase64(new Uint8Array(wrappedKey)),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

/** Encrypt before dispatch so credentials never enter Redux actions. */
export async function encryptCredentials(data, purpose, target = "") {
  if (
    typeof window.crypto?.getRandomValues !== "function" ||
    typeof TextEncoder === "undefined"
  ) {
    throw new PasswordEncryptionError("UNSUPPORTED");
  }
  if (
    !["login", "change-password"].includes(purpose) ||
    typeof target !== "string" ||
    (purpose === "login" && target) ||
    (purpose === "change-password" && !target)
  ) {
    throw new PasswordEncryptionError("FAILED");
  }
  const info = await publicInformation();
  let rawKey;
  try {
    const encoder = new TextEncoder();
    rawKey = window.crypto.getRandomValues(new Uint8Array(32));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const additionalData = encoder.encode(
      `shenyu-password/v1|${info.keyId}|${purpose}|${target}`,
    );
    const plaintext = encoder.encode(
      JSON.stringify({ issuedAt: info.serverTime, data }),
    );
    // Select once: a native encryption failure must never trigger a fallback.
    const encrypt =
      window.isSecureContext === true && window.crypto.subtle
        ? encryptWithSubtle
        : encryptWithForge;
    const { wrappedKey, ciphertext } = await encrypt(
      info,
      rawKey,
      iv,
      additionalData,
      plaintext,
    );
    const envelope = {
      version: 1,
      keyId: info.keyId,
      wrappedKey,
      iv: toBase64(iv),
      ciphertext,
    };
    if (encoder.encode(JSON.stringify(envelope)).length > MAX_BODY_BYTES) {
      throw new Error();
    }
    return envelope;
  } catch (error) {
    throw new PasswordEncryptionError("FAILED");
  } finally {
    rawKey?.fill(0);
  }
}
