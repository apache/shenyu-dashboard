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

import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { message, notification } from "./feedback";

afterEach(() => {
  act(() => {
    message.destroy();
    notification.destroy();
  });
});

it("retains only the newest three messages and clears them on destroy", async () => {
  message.config({ duration: 0, top: 200, maxCount: 3 });
  act(() => {
    message.warn("First warning");
    message.warning("Second warning");
    message.success("Saved successfully");
    message.error("Request failed");
  });
  // jsdom does not run CSS animations; finish Semi's exit transition.
  const evicted = screen.queryByText("First warning");
  if (evicted) fireEvent.animationEnd(evicted.closest("[role=alert]"));
  await waitFor(() => expect(screen.queryByText("First warning")).toBeNull());
  expect(screen.getByText("Second warning")).toBeTruthy();
  expect(screen.getByText("Saved successfully")).toBeTruthy();
  expect(screen.getByText("Request failed")).toBeTruthy();
  act(() => message.destroy());
  await waitFor(() => expect(screen.queryByText("Request failed")).toBeNull());
});

it("respects configured auto-dismiss duration", async () => {
  message.config({ duration: 0.02, maxCount: 3 });
  act(() => message.success("Brief success"));
  expect(screen.getByText("Brief success")).toBeTruthy();
  await waitFor(() =>
    expect(
      screen.getByText("Brief success").closest("[role=alert]").className,
    ).toContain("animation-hide"),
  );
  fireEvent.animationEnd(
    screen.getByText("Brief success").closest("[role=alert]"),
  );
  await waitFor(() => expect(screen.queryByText("Brief success")).toBeNull());
});

it("renders both the error title and its detailed description", async () => {
  act(() => {
    notification.error({
      message: "Session expired",
      description: "Please sign in again",
      duration: 0,
    });
  });
  expect(await screen.findByText("Session expired")).toBeTruthy();
  expect(screen.getByText("Please sign in again")).toBeTruthy();
});
