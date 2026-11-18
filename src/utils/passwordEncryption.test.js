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

import {
  webcrypto,
  generateKeyPairSync,
  createHash,
  privateDecrypt,
  createDecipheriv,
  constants,
} from "node:crypto";
import { TextEncoder } from "node:util";
import forge from "node-forge";
import { encryptCredentials } from "./passwordEncryption";
import { querySecretInfo } from "../services/api";

jest.mock("../services/api", () => ({ querySecretInfo: jest.fn() }));

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicDer = keys.publicKey.export({ type: "spki", format: "der" });
const metadata = {
  version: 1,
  algorithm: "RSA-OAEP-256+A256GCM",
  keyId: createHash("sha256").update(publicDer).digest("base64url"),
  publicKey: publicDer.toString("base64"),
  serverTime: Date.now(),
  maxAgeSeconds: 120,
};
const response = (info) => ({
  status: 200,
  json: async () => ({
    code: 200,
    data: btoa(JSON.stringify({ key: "", iv: "", encryption: info })),
  }),
});

beforeEach(() => {
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: webcrypto,
  });
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: true,
  });
  window.TextEncoder = TextEncoder;
  querySecretInfo.mockReset().mockResolvedValue(response(metadata));
});

function unwrap(envelope) {
  return privateDecrypt(
    {
      key: keys.privateKey,
      oaepHash: "sha256",
      padding: constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(envelope.wrappedKey, "base64"),
  );
}

function decrypt(envelope, purpose, target = "") {
  const key = unwrap(envelope);
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAAD(
    Buffer.from(`shenyu-password/v1|${metadata.keyId}|${purpose}|${target}`),
  );
  decipher.setAuthTag(ciphertext.subarray(-16));
  return JSON.parse(
    Buffer.concat([
      decipher.update(ciphertext.subarray(0, -16)),
      decipher.final(),
    ]).toString("utf8"),
  );
}

describe.each(["native", "HTTP"])("%s encryption provider", (provider) => {
  beforeEach(() => {
    if (provider === "HTTP") {
      Object.defineProperty(window, "isSecureContext", {
        configurable: true,
        value: false,
      });
      Object.defineProperty(window, "crypto", {
        configurable: true,
        value: { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) },
      });
    }
  });

  it("encrypts Unicode and long passwords without the direct-RSA payload limit", async () => {
    const data = {
      userName: "fixture-user",
      password: "中文🔐".repeat(100),
      clientId: "fixture-client",
    };
    const envelope = await encryptCredentials(data, "login");
    expect(decrypt(envelope, "login")).toEqual({
      issuedAt: metadata.serverTime,
      data,
    });
    expect(Object.keys(envelope)).toEqual([
      "version",
      "keyId",
      "wrappedKey",
      "iv",
      "ciphertext",
    ]);
    expect(JSON.stringify(envelope)).not.toContain(data.password);
    expect(JSON.stringify(envelope)).not.toContain(data.userName);
    expect(data.password).toBe("中文🔐".repeat(100));
  });

  it("encrypts both change-password fields and authenticates the purpose and target ID", async () => {
    const data = {
      userName: "fixture-user",
      password: "Next-Fixture1!",
      oldPassword: "Old-Fixture1!",
    };
    const envelope = await encryptCredentials(
      data,
      "change-password",
      "用户-1🔐",
    );
    expect(decrypt(envelope, "change-password", "用户-1🔐").data).toEqual(data);
    expect(() => decrypt(envelope, "change-password", "user-2")).toThrow();
    expect(() => decrypt(envelope, "login")).toThrow();
  });

  it("uses a fresh key and IV and fetches current public metadata for every attempt", async () => {
    const data = { userName: "fixture-user", password: "Fixture-only1!" };
    const a = await encryptCredentials(data, "login");
    const b = await encryptCredentials(data, "login");
    expect(a.wrappedKey).not.toBe(b.wrappedKey);
    expect(unwrap(a)).not.toEqual(unwrap(b));
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(querySecretInfo).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid or undersized public keys without revealing their errors", async () => {
    const weakKeys = generateKeyPairSync("rsa", { modulusLength: 1024 });
    const weakPublicKey = weakKeys.publicKey.export({
      type: "spki",
      format: "der",
    });
    querySecretInfo
      .mockResolvedValueOnce(response({ ...metadata, publicKey: "invalid" }))
      .mockResolvedValueOnce(
        response({ ...metadata, publicKey: weakPublicKey.toString("base64") }),
      );
    const encrypt = () =>
      encryptCredentials({ password: "Fixture-only1!" }, "login");
    await expect(encrypt()).rejects.toMatchObject({
      message: "Unable to submit encrypted credentials",
      messageKey: "SHENYU.PASSWORD.ENCRYPTION.FAILED",
    });
    await expect(encrypt()).rejects.toMatchObject({
      message: "Unable to submit encrypted credentials",
      messageKey: "SHENYU.PASSWORD.ENCRYPTION.FAILED",
    });
  });

  it("rejects envelopes beyond the shared 64 KiB limit", async () => {
    await expect(
      encryptCredentials({ password: "x".repeat(64 * 1024) }, "login"),
    ).rejects.toMatchObject({
      messageKey: "SHENYU.PASSWORD.ENCRYPTION.FAILED",
    });
  });
});

