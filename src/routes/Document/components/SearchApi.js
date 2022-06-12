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

import { Tree, Input, Empty } from "antd";
import React, { useContext, useEffect, useState } from "react";
import ApiContext from "./ApiContext";
import { getIntlContent } from "../../../utils/IntlUtils";

const { TreeNode } = Tree;
const { Search } = Input;

function SearchApi(props) {
  const { onSelect } = props;
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const {
    apiData: { menuProjects }
  } = useContext(ApiContext);

  const renderTreeNode = data => {
    return data.map(item => {
      const { children, id, label, key, name } = item;
      const index = label.indexOf(searchValue);
      const sameName = name?.indexOf(searchValue);
      const beforeStr = label.substr(0, index);
      const afterStr = label.substr(index + searchValue.length);
      let titleObj = <span>{label}</span>;
      if (index > -1) {
        titleObj = (
          <span>
            {beforeStr}
            <span style={{ color: "#f50" }}>{searchValue}</span>
            {afterStr}
          </span>
        );
      }
      if (searchValue && sameName > -1) {
        titleObj = <span style={{ color: "#f50" }}>{label}</span>;
      }
      return (
        <TreeNode
          key={key}
          title={titleObj}
          selectable={id !== undefined}
          id={id}
        >
          {children?.length && renderTreeNode(children)}
        </TreeNode>
      );
    });
  };

  const handleSearchChange = e => {
    const { value } = e.target;
    const keys = [];
    const findSearchKeys = data =>
      data.forEach(item => {
        if (item.label.indexOf(value) > -1 || item.name?.indexOf(value) > -1) {
          keys.push(item.key);
        }
        if (Array.isArray(item.children)) {
          findSearchKeys(item.children);
        }
      });
    findSearchKeys(menuProjects);
    setExpandedKeys(keys);
    setSearchValue(value);
    setAutoExpandParent(true);
  };

  const handleExpandChange = keys => {
    setExpandedKeys(keys);
    setAutoExpandParent(false);
  };

  useEffect(
    () => {
      if (Array.isArray(menuProjects)) {
        const allKeys = [];
        const getAllParentsKey = data =>
          data.forEach(item => {
            if (item.children) {
              allKeys.push(item.key);
              getAllParentsKey(item.children);
            }
          });
        getAllParentsKey(menuProjects);
        setExpandedKeys(allKeys);
      }
    },
    [menuProjects]
  );

  return (
    <div style={{ overflow: "auto" }}>
      <Search
        allowClear
        onChange={handleSearchChange}
        placeholder={getIntlContent(
          "SHENYU.DOCUMENT.APIDOC.SEARCH.PLACEHOLDER"
        )}
      />
      {menuProjects?.length ? (
        <Tree
          autoExpandParent={autoExpandParent}
          expandedKeys={expandedKeys}
          onExpand={handleExpandChange}
          onSelect={onSelect}
        >
          {renderTreeNode(menuProjects)}
        </Tree>
      ) : (
        <Empty style={{ padding: "80px 0" }} description={false} />
      )}
    </div>
  );
}

export default SearchApi;
