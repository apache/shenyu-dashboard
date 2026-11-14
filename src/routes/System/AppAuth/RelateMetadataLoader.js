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

import React, { useEffect, useState } from "react";
import { Button, Modal, Spin } from "antd";
import { getIntlContent } from "../../../utils/IntlUtils";
import loadRelateMetadata from "./loadRelateMetadata";

export default function RelateMetadataLoader(props) {
  const [Editor, setEditor] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadRelateMetadata().then(
      (module) => {
        if (active) {
          setEditor(() => module.default);
        }
      },
      () => {
        if (active) {
          setFailed(true);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  if (Editor) {
    return <Editor {...props} />;
  }

  return (
    <Modal
      visible
      centered
      width={1200}
      title={getIntlContent("SHENYU.AUTH.EDITOR.RESOURCE")}
      footer={null}
      onCancel={props.handleCancel}
    >
      {failed ? (
        <div role="alert">
          <p>{getIntlContent("SHENYU.AUTH.RESOURCE.LOAD.FAILED")}</p>
          <Button
            onClick={() => {
              setFailed(false);
              setAttempt(attempt + 1);
            }}
          >
            {getIntlContent("SHENYU.META.EDITOR.RETRY")}
          </Button>
        </div>
      ) : (
        <div
          role="status"
          aria-label={getIntlContent("SHENYU.AUTH.RESOURCE.LOADING")}
        >
          <Spin />
        </div>
      )}
    </Modal>
  );
}
