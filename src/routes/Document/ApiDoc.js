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
import { getDocMenus, getApiDetail, addApi, updateApi ,deleteApi} from "../../services/api";
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
    document: '',
    tagIds:[]
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
    //最后一行不需要
    if(!id){
      const targetId = _
      handleAddApi(targetId)
      return;
    }
    const { code, message: msg, data } = await getApiDetail(id);
    if (code !== 200) {
      message.error(msg);
      return;
    }
    setInitialValue({
      id: id
    });
    setApiDetail(data);
  };
  const handleAddApi = (targetId,e) => {
    console.log('targetId', targetId)
    setflag('add')
    setInitialValue({
      tagIds:[targetId]
    });
    setOpen(true)
  };
  const callSaveOrUpdateApi = async (params, e) => {
    let rs = (flag === 'add' ? await addApi({...params, tagIds: initialValue.tagIds[0]}) : await updateApi({ ...params, id: initialValue.id , tagIds: initialValue.tagIds}));
    if (rs.code !== 200) {
      message.error(rs.msg);
      return;
    } else {
      setOpen(false)
      location.reload()
    }
  };
  const handleDeleteApi = async e => {
    console.log('handleDelete', initialValue.id)
    
    const { code, message: msg, data } = await deleteApi([initialValue.id]);
    if (code !== 200) {
      message.error(msg);
      return;
    } else {
      location.reload()
    }
  };
  const handleUpdateApi = async () => {
    let queryData = await getApiDetail(initialValue.id)
    console.log("getApiDetail", queryData)
    setInitialValue(queryData.data);
    setOpen(true)
    setflag('update')
  }

  useEffect(() => {
    initData();
  }, []);

  return (
    <ApiContext.Provider
      value={{
        apiDetail,
        apiData
      }}
    >
      <Card style={{ margin: 24 }}>
        {open && <AddAndUpdateApiDoc onCancel={() => setOpen(false)} handleOk={callSaveOrUpdateApi} {...initialValue} />
        }
        <Row gutter={24}>
          <Col span={6}>
            <SearchApi onSelect={handleSelectNode} />
          </Col>
          <Col span={18}>
            {apiDetail.id ? (
              <>
              {/* <Button onClick={handleUpdateApi}>edit</Button>
              <Button onClick={handleDeleteApi}>delete</Button> */}
              <ApiInfo handleUpdateApi= {handleUpdateApi} handleDeleteApi={handleDeleteApi}/>
              </>
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
