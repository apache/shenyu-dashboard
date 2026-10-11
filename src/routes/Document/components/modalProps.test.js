/* eslint-disable react/forbid-foreign-prop-types */
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

import AddAndUpdateApiDoc from "./AddAndUpdateApiDoc";
import AddAndUpdateTag from "./AddAndUpdateTag";

jest.mock("../../../services/api", () => ({
  addApi: jest.fn(),
  updateApi: jest.fn(),
  addTag: jest.fn(),
  updateTag: jest.fn(),
}));

describe("AddAndUpdateApiDoc and AddAndUpdateTag props", () => {
  it("should have correct propTypes and defaultProps on AddAndUpdateApiDoc", () => {
    const Component = AddAndUpdateApiDoc.WrappedComponent;
    expect(Component.propTypes).toBeDefined();
    expect(typeof Component.propTypes.form).toBe("function");
    expect(typeof Component.propTypes.visible).toBe("function");
    expect(typeof Component.propTypes.formLoaded).toBe("function");
    expect(typeof Component.propTypes.onOk).toBe("function");
    expect(typeof Component.propTypes.onCancel).toBe("function");

    expect(Component.defaultProps).toBeDefined();
    expect(Component.defaultProps.visible).toBe(false);
    expect(Component.defaultProps.form).toBeNull();
    expect(typeof Component.defaultProps.formLoaded).toBe("function");
    expect(typeof Component.defaultProps.onOk).toBe("function");
    expect(typeof Component.defaultProps.onCancel).toBe("function");
  });

  it("should have correct propTypes and defaultProps on AddAndUpdateTag", () => {
    const Component = AddAndUpdateTag.WrappedComponent;
    expect(Component.propTypes).toBeDefined();
    expect(typeof Component.propTypes.form).toBe("function");
    expect(typeof Component.propTypes.visible).toBe("function");
    expect(typeof Component.propTypes.formLoaded).toBe("function");
    expect(typeof Component.propTypes.onOk).toBe("function");
    expect(typeof Component.propTypes.onCancel).toBe("function");

    expect(Component.defaultProps).toBeDefined();
    expect(Component.defaultProps.visible).toBe(false);
    expect(Component.defaultProps.form).toBeNull();
    expect(typeof Component.defaultProps.formLoaded).toBe("function");
    expect(typeof Component.defaultProps.onOk).toBe("function");
    expect(typeof Component.defaultProps.onCancel).toBe("function");
  });
});
