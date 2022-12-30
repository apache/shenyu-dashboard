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

import { Typography , Button, Card, Tabs } from "antd";
import React, { useContext } from "react";
import TagContext from "./TagContext";

const { Title } = Typography;
const TabPane = Tabs.TabPane;

function TagInfo(props) {
  const {
    tagData: { envProps = [] },
    tagDetail: { id , name , tagDesc , ext }
  } = useContext(TagContext);
  let documentJSON = {};
  let {handleUpdateTag,handleDelTag} = props
  try {
    documentJSON = JSON.parse(document);
    documentJSON.errorCode = [];
    Object.keys(documentJSON.responses).forEach(key => {
      documentJSON.errorCode.push({
        code: key,
        description: documentJSON.responses[key].description,
        content: documentJSON.responses[key].content
      });
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
  return (
    <>
      <Tabs defaultActiveKey='1'>
        <TabPane tab="tab1" key="1">Content of Tab1</TabPane>
      </Tabs>
    </>
  );
}

export default TagInfo;
