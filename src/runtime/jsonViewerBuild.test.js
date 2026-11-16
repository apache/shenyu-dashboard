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

import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import React from "react";
import { render } from "@testing-library/react";

it("bundles the JSON viewer ESM entry as a renderable component", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "shenyu-json-viewer-"),
  );
  const entry = path.join(directory, "entry.js");
  fs.writeFileSync(
    entry,
    `export { default } from ${JSON.stringify(path.resolve("node_modules/@microlink/react-json-view/index.mjs"))};`,
  );
  try {
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
      import { build } from "vite";
      await build({ configFile: false, logLevel: "silent", build: {
        outDir: ${JSON.stringify(directory)}, emptyOutDir: false,
        lib: { entry: ${JSON.stringify(entry)}, formats: ["cjs"], fileName: () => "viewer.cjs" },
        rollupOptions: { external: ["react"], output: { exports: "named" } },
      } });
    `,
      ],
      { cwd: process.cwd(), stdio: "pipe" },
    );
    // The generated module must resolve the same React instance as the test root.
    fs.symlinkSync(
      path.resolve("node_modules"),
      path.join(directory, "node_modules"),
      "dir",
    );
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const Viewer = require(path.join(directory, "viewer.cjs")).default;
    const view = render(
      <Viewer src={{ count: 0, flag: false }} enableClipboard={false} />,
    );
    expect(view.container.textContent).toContain("count");
    expect(view.container.textContent).toContain("false");
    view.unmount();
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}, 20000);
