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
import React from "react";
import { render } from "@testing-library/react";
import webpack from "webpack";
import configure from "../../webpack.config";

it("bundles the JSON viewer as a renderable component instead of an inline asset", async () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "shenyu-json-viewer-"),
  );
  const entry = path.join(directory, "entry.js");
  fs.writeFileSync(
    entry,
    'import Viewer from "@microlink/react-json-view"; export default Viewer;',
  );
  try {
    const config = configure({
      context: process.cwd(),
      target: "node",
      entry,
      output: {
        path: directory,
        filename: "viewer.js",
        chunkFilename: "[name].js",
        libraryTarget: "commonjs2",
      },
      resolve: {
        mainFields: ["module", "main"],
        modules: [path.resolve("node_modules")],
      },
      externals: { react: `commonjs ${require.resolve("react")}` },
      module: {
        rules: [
          // Match Roadhog's existing node_modules transpilation before Webpack 3 parses JS.
          {
            test: /\.jsx?$/,
            use: {
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                configFile: false,
                presets: [
                  [
                    require.resolve("babel-preset-umi"),
                    { targets: { ie: "11" } },
                  ],
                ],
              },
            },
          },
          {
            test: /\.mjs$/,
            use: {
              loader: require.resolve("url-loader"),
              options: { limit: 1024, mimetype: "application/javascript" },
            },
          },
        ],
      },
    });
    await new Promise((resolve, reject) => {
      webpack(config, (error, stats) => {
        if (error) reject(error);
        else if (stats.hasErrors())
          reject(new Error(stats.toString({ all: false, errors: true })));
        else resolve();
      });
    });
    // This module is generated during the test, so it cannot be imported statically.
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const Viewer = require(path.join(directory, "viewer.js")).default;
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
