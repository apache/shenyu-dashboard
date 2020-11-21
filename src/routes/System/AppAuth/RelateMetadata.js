import React, { Component } from "react";
import { Modal, Form } from "antd";
// import styles from "./index.less";
import TableTransferComponent from "./TableTransfer"

class RelateMetadata extends Component {
  constructor(props) {
    super(props);
    this.state= {
    authPathDTOList: [],
    id: this.props.id
    }
  }
  
  // 获取穿梭框中右侧数据以便更新
  getUpdateMetas = data => {
    
    this.setState({
      authPathDTOList: data,
    })
  }
  

  handleSubmit = () => {
    const {handleOk} = this.props;
    // 需要传值更新
    handleOk(this.state);
    
  };

  render(){
    let { authName, handleCancel,auth,dataList }=this.props;
    
    return (
      <Modal 
        width={900}
        centered
        visible
        title="Basic Modal"
        okText="确定"
        cancelText="取消"
        onOk={this.handleSubmit}
        onCancel={handleCancel}
      >
        
        {/* 放置穿梭框组件 */}
        <TableTransferComponent authName={authName} auth={auth} datalist={dataList} handleGetUpdateMetas={(data)=>this.getUpdateMetas(data)} />
      </Modal>
    )
  }

  
}

export default Form.create()(RelateMetadata);
