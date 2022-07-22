/* 定义不同的节点类型，如元素节点、属性节点、指令节点、文本节点、插值节点等，共有七种类型 */
export const NodeTypes = {
  ROOT: "ROOT" /* 根节点 */,
  ELEMENT: "ELEMENT" /* 元素节点 */,
  TEXT: "TEXT" /* 文本节点 */,
  SIMPLE_EXPRESSION: "SIMPLE_EXPRESSION" /* 表达式节点 */,
  INTERPOLATION: "INTERPOLATION" /* 插值节点 mustache语法 */,
  ATTRIBUTE: "ATTRIBUTE" /* 属性节点 */,
  DIRECTIVE: "DIRECTIVE" /* 指令节点 */,
};

export const ElementTypes = {
  ELEMENT: "ELEMENT" /* 普通标签 */,
  COMPONENT: "COMPONENT" /* 组件，自定义标签 */,
};

export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}
