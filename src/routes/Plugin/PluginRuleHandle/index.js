import RequestRuleHandle from "./RequestRuleHandle";
import HystrixRuleHandle from "./HystrixRuleHandle";
import ParamPluginRuleHandle from "./ParamPluginRuleHandle";
import ResponseRuleHandle from "./ResponseRuleHandle";

export default {
  request: RequestRuleHandle,
  modifyResponse: ResponseRuleHandle,
  hystrix: HystrixRuleHandle,
  param_mapping: ParamPluginRuleHandle
};
