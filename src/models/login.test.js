import { runSaga, effects } from "dva/saga";
import { message } from "antd";
import model from "./login";
import { queryLogin } from "../services/api";

jest.mock("../services/api", () => ({
  queryLogin: jest.fn(),
}));
jest.mock("antd", () => ({
  message: { destroy: jest.fn(), error: jest.fn() },
}));
jest.mock("../components/_utils/utils", () => ({
  defaultNamespaceId: "default",
}));

it("does not dereference an absent login response", async () => {
  queryLogin.mockResolvedValueOnce(undefined);
  const callback = jest.fn();

  await runSaga(
    { dispatch: jest.fn(), getState: () => ({ global: { namespaces: [] } }) },
    model.effects.login,
    { payload: { callback } },
    effects,
  ).done;

  expect(callback).toHaveBeenCalledWith(undefined);
  expect(message.error).toHaveBeenCalledWith("Login failed");
});

it("handles rejected login requests without dereferencing a response", async () => {
  const error = new Error("request failed");
  queryLogin.mockRejectedValueOnce(error);
  const callback = jest.fn();

  await runSaga(
    { dispatch: jest.fn(), getState: () => ({ global: { namespaces: [] } }) },
    model.effects.login,
    { payload: { callback } },
    effects,
  ).done;

  expect(callback).toHaveBeenCalledWith(undefined);
  expect(message.error).toHaveBeenCalledWith("request failed");
});
