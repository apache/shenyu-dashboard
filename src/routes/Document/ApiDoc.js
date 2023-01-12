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

import { Col, Row, Card, BackTop, Empty, message } from "antd";
import React, { useEffect, useState } from "react";
import SearchApi from "./components/SearchApi";
import AddAndUpdateApiDoc from "./components/AddAndUpdateApiDoc";
import ApiInfo from "./components/ApiInfo";
import TagInfo from "./components/TagInfo";
import { getDocMenus, getApiDetail, addApi, updateApi, deleteApi, getTagDetail, deleteTag, addTag,updateTag} from "../../services/api";
import ApiContext from "./components/ApiContext";
import AddAndUpdateTag from "./components/AddAndUpdateTag";

function ApiDoc() {
  const [tagDetail, setTagDetail] = useState({});
  const [apiDetail, setApiDetail] = useState({});
  const [apiData, setApiData] = useState({});
  const [openTag, setOpenTag] = useState(false);
  const [open, setOpen] = useState(false);
  const [flag, setflag] = useState('add');

  const [initialTagValue,setInitalTagValue] = useState({
    id: '',
    name: '',
    ext: '',
    tagDesc: ''
  }
  )
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
    tagIds: []
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
  const handleRightSelectNode = async (_, e) => {
    const {
      node: {
        props: {
          dataRef: { id, isLeaf,isTag}
        }
      }
    } = e;
    if (isLeaf) {
      if (!id) {
        const targetId = _
        if(isTag) {
          handleAddTag(targetId)
        }
      }
    }
  };
  const handleSelectNode = async (_, e) => {
    const {
      node: {
        props: {
          dataRef: { id, isLeaf,isTag}
        }
      }
    } = e;
    if (!isLeaf) {
      return;
    }
    if (!id) {
      const targetId = _
      if(isTag) {
        handleAddTag(targetId)
      }else {
        handleAddApi(targetId)
      }
      return;
    }
    if (isTag) {
        const { code, message: msg, data } = await getTagDetail(id);
    if (code !== 200) {
      message.error(msg);
      return;
    }
    setTagDetail(data);
    } else {
      const { code, message: msg, data } = await getApiDetail(id);
    if (code !== 200) {
      message.error(msg);
      return;
    }
    setInitialValue({
      id
    });
    setApiDetail(data);
    }
  };
  const handleAddTag = () => {
    setOpenTag(true)
  }
  const handleAddApi = (targetId) => {
    setflag('add')
    setInitialValue({
      tagIds: [targetId]
    });
    setOpen(true)
  };
  const callSaveOrUpdateTag = async (params) => {
    let rs = (flag === 'add' ? await addTag({ ...params,parentTagId : "0"}) : await updateTag({ ...params, id: initialTagValue.id}));
    if (rs.code !== 200) {
      message.error(rs.msg);
    } else {
      setOpen(false)
      location.reload()
    }
  };
  const callSaveOrUpdateApi = async (params) => {
    let rs = (flag === 'add' ? await addApi({ ...params, tagIds: initialValue.tagIds[0] }) : await updateApi({ ...params, id: initialValue.id, tagIds: initialValue.tagIds }));
    if (rs.code !== 200) {
      message.error(rs.msg);
    } else {
      setOpen(false)
      location.reload()
    }
  };
  const handleDeleteApi = async () => {
    const { code, message: msg } = await deleteApi([initialValue.id]);
    if (code !== 200) {
      message.error(msg);
    } else {
      location.reload()
    }
  };
  const handleUpdateApi = async () => {
    let queryData = await getApiDetail(initialValue.id)
    setInitialValue(queryData.data);
    setOpen(true)
    setflag('update')
  };
  const handDelTag = async () => {
    const { code, message:msg } = await deleteTag([initialTagValue.id]);
    if (code !== 200) {
      message.error(msg);
    } else {
      location.reload()
    }
  }
  const handleUpdateTag = async () => {
    let queryData = await getTagDetail(initialTagValue.id)
    setInitalTagValue(queryData.data);
  }
  useEffect(() => {
    initData();
  }, []);

  return (
    <ApiContext.Provider
      value={{
        apiDetail,
        apiData,
        tagDetail
      }}
    >
      <Card style={{ margin: 24 }}>
        {open && <AddAndUpdateApiDoc onCancel={() => setOpen(false)} handleOk={callSaveOrUpdateApi} {...initialValue} />
        }
        {openTag && <AddAndUpdateTag onCancel={() => setOpenTag(false)} handleOk={callSaveOrUpdateTag} {...initialTagValue} />
        }
        <Row gutter={24}>
          <Col span={6}>
            <SearchApi onSelect={handleSelectNode} onRightClick={handleRightSelectNode} />
          </Col>
          <Col span={18}>
            {tagDetail.id ? ((
              <>
                <TagInfo handleUpdateTag={handleUpdateTag} handDelTag={handDelTag} />
              </>
            )) : apiDetail.id ? ((
              <>
                <ApiInfo handleUpdateApi={handleUpdateApi} handleDeleteApi={handleDeleteApi} />
              </>
            )) : ((
              <Empty description={false} style={{ padding: "160px 0" }} />
            ))
            }
          </Col>
        </Row>
        <BackTop />
      </Card>
    </ApiContext.Provider>
  );
}

export default ApiDoc;
