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

import { Typography, Button, Row, Col, Table, Popconfirm } from "antd";
import React, { useContext } from "react";
import dayjs from "dayjs";
import ApiContext from "./ApiContext";
import { getIntlContent } from "../../../utils/IntlUtils";
import { Method, API_SOURCE_TYPE, STATE_TYPE } from "./globalData";

const { Title, Text } = Typography;

function TagInfo(props) {
  const { handleDelete, handleUpdate } = props;
  const { tagDetail } = useContext(ApiContext);
  const { apiDataList } = tagDetail;

  const apiColumns = [
    {
      title: getIntlContent("SHENYU.DOCUMENT.TAG.TABLE.PATH"),
      dataIndex: "apiPath",
      render: (_, record) => (
        <>
          <Text code>{Method?.[record.httpMethod]}</Text>
          <Text>{record.apiPath}</Text>
        </>
      ),
    },
    {
      title: getIntlContent("SHENYU.DOCUMENT.TAG.TABLE.TYPE"),
      dataIndex: "module",
    },
    {
      title: getIntlContent("SHENYU.DOCUMENT.TAG.TABLE.VERSION"),
      dataIndex: "version",
    },
    {
      title: getIntlContent("SHENYU.DOCUMENT.TAG.TABLE.STATE"),
      dataIndex: "state",
      render: (v) => STATE_TYPE[v],
    },
    {
      title: getIntlContent("SHENYU.DOCUMENT.TAG.TABLE.SOURCE"),
      dataIndex: "apiSource",
      render: (v) => API_SOURCE_TYPE[v],
    },
    {
      title: getIntlContent("SHENYU.DOCUMENT.TAG.TABLE.CREATETIME"),
      dataIndex: "dateCreated",
      render: (v) => dayjs(v).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: getIntlContent("SHENYU.DOCUMENT.TAG.TABLE.MODIFYTIME"),
      dataIndex: "dateUpdated",
      render: (v) => dayjs(v).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  return (
    <Row gutter={24}>
      <Col span={12}>
        <Title level={2}>{tagDetail.name}</Title>
      </Col>
      <Col span={12} style={{ textAlign: "right", minHeight: "56px" }}>
        <Button onClick={handleUpdate}>
          {getIntlContent("SHENYU.BUTTON.SYSTEM.EDIT")}
        </Button>
        &nbsp;&nbsp;
        <Popconfirm
          title={getIntlContent("SHENYU.COMMON.DELETE")}
          placement="bottom"
          onCancel={(e) => {
            e.stopPropagation();
          }}
          onConfirm={(e) => {
            e.stopPropagation();
            handleDelete(e);
          }}
          okText={getIntlContent("SHENYU.COMMON.SURE")}
          cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        >
          <Button ghost type="danger">
            {getIntlContent("SHENYU.BUTTON.SYSTEM.DELETE")}
          </Button>
        </Popconfirm>
      </Col>
      <Col span={12}>
        <Text>
          {getIntlContent("SHENYU.DOCUMENT.TAG.DESC")}: {tagDetail.tagDesc}
        </Text>
      </Col>
      <Col span={12}>
        <Text>
          {getIntlContent("SHENYU.DOCUMENT.TAG.MODIFYTIME")}:{" "}
          {tagDetail.dateUpdated}
        </Text>
      </Col>
      <Col span={24} style={{ marginTop: "20px" }}>
        <Table
          size="small"
          rowKey="id"
          bordered
          dataSource={apiDataList}
          pagination={false}
          columns={apiColumns}
        />
      </Col>
    </Row>
  );
}

export default TagInfo;
