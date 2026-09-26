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
