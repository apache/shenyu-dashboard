import React, { PureComponent } from 'react';
import { Icon } from 'antd';
import styles from './index.less';

export default class GlobalHeader extends PureComponent {
 
  render() {
   const { onLogout } = this.props;
    return (
      <div className={styles.header}>
        <div className={styles.right} onClick={onLogout}>
          <Icon type="logout" />退出登录
        </div>
      </div>
    );
  }
}
