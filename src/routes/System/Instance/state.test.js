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

import Instance from "./index";
import enUS from "../../../locales/en-US.json";
import zhCN from "../../../locales/zh-CN.json";

jest.mock("dva", () => ({ connect: () => (component) => component }));
jest.mock("../../../utils/IntlUtils", () => ({
  getCurrentLocale: jest.fn(),
  getIntlContent: (key) => key,
}));

describe("Instance state column", () => {
  let renderState;

  beforeEach(() => {
    const instance = new Instance({});
    instance.setState = (update) => {
      instance.state = { ...instance.state, ...update };
    };
    instance.initInstanceColumns();
    renderState = instance.state.columns.find(
      (column) => column.dataIndex === "instanceState",
    ).render;
  });

  it.each([
    [0, "DELETED"],
    [1, "ONLINE"],
    [2, "OFFLINE"],
  ])("renders persisted state %s as %s", (code, name) => {
    const tag = renderState(code);
    expect(tag.props.children).toBe(`SHENYU.INSTANCE.SELECT.STATE.${name}`);
  });

  it.each([null, undefined, -1, 3, 99, "0"])(
    "renders unrecognized state %s as unknown",
    (code) => {
      expect(renderState(code).props.children).toBe(
        "SHENYU.INSTANCE.SELECT.STATE.UNKNOWN",
      );
    },
  );

  it("defines deleted and unknown as separate localized labels", () => {
    expect(enUS["SHENYU.INSTANCE.SELECT.STATE.DELETED"]).toBe("Deleted");
    expect(zhCN["SHENYU.INSTANCE.SELECT.STATE.DELETED"]).toBe("已删除");
    expect(enUS["SHENYU.INSTANCE.SELECT.STATE.UNKNOWN"]).toBe("Unknown");
    expect(zhCN["SHENYU.INSTANCE.SELECT.STATE.UNKNOWN"]).toBe("未知");
  });
});
