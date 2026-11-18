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

import request from "../utils/request";
import { queryLogin, updatePassword } from "./api";

jest.mock("../utils/request", () => jest.fn().mockResolvedValue({ code: 200 }));
jest.mock("../utils/download", () => jest.fn());

const envelope = {
  version: 1,
  keyId: "fixture-key",
  wrappedKey: "wrapped",
  iv: "iv",
  ciphertext: "ciphertext",
};

beforeEach(() => request.mockClear());

it("sends only the encrypted envelope, excluding plaintext and local callback metadata", async () => {
  const accidental = { ...envelope, password: "Must-not-send1!" };
  await queryLogin({
    envelope: accidental,
    userName: "fixture-user",
    password: "Must-not-send1!",
    callback: jest.fn(),
  });
  expect(request).toHaveBeenLastCalledWith("./platform/login", {
    method: "POST",
    body: envelope,
  });
  await updatePassword({
    id: "user-1",
    envelope: accidental,
    oldPassword: "Old-fixture1!",
  });
  expect(request).toHaveBeenLastCalledWith(
    "./dashboardUser/modify-password/user-1",
    { method: "PUT", body: envelope },
  );
});

it("refuses plaintext-only password calls instead of silently downgrading", async () => {
  await expect(queryLogin({ password: "Fixture-only1!" })).rejects.toThrow(
    "Encrypted credentials required",
  );
  await expect(
    updatePassword({ id: "user-1", oldPassword: "Fixture-only1!" }),
  ).rejects.toThrow("Encrypted credentials required");
  expect(request).not.toHaveBeenCalled();
});
