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

// Shared conversion for plugin-template and namespace-plugin forms.
export function getConfigFieldValue(config, field, defaultValue) {
  const value = config ? config[field] : undefined;
  return value === undefined ? defaultValue : value;
}

export function serializePluginConfig({
  fields,
  values,
  config,
  jsonValues = {},
}) {
  if (!fields || fields.length === 0) {
    return values.config === undefined ? config : values.config;
  }
  // Merge edits into stored configuration so fields absent from the schema
  // survive a read/edit/write cycle.
  const stored =
    typeof config === "string" && config ? JSON.parse(config) : config;
  const result = { ...stored };
  fields.forEach(({ field }) => {
    const fieldName = `__${field}__`;
    if (Object.prototype.hasOwnProperty.call(values, fieldName)) {
      if (values[fieldName] === undefined) {
        delete result[field];
      } else {
        result[field] = values[fieldName];
      }
    }
    if (Object.prototype.hasOwnProperty.call(jsonValues, field)) {
      result[field] = jsonValues[field];
    }
  });
  return Object.keys(result).length ? JSON.stringify(result) : "";
}
