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

// Parses a stored string that is expected to hold a JSON object, without
// throwing. Null or empty input gives { value: undefined }; a JSON object
// gives { value }; malformed JSON, or valid JSON that is not an object, gives
// { error } so the caller can show the raw text or refuse to save over it
// instead of substituting an empty object.
export function parseJsonObject(text) {
  if (text === undefined || text === null || text === "") {
    return { value: undefined };
  }
  let value = text;
  if (typeof text === "string") {
    try {
      value = JSON.parse(text);
    } catch (e) {
      return { error: e.message };
    }
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "not a JSON object" };
  }
  return { value };
}

// Pretty-prints a stored JSON object for read-only views. Anything that is
// not a JSON object is returned as the original text so it renders literally.
export function formatJsonObject(text) {
  const { value, error } = parseJsonObject(text);
  if (error) {
    return String(text);
  }
  return JSON.stringify(value || {}, null, 4);
}
