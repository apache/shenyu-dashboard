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

import { disposeCharts, resizeCharts } from "./index";

describe("Instance chart lifecycle", () => {
  it("resizes each initialized chart once", () => {
    const pie = { resize: jest.fn() };
    const line = { resize: jest.fn() };

    resizeCharts(pie, null, line);

    expect(pie.resize).toHaveBeenCalledTimes(1);
    expect(line.resize).toHaveBeenCalledTimes(1);
  });

  it("disposes each initialized chart once", () => {
    const pie = { dispose: jest.fn() };
    const line = { dispose: jest.fn() };

    disposeCharts(pie, undefined, line);

    expect(pie.dispose).toHaveBeenCalledTimes(1);
    expect(line.dispose).toHaveBeenCalledTimes(1);
  });
});
