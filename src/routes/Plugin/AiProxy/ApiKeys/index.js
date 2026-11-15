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

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { connect } from "react-redux";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Table from "@douyinfe/semi-ui/lib/es/table";
import Popconfirm from "@douyinfe/semi-ui/lib/es/popconfirm";
import Banner from "@douyinfe/semi-ui/lib/es/banner";
import LocaleProvider from "@douyinfe/semi-ui/lib/es/locale/localeProvider";
import enUS from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import zhCN from "@douyinfe/semi-ui/lib/es/locale/source/zh_CN";
import Input from "../../../../components/ui/Input";
import Switch from "../../../../components/ui/Switch";
import Modal from "../../../../components/ui/Modal";
import Form from "../../../../components/ui/Form";
import ResourceIcon from "../../../../components/ui/ResourceIcon";
import { message } from "../../../../components/ui/feedback";
import styles from "../../../../components/ui/ManagementList.module.less";
import { getIntlContent } from "../../../../utils/IntlUtils";
import AuthButton from "../../../../utils/AuthButton";
import {
  addAiProxyApiKey,
  getAiProxyApiKeys,
  updateAiProxyApiKey,
  batchDeleteAiProxyApiKeys,
  batchEnableAiProxyApiKeys,
} from "../../../../services/api";
import { clipboardCopy } from "../../../../utils/utils";

