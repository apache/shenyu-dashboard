import LoginPage from "./Login";
import { encryptCredentials } from "../../utils/passwordEncryption";
import { message } from "../../components/ui/feedback";

jest.mock("react-redux", () => ({
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
jest.mock("../../utils/passwordEncryption", () => ({
  encryptCredentials: jest.fn(),
}));
jest.mock("../../components/ui/feedback", () => ({
  message: { error: jest.fn() },
}));
jest.mock("uuid", () => ({ v4: () => "client-id" }));
jest.mock("../../utils/IntlUtils", () => ({ getIntlContent: (key) => key }));

const envelope = {
  version: 1,
  keyId: "fixture-key",
  wrappedKey: "wrapped",
  iv: "iv",
  ciphertext: "ciphertext",
};
beforeEach(() => {
  encryptCredentials.mockReset().mockResolvedValue(envelope);
  message.error.mockClear();
});

function mountPage() {
  const dispatch = jest.fn().mockResolvedValue(undefined);
  const instance = new LoginPage({ dispatch });
  instance.setState = jest.fn();
  instance.componentDidMount();
  return { instance, dispatch };
}

it("encrypts before dispatch and excludes plaintext from the login action", async () => {
  const { instance, dispatch } = mountPage();
  await instance.handleSubmit(null, {
    userName: "fixture-user",
    password: "Fixture-only1!",
  });
  expect(encryptCredentials).toHaveBeenCalledWith(
    {
      userName: "fixture-user",
      password: "Fixture-only1!",
      clientId: "clientid",
    },
    "login",
  );
  expect(dispatch.mock.calls[0][0].payload).toEqual({
    envelope,
    callback: expect.any(Function),
  });
  expect(JSON.stringify(dispatch.mock.calls)).not.toContain("Fixture-only1!");
});

it("blocks duplicate encryption attempts and discards a result after unmount", async () => {
  let resolve;
  encryptCredentials.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const { instance, dispatch } = mountPage();
  const pending = instance.handleSubmit(null, {
    userName: "fixture-user",
    password: "Fixture-only1!",
  });
  await instance.handleSubmit(null, {
    userName: "fixture-user",
    password: "Fixture-only1!",
  });
  expect(encryptCredentials).toHaveBeenCalledTimes(1);
  instance.componentWillUnmount();
  resolve(envelope);
  await pending;
  expect(dispatch).not.toHaveBeenCalled();
});

it("does not dispatch credentials when encryption is unavailable", async () => {
  encryptCredentials.mockRejectedValueOnce(new Error("unavailable"));
  const { instance, dispatch } = mountPage();
  await instance.handleSubmit(null, {
    userName: "fixture-user",
    password: "Fixture-only1!",
  });
  expect(dispatch).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledWith(
    "SHENYU.PASSWORD.ENCRYPTION.FAILED",
  );
});

it("does not throw when the login callback receives no response", async () => {
  const page = new LoginPage({ dispatch: jest.fn() });
  page.setState = jest.fn();

  expect(() => page.handleLoginResponse(undefined)).not.toThrow();
  expect(() => page.handleLoginResponse(null)).not.toThrow();
  expect(page.setState).not.toHaveBeenCalled();
});
