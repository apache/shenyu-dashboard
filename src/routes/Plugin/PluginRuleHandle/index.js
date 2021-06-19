import RequestRuleHandle from './RequestRuleHandle';
import HystrixRuleHandle from './HystrixRuleHandle';
import ParamPluginRuleHandle from "./ParamPluginRuleHandle";

export default {
    request:RequestRuleHandle,
    hystrix:HystrixRuleHandle,
    param_mapping: ParamPluginRuleHandle
}
