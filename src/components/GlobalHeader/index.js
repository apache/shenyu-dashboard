import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import styles from './index.less';

export default class GlobalHeader extends PureComponent {
  componentWillUnmount() {
  }
  
  render() {
   
    return (
      <div className={styles.header}>
        <div className={styles.right}>
          <Icon type="logout" />退出登录
        </div>
      </div>
    );
  }
}
