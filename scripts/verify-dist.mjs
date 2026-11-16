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

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const directory = path.resolve("dist");
const html = fs.readFileSync(path.join(directory, "index.html"), "utf8");
const manifest = JSON.parse(
  fs.readFileSync(path.join(directory, ".vite/manifest.json"), "utf8"),
);
assert.match(html, /th:text="\$\{domain\}"/);
assert.match(html, /id="httpPath"/);
assert.match(html, /type="module"/);
const entries = Object.values(manifest);
assert(
  entries.some((entry) => entry.isEntry),
  "Missing application entry",
);
assert(
  entries.some((entry) => entry.isDynamicEntry),
  "Lazy routes were not emitted",
);
function verifyAsset(file) {
  assert(
    file.startsWith("static/") && !file.includes(".."),
    `Asset not anonymously served by Admin: ${file}`,
  );
  assert(fs.existsSync(path.join(directory, file)), `Missing asset: ${file}`);
}
const initialCss = entries
  .filter((entry) => entry.isEntry)
  .flatMap((entry) => entry.css || [])
  .map((file) => fs.readFileSync(path.join(directory, file), "utf8"))
  .join("\n");
assert(
  initialCss.includes("--semi-color-primary:"),
  "Semi theme tokens must load with the entry, before lazy routes",
);
for (const entry of entries) {
  verifyAsset(entry.file);
  for (const file of [...(entry.css || []), ...(entry.assets || [])])
    verifyAsset(file);
  for (const key of [...(entry.imports || []), ...(entry.dynamicImports || [])])
    assert(manifest[key], `Missing import: ${key}`);
}
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const url = match[1];
  assert(
    !url.startsWith("/"),
    `Root-absolute asset breaks subpath deployment: ${url}`,
  );
  assert(
    fs.existsSync(path.resolve(directory, url)),
    `Missing HTML asset: ${url}`,
  );
}
console.log(
  `Verified ${entries.length} manifest entries, relative assets and Admin template binding.`,
);
