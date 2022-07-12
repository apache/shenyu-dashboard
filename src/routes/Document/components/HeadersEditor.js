import { Col, Input, Row, Button, Icon, Typography } from "antd";
import React, { Fragment } from "react";

const { Text } = Typography;

function HeadersEditor(props) {
  const { value, onChange } = props;
  const onChangeItem = (e, key, id) => {
    onChange(
      value.map(
        item => (item.id === id ? { ...item, [key]: e.target.value } : item)
      )
    );
  };

  const onDeleteItem = id => {
    onChange(value.filter(item => item.id !== id));
  };

  const onAddItem = () => {
    onChange([
      ...value,
      { id: `${Date.now()}`, name: "", example: "", required: false }
    ]);
  };

  return (
    <Row gutter={16}>
      {value.map(item => (
        <Fragment key={item.id}>
          <Col span={6}>
            <Input
              allowClear
              value={item.name}
              readOnly={item.required}
              onChange={e => onChangeItem(e, "name", item.id)}
            />
          </Col>
          <Col span={16}>
            <Input
              allowClear
              value={item.example}
              placeholder={item.description}
              prefix={
                item.required && (
                  <Text type="danger" strong>
                    *
                  </Text>
                )
              }
              onChange={e => onChangeItem(e, "example", item.id)}
            />
          </Col>
          <Col span={2} style={{ textAlign: "center" }}>
            {!item.required && (
              <Text type="danger">
                <Icon
                  style={{ fontSize: "16px" }}
                  type="minus-circle-o"
                  onClick={() => onDeleteItem(item.id)}
                />
              </Text>
            )}
          </Col>
        </Fragment>
      ))}

      <Col span={24}>
        <Button block type="dashed" onClick={onAddItem}>
          <Icon type="plus" /> Add header
        </Button>
      </Col>
    </Row>
  );
}

export default HeadersEditor;
