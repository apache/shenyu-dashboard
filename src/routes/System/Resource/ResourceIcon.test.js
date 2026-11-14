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

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createHash } from "crypto";
import Icon from "./ResourceIcon";
import { iconMap } from "./IconModal";

it("preserves the resource catalog and legacy SVG glyphs", () => {
  const names = [
    ...Object.values(iconMap).flat(),
    "cross",
    "interation",
    "canlendar",
    "colum-height",
    "home-o",
    "home-fill",
    "home-twotone",
    "unknown-resource-icon",
  ];
  const glyphs = names.map((type) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderToStaticMarkup(<Icon type={type} />);
    const svg = wrapper.querySelector("svg");
    return [
      type,
      svg && svg.getAttribute("viewBox"),
      [...wrapper.querySelectorAll("path")].map((path) =>
        path.getAttribute("d"),
      ),
    ];
  });
  const digest = createHash("sha256")
    .update(JSON.stringify(glyphs))
    .digest("hex");
  expect(names).toHaveLength(373);
  // Captured from AntD 3 before migration: 365 choices plus aliases/unknown.
  expect(digest).toBe(
    "b69eb5fec063610e86d081c217b27cbadb82146ef007e4f9bf24840dc25e5fbf",
  );
});

it.each([
  null,
  undefined,
  "",
  "__proto__",
  "constructor",
  "unknown-resource-icon",
])("renders no icon for missing or unknown name %p", (type) => {
  expect(renderToStaticMarkup(<Icon type={type} />)).toBe("");
});
