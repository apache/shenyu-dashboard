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
  getBrowserLocale,
  getLocale,
  getStoredLocale,
  setStoredLocale,
} from "./localePreference";

function setBrowserLanguage(value) {
  Object.defineProperty(window.navigator, "language", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  window.localStorage.removeItem("locale");
  delete window.navigator.language;
});

it("maps the browser language to a dashboard locale", () => {
  setBrowserLanguage("zh-TW");
  expect(getBrowserLocale()).toBe("zh-CN");
  setBrowserLanguage("fr-FR");
  expect(getBrowserLocale()).toBe("en-US");
});

it("follows the browser language until a choice is stored, without storing it", () => {
  setBrowserLanguage("zh-CN");
  expect(getLocale()).toBe("zh-CN");
  expect(getStoredLocale()).toBeNull();
  setBrowserLanguage("en-GB");
  expect(getLocale()).toBe("en-US");
});

it("prefers the stored choice over the browser language", () => {
  setBrowserLanguage("zh-CN");
  setStoredLocale("en-US");
  expect(window.localStorage.getItem("locale")).toBe("en-US");
  expect(getLocale()).toBe("en-US");
});
