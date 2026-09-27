import { ensureSecret, getSecret } from "./loginSecret";
import { querySecretInfo } from "../../services/api";

jest.mock("../../services/api", () => ({
  querySecretInfo: jest.fn(),
}));

const response = (key, iv) => ({
  status: 200,
  json: async () => ({ data: btoa(JSON.stringify({ key, iv })) }),
});

it("retries secret initialization when the eager request fails", async () => {
  querySecretInfo.mockRejectedValueOnce(new Error("not ready"));
  querySecretInfo.mockResolvedValueOnce(response("key", "iv"));

  await expect(ensureSecret()).resolves.toBe(true);
  expect(getSecret()).toEqual({ key: "key", iv: "iv" });
  expect(querySecretInfo).toHaveBeenCalledTimes(2);
});

it("accepts an initialized Admin response without client-side secrets", async () => {
  jest.resetModules();
  let isolatedQuerySecretInfo;
  jest.doMock("../../services/api", () => ({
    querySecretInfo: (() => {
      isolatedQuerySecretInfo = jest.fn();
      return isolatedQuerySecretInfo;
    })(),
  }));
  let ensureInitializedSecret;
  let getInitializedSecret;
  jest.isolateModules(() => {
    ({
      ensureSecret: ensureInitializedSecret,
      getSecret: getInitializedSecret,
    } = require("./loginSecret"));
  });
  isolatedQuerySecretInfo.mockResolvedValueOnce(response("", ""));

  await expect(ensureInitializedSecret()).resolves.toBe(true);
  expect(getInitializedSecret()).toEqual({ key: "", iv: "" });
});
