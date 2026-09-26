import LoginPage from "./Login";

jest.mock("dva", () => ({
  connect: () => (Component) => Component,
}));
jest.mock("components/Login", () => {
  const Login = () => null;
  Login.UserName = () => null;
  Login.Password = () => null;
  Login.Submit = () => null;
  Login.VerifyCode = () => null;
  Login.LoginCode = () => null;
  return Login;
});
jest.mock("./loginSecret", () => ({
  ensureSecret: jest.fn().mockResolvedValue(true),
  getSecret: () => ({ key: "", iv: "" }),
}));
jest.mock("crypto-js", () => ({
  enc: { Utf8: { parse: jest.fn() } },
  AES: { encrypt: jest.fn() },
  mode: { CBC: {} },
  pad: { Pkcs7: {} },
}));
jest.mock("uuid", () => ({ v4: () => "client-id" }));

it("does not throw when the login callback receives no response", async () => {
  const page = new LoginPage({ dispatch: jest.fn() });
  page.setState = jest.fn();

  expect(() => page.handleLoginResponse(undefined)).not.toThrow();
  expect(() => page.handleLoginResponse(null)).not.toThrow();
  expect(page.setState).not.toHaveBeenCalled();
});
