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

const path = require("path");

const adminChunks = [
  "layout-main",
  "route-mcp",
  "route-home",
  "route-discovery",
  "route-plugin",
  "route-api-keys",
  "route-role",
  "route-user",
  "route-resource",
  "route-alert",
  "route-scale",
  "route-namespace",
  "route-metadata",
  "route-plugin-config",
  "route-instance",
  "route-registry",
  "route-namespace-plugin",
  "route-plugin-handle",
  "route-appauth",
  "route-dict",
];

export default {
  es5ImcompatibleVersions: true,
  extraBabelIncludes: ["node_modules"],
  entry: "./src/index.js",
  extraBabelPlugins: [
    ["import", { libraryName: "antd", libraryDirectory: "es", style: true }],
  ],
  alias: {
    components: path.resolve(__dirname, "src/components/"),
  },
  ignoreMomentLocale: true,
  theme: "./src/theme.js",
  html: {
    template: "./src/index.ejs",
  },
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  // Keep public routes and unrelated editor dependencies out of shared downloads.
  commons: [
    {
      name: "index",
      chunks: adminChunks,
      async: "route-shared",
      minChunks(module, count) {
        return (
          count >= 4 &&
          module
            .getChunks()
            .some(
              (chunk) =>
                chunk.name === "layout-main" || chunk.name === "route-metadata",
            )
        );
      },
    },
    {
      name: "index",
      chunks: adminChunks,
      async: "admin-shared",
      minChunks: 4,
    },
    {
      name: "index",
      chunks: [
        "metadata-modal",
        "metadata-table",
        "mcp-tools-modal",
        "appauth-resources",
      ],
      async: "semi-shared",
      minChunks: 4,
    },
    {
      name: "index",
      chunks: ["metadata-modal", "mcp-tools-modal", "appauth-resources"],
      async: "editor-shared",
      minChunks: 3,
    },
    {
      name: "index",
      chunks: ["metadata-modal", "mcp-tools-modal"],
      async: "form-shared",
      minChunks: 2,
    },
    {
      name: "index",
      chunks: ["metadata-table", "appauth-resources"],
      async: "table-shared",
      minChunks: 2,
    },
  ],
  publicPath: "",
  hash: true,
  proxy: {
    "/": {
      target: "http://localhost:9095",
      changeOrigin: true,
      pathRewrite: { "^/": "" },
    },
  },
};
