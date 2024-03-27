/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-unused-expressions */

import {
  Tree,
  Empty,
  message,
  Typography,
  Button,
  Row,
  Col,
  Spin,
  Tooltip,
} from "antd";
import React, { useEffect, useImperativeHandle, useState } from "react";
import { getRootTag, getParentTagId, getApi } from "../../../services/api";
import { Method } from "./globalData";
import AddAndUpdateTag from "./AddAndUpdateTag";
import AddAndUpdateApiDoc from "./AddAndUpdateApiDoc";
import { getIntlContent } from "../../../utils/IntlUtils";

const { Text } = Typography;

const SearchApi = React.forwardRef((props, ref) => {
  const { onSelect, afterUpdate } = props;
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState({});
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [document, setDocument] = useState("{}");
  const [ext, setExt] = useState("{}");

  const queryRootTag = async () => {
    setExpandedKeys([]);
    setLoading(true);
    const { code, data = [], message: msg } = await getRootTag();
    setLoading(false);
    if (code !== 200) {
      message.error(msg);
      return;
    }
    const arr =
      data?.map((item, index) => ({
        ...item,
        title: item.name,
        key: index.toString(),
        isLeaf: false,
      })) || [];
    if (data?.length) {
      const {
        code: apiCode,
        message: apiMsg,
        data: apiDataRecords,
      } = await getApi(data[0].id);
      if (apiCode !== 200) {
        message.error(apiMsg);
        return;
      }
      const { dataList: apiDataList } = apiDataRecords;
      data[0].apiDataList = apiDataList;
      setTreeData(arr);
      // 默认选中第一个
      setSelectedKeys(["0"]);
      onSelect(["0"], { node: { props: arr[0] } });
    } else {
      setTreeData(arr);
      setSelectedKeys([]);
    }
  };

  const onExpand = async (keys, { expanded, node }) => {
    setExpandedKeys(keys);
    if (expanded === false) {
      return;
    }
    setLoading(true);
    const { id, hasChildren, eventKey } = node.props;
    const newTreeData = [...treeData];
    let showAddTag = true;
    let resData = [];
    const eventKeys = eventKey
      .split("-")
      .map((v, i, arr) => arr.slice(0, i + 1).join("-"));

    if (hasChildren) {
      const { code, message: msg, data } = await getParentTagId(id);
      setLoading(false);
      if (code !== 200) {
        message.error(msg);
        return Promise.reject();
      }
      resData = data;
    } else {
      const { code, message: msg, data } = await getApi(id);
      setLoading(false);
      if (code !== 200) {
        message.error(msg);
        return Promise.reject();
      }
      const { dataList } = data;
      if (dataList.length) {
        showAddTag = false;
      }
      resData = dataList;
    }
    const curNode = eventKeys.reduce((pre, cur, curIndex, curArray) => {
      const el = pre.find((item) => item.key === cur);
      if (curIndex === curArray.length - 1) {
        return el;
      } else {
        return el.children || [];
      }
    }, newTreeData);

    curNode.children = resData?.map((item, index) => ({
      ...item,
      title: hasChildren ? (
        item.name
      ) : (
        <>
          <Text code>{Method[item.httpMethod]}</Text>
          <Tooltip placement="topLeft" arrowPointAtCenter title={item.apiPath}>
            {item.apiPath}
          </Tooltip>
        </>
      ),
      key: `${eventKey}-${index}`,
      isLeaf: !hasChildren,
    }));
    curNode.children.push({
      selectable: false,
      title: (
        <Row gutter={18}>
          {showAddTag && (
            <Col span={12}>
              <Button
                type="primary"
                ghost
                size="small"
                onClick={() =>
                  addOrUpdateTag({
                    parentTagId: id,
                  })
                }
              >
                {getIntlContent("SHENYU.DOCUMENT.APIDOC.SEARCH.ADD_MODULE")}
              </Button>
            </Col>
          )}

          <Col span={12}>
            <Button
              type="primary"
              ghost
              size="small"
              onClick={() =>
                addOrUpdateApi({
                  tagIds: [id],
                })
              }
            >
              + Api
            </Button>
          </Col>
        </Row>
      ),
      key: `${eventKey}-operator`,
      isLeaf: true,
    });
    setTreeData(newTreeData);
  };

  const [openTag, setOpenTag] = useState(false);
  const [tagForm, setTagForm] = useState({});

  const handleTagCancel = () => {
    setOpenTag(false);
    tagForm.resetFields();
  };

  const handleTagOk = (data) => {
    handleTagCancel();
    updateTree(data, "tag");
  };

  const [openApi, setOpenApi] = useState(false);
  const [apiForm, setApiForm] = useState({});

  const handleApiCancel = () => {
    setOpenApi(false);
    tagForm.resetFields();
  };

  const handleApiOk = (data) => {
    handleApiCancel();
    updateTree(data, "api");
  };

  const addOrUpdateApi = (data) => {
    apiForm.resetFields();
    apiForm.setFieldsValue({
      ...data,
    });
    setDocument(data.document || "{}");
    setExt(data.ext || "{}");
    setOpenApi(true);
  };

  const addOrUpdateTag = (data) => {
    tagForm.setFieldsValue({
      ...data,
    });
    setOpenTag(true);
  };

  const updateTree = (data, refType) => {
    if (!data?.id) {
      queryRootTag();
      return;
    }
    let allNodes = treeData.flatMap((i) =>
      i.children ? [...i.children, i] : i,
    );
    let curNodeIdx = allNodes.findIndex((t) => t.id && t.id === data.id) ?? -1;
    if (curNodeIdx === -1) {
      return;
    }
    if (refType === "tag") {
      allNodes[curNodeIdx].title = data.name;
    } else if (refType === "api") {
      allNodes[curNodeIdx].title = (
        <>
          <Text code>{Method[data.httpMethod]}</Text>
          <Tooltip placement="topLeft" arrowPointAtCenter title={data.apiPath}>
            {data.apiPath}
          </Tooltip>
        </>
      );
    }
    // forceUpdate tree
    setTreeData();
    setTreeData(treeData);
    afterUpdate(data, refType);
  };

  useImperativeHandle(ref, () => ({
    addOrUpdateApi,
    addOrUpdateTag,
    updateTree,
  }));

  useEffect(() => {
    queryRootTag();
  }, []);

  return (
    <div>
      {treeData?.length ? (
        <Spin spinning={loading}>
          <Tree
            onSelect={(keys, e) => {
              setSelectedKeys(keys);
              onSelect(keys, e);
            }}
            treeData={treeData}
            onExpand={onExpand}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            defaultSelectedKeys={["0"]}
          />
        </Spin>
      ) : (
        <Empty style={{ padding: "80px 0" }} description={false} />
      )}
      <Button
        block
        type="dashed"
        onClick={() => addOrUpdateTag({ parentTagId: "0" })}
      >
        {getIntlContent("SHENYU.DOCUMENT.APIDOC.SEARCH.ADD_ROOT_MODULE")}
      </Button>
      <AddAndUpdateTag
        visible={openTag}
        formLoaded={setTagForm}
        onOk={handleTagOk}
        onCancel={handleTagCancel}
      />
      <AddAndUpdateApiDoc
        visible={openApi}
        document={document}
        updateDocument={(obj) => setDocument(JSON.stringify(obj.updated_src))}
        ext={ext}
        updateExt={(obj) => setExt(JSON.stringify(obj.updated_src))}
        formLoaded={setApiForm}
        onOk={handleApiOk}
        onCancel={handleApiCancel}
      />
    </div>
  );
});

export default SearchApi;
