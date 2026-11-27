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

const LOCALE_KEY = "locale";

/** The language the user picked in the language switcher, if any. */
export function getStoredLocale() {
  try {
    return window.localStorage.getItem(LOCALE_KEY);
  } catch (e) {
    return null;
  }
}

/** Remember an explicit choice from the language switcher. */
export function setStoredLocale(locale) {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch (e) {
    // Storage can be unavailable (e.g. blocked); the choice then lasts for this page only.
  }
}

/** The dashboard locale that matches the browser language. */
export function getBrowserLocale() {
  const browserLanguage = window.navigator.language || "";
  return browserLanguage.startsWith("zh") ? "zh-CN" : "en-US";
}

/**
 * The locale to show: the user's explicit choice, otherwise the browser
 * language. The browser fallback is never stored, so the dashboard keeps
 * following the browser until the user picks a language.
 */
export function getLocale() {
  return getStoredLocale() || getBrowserLocale();
}