// proxyApiKey needs to be fully visible on the management page, so we do not mask it
class CreateModalInner extends React.Component {
  componentDidUpdate(prevProps) {
    const { visible, defaultNamespace, form } = this.props;
    if (visible && visible !== prevProps.visible) {
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
        namespaceId: defaultNamespace,
      });
    }
  }

  handleOk = () => {
    const { form, onOk } = this.props;
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        onOk({ ...values });
      }
    });
  };

  render() {
    const { visible, onCancel, defaultNamespace, form, realApiKeyPreset } =
      this.props;
    const { getFieldDecorator } = form;
    return (
      <Modal
        title={getIntlContent("APIPROXY.APIKEY.CREATE") || "Create API Key"}
        visible={visible}
        onCancel={onCancel}
        onOk={this.handleOk}
        okText={getIntlContent("SHENYU.COMMON.SAVE")}
        cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="Real API Key">
            <Input value={realApiKeyPreset} disabled />
          </Form.Item>
          <Form.Item
            label={getIntlContent("SHENYU.SYSTEM.DESCRIBE") || "Description"}
          >
            {getFieldDecorator("description")(<Input maxLength={200} />)}
          </Form.Item>
          <Form.Item label={getIntlContent("SHENYU.COMMON.OPEN") || "Enabled"}>
            {getFieldDecorator("enabled", {
              valuePropName: "checked",
              initialValue: true,
            })(<Switch />)}
          </Form.Item>
          <Form.Item label="Namespace">
            {getFieldDecorator("namespaceId", {
              initialValue: defaultNamespace,
            })(<Input disabled placeholder="default" />)}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
const CreateModal = Form.create()(CreateModalInner);

function EditModalStateless(props) {
  const { visible, onCancel, onOk, record, defaultNamespace, form } = props;
  const { getFieldDecorator, resetFields, setFieldsValue } = form;
  React.useEffect(() => {
    if (visible) {
      resetFields();
      setFieldsValue({
        description: record && record.description,
        enabled: record && record.enabled,
        namespaceId: defaultNamespace,
      });
    }
  }, [visible, record, defaultNamespace]);

  const handleOk = () => {
    form.validateFieldsAndScroll((err, values) => {
      if (!err) onOk(values);
    });
  };

  return (
    <Modal
      title={getIntlContent("APIPROXY.APIKEY.EDIT") || "Edit API Key"}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText={getIntlContent("SHENYU.COMMON.SAVE")}
      cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="Proxy API Key">
          <Input value={record && record.proxyApiKey} disabled />
        </Form.Item>
        <Form.Item
          label={getIntlContent("SHENYU.SYSTEM.DESCRIBE") || "Description"}
        >
          {getFieldDecorator("description", {
            initialValue: record && record.description,
          })(<Input maxLength={200} />)}
        </Form.Item>
        <Form.Item label={getIntlContent("SHENYU.COMMON.OPEN") || "Enabled"}>
          {getFieldDecorator("enabled", {
            valuePropName: "checked",
            initialValue: record ? record.enabled : true,
          })(<Switch />)}
        </Form.Item>
        <Form.Item label="Namespace">
          {getFieldDecorator("namespaceId", {
            initialValue: defaultNamespace,
          })(<Input disabled placeholder="default" />)}
        </Form.Item>
      </Form>
    </Modal>
  );
}
const EditModal = Form.create()(EditModalStateless);

function ApiKeysPage({
  currentNamespaceId,
  initialSelectorId,
  initialNamespaceId,
  onBack,
  currentSelector,
  language,
}) {
  const selectorId = initialSelectorId;
  const namespaceId = initialNamespaceId || currentNamespaceId || "default";
  const scope = JSON.stringify([selectorId, namespaceId]);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const mounted = useRef(false);
  const requestId = useRef(0);
  const refresh = useRef(null);
  const [queryKey, setQueryKey] = useState();
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState();
  const [createdKey, setCreatedKey] = useState();
  const [pendingDelete, setPendingDelete] = useState(null);
  const realKeyFromSelector = useMemo(() => {
    try {
      const handle = currentSelector && currentSelector.handle;
      const config = typeof handle === "string" ? JSON.parse(handle) : handle;
      return config && (config.realApiKey || config.realKey || config.apiKey);
    } catch {
      return undefined;
    }
  }, [currentSelector]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, []);

  const fetchList = useCallback(
    async (p = page, ps = pageSize, key = queryKey) => {
      if (!selectorId) return;
      requestId.current += 1;
      const request = requestId.current;
      try {
        const res = await getAiProxyApiKeys({
          selectorId,
          namespaceId,
          currentPage: p,
          pageSize: ps,
          proxyApiKey: key && key.trim() !== "" ? key.trim() : undefined,
        });
        if (
          !mounted.current ||
          scopeRef.current !== scope ||
          request !== requestId.current
        )
          return;
        if (res?.code !== 200) {
          if (res) message.warn(res.message || "Request failed");
          return;
        }
        setData(res.data?.dataList || []);
        setTotal(res.data?.totalCount || 0);
      } catch (error) {
        if (
          mounted.current &&
          scopeRef.current === scope &&
          request === requestId.current
        )
          message.warn(error.message || "Request failed");
      }
    },
    [selectorId, namespaceId, scope, page, pageSize, queryKey],
  );
  refresh.current = fetchList;

  useEffect(() => {
    setPage(1);
    setSelectedRowKeys([]);
    setCreateOpen(false);
    setEditOpen(false);
    setCurrent(undefined);
    setCreatedKey(undefined);
    setPendingDelete(null);
    setData([]);
    setTotal(0);
    fetchList(1, pageSize);
    return () => {
      requestId.current += 1;
    };
    // Fetch only for a context change; search and pagination issue their own request.
    // eslint-disable-next-line
  }, [selectorId, namespaceId]);

  const isCurrent = () => mounted.current && scopeRef.current === scope;
  const success = (res) => {
    if (!isCurrent()) return false;
    if (res?.code === 200) return true;
    if (res) message.warn(res.message || "Request failed");
    return false;
  };
  const onToggle = async (ids, enabled) => {
    if (!selectorId) return;
    const res = await batchEnableAiProxyApiKeys({ selectorId, ids, enabled });
    if (success(res)) refresh.current();
  };
  const onBatchDelete = async (ids) => {
    if (!selectorId) return false;
    const res = await batchDeleteAiProxyApiKeys({ selectorId, ids });
    if (!success(res)) return false;
    setSelectedRowKeys((keys) => keys.filter((id) => !ids.includes(id)));
    refresh.current();
    return true;
  };
  const onCreate = async (values) => {
    if (!selectorId) return;
    const res = await addAiProxyApiKey({ selectorId, ...values });
    if (!success(res)) return;
    setCreateOpen(false);
    const key = res.data?.proxyApiKey;
    if (key) setCreatedKey(key);
    else message.success(getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS"));
    setPage(1);
    refresh.current(1);
  };
  const onEdit = async (values) => {
    if (!selectorId || !current) return;
    const res = await updateAiProxyApiKey({
      selectorId,
      id: current.id,
      ...values,
    });
    if (!success(res)) return;
    setEditOpen(false);
    refresh.current();
  };
  const hasSelection = () => {
    if (selectedRowKeys.length) return true;
    message.destroy();
    message.warn(
      getIntlContent("SHENYU.COMMON.WARN.INPUT_SELECTOR") ||
        "Please select data",
    );
    return false;
  };
  const copyKey = () =>
    clipboardCopy(createdKey)
      .then((copied) =>
        copied
          ? message.success(getIntlContent("SHENYU.COMMON.COPY"))
          : message.warn("Copy failed"),
      )
      .catch(() => message.warn("Copy failed"));
  const search = (value) => {
    const trimmed = value.trim();
    setQueryKey(trimmed || undefined);
    setPage(1);
    fetchList(1, pageSize, trimmed);
  };
  const columns = [
    {
      title: "proxyApiKey",
      dataIndex: "proxyApiKey",
      key: "proxyApiKey",
      width: 320,
      render: (value) => (
        <span style={{ wordBreak: "break-all" }}>{value}</span>
      ),
    },
    {
      title: getIntlContent("SHENYU.SYSTEM.DESCRIBE") || "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: getIntlContent("SHENYU.COMMON.OPEN") || "Enabled",
      dataIndex: "enabled",
      key: "enabled",
      width: 120,
      render: (value, record) => (
        <Switch
          aria-label={`${record.id}: ${getIntlContent("SHENYU.COMMON.OPEN")}`}
          checked={value}
          onChange={(checked) => onToggle([record.id], checked)}
        />
      ),
    },
    {
      title: getIntlContent("SHENYU.SYSTEM.UPDATETIME") || "Update Time",
      dataIndex: "dateUpdated",
      key: "dateUpdated",
      width: 180,
    },
    {
      title: getIntlContent("SHENYU.COMMON.OPERAT") || "Operation",
      key: "op",
      width: 180,
      render: (_, record) => (
        <div className={styles.actions}>
          <AuthButton perms="system:aiProxyApiKey:edit">
            {({ icon }) => (
              <Button
                htmlType="button"
                theme="borderless"
                icon={icon ? <ResourceIcon type={icon} /> : undefined}
                onClick={() => {
                  setCurrent(record);
                  setEditOpen(true);
                }}
              >
                {getIntlContent("SHENYU.COMMON.CHANGE")}
              </Button>
            )}
          </AuthButton>
          <AuthButton perms="system:aiProxyApiKey:delete">
            {({ icon }) => (
              <Popconfirm
                title={getIntlContent("SHENYU.COMMON.DELETE")}
                motion={false}
                onConfirm={() => onBatchDelete([record.id])}
                okText={getIntlContent("SHENYU.COMMON.SURE")}
                cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
              >
                <Button
                  htmlType="button"
                  theme="borderless"
                  type="danger"
                  icon={icon ? <ResourceIcon type={icon} /> : undefined}
                >
                  {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                </Button>
              </Popconfirm>
            )}
          </AuthButton>
        </div>
      ),
    },
  ];

  return (
    <LocaleProvider locale={language === "zh-CN" ? zhCN : enUS}>
      <div className="plug-content-wrap">
        <div className={styles.toolbar} style={{ marginBottom: 12 }}>
          {onBack && (
            <Button htmlType="button" onClick={() => onBack()}>
              {getIntlContent("SHENYU.COMMON.BACK") || "Back"}
            </Button>
          )}
          <h2 style={{ margin: 0 }}>API Key</h2>
          <span className={styles.secondary}>Ai</span>
        </div>
        {selectorId && (
          <Banner
            type="info"
            fullMode={false}
            closeIcon={null}
            title={getIntlContent("APIPROXY.APIKEY.USAGE.TITLE")}
            description={
              <div>
                <div>{getIntlContent("APIPROXY.APIKEY.USAGE.LINE1")}</div>
                <div>{getIntlContent("APIPROXY.APIKEY.USAGE.LINE2")}</div>
              </div>
            }
            style={{ marginBottom: 12 }}
          />
        )}
        <form
          className={styles.toolbar}
          onSubmit={(event) => {
            event.preventDefault();
            search(searchText);
          }}
        >
          <Input
            className={styles.filter}
            value={searchText}
            placeholder="proxyApiKey"
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Button htmlType="submit" theme="solid" type="primary">
            {getIntlContent("SHENYU.SYSTEM.SEARCH")}
          </Button>
          <Button
            htmlType="button"
            onClick={() => {
              setSearchText("");
              search("");
            }}
          >
            {getIntlContent("SHENYU.COMMON.REFRESH") || "Refresh"}
          </Button>
          <AuthButton perms="system:aiProxyApiKey:add">
            {({ icon }) => (
              <Button
                htmlType="button"
                type="primary"
                theme="solid"
                icon={icon ? <ResourceIcon type={icon} /> : undefined}
                onClick={() => setCreateOpen(true)}
              >
                {getIntlContent("SHENYU.COMMON.ADD")}
              </Button>
            )}
          </AuthButton>
          <AuthButton perms="system:aiProxyApiKey:disable">
            {({ icon }) => (
              <Button
                htmlType="button"
                type="primary"
                theme="solid"
                icon={icon ? <ResourceIcon type={icon} /> : undefined}
                onClick={() => {
                  if (hasSelection()) onToggle(selectedRowKeys, true);
                }}
              >
                {getIntlContent("SHENYU.PLUGIN.SELECTOR.BATCH.OPENED")}
              </Button>
            )}
          </AuthButton>
          <AuthButton perms="system:aiProxyApiKey:disable">
            {({ icon }) => (
              <Button
                htmlType="button"
                type="primary"
                theme="solid"
                icon={icon ? <ResourceIcon type={icon} /> : undefined}
                onClick={() => {
                  if (hasSelection()) onToggle(selectedRowKeys, false);
                }}
              >
                {getIntlContent("SHENYU.PLUGIN.SELECTOR.BATCH.CLOSED")}
              </Button>
            )}
          </AuthButton>
          <AuthButton perms="system:aiProxyApiKey:delete">
            {({ icon }) => (
              <Button
                htmlType="button"
                type="danger"
                theme="solid"
                icon={icon ? <ResourceIcon type={icon} /> : undefined}
                onClick={() => {
                  if (hasSelection()) setPendingDelete([...selectedRowKeys]);
                }}
              >
                {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
              </Button>
            )}
          </AuthButton>
        </form>
        <Table
          size="small"
          rowKey="id"
          bordered
          style={{ marginTop: 20 }}
          columns={columns}
          dataSource={data}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            total,
            showTotal: true,
            showSizeChanger: true,
            pageSizeOpts: [10, 20, 50, 100],
            currentPage: page,
            pageSize,
            onChange: (next, size) => {
              const target = size === pageSize ? next : 1;
              setPage(target);
              setPageSize(size);
              fetchList(target, size);
            },
          }}
        />
        {createOpen && (
          <CreateModal
            visible
            onCancel={() => setCreateOpen(false)}
            onOk={onCreate}
            defaultNamespace={namespaceId}
            realApiKeyPreset={realKeyFromSelector}
          />
        )}
        {editOpen && (
          <EditModal
            id={current?.id}
            visible
            onCancel={() => setEditOpen(false)}
            onOk={onEdit}
            record={current}
            defaultNamespace={namespaceId}
          />
        )}
        {createdKey && (
          <Modal
            visible
            title={getIntlContent("APIPROXY.APIKEY.CREATE")}
            onCancel={() => setCreatedKey(undefined)}
            footer={
              <Button
                htmlType="button"
                type="primary"
                theme="solid"
                onClick={() => setCreatedKey(undefined)}
              >
                {getIntlContent("SHENYU.COMMON.SURE")}
              </Button>
            }
          >
            <div>Proxy API Key:</div>
            <div
              style={{
                wordBreak: "break-all",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {createdKey}
            </div>
            <Button htmlType="button" onClick={copyKey}>
              {getIntlContent("SHENYU.COMMON.COPY")}
            </Button>
            <p>{getIntlContent("APIPROXY.APIKEY.USAGE.HINT")}</p>
          </Modal>
        )}
        {pendingDelete && (
          <Modal
            visible
            title={getIntlContent("SHENYU.COMMON.DELETE")}
            okText={getIntlContent("SHENYU.COMMON.SURE")}
            cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
            onCancel={() => setPendingDelete(null)}
            onOk={async () => {
              if (await onBatchDelete(pendingDelete)) setPendingDelete(null);
            }}
          />
        )}
      </div>
    </LocaleProvider>
  );
}

export default connect(({ global }) => ({
  currentNamespaceId: global.currentNamespaceId,
  language: global.language,
}))(ApiKeysPage);
