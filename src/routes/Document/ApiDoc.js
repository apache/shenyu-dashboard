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

/* eslint-disable no-unused-expressions */
/* eslint-disable react/jsx-no-constructed-context-values */
import { Col, Row, Card, Empty, message } from "antd";
import React, { useEffect, useState } from "react";
import {
  getApi,
  getDocMenus,
  getApiDetail,
  deleteApi,
  getTagDetail,
  deleteTag,
  getApiMockRequest,
} from "../../services/api";
import SearchApi from "./components/SearchApi";
import ApiInfo from "./components/ApiInfo";
import TagInfo from "./components/TagInfo";
import ApiContext from "./components/ApiContext";

function ApiDoc() {
  const [tagDetail, setTagDetail] = useState({});
  const [apiDetail, setApiDetail] = useState({});
  const [apiData, setApiData] = useState({});
  const [apiMock, setApiMock] = useState({});

  const searchApiRef = React.createRef();

  const initData = async () => {
    const { code, data = {} } = await getDocMenus();
    if (code === 200) {
      const { menuProjects = [] } = data;
      const createKey = (treeData, keys) => {
        treeData.forEach((item, index) => {
          const { children, id, name } = item;
          const key = [...keys, index].join("-");
          item.key = key;
          item.id = id;
          item.name = name;
          if (children?.length) {
            createKey(children, [...keys, index]);
          }
        });
      };
      createKey(menuProjects, []);
      data.menuProjects = menuProjects;
      setApiData(data);
    }
  };

  const handleSelectNode = async (_, e) => {
    const {
      node: {
        props: { id, isLeaf },
      },
    } = e;
    if (isLeaf) {
      const { code, message: msg, data } = await getApiDetail(id);
      if (code !== 200) {
        message.error(msg);
        return;
      }
      setApiDetail(data);
      setTagDetail({});

      const {
        code: mockCode,
        message: mockMsg,
        data: mockData,
      } = await getApiMockRequest(id);
      if (mockCode !== 200) {
        message.error(mockMsg);
        return;
      }
      setApiMock(mockData);
    } else {
      const { code, message: msg, data } = await getTagDetail(id);
      if (code !== 200) {
        message.error(msg);
        return;
      }
      const {
        code: apiCode,
        message: apiMsg,
        data: apiDataRecords,
      } = await getApi(id);
      if (apiCode !== 200) {
        message.error(apiMsg);
        return;
      }
      const { dataList: apiDataList } = apiDataRecords;
      data.apiDataList = apiDataList;
      setTagDetail(data);
      setApiDetail({});
    }
  };

  const handleDelete = async () => {
    let res = {};
    if (tagDetail.id) {
      res = await deleteTag([tagDetail.id]);
    }
    if (apiDetail.id) {
      res = await deleteApi([apiDetail.id]);
    }
    const { code, message: msg } = res;
    if (code !== 200) {
      message.error(msg);
    } else {
      message.success(msg);
      if (tagDetail.id) {
        searchApiRef.current?.updateTree(null, "tag");
        setTagDetail({});
      }
      if (apiDetail.id) {
        searchApiRef.current?.updateTree(null, "api");
      }
    }
  };

  const handleUpdate = () => {
    if (tagDetail.id) {
      searchApiRef.current?.addOrUpdateTag(tagDetail);
    }
    if (apiDetail.id) {
      searchApiRef.current?.addOrUpdateApi(apiDetail);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleAfterUpdate = (data, refType) => {
    if (refType === "tag") {
      setTagDetail({ ...tagDetail, ...data });
    } else if (refType === "api") {
      setApiDetail({ ...apiDetail, ...data });
    }
  };

  useEffect(() => {
    initData();
  }, []);

  return (
    <ApiContext.Provider
      value={{
        apiDetail,
        apiData,
        apiMock,
        tagDetail,
      }}
    >
      <Row gutter={12}>
        <Col span={6}>
          <Card style={{ margin: "24px 0 24px 24px" }}>
            <SearchApi
              onSelect={handleSelectNode}
              ref={searchApiRef}
              afterUpdate={handleAfterUpdate}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card style={{ margin: "24px 24px 24px 0" }}>
            {tagDetail.id ? (
              <TagInfo
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
              />
            ) : null}
            {apiDetail.id ? (
              <ApiInfo
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
              />
            ) : null}
            {!tagDetail.id && !apiDetail.id && (
              <Empty description={false} style={{ padding: "160px 0" }} />
            )}
          </Card>
        </Col>
      </Row>
    </ApiContext.Provider>
  );
}

export default ApiDoc;