it.each([
  undefined,
  { ...metadata, version: 2 },
  { ...metadata, algorithm: "AES" },
])(
  "never falls back to plaintext when public encryption metadata is unavailable",
  async (info) => {
    querySecretInfo.mockResolvedValue(response(info));
    await expect(
      encryptCredentials({ password: "Fixture-only1!" }, "login"),
    ).rejects.toMatchObject({
      messageKey: "SHENYU.PASSWORD.ENCRYPTION.UNAVAILABLE",
    });
  },
);

it("uses only native CSPRNG entropy for HTTP keys, IVs and OAEP seeds", async () => {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: false,
  });
  const getRandomValues = jest.fn((bytes) => webcrypto.getRandomValues(bytes));
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: { getRandomValues },
  });
  const noForgeRandom = () => {
    throw new Error("Forge RNG must never be used");
  };
  jest.spyOn(forge.random, "getBytes").mockImplementation(noForgeRandom);
  jest.spyOn(forge.random, "getBytesSync").mockImplementation(noForgeRandom);
  const data = { userName: "fixture-user", password: "中文🔐".repeat(100) };
  const envelope = await encryptCredentials(data, "login");
  expect(decrypt(envelope, "login").data).toEqual(data);
  expect(getRandomValues.mock.calls.map(([bytes]) => bytes.length)).toEqual([
    32, 12, 32,
  ]);
  expect(forge.random.getBytes).not.toHaveBeenCalled();
  expect(forge.random.getBytesSync).not.toHaveBeenCalled();
  // Best-effort cleanup of mutable secret buffers after encryption.
  expect(getRandomValues.mock.calls[0][0].every((byte) => byte === 0)).toBe(
    true,
  );
  expect(getRandomValues.mock.calls[2][0].every((byte) => byte === 0)).toBe(
    true,
  );
});

it("uses the HTTP provider in a secure context when subtle is unavailable", async () => {
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) },
  });
  const envelope = await encryptCredentials(
    { password: "Fixture-only1!" },
    "login",
  );
  expect(decrypt(envelope, "login").data.password).toBe("Fixture-only1!");
});

it("does not use subtle on an insecure origin even if exposed", async () => {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: false,
  });
  const importKey = jest.fn(() => {
    throw new Error("Insecure origins must use the HTTP provider");
  });
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
      subtle: { importKey },
    },
  });
  const envelope = await encryptCredentials(
    { password: "Fixture-only1!" },
    "login",
  );
  expect(decrypt(envelope, "login").data.password).toBe("Fixture-only1!");
  expect(importKey).not.toHaveBeenCalled();
});

it.each([undefined, {}, { getRandomValues: null }])(
  "rejects unavailable native entropy before fetching metadata",
  async (crypto) => {
    Object.defineProperty(window, "crypto", {
      configurable: true,
      value: crypto,
    });
    await expect(
      encryptCredentials({ password: "Fixture-only1!" }, "login"),
    ).rejects.toMatchObject({
      messageKey: "SHENYU.PASSWORD.ENCRYPTION.UNSUPPORTED",
    });
    expect(querySecretInfo).not.toHaveBeenCalled();
  },
);

it("rejects a failing CSPRNG without using Forge randomness", async () => {
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: () => {
        throw new Error("Sensitive RNG error");
      },
    },
  });
  await expect(
    encryptCredentials({ password: "Fixture-only1!" }, "login"),
  ).rejects.toMatchObject({
    message: "Unable to submit encrypted credentials",
    messageKey: "SHENYU.PASSWORD.ENCRYPTION.FAILED",
  });
});

it("never switches to Forge when native encryption fails", async () => {
  const encrypt = jest
    .fn()
    .mockRejectedValue(new Error("Sensitive encryption error"));
  const forgeImport = jest.spyOn(forge.pki, "publicKeyFromAsn1");
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
      subtle: {
        importKey: webcrypto.subtle.importKey.bind(webcrypto.subtle),
        encrypt,
      },
    },
  });
  await expect(
    encryptCredentials({ password: "Fixture-only1!" }, "login"),
  ).rejects.toMatchObject({
    message: "Unable to submit encrypted credentials",
    messageKey: "SHENYU.PASSWORD.ENCRYPTION.FAILED",
  });
  expect(encrypt).toHaveBeenCalledTimes(1);
  expect(forgeImport).not.toHaveBeenCalled();
});

it("fails closed when the HTTP crypto provider cannot load", async () => {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value: false,
  });
  jest.doMock("node-forge", () => {
    throw new Error("Sensitive module-loading error");
  });
  try {
    await jest.isolateModulesAsync(async () => {
      const api = await import("../services/api");
      api.querySecretInfo.mockResolvedValue(response(metadata));
      const encryption = await import("./passwordEncryption");
      await expect(
        encryption.encryptCredentials({ password: "Fixture-only1!" }, "login"),
      ).rejects.toMatchObject({
        message: "Unable to submit encrypted credentials",
        messageKey: "SHENYU.PASSWORD.ENCRYPTION.FAILED",
      });
    });
  } finally {
    jest.dontMock("node-forge");
  }
});
