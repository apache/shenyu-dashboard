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

import { execFileSync } from "child_process";
import path from "path";
import { waitFor, screen } from "@testing-library/react";

it("renders the real lazy table from a Vite production bundle", async () => {
  // Babel/Jest marks import() namespaces with __esModule; Vite does not.
  // Execute the production transform with the real loader and Semi table.
  const root = path.resolve(__dirname, "../../../..");
  const source = `
    import React from "react";
    import { createRoot } from "react-dom/client";
    import MetadataTableLoader from "./src/routes/System/Metadata/MetadataTableLoader";
    import { initIntl } from "./src/utils/IntlUtils";
    initIntl("en-US");
    window.metadataRuntimeRoot = createRoot(document.getElementById("metadata-runtime"));
    window.metadataRuntimeRoot.render(React.createElement(MetadataTableLoader, {
      columns: [{ title: "Path", dataIndex: "path" }],
      dataSource: [{ id: "metadata", path: "/production/metadata" }],
      currentPage: 1, pageSize: 12, total: 1,
      onPageChange() {}, onPageSizeChange() {}
    }));
  `;
  const bundle = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { build } from "vite";
       const source = ${JSON.stringify(source)};
       const entry = "${root}/metadata-runtime.jsx";
       const result = await build({
         logLevel: "silent",
         plugins: [{
           name: "metadata-runtime-fixture",
           resolveId(id) { if (id === entry) return entry; },
           load(id) { if (id === entry) return source; }
         }],
         build: {
           write: false,
           rollupOptions: {
             input: entry,
             output: { format: "iife", inlineDynamicImports: true }
           }
         }
       });
       process.stdout.write(result.output.find(asset => asset.type === "chunk").code);`,
    ],
    {
      cwd: root,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: "production" },
    },
  ).toString();
  const container = document.createElement("div");
  container.id = "metadata-runtime";
  document.body.appendChild(container);
  try {
    window.eval(bundle); // eslint-disable-line no-eval
    await waitFor(() => {
      expect(
        screen.getByRole("gridcell", { name: "/production/metadata" }),
      ).toBeTruthy();
      expect(screen.getByRole("grid")).toBeTruthy();
    });
  } finally {
    window.metadataRuntimeRoot?.unmount();
    delete window.metadataRuntimeRoot;
    container.remove();
  }
}, 30000);
