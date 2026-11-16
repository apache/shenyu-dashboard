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

// Admin serves /static/** anonymously, including the login route's chunks.
export default (config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve && config.resolve.alias),
      // Webpack 3's asset rule treats the package's .mjs entry as a data URL.
      // Node resolves its supported CommonJS export; remove with the builder migration.
      "@microlink/react-json-view$": require.resolve(
        "@microlink/react-json-view",
      ),
    },
  },
  output: {
    ...config.output,
    chunkFilename: `static/${config.output.chunkFilename}`,
  },
});
