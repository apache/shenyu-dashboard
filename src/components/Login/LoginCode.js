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
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
} from "react";
import { randomNum, originalCharacter } from "../_utils/utils";
import { getIntlContent } from "../../utils/IntlUtils";

function createCode() {
  return Array.from(
    { length: 4 },
    () => originalCharacter[randomNum(0, originalCharacter.length - 1)],
  ).join("");
}

const LoginCode = ({ ChildGetCode, onRef }) => {
  const [code, setCode] = useState(createCode);
  const callback = useRef(ChildGetCode);
  callback.current = ChildGetCode;
  useEffect(() => {
    callback.current(code);
  }, [code]);
  const refresh = useCallback(() => setCode(createCode()), []);
  useImperativeHandle(onRef, () => ({ handleChange: refresh }), [refresh]);
  return (
    <button
      type="button"
      onClick={refresh}
      aria-label={`${getIntlContent("SHENYU.LOGIN.REFRESH.CAPTCHA")}: ${code}`}
      style={{
        padding: 0,
        cursor: "pointer",
        border: "1px solid var(--semi-color-border, #ddd)",
        background: "var(--semi-color-fill-0, #f5f5f5)",
      }}
    >
      <svg width="110" height="40" viewBox="0 0 110 40" aria-hidden="true">
        <path
          d="M0 12L110 30M0 31L110 8"
          stroke="var(--semi-color-border, #ddd)"
        />
        <text
          x="55"
          y="28"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="24"
          letterSpacing="5"
          fill="var(--semi-color-text-0, #333)"
        >
          {code}
        </text>
      </svg>
    </button>
  );
};

export default LoginCode;
