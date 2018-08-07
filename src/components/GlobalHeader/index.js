import React, { PureComponent } from 'react';
import { Menu, Icon, Dropdown, Avatar } from 'antd';
import styles from './index.less';

export default class GlobalHeader extends PureComponent {
  componentWillUnmount() {
  }
  
  render() {
    const {
      currentUser = {},
      onMenuClick,
    } = this.props;
    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
        <Menu.Item key="triggerError">
          <Icon type="close-circle" />触发报错
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="logout">
          <Icon type="logout" />退出登录
        </Menu.Item>
      </Menu>
    );
    return (
      <div className={styles.header}>
        <div className={styles.right}>
          <Dropdown overlay={menu}>
            <span className={`${styles.action} ${styles.account}`}>
              <Avatar size="small" className={styles.avatar} src={currentUser.avatar} />
              <span className={styles.name}>{currentUser.name}</span>
            </span>
          </Dropdown>
        </div>
      </div>
    );
  }
}
