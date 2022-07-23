import { NodeTypes } from ".";

// 接受一段语法树，返回对应可执行的代码，通过 new Function | eval 创建一段可执行代码
export function generate(ast) {
  return traverseNode(ast);
}

/**
 * 编译节点树，关注四个基本的节点类型，生成h函数的字符串
 * 注意，这些函数都是生成h函数的代码，即一段代码文本，而不是直接执行函数
 * @param {*} node
 * @returns
 */
function traverseNode(node) {
  switch (node.type) {
    case NodeTypes.ROOT:
      console.log(node.children);
      return traverseNode(node.children[0]);
    case NodeTypes.ELEMENT:
      return;
    case NodeTypes.INTERPOLATION:
      return createInterpolationVNode(node);
    case NodeTypes.TEXT:
      return createTextVNode(node);
    default:
      break;
  }
}

/* 通过isStatic来判断是否为静态节点，从而生成对应的代码片段，如插值不需要引号，静态文本需要引号，注意是生成可执行的代码片段 */
function createText({ isStatic = true, content = "" } = {}) {
  return isStatic ? JSON.stringify(content) : content;
}

function createTextVNode(node) {
  return `h(Text, null, ${createText(node)})`;
}
/* 将插值节点也看成是虚拟dom的Text类型 */
function createInterpolationVNode(node) {
  // return `h(Text, null, ${node.content.content})`;
  return `h(Text, null, ${createText(node.content)})`;
}
