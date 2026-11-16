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

import { getMenuData } from "./menu";
import { getIntlContent } from "../utils/IntlUtils";

jest.mock("../utils/IntlUtils", () => ({ getIntlContent: jest.fn(() => "") }));

it("translates menu labels when requested after locale initialization", () => {
  getIntlContent.mockImplementation((key) => `translated:${key}`);
  const menus = getMenuData();
  expect(menus[0].name).toBe("translated:SHENYU.MENU.PLUGIN.LIST");
  expect(menus[1].children[0].name).toBe(
    "translated:SHENYU.MENU.SYSTEM.MANAGMENT.ROLE",
  );
  getIntlContent.mockImplementation((key) => `next:${key}`);
  expect(getMenuData()[0].name).toBe("next:SHENYU.MENU.PLUGIN.LIST");
});
