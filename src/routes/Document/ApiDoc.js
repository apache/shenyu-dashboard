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

import { Col, Row, Card, BackTop, Empty, message, Button } from "antd";
import React, { useEffect, useState } from "react";
import SearchApi from "./components/SearchApi";
import AddAndUpdateApiDoc from "./components/AddAndUpdateApiDoc";
import ApiInfo from "./components/ApiInfo";
import { getDocMenus, getApiDetail, addApi, updateApi } from "../../services/api";
import ApiContext from "./components/ApiContext";

function ApiDoc() {
  const [apiDetail, setApiDetail] = useState({});
  const [apiData, setApiData] = useState({});
  const [open, setOpen] = useState(false);
  const [flag, setflag] = useState('add');

  const [initialValue, setInitialValue] = useState({
    id: '',
    contextPath: '',
    apiPath: '',
    httpMethod: '',
    consume: '',
    produce: '',
    version: '',
    rpcType: '',
    state: '',
    ext: '',
    apiOwner: '',
    apiDesc: '',
    apiSource: '',
    document: ''
  })

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
        props: {
          dataRef: { id, isLeaf }
        }
      }
    } = e;
    if (!isLeaf) {
      return;
    }
    const { code, message: msg, data } = await getApiDetail('1604675139728617472');
    if (code !== 200) {
      message.error(msg);
      return;
    }
    setApiDetail(data);
  };

  const callSaveOrUpdateApi = async (params, e) => {
    console.log("callAddApi", params)
    let rs = (flag === 'add' ? await addApi(params) : await updateApi({ ...params, id: initialValue.id }));
    if (rs.code !== 200) {
      message.error(rs.msg);
      return;
    } else {
      setOpen(false)
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleAddApi = e => {
    console.log('handleClick', 1)
    setflag('add')
    setInitialValue({
      id: '',
      contextPath: '',
      apiPath: '',
      httpMethod: '',
      consume: '',
      produce: '',
      version: '',
      rpcType: '',
      state: '',
      ext: '',
      apiOwner: '',
      apiDesc: '',
      apiSource: '',
      document: ''
    });
    setOpen(true)
  };

  const handleDeleteApi = e => {
    console.log('handleDelete', 1)
  };

  const handleUpdateApi = async () => {
    //todo add update api
    // json = getAPi;
    let queryData = await getApiDetail('1604756913158664192')
    console.log("getApiDetail", queryData)
    setInitialValue(queryData.data);
    setOpen(true)
    setflag('update')
  }


  return (
    <ApiContext.Provider
      value={{
        apiDetail,
        apiData
      }}
    >
      <Card style={{ margin: 24 }}>
        <Button onClick={handleAddApi}>add API</Button>
        <Button onClick={handleUpdateApi}>update API</Button>
        <Button onClick={handleDeleteApi}>delete API</Button>
        {open && <AddAndUpdateApiDoc onCancel={() => setOpen(false)} handleOk={callSaveOrUpdateApi} {...initialValue} />
        }
        <Row gutter={24}>
          <Col span={6}>
            <SearchApi onSelect={handleSelectNode} />
          </Col>
          <Col span={18}>
            {apiDetail.id ? (
              <ApiInfo />
            ) : (
              <Empty description={false} style={{ padding: "160px 0" }} />
            )}
          </Col>
        </Row>
        <BackTop />
      </Card>
    </ApiContext.Provider>
  );
}

export default ApiDoc;
