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
import * as definitions from "@ant-design/icons/lib/dist";
import styles from "./ResourceIcon.module.less";

// Resource names are persisted by Admin. Retain the existing outline artwork
// without depending on AntD's React-16-only icon component.
const icons = new Map(
  Object.values(definitions)
    .filter((definition) => definition.theme === "outline")
    .map((definition) => [definition.name, definition.icon]),
);
const aliases = {
  cross: "close",
  interation: "interaction",
  canlendar: "calendar",
  "colum-height": "column-height",
};

export default function ResourceIcon({ type = "", className, ...props }) {
  const name =
    typeof type === "string" ? type.replace(/(-o|-fill|-twotone)$/, "") : "";
  const icon = icons.get(aliases[name] || name);
  if (!icon) return null;
  return (
    <svg
      {...icon.attrs}
      {...props}
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={[styles.icon, type === "loading" && styles.spin, className]
        .filter(Boolean)
        .join(" ")}
    >
      {icon.children.map((path, index) => (
        <path key={index} {...path.attrs} />
      ))}
    </svg>
  );
}
