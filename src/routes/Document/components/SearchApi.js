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

import { Tree, Empty, message, Typography, Button, Row, Col, Spin, Tooltip } from "antd";
import React, { useEffect, useImperativeHandle, useState } from "react";
import { getRootTag, getParentTagId, getApi } from "../../../services/api";
import { Method } from "./globalData";
import AddAndUpdateTag from "./AddAndUpdateTag";
import AddAndUpdateApiDoc from "./AddAndUpdateApiDoc";
import {getIntlContent} from "../../../utils/IntlUtils";

const { Text } = Typography;
const { TreeNode } = Tree;

const SearchApi = React.forwardRef((props, ref) => {
  const { onSelect, afterUpdate } = props;
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState({});
  const [expandedKeys, setExpandedKeys] = useState([]);

  const queryRootTag = async () => {
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
        isLeaf: false
      })) || [];
    setTreeData(arr);
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
      const el = pre.find(item => item.key === cur);
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
          <Tooltip title={item.apiPath}>{item.apiPath}</Tooltip>
        </>
      ),
      key: `${eventKey}-${index}`,
      isLeaf: !hasChildren
    }));
    curNode.children.push({
      selectable: false,
      title: (
        <Row gutter={8}>
          {showAddTag && (
            <Col span={12}>
              <Button
                type="primary"
                ghost
                size="small"
                onClick={() =>
                  addOrUpdateTag({
                    parentTagId: id
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
                  tagIds: [id]
                })
              }
            >
              + Api
            </Button>
          </Col>
        </Row>
      ),
      key: `${eventKey}-operator`,
      isLeaf: true
    });
    setTreeData(newTreeData);
  };

  const [openTag, setOpenTag] = useState(false);
  const [tagForm, setTagForm] = useState({});

  const handleTagCancel = () => {
    setOpenTag(false);
    tagForm.resetFields();
  };

  const handleTagOk = data => {
    handleTagCancel();
    updateTree(data);
  };

  const [openApi, setOpenApi] = useState(false);
  const [apiForm, setApiForm] = useState({});

  const handleApiCancel = () => {
    setOpenApi(false);
    tagForm.resetFields();
  };

  const handleApiOk = data => {
    handleApiCancel();
    updateTree(data);
  };

  const addOrUpdateApi = data => {
    apiForm.setFieldsValue({
      ...data
    });
    setOpenApi(true);
  };

  const addOrUpdateTag = data => {
    tagForm.setFieldsValue({
      ...data
    });
    setOpenTag(true);
  };

  const updateTree = data => {
    setExpandedKeys([]);
    queryRootTag();
    afterUpdate(data);
  };

  useImperativeHandle(ref, () => ({
    addOrUpdateApi,
    addOrUpdateTag,
    updateTree
  }));

  useEffect(() => {
    queryRootTag();
  }, []);

  return (
    <div style={{ overflow: "auto" }}>
      {treeData?.length ? (
        <Spin spinning={loading}>
          <Tree
            onSelect={onSelect}
            treeData={treeData}
            onExpand={onExpand}
            expandedKeys={expandedKeys}
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
        formLoaded={setApiForm}
        onOk={handleApiOk}
        onCancel={handleApiCancel}
      />
    </div>
  );
});

export default SearchApi;
