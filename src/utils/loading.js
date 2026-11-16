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

const SHOW = "@@DVA_LOADING/SHOW";
const HIDE = "@@DVA_LOADING/HIDE";
const initialState = { global: false, models: {}, effects: {} };

export default function createLoading(opts = {}) {
  const { only = [], except = [], namespace = "loading" } = opts;
  if (only.length && except.length) {
    throw new Error("Configure either only or except, not both");
  }
  const reducer = (state = initialState, action = {}) => {
    if (action.type !== SHOW && action.type !== HIDE) return state;
    const { namespace: model, actionType } = action.payload;
    const active = action.type === SHOW;
    const effects = { ...state.effects, [actionType]: active };
    const models = {
      ...state.models,
      [model]:
        active ||
        Object.keys(effects).some(
          (type) => type.split("/")[0] === model && effects[type],
        ),
    };
    return { global: Object.values(models).some(Boolean), models, effects };
  };

  function onEffect(effect, sagaEffects, model, actionType) {
    if (
      (only.length && !only.includes(actionType)) ||
      except.includes(actionType)
    )
      return effect;
    const { put } = sagaEffects;
    const payload = { namespace: model.namespace, actionType };
    return function* loadingEffect(...args) {
      yield put({ type: SHOW, payload });
      try {
        return yield effect(...args);
      } finally {
        yield put({ type: HIDE, payload });
      }
    };
  }
  return { extraReducers: { [namespace]: reducer }, onEffect };
}
