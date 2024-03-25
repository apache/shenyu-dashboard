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

import React, { Component } from "react";

function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val;
}

function initTime(target) {
  let lastTime = 0;
  let targetTime = 0;
  try {
    if (Object.prototype.toString.call(target) === "[object Date]") {
      targetTime = target.getTime();
    } else {
      targetTime = new Date(target).getTime();
    }
  } catch (e) {
    throw new Error(`invalid target prop ${e.message}`);
  }

  lastTime = targetTime - new Date().getTime();
  return {
    lastTime: Math.max(lastTime, 0),
  };
}

class CountDown extends Component {
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.target !== prevState.target) {
      const { lastTime } = initTime(nextProps.target);
      return {
        lastTime,
        target: nextProps.target,
        resetTimer: true,
      };
    }
    return null;
  }

  timer = 0;

  interval = 1000;

  constructor(props) {
    super(props);

    const { lastTime } = initTime(props.target);

    this.state = {
      lastTime,
    };
  }

  componentDidMount() {
    this.tick();
  }

  componentDidUpdate() {
    if (!this.state.resetTimer) {
      return;
    }
    clearTimeout(this.timer);
    this.tick();
    // eslint-disable-next-line react/no-did-update-set-state
    this.setState({ resetTimer: false });
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  // defaultFormat = time => (
  //  <span>{moment(time).format('hh:mm:ss')}</span>
  // );
  defaultFormat = (time) => {
    const hours = 60 * 60 * 1000;
    const minutes = 60 * 1000;

    const h = Math.floor(time / hours);
    const m = Math.floor((time - h * hours) / minutes);
    const s = Math.floor((time - h * hours - m * minutes) / 1000);
    return (
      <span>
        {fixedZero(h)}:{fixedZero(m)}:{fixedZero(s)}
      </span>
    );
  };

  tick = () => {
    const { onEnd = () => {} } = this.props;
    let { lastTime } = this.state;

    this.timer = setTimeout(() => {
      if (lastTime < this.interval) {
        clearTimeout(this.timer);
        this.setState(
          {
            lastTime: 0,
          },
          () => {
            if (onEnd) {
              onEnd();
            }
          },
        );
      } else {
        lastTime -= this.interval;
        this.setState(
          {
            lastTime,
          },
          () => {
            this.tick();
          },
        );
      }
    }, this.interval);
  };

  render() {
    const { format = this.defaultFormat, onEnd, ...rest } = this.props;
    const { lastTime } = this.state;
    const result = format(lastTime);

    return <span {...rest}>{result}</span>;
  }
}

export default CountDown;
