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

import { flushSync } from "react-dom";
import Toast from "@douyinfe/semi-ui/lib/es/toast";
import Notification from "@douyinfe/semi-ui/lib/es/notification";

// Only the feedback API used by the dashboard is retained. Semi has no
// maxCount option, so keep the configured bound explicitly across callers.
let maxCount;
const active = new Set();
Toast.config({ duration: 3 });

function show(type, content) {
  if (maxCount > 0 && active.size >= maxCount) {
    const oldest = active.values().next().value;
    active.delete(oldest);
    flushSync(() => Toast.close(oldest));
  }
  let id;
  // Semi updates an imperative React root. Commit each operation before the
  // next one so a batched burst cannot resurrect an evicted message.
  flushSync(() => {
    id = Toast[type]({ content, onClose: () => active.delete(id) });
  });
  active.add(id);
}

export const message = {
  success: (content) => show("success", content),
  error: (content) => show("error", content),
  warn: (content) => show("warning", content),
  warning: (content) => show("warning", content),
  config: ({ maxCount: limit, ...options }) => {
    if (limit !== undefined) maxCount = limit;
    Toast.config(options);
  },
  destroy: () => {
    active.clear();
    Toast.destroyAll();
  },
};

export const notification = {
  error: ({ message: title, description: content, ...options }) =>
    Notification.error({ title, content, duration: 4.5, ...options }),
  destroy: () => Notification.destroyAll(),
};
