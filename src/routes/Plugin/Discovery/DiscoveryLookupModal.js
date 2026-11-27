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
import { connect } from "react-redux";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import { getDiscovery } from "../../../services/api";
import { getIntlContent } from "../../../utils/IntlUtils";

export function DiscoveryLookupModalComponent({
  pluginName,
  namespaceId,
  typeEnums,
  initialType,
  title,
  onOk,
  onCancel,
  canCreate,
}) {
  const [type, setType] = useState(initialType);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!type) return undefined;
    let active = true;
    const finish = (value) => {
      if (active) setResult({ pluginName, namespaceId, type, ...value });
    };
    getDiscovery({ pluginName, level: "1", namespaceId, discoveryType: type })
      .then(({ code, data, message }) => {
        const recordType = data?.discoveryType ?? data?.type;
        if (code !== 200 || (data !== null && recordType !== type)) {
          finish({
            error:
              (code !== 200 && message) ||
              getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.LOAD.ERROR"),
          });
          return;
        }
        // Admin returns a DiscoveryVO, while the editor submits a DiscoveryDTO.
        const config = data && {
          ...data,
          name: data.discoveryName ?? data.name,
          type: recordType,
        };
        finish({ data: config });
      })
      .catch(() =>
        finish({
          error: getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.LOAD.ERROR"),
        }),
      );
    return () => {
      active = false;
    };
  }, [pluginName, namespaceId, type]);

  const current =
    result?.type === type &&
    result?.namespaceId === namespaceId &&
    result?.pluginName === pluginName
      ? result
      : null;
  const ready =
    current && !current.error && (current.data || canCreate?.(type));
  return (
    <Modal
      visible
      centered
      title={getIntlContent(title)}
      onCancel={onCancel}
      onOk={() => ready && onOk(current.data, type)}
      okButtonProps={{ disabled: !ready }}
      okText={getIntlContent(
        !canCreate
          ? "SHENYU.DISCOVERY.SELECTOR.CONFIG.IMPORT.SURE"
          : "SHENYU.COMMON.SURE",
      )}
      cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
    >
      <Select
        value={type}
        aria-label={getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.TYPE")}
        placeholder={getIntlContent(
          "SHENYU.DISCOVERY.CONFIGURATION.TYPE.INPUT",
        )}
        onChange={(value) => {
          if (type !== value) {
            setResult(null);
            setType(value);
          }
        }}
      >
        {typeEnums.map((value) => (
          <Select.Option key={value} value={value}>
            {value}
          </Select.Option>
        ))}
      </Select>
      {type && !current && (
        <p role="status">{getIntlContent("SHENYU.HOME.LOADING")}</p>
      )}
      {current?.error && <p role="alert">{current.error}</p>}
      {current?.data === null && (
        <p role="status">
          {getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.NO.MATCH")}
        </p>
      )}
      {!canCreate && current?.data && (
        <dl>
          <dt>{getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.SERVERLIST")}</dt>
          <dd>{current.data.serverList}</dd>
          <dt>{getIntlContent("SHENYU.DISCOVERY.CONFIGURATION.PROPS")}</dt>
          <dd>
            <pre>{current.data.props}</pre>
          </dd>
        </dl>
      )}
    </Modal>
  );
}

export default connect(({ global, discovery }) => ({
  namespaceId: global.currentNamespaceId,
  typeEnums: discovery.typeEnums,
}))(DiscoveryLookupModalComponent);
