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

import {
  Typography,
  Form,
  Input,
  Button,
  Radio,
  Row,
  Col,
  Tree,
  Empty,
  Tabs
} from "antd";
import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  createRef,
  useContext
} from "react";
import ReactJson from "react-json-view";
import fetch from "dva/fetch";
import { sandboxProxyGateway } from "../../../services/api";
import ApiContext from "./ApiContext";
import HeadersEditor from "./HeadersEditor";
import { getIntlContent } from "../../../utils/IntlUtils";
import AuthButton from "../../../utils/AuthButton";

const { Title, Text, Paragraph } = Typography;
const { TreeNode } = Tree;
const { TabPane } = Tabs;
const FormItem = Form.Item;

const FCForm = forwardRef(({ form, onSubmit }, ref) => {
  useImperativeHandle(ref, () => ({
    form
  }));

  const {
    apiDetail: { apiPath, httpMethodList, requestHeaders, requestParameters },
    apiData: { appKey, gatewayUrl, cookie }
  } = useContext(ApiContext);
  const [questJson, setRequestJson] = useState({});

  const handleSubmit = e => {
    e.preventDefault();
    ref.current.form.validateFieldsAndScroll((errors, values) => {
      if (!errors) {
        onSubmit({
          ...values,
          bizParam: questJson
        });
      }
    });
  };

  const createRequestJson = (params = []) => {
    const exampleJSON = {};
    const key = [];
    const loopExample = (data, obj) => {
      data.forEach(item => {
        const { name, refs, example, type } = item;
        key.push(name);
        switch (type) {
          case "array":
            if (Array.isArray(refs)) {
              obj[name] = [{}];
              key.push(0);
              loopExample(refs, obj[name][0]);
              key.pop();
            } else {
              obj[name] = [];
            }
            break;
          case "object":
            obj[name] = {};
            if (Array.isArray(refs)) {
              loopExample(refs, obj[name]);
            }
            break;
          default:
            obj[name] = example;
            break;
        }
        key.pop();
      });
    };

    loopExample(params, exampleJSON);
    setRequestJson(exampleJSON);
  };

  const renderTreeNode = (data, indexArr = []) => {
    return data.map((item, index) => {
      const { name, type, required, description } = item;
      const TreeTitle = (
        <>
          <Text strong>{name}</Text>
          &nbsp;<Text code>{type}</Text>
          &nbsp;
          {required ? (
            <Text type="danger">required</Text>
          ) : (
            <Text type="warning">optional</Text>
          )}
          &nbsp;<Text type="secondary">{description}</Text>
        </>
      );
      return (
        <TreeNode key={[...indexArr, index].join("-")} title={TreeTitle}>
          {item.refs && renderTreeNode(item.refs, [...indexArr, index])}
        </TreeNode>
      );
    });
  };

  const updateJson = obj => {
    setRequestJson(obj.updated_src);
  };

  useEffect(
    () => {
      createRequestJson(requestParameters);
    },
    [requestParameters]
  );

  return (
    <Form onSubmit={handleSubmit}>
      <Title level={4}>
        {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.REQUEST.INFORMATION")}
      </Title>
      <FormItem label={getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.ADDRESS")}>
        {form.getFieldDecorator("requestUrl", {
          initialValue: gatewayUrl + apiPath,
          rules: [{ type: "string", required: true }]
        })(<Input allowClear />)}
      </FormItem>
      <FormItem label="AppKey">
        {form.getFieldDecorator("appKey", {
          initialValue: appKey,
          rules: [{ type: "string" }]
        })(
          <Input
            allowClear
            placeholder=" If the current API requires signature authentication, this parameter is required"
          />
        )}
      </FormItem>
      <FormItem label="Cookie">
        {form.getFieldDecorator("cookie", {
          initialValue: cookie,
          rules: [{ type: "string" }]
        })(
          <Input
            allowClear
            placeholder="Fill in the real cookie value.(signature authentication and login free API ignore this item)"
          />
        )}
      </FormItem>

      <FormItem label="Headers">
        {form.getFieldDecorator("headers", {
          initialValue: requestHeaders || [],
          rules: [
            {
              validator: (rule, value, callback) => {
                const errorRow = value.find(
                  item => item.required && item.example === ""
                );
                if (errorRow) {
                  callback(`${errorRow.name} is required`);
                } else {
                  callback();
                }
              }
            }
          ]
        })(<HeadersEditor />)}
      </FormItem>

      <FormItem label={getIntlContent("SHENYU.COMMON.HTTP.METHOD")}>
        {form.getFieldDecorator("httpMethod", {
          initialValue: httpMethodList?.[0]?.toLocaleUpperCase(),
          rules: [{ type: "string", required: true }]
        })(
          <Radio.Group
            options={httpMethodList?.map(v => v.toLocaleUpperCase())}
          />
        )}
      </FormItem>
      <FormItem
        label={getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.REQUEST.PARAMETERS")}
        required
      />
      <Row gutter={16}>
        <Col span={14}>
          <ReactJson
            src={questJson}
            theme="monokai"
            displayDataTypes={false}
            name={false}
            onAdd={updateJson}
            onEdit={updateJson}
            onDelete={updateJson}
            style={{ borderRadius: 4, padding: 16 }}
          />
        </Col>
        <Col span={10}>
          <div
            style={{
              borderRadius: 4,
              border: "1px solid #e8e8e8",
              overflow: "auto",
              padding: 8
            }}
          >
            {requestParameters && (
              <Tree showLine defaultExpandAll>
                {renderTreeNode(requestParameters)}
              </Tree>
            )}
          </div>
        </Col>
      </Row>
      <AuthButton perms="document:apirun:send">
        <FormItem label=" " colon={false}>
          <Button htmlType="submit" type="primary">
            {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.SEND.REQUEST")}
          </Button>
        </FormItem>
      </AuthButton>
    </Form>
  );
});

const EnhancedFCForm = Form.create()(FCForm);

function ApiDebug() {
  const {
    apiDetail: { id }
  } = useContext(ApiContext);
  const [responseInfo, setResponseInfo] = useState({});
  const [activeKey, setActiveKey] = useState("2");

  const formRef = createRef();

  const handleSubmit = async values => {
    const { headers, ...params } = values;
    const headersObj = {};
    headers.forEach(item => {
      headersObj[item.name] = item.example;
    });
    params.headers = headersObj;
    fetch(sandboxProxyGateway(), {
      method: "POST",
      headers: {
        "X-Access-Token": sessionStorage.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    }).then(async response => {
      const data = await response.json();
      setResponseInfo({
        "sandbox-params": response.headers.get("sandbox-params"),
        "sandbox-beforesign": response.headers.get("sandbox-beforesign"),
        "sandbox-sign": response.headers.get("sandbox-sign"),
        body: data
      });
    });
  };

  useEffect(
    () => {
      setResponseInfo({});
      // eslint-disable-next-line no-unused-expressions
      formRef.current?.form.resetFields(["method", "headers"]);
      setActiveKey("2");
    },
    [id]
  );

  return (
    <>
      <EnhancedFCForm wrappedComponentRef={formRef} onSubmit={handleSubmit} />
      <Tabs
        type="card"
        activeKey={activeKey}
        onChange={key => setActiveKey(key)}
      >
        <TabPane
          tab={getIntlContent(
            "SHENYU.DOCUMENT.APIDOC.INFO.REQUEST.INFORMATION"
          )}
          key="1"
        >
          {Object.keys(responseInfo).length ? (
            <>
              <Paragraph>
                <Text strong>
                  {getIntlContent(
                    "SHENYU.DOCUMENT.APIDOC.CONTENTS.TO.BE.SIGNED"
                  )}
                </Text>
                <br />
                <Text code>
                  {responseInfo["sandbox-beforesign"] || "undefined"}
                </Text>
              </Paragraph>
              <Paragraph>
                <Text strong>
                  {getIntlContent("SHENYU.DOCUMENT.APIDOC.SIGNATURE")}
                </Text>
                <br />
                <Text code>{responseInfo["sandbox-sign"] || "undefined"}</Text>
              </Paragraph>
            </>
          ) : (
            <Empty description={false} />
          )}
        </TabPane>
        <TabPane
          tab={getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.REQUEST.RESULTS")}
          key="2"
        >
          {Object.keys(responseInfo).length ? (
            <ReactJson src={responseInfo.body} name={false} />
          ) : (
            <Empty description={false} />
          )}
        </TabPane>
      </Tabs>
    </>
  );
}

export default ApiDebug;
