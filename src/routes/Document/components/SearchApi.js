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

import Tree from "@douyinfe/semi-ui/lib/es/tree";
import Empty from "@douyinfe/semi-ui/lib/es/empty";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Row from "@douyinfe/semi-ui/lib/es/grid/row";
import Col from "@douyinfe/semi-ui/lib/es/grid/col";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Tooltip from "@douyinfe/semi-ui/lib/es/tooltip";
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { message } from "../../../components/ui/feedback";
import { getRootTag, getParentTagId, getApi } from "../../../services/api";
import { Method } from "./globalData";
import AddAndUpdateTag from "./AddAndUpdateTag";
import AddAndUpdateApiDoc from "./AddAndUpdateApiDoc";
import ImportSwaggerModal from "./ImportSwaggerModal";
import { getIntlContent } from "../../../utils/IntlUtils";
import { updateTreeNodes, findNodeById } from "./searchApiTree";

const { Text } = Typography;

const SearchApi = React.forwardRef((props, ref) => {
  const { onSelect, afterUpdate } = props;
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState([]);
  const treeDataRef = useRef(treeData);
  useEffect(() => {
    treeDataRef.current = treeData;
  }, [treeData]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [document, setDocument] = useState("{}");
  const [ext, setExt] = useState("{}");
  // Import Swagger related state
  const [swaggerModalVisible, setSwaggerModalVisible] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState("");

  const queryRootTag = async () => {
    setExpandedKeys([]);
    setLoading(true);
    let code;
    let data = [];
    let msg;
    try {
      ({ code, data = [], message: msg } = await getRootTag());
    } finally {
      setLoading(false);
    }
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
    setTreeData(arr);
    if (data?.length) {
      // Select the first one by default
      selectNode(["0"], arr[0]);
    } else {
      setSelectedKeys([]);
    }
  };

  const loadNode = async (node) => {
    setLoading(true);
    const { id, hasChildren, key: eventKey } = node;
    let showAddTag = true;
    let tagChildren = [];
    let apiChildren = [];
    try {
      // non-leaf tags can carry direct APIs alongside child modules
      const requests = hasChildren
        ? [getParentTagId(id), getApi(id)]
        : [getApi(id)];
      const [tagRes, apiRes] = await Promise.all(requests);
      if (tagRes.code !== 200) {
        message.error(tagRes.message);
        return;
      }
      const apiListRes = hasChildren ? apiRes : tagRes;
      if (apiListRes.code !== 200) {
        message.error(apiListRes.message);
        return;
      }
      tagChildren = hasChildren ? tagRes.data || [] : [];
      apiChildren = apiListRes.data?.dataList || [];
    } finally {
      setLoading(false);
    }

    if (!hasChildren && apiChildren.length) {
      showAddTag = false;
    }
    const childTags = tagChildren.map((item, index) => ({
      ...item,
      title: item.name,
      key: `${eventKey}-tag-${index}`,
      isLeaf: false,
    }));
    const childApis = apiChildren.map((item, index) => ({
      ...item,
      title: (
        <>
          <Text code>{Method[item.httpMethod]}</Text>
          <Tooltip position="topLeft" content={item.apiPath}>
            {item.apiPath}
          </Tooltip>
        </>
      ),
      key: `${eventKey}-api-${index}`,
      isLeaf: true,
    }));
    const children = [
      ...childTags,
      ...childApis,
      {
        selectable: false,
        title: (
          <Row gutter={2}>
            {showAddTag && (
              <Col span={10}>
                <Button
                  type="primary"
                  theme="outline"
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
            <Col span={showAddTag ? 6 : 12}>
              <Button
                type="primary"
                theme="outline"
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
            <Col span={showAddTag ? 8 : 12}>
              <Button
                type="primary"
                theme="outline"
                size="small"
                onClick={() => handleImportSwagger(id)}
              >
                {getIntlContent("SHENYU.DOCUMENT.APIDOC.IMPORT.SWAGGER")}
              </Button>
            </Col>
          </Row>
        ),
        key: `${eventKey}-operator`,
        isLeaf: true,
      },
    ];
    setTreeData((nodes) => {
      const attachChildren = (items) =>
        items.map((item) => {
          if (item.id === id) return { ...item, children };
          return item.children
            ? { ...item, children: attachChildren(item.children) }
            : item;
        });
      return attachChildren(nodes);
    });
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
    apiForm.resetFields();
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
    let title;
    if (refType === "tag") {
      title = data.name;
    } else if (refType === "api") {
      title = (
        <>
          <Text code>{Method[data.httpMethod]}</Text>
          <Tooltip position="topLeft" content={data.apiPath}>
            {data.apiPath}
          </Tooltip>
        </>
      );
    }
    const result = updateTreeNodes(
      treeData,
      data.id,
      title,
      refType === "tag" ? data.name : undefined,
    );
    if (!result.updated) {
      return;
    }
    setTreeData(result.nodes);
    afterUpdate(data, refType);
  };

  const selectNode = (keys, nodeProps) => {
    setSelectedKeys(keys);
    onSelect(keys, { node: { props: nodeProps } });
  };

  // Handle Import Swagger button click
  const handleImportSwagger = (tagId) => {
    // Resolve the project name from the clicked tag, falling back to the root node
    // Operator buttons are stored in treeData and outlive the render that created them.
    const currentTree = treeDataRef.current;
    const node = tagId ? findNodeById(currentTree, tagId) : null;
    const projectName =
      node?.name || currentTree?.[0]?.name || "default_project";
    setCurrentProjectName(projectName);
    setSwaggerModalVisible(true);
  };

  // Handle Import Swagger modal cancel
  const handleSwaggerCancel = () => {
    setSwaggerModalVisible(false);
  };

  // Handle Import Swagger modal confirm
  const handleSwaggerOk = () => {
    setSwaggerModalVisible(false);
    // Refresh tree structure
    queryRootTag();
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
            onSelect={(key, selected, node) => {
              if (node.selectable !== false) selectNode([key], node);
            }}
            keyMaps={{ label: "title" }}
            motion={false}
            treeData={treeData}
            onExpand={setExpandedKeys}
            loadData={loadNode}
            loadedKeys={[]}
            expandedKeys={expandedKeys}
            value={selectedKeys[0]}
          />
        </Spin>
      ) : (
        <Empty style={{ padding: "80px 0" }} description={false} />
      )}
      <Button
        block
        theme="outline"
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
      <ImportSwaggerModal
        visible={swaggerModalVisible}
        onOk={handleSwaggerOk}
        onCancel={handleSwaggerCancel}
        currentProjectName={currentProjectName}
      />
    </div>
  );
});

export default SearchApi;
