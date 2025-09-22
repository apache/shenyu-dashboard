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

import React, { useEffect, useMemo, useState } from "react";
import { connect } from "dva";
import {
  Button,
  Input,
  Row,
  Col,
  Table,
  Switch,
  Modal,
  Form,
  Typography,
  Popconfirm,
  message,
  Alert,
} from "antd";
import styles from "../../index.less";
import { getIntlContent } from "../../../../utils/IntlUtils";
import AuthButton from "../../../../utils/AuthButton";
import {
  addAiProxyApiKey,
  getAiProxyApiKeys,
  updateAiProxyApiKey,
  batchDeleteAiProxyApiKeys,
  batchEnableAiProxyApiKeys,
} from "../../../../services/api";

const { Search } = Input;
const { Title } = Typography;

// proxyApiKey 需在管理页完整显示，因此不做掩码处理
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
}) {
  const [selectorId, setSelectorId] = useState(initialSelectorId);
  const [namespaceId, setNamespaceId] = useState(
    initialNamespaceId || currentNamespaceId || "default",
  );
  const [queryKey, setQueryKey] = useState();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState();
  const realKeyFromSelector = useMemo(() => {
    try {
      const handle = currentSelector && currentSelector.handle;
      if (handle) {
        const obj = typeof handle === "string" ? JSON.parse(handle) : handle;
        return obj && (obj.realApiKey || obj.realKey || obj.apiKey);
      }
    } catch (e) {
      // ignore
    }
    return undefined;
  }, [currentSelector]);

  useEffect(() => {
    if (initialSelectorId) setSelectorId(initialSelectorId);
    if (initialNamespaceId) setNamespaceId(initialNamespaceId);
    // eslint-disable-next-line
  }, [initialSelectorId, initialNamespaceId]);

  useEffect(() => {
    if (selectorId) {
      fetchList(1, pageSize);
    }
    // eslint-disable-next-line
  }, [selectorId, namespaceId]);

  const columns = useMemo(
    () => [
      { title: "proxyApiKey", dataIndex: "proxyApiKey", key: "proxyApiKey" },
      {
        title: getIntlContent("SHENYU.SYSTEM.DESCRIBE") || "Description",
        dataIndex: "description",
        key: "description",
      },
      {
        title: getIntlContent("SHENYU.COMMON.OPEN") || "Enabled",
        dataIndex: "enabled",
        key: "enabled",
        render: (v, r) => (
          <Switch
            checked={v}
            onChange={(checked) => onToggle([r.id], checked)}
          />
        ),
      },
      {
        title: getIntlContent("SHENYU.SYSTEM.UPDATETIME") || "Update Time",
        dataIndex: "dateUpdated",
        key: "dateUpdated",
      },
      {
        title: getIntlContent("SHENYU.COMMON.OPERAT") || "Operation",
        key: "op",
        render: (_, r) => (
          <div>
            <AuthButton perms="system:aiProxyApiKey:edit">
              <span
                className="edit"
                style={{ marginRight: 8 }}
                onClick={() => {
                  setCurrent(r);
                  setEditOpen(true);
                }}
              >
                {getIntlContent("SHENYU.COMMON.CHANGE")}
              </span>
            </AuthButton>
            <AuthButton perms="system:aiProxyApiKey:delete">
              <Popconfirm
                title={
                  getIntlContent("SHENYU.COMMON.DELETE") || "Confirm delete?"
                }
                onConfirm={() => onBatchDelete([r.id])}
                okText={getIntlContent("SHENYU.COMMON.SURE")}
                cancelText={getIntlContent("SHENYU.COMMON.CALCEL")}
              >
                <span className="edit">
                  {getIntlContent("SHENYU.COMMON.DELETE.NAME")}
                </span>
              </Popconfirm>
            </AuthButton>
          </div>
        ),
      },
    ],
    [namespaceId, onToggle],
  );

  const fetchList = async (p = page, ps = pageSize) => {
    if (!selectorId) return;
    const res = await getAiProxyApiKeys({
      selectorId,
      namespaceId,
      currentPage: p,
      pageSize: ps,
      proxyApiKey:
        queryKey && queryKey.trim() !== "" ? queryKey.trim() : undefined,
    });
    const list = res?.data?.dataList || [];
    setData(list);
    setTotal(res?.data?.totalCount || 0);
  };

  const onToggle = async (ids, enabled) => {
    if (!selectorId) return;
    await batchEnableAiProxyApiKeys({ selectorId, ids, enabled });
    fetchList();
  };

  const onBatchDelete = async (ids) => {
    if (!selectorId) return;
    await batchDeleteAiProxyApiKeys({ selectorId, ids });
    fetchList();
  };

  const onCreate = async (values) => {
    if (!selectorId) return;
    const res = await addAiProxyApiKey({ selectorId, ...values });
    setCreateOpen(false);
    const newKey = res && res.data && res.data.proxyApiKey;
    if (newKey) {
      const copy = async (text) => {
        try {
          if (
            navigator &&
            navigator.clipboard &&
            navigator.clipboard.writeText
          ) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          message.success(getIntlContent("SHENYU.COMMON.COPY") || "Copy");
        } catch (e) {
          message.warn("Copy failed");
        }
      };
      Modal.success({
        title: getIntlContent("APIPROXY.APIKEY.CREATE") || "Create API Key",
        content: (
          <div>
            <div style={{ marginBottom: 6 }}>Proxy API Key:</div>
            <div
              style={{
                wordBreak: "break-all",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {newKey}
            </div>
            <Button onClick={() => copy(newKey)}>
              {getIntlContent("SHENYU.COMMON.COPY") || "Copy"}
            </Button>
          </div>
        ),
      });
    } else {
      message.success(
        getIntlContent("SHENYU.COMMON.RESPONSE.ADD.SUCCESS") ||
          "Create success",
      );
    }
    fetchList(1, pageSize);
  };

  const onEdit = async (values) => {
    if (!selectorId || !current) return;
    await updateAiProxyApiKey({ selectorId, id: current.id, ...values });
    setEditOpen(false);
    fetchList(page, pageSize);
  };

  const onBatchDeleteConfirm = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      message.destroy();
      message.warn(
        getIntlContent("SHENYU.COMMON.WARN.INPUT_SELECTOR") ||
          "Please select data",
      );
      return;
    }
    Modal.confirm({
      title: getIntlContent("SHENYU.COMMON.DELETE") || "Confirm delete?",
      okText: getIntlContent("SHENYU.COMMON.SURE"),
      cancelText: getIntlContent("SHENYU.COMMON.CALCEL"),
      onOk: () => onBatchDelete(selectedRowKeys),
    });
  };

  const onBatchEnable = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      message.destroy();
      message.warn(
        getIntlContent("SHENYU.COMMON.WARN.INPUT_SELECTOR") ||
          "Please select data",
      );
      return;
    }
    onToggle(selectedRowKeys, true);
  };

  const onBatchDisable = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      message.destroy();
      message.warn(
        getIntlContent("SHENYU.COMMON.WARN.INPUT_SELECTOR") ||
          "Please select data",
      );
      return;
    }
    onToggle(selectedRowKeys, false);
  };

  return (
    <div className="plug-content-wrap">
      <Row
        style={{
          marginBottom: 5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "end", flex: 1, margin: 0 }}>
          {onBack ? (
            <Button style={{ marginRight: 12 }} onClick={() => onBack()}>
              {getIntlContent("SHENYU.COMMON.BACK") || "Back"}
            </Button>
          ) : null}
          <Title
            level={2}
            style={{ textTransform: "capitalize", margin: "0 20px 0 0" }}
          >
            API Key
          </Title>
          <Title level={3} type="secondary" style={{ margin: "0 20px 0 0" }}>
            Ai
          </Title>
        </div>
      </Row>

      {selectorId ? (
        <Alert
          type="info"
          showIcon
          message={getIntlContent("APIPROXY.APIKEY.USAGE.TITLE")}
          description={
            <div>
              <div>{getIntlContent("APIPROXY.APIKEY.USAGE.LINE1")}</div>
              <div style={{ marginTop: 4 }}>
                {getIntlContent("APIPROXY.APIKEY.USAGE.LINE2")}
              </div>
            </div>
          }
          style={{ marginBottom: 12 }}
        />
      ) : null}

      <Row gutter={20}>
        <Col span={24}>
          <div className="table-header">
            <div className={styles.headerSearch}>
              <Search
                className={styles.search}
                style={{ minWidth: 160 }}
                placeholder="proxyApiKey"
                onSearch={(v) => {
                  const value = (v || "").trim();
                  setQueryKey(value === "" ? undefined : value);
                  setPage(1);
                  fetchList(1, pageSize);
                }}
              />
              <Button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  setQueryKey(undefined);
                  setPage(1);
                  fetchList(1, pageSize);
                }}
              >
                {getIntlContent("SHENYU.COMMON.REFRESH") || "Refresh"}
              </Button>
              <AuthButton perms="system:aiProxyApiKey:add">
                <Button
                  type="primary"
                  onClick={() => setCreateOpen(true)}
                  style={{ marginLeft: 10 }}
                >
                  {getIntlContent("SHENYU.COMMON.ADD")}
                </Button>
              </AuthButton>
              <AuthButton perms="system:aiProxyApiKey:disable">
                <Button
                  type="primary"
                  onClick={onBatchEnable}
                  style={{ marginLeft: 10 }}
                >
                  {getIntlContent("SHENYU.PLUGIN.SELECTOR.BATCH.OPENED")}
                </Button>
              </AuthButton>
              <AuthButton perms="system:aiProxyApiKey:disable">
                <Button
                  type="primary"
                  onClick={onBatchDisable}
                  style={{ marginLeft: 10 }}
                >
                  {getIntlContent("SHENYU.PLUGIN.SELECTOR.BATCH.CLOSED")}
                </Button>
              </AuthButton>
              <AuthButton perms="system:aiProxyApiKey:delete">
                <Button
                  type="primary"
                  onClick={onBatchDeleteConfirm}
                  style={{ marginLeft: 10 }}
                >
                  {getIntlContent("SHENYU.SYSTEM.DELETEDATA")}
                </Button>
              </AuthButton>
            </div>
          </div>

          <Table
            size="small"
            style={{ marginTop: 20 }}
            rowKey={(r) => r.id}
            bordered
            columns={columns}
            dataSource={data}
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={{
              total,
              showTotal: (t) => `${t}`,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              current: page,
              pageSize,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
                fetchList(p, ps);
              },
              onShowSizeChange: (cp, ps) => {
                setPage(1);
                setPageSize(ps);
                fetchList(1, ps);
              },
            }}
          />
        </Col>
      </Row>

      <CreateModal
        visible={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={onCreate}
        defaultNamespace={namespaceId}
        realApiKeyPreset={realKeyFromSelector}
      />
      <EditModal
        visible={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={onEdit}
        record={current}
        defaultNamespace={namespaceId}
      />
    </div>
  );
}

export default connect(({ global }) => ({
  currentNamespaceId: global.currentNamespaceId,
}))(ApiKeysPage);
