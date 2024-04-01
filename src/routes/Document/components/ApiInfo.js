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

import { Typography, Table, Tabs, Icon, Row, Col, Button } from "antd";
import React, { useContext } from "react";
import ApiDebug from "./ApiDebug";
import ApiContext from "./ApiContext";
import { getIntlContent } from "../../../utils/IntlUtils";
import { Method } from "./globalData";

const { Title, Text, Paragraph } = Typography;

function ApiInfo(props) {
  const {
    apiData: { envProps = [] },
    apiDetail,
    apiDetail: { document, responseParameters, requestHeaders },
  } = useContext(ApiContext);
  const { handleUpdate, handleDelete } = props;
  let requestParameters = apiDetail.requestParameters;
  let documentJSON = {};
  try {
    documentJSON = JSON.parse(document);
    documentJSON.errorCode = [];
    Object.keys(documentJSON.responses).forEach((key) => {
      documentJSON.errorCode.push({
        code: key,
        description: documentJSON.responses[key].description,
        content: documentJSON.responses[key].content,
      });
    });
    requestParameters = requestParameters ?? documentJSON.parameters;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }

  const columns = [
    {
      title: getIntlContent("SHENYU.PLUGIN.SELECTOR.LIST.COLUMN.NAME"),
      dataIndex: "name",
    },
    {
      title: getIntlContent("SHENYU.COMMON.TYPE"),
      dataIndex: "type",
    },
    {
      title: getIntlContent("SHENYU.COMMON.REQUIRED"),
      dataIndex: "required",
      render: (v) =>
        v ? (
          <Text type="danger">{getIntlContent("SHENYU.COMMON.YES")}</Text>
        ) : (
          getIntlContent("SHENYU.COMMON.NO")
        ),
    },
    {
      title: getIntlContent("SHENYU.COMMON.MAX.LENGTH"),
      dataIndex: "maxLength",
    },
    {
      title: getIntlContent("SHENYU.PLUGIN.DESCRIBE"),
      dataIndex: "description",
    },
    {
      title: getIntlContent("SHENYU.COMMON.MAX.EXAMPLE"),
      dataIndex: "example",
    },
  ];

  const errorCodeColumns = [
    {
      title: "Code",
      dataIndex: "code",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "Content",
      dataIndex: "content",
      render: (v) => JSON.stringify(v),
    },
  ];

  const defaultCommonData = [
    {
      id: 1,
      name: "code",
      type: "integer",
      description: getIntlContent(
        "SHENYU.DOCUMENT.APIDOC.INFO.COMMON.RESPONSE.CODE",
      ),
      example: "200",
    },
    {
      id: 2,
      name: "message",
      type: "string",
      description: getIntlContent(
        "SHENYU.DOCUMENT.APIDOC.INFO.COMMON.RESPONSE.DESCRIPTION",
      ),
      example: getIntlContent(
        "SHENYU.DOCUMENT.APIDOC.INFO.COMMON.RESPONSE.DESCRIPTION_EXAMPLE",
      ),
    },
    {
      id: 3,
      name: "data",
      type: "object",
      description: getIntlContent(
        "SHENYU.DOCUMENT.APIDOC.INFO.COMMON.RESPONSE.RESULTS",
      ),
      example: '{"id":"1988771289091030"}',
    },
  ];

  const envPropsColumns = [
    {
      title: getIntlContent("SHENYU.COMMON.MAX.ENVIRONMENT"),
      dataIndex: "envLabel",
    },
    {
      title: getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.ADDRESS"),
      dataIndex: "addressUrl",
    },
    {
      title: getIntlContent("SHENYU.PLUGIN.DESCRIBE"),
      dataIndex: "envDesc",
    },
  ];

  return (
    <Tabs>
      <Tabs.TabPane
        tab={
          <>
            <Icon type="file-text" />
            {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.INTERFACE.DOCUMENT")}
          </>
        }
        key="1"
      >
        <Row gutter={24}>
          <Col span={12}>
            <Title level={2}>
              {apiDetail.tags[apiDetail.tags.length - 1].name}
            </Title>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <Button onClick={handleUpdate}>
              {getIntlContent("SHENYU.BUTTON.SYSTEM.EDIT")}
            </Button>
            &nbsp;&nbsp;
            <Button ghost type="danger" onClick={handleDelete}>
              {getIntlContent("SHENYU.BUTTON.SYSTEM.DELETE")}
            </Button>
          </Col>
        </Row>

        <Paragraph>
          <Title level={4}>
            {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.INTERFACE.ADDRESS")}
          </Title>
          <Text code>{Method?.[apiDetail.httpMethod]}</Text>
          <Text code>{apiDetail.apiPath}</Text>
          <Text code>{apiDetail.version}</Text>
        </Paragraph>
        <Paragraph>
          <Title level={4}>
            {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.DESCRIPTION")}
          </Title>
          <Text type="secondary">{apiDetail.apiDesc || "-"}</Text>
        </Paragraph>
        <Paragraph>
          <Row gutter={24}>
            <Col span={8}>
              <Title level={4}>Owner</Title>
              <Text code>{apiDetail.apiOwner}</Text>
            </Col>
            <Col span={8}>
              <Title level={4}>Consume</Title>
              <Text code>{apiDetail.consume}</Text>
            </Col>
            <Col span={8}>
              <Title level={4}>Produce</Title>
              <Text code>{apiDetail.produce}</Text>
            </Col>
          </Row>
        </Paragraph>

        <Title level={4}>
          {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.ADDRESS")}
        </Title>
        <Paragraph>
          <Table
            size="small"
            rowKey="envLabel"
            bordered
            dataSource={envProps}
            pagination={false}
            columns={envPropsColumns}
          />
        </Paragraph>
        <Title level={2}>
          {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.REQUEST.PARAMETERS")}
        </Title>
        <Title level={4}>
          {getIntlContent(
            "SHENYU.DOCUMENT.APIDOC.INFO.SERVICE.REQUEST.HEADERS",
          )}
        </Title>
        <Paragraph>
          <Table
            size="small"
            rowKey="id"
            bordered
            dataSource={requestHeaders}
            pagination={false}
            childrenColumnName="refs"
            columns={columns}
          />
        </Paragraph>
        <Title level={4}>
          {getIntlContent(
            "SHENYU.DOCUMENT.APIDOC.INFO.SERVICE.REQUEST.PARAMETERS",
          )}
        </Title>
        <Paragraph>
          <Table
            size="small"
            rowKey="id"
            bordered
            dataSource={requestParameters || []}
            pagination={false}
            childrenColumnName="refs"
            columns={columns}
          />
        </Paragraph>
        <Title level={2}>
          {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.RESPONSE.PARAMETERS")}
        </Title>
        <Title level={4}>
          {getIntlContent(
            "SHENYU.DOCUMENT.APIDOC.INFO.COMMON.RESPONSE.PARAMETERS",
          )}
        </Title>
        <Paragraph>
          <Table
            size="small"
            rowKey="id"
            bordered
            dataSource={defaultCommonData}
            pagination={false}
            columns={columns.filter((_, i) => ![2, 3].includes(i))}
          />
        </Paragraph>
        <Title level={4}>
          {getIntlContent(
            "SHENYU.DOCUMENT.APIDOC.INFO.BUSINESS.RESPONSE.PARAMETERS",
          )}
        </Title>
        <Paragraph>
          <Table
            size="small"
            rowKey="id"
            bordered
            dataSource={responseParameters}
            pagination={false}
            childrenColumnName="refs"
            columns={columns}
          />
        </Paragraph>
        <Title level={4}>
          {getIntlContent("SHENYU.DOCUMENT.APIDOC.ERROR.CODE.DETAILS")}
        </Title>
        <Paragraph>
          <Table
            size="small"
            rowKey="code"
            bordered
            dataSource={documentJSON.errorCode || []}
            pagination={false}
            columns={errorCodeColumns}
          />
        </Paragraph>
      </Tabs.TabPane>
      <Tabs.TabPane
        tab={
          <>
            <Icon type="code" />
            {getIntlContent("SHENYU.DOCUMENT.APIDOC.INFO.INTERFACE.DEBUG")}
          </>
        }
        key="2"
      >
        <ApiDebug />
      </Tabs.TabPane>
    </Tabs>
  );
}

export default ApiInfo;
