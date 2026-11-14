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

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
} from "react";
import get from "lodash/get";
import set from "lodash/set";
import isPlainObject from "lodash/isPlainObject";
import { Form as SemiForm } from "@douyinfe/semi-ui/lib/es/form";
import withField from "@douyinfe/semi-ui/lib/es/form/hoc/withField";
import Row from "@douyinfe/semi-ui/lib/es/grid/row";

const FormOwner = createContext(null);

const BoundControl = React.forwardRef(
  (
    {
      control,
      value,
      onChange,
      onBlur,
      valuePropName = "value",
      changeTrigger = "onChange",
      ...props
    },
    ref,
  ) => {
    const change = (...args) => {
      if (control.props[changeTrigger]) control.props[changeTrigger](...args);
      const event = args[0];
      const next =
        event && event.target
          ? event.target[valuePropName === "checked" ? "checked" : "value"]
          : valuePropName === "fileList" && event && event.fileList
            ? event.fileList
            : event;
      onChange(next);
    };
    return React.cloneElement(control, {
      ...props,
      disabled:
        control.props.disabled === undefined
          ? props.disabled
          : control.props.disabled,
      ref: ref || control.ref,
      [valuePropName]: value,
      [changeTrigger]: change,
      onBlur: (...args) => {
        if (control.props.onBlur) control.props.onBlur(...args);
        if (onBlur) onBlur(...args);
      },
    });
  },
);
BoundControl.displayName = "BoundControl";
const Field = withField(BoundControl, {
  valueKey: "value",
  onKeyChangeFnName: "onChange",
  shouldMemo: false,
});

function subset(values, names) {
  if (!names) return values;
  return names.reduce(
    (result, name) => set(result, name, get(values, name)),
    {},
  );
}

function mergeValues(current, patch) {
  Object.keys(patch).forEach((name) => {
    const value = patch[name];
    const previous = get(current, name);
    set(
      current,
      name,
      isPlainObject(value)
        ? mergeValues(isPlainObject(previous) ? previous : {}, value)
        : value,
    );
  });
  return current;
}

function createOwner(notify) {
  const fields = new Map();
  const owner = { api: null, active: true, notify, pending: {} };
  const values = () => (owner.api ? owner.api.getValues() : owner.pending);
  const validate = (scroll, ...args) => {
    const names = Array.isArray(args[0]) ? args[0] : undefined;
    const callback = args.find((argument) => typeof argument === "function");
    if (!owner.api) throw new Error("Render Form before validating its fields");
    const pending = owner.api.validate(names).then(
      (result) => {
        const selected = subset(result, names);
        if (owner.active && callback) callback(null, selected);
        return selected;
      },
      (errors) => {
        if (owner.active && scroll) {
          const first = [...fields.keys()].find((name) => get(errors, name));
          if (first) owner.api.scrollToField(first);
        }
        if (callback) {
          if (owner.active) callback(errors, subset(values(), names));
          return undefined;
        }
        throw errors;
      },
    );
    // Callers also use validateFields only to update inline errors.
    pending.catch(() => {});
    return pending;
  };
  owner.form = {
    getFieldDecorator: (field, options = {}) => {
      fields.set(field, options);
      return (control) => (
        <Field
          field={field}
          initValue={options.initialValue}
          rules={options.rules}
          keepState={options.preserve}
          valuePropName={options.valuePropName || "value"}
          changeTrigger={options.trigger || "onChange"}
          control={control}
          noLabel
        />
      );
    },
    validateFields: (...args) => validate(false, ...args),
    validateFieldsAndScroll: (...args) => validate(true, ...args),
    getFieldValue: (name) =>
      owner.api ? owner.api.getValue(name) : fields.get(name)?.initialValue,
    getFieldsValue: (names) => subset(values(), names),
    setFieldsValue: (next) => {
      if (owner.api)
        owner.api.setValues(mergeValues(owner.api.getValues(), next));
      else owner.pending = mergeValues(owner.pending, next);
    },
    resetFields: (names) => owner.api && owner.api.reset(names),
  };
  return owner;
}

function Form({
  children,
  onSubmit,
  layout = "horizontal",
  onValueChange,
  ...props
}) {
  const owner = useContext(FormOwner);
  return (
    <SemiForm
      {...props}
      layout={layout === "inline" ? "horizontal" : "vertical"}
      labelPosition={layout === "vertical" ? "top" : "left"}
      allowEmpty
      autoScrollToError
      getFormApi={(api) => {
        if (owner) owner.api = api;
      }}
      initValues={owner?.pending}
      onValueChange={(values, changed) => {
        if (owner?.active) owner.notify();
        if (onValueChange) onValueChange(values, changed);
      }}
      onSubmit={(values, event) =>
        onSubmit && onSubmit(event || { preventDefault() {} })
      }
      onSubmitFail={(errors, values, event) =>
        onSubmit && onSubmit(event || { preventDefault() {} })
      }
    >
      {children}
    </SemiForm>
  );
}

function Item({ children, label, style, help, validateStatus, ...props }) {
  if (React.isValidElement(children) && children.type === Field) {
    const field = React.cloneElement(children, {
      ...props,
      label,
      noLabel: !label,
      fieldStyle: style,
      helpText: help,
      validateStatus,
    });
    return props.labelCol && props.wrapperCol ? <Row>{field}</Row> : field;
  }
  return (
    <SemiForm.Slot
      label={label}
      noLabel={!label}
      style={style}
      error={validateStatus === "error" ? help : undefined}
    >
      {children}
    </SemiForm.Slot>
  );
}

Form.Item = Item;
Form.create = () => (Component) => {
  function WithForm(props) {
    const [, notify] = useReducer((value) => value + 1, 0);
    const identity =
      props.id || props.detail?.id || props.namespaceId || "create";
    const owner = useMemo(() => createOwner(notify), [identity]);
    useLayoutEffect(() => {
      owner.active = true;
      return () => {
        owner.active = false;
      };
    }, [owner]);
    return (
      <FormOwner.Provider key={identity} value={owner}>
        <Component
          {...props}
          form={{ ...owner.form }}
          ref={props.wrappedComponentRef}
        />
      </FormOwner.Provider>
    );
  }
  WithForm.displayName = `WithForm(${Component.displayName || Component.name || "Component"})`;
  WithForm.WrappedComponent = Component.WrappedComponent || Component;
  return WithForm;
};

export default Form;
