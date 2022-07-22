import { createRoot } from "./ast";

export function parse(content) {
  /* 保存原有字符串，并加上一些配置信息 */
  const context = createParseContext(content);
  /* 通过context及配置信息，编译children的ast */
  const children = parseChildren(context);
  /* 生成编译后带有根节点的初始抽象语法树 */
  return createRoot(children);
}

function createParseContext(content) {
  return {
    option: {
      delimiters: ["{{", "}}"] /* 分隔符，可配置 */,
    },
    source: content /* source保存原有的模板字符串 */,
  };
}

function parseChildren(context) {}

function advanceBy(params) {
  
}
function advance