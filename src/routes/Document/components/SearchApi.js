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

import { Tree, Empty, message, Typography } from "antd";
import React, { useEffect, useState } from "react";
// import ApiContext from "./ApiContext";
// import { getIntlContent } from "../../../utils/IntlUtils";
import { getRootTag, getParentTagId, getApi } from "../../../services/api";
import { Method } from "./globalData";

const { Text } = Typography;
const { TreeNode } = Tree;
// const { Search } = Input;

function SearchApi(props) {
  const { onSelect } = props;
  // const [searchValue, setSearchValue] = useState("");

  // const handleSearchChange = e => {
  //   const { value } = e.target;
  //   const keys = [];
  //   const findSearchKeys = data =>
  //     data.forEach(item => {
  //       if (item.label.indexOf(value) > -1 || item.name?.indexOf(value) > -1) {
  //         keys.push(item.key);
  //       }
  //       if (Array.isArray(item.children)) {
  //         findSearchKeys(item.children);
  //       }
  //     });
  //   setSearchValue(value);
  // };

  const [apiTree, setApiTree] = useState([]);

  const renderTreeNodes = data => {
    return data.map(item => {
      if (item.children) {
        return (
          <TreeNode
            title={item.title}
            key={item.key}
            dataRef={item}
            selectable={item.isLeaf}
            isLeaf={item.isLeaf}
          >
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} {...item} dataRef={item} />;
    });
  };

  const queryRootTag = async () => {
    const { code, data = [], message: msg } = await getRootTag();
    if (code !== 200) {
      message.error(msg);
      return;
    }
    setApiTree(
      data?.map((item, index) => ({
        ...item,
        title: item.name,
        key: index.toString(),
        isLeaf: !item.hasChildren
      })) || []
    );
  };

  const onLoadData = async treeNode => {
    if (treeNode.props.children) {
      return Promise.resolve();
    }
    const { id, hasChildren } = treeNode.props.dataRef;
    if (hasChildren) {
      const { code, message: msg, data } = await getParentTagId(id);
      if (code !== 200) {
        message.error(msg);
        return Promise.reject();
      }
      treeNode.props.dataRef.children = data?.map((item, index) => ({
        ...item,
        title: item.name,
        key: `${treeNode.props.eventKey}-${index}`
      }));
    } else {
      const { code, message: msg, data } = await getApi(id);
      if (code !== 200) {
        message.error(msg);
        return Promise.reject();
      }
      const { dataList } = data;
      treeNode.props.dataRef.children = dataList?.map((item, index) => ({
        ...item,
        title: (
          <>
            <Text code>{Method[item.httpMethod]}</Text> {item.apiPath}
          </>
        ),
        key: `${treeNode.props.eventKey}-${index}`,
        isLeaf: true
      }));
    }
    setApiTree([...apiTree]);
    return Promise.resolve();
  };

  useEffect(() => {
    queryRootTag();
  }, []);

  return (
    <div style={{ overflow: "auto" }}>
      {/* <Search
        allowClear
        onChange={handleSearchChange}
        placeholder={getIntlContent(
          "SHENYU.DOCUMENT.APIDOC.SEARCH.PLACEHOLDER"
        )}
      /> */}
      {apiTree?.length ? (
        <Tree loadData={onLoadData} onSelect={onSelect}>
          {renderTreeNodes(apiTree)}
        </Tree>
      ) : (
        <Empty style={{ padding: "80px 0" }} description={false} />
      )}
    </div>
  );
}

export default SearchApi;
