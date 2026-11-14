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
import SemiInput from "@douyinfe/semi-ui/lib/es/input";
import SemiTextArea from "@douyinfe/semi-ui/lib/es/input/textarea";
import styles from "./Input.module.less";

function inputEvent(value, event, props) {
  return {
    ...event,
    target: { value, name: props.name, id: props.id },
    currentTarget: { value, name: props.name, id: props.id },
    preventDefault: () => event?.preventDefault(),
    stopPropagation: () => event?.stopPropagation(),
    persist: () => event?.persist?.(),
  };
}

const Input = React.forwardRef(
  ({ allowClear, onChange, onPressEnter, ...props }, ref) => (
    <SemiInput
      {...props}
      className={[styles.input, props.className].filter(Boolean).join(" ")}
      ref={ref}
      showClear={allowClear}
      onEnterPress={onPressEnter}
      onChange={(value, event) =>
        onChange && onChange(inputEvent(value, event, props))
      }
    />
  ),
);
Input.displayName = "Input";
Input.Password = React.forwardRef((props, ref) => (
  <Input {...props} ref={ref} mode="password" />
));
Input.Password.displayName = "Password";
Input.TextArea = React.forwardRef(
  ({ allowClear, autoSize, onChange, onPressEnter, ...props }, ref) => (
    <SemiTextArea
      {...props}
      className={[styles.input, props.className].filter(Boolean).join(" ")}
      ref={ref}
      showClear={allowClear}
      autosize={autoSize}
      onEnterPress={onPressEnter}
      onChange={(value, event) =>
        onChange && onChange(inputEvent(value, event, props))
      }
    />
  ),
);
Input.TextArea.displayName = "TextArea";
export default Input;
