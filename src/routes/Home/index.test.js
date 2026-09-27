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

import { routerRedux } from "dva/router";
import ConnectedHome from "./index";

jest.mock("../../services/api", () => ({
  activePluginSnapshotByNamespace: jest.fn(() => Promise.resolve()),
  getNewEventRecodLogList: jest.fn(() => Promise.resolve()),
}));
jest.mock("../../utils/IntlUtils", () => ({
  getIntlContent: (key) => key,
}));

const Home = ConnectedHome.WrappedComponent;

it("navigates plugin tags with an absolute route", () => {
  const dispatch = jest.fn();
  const component = new Home({ dispatch });

  component.pluginOnClick({ role: "Mcp", name: "mcpServer" });

  expect(dispatch).toHaveBeenCalledWith(
    routerRedux.push("/plug/Mcp/mcpServer"),
  );
});
