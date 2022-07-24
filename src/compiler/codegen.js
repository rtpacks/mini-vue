import { NodeTypes } from ".";
import { capitalize } from "../utils";

// 接受一段语法树，返回对应的以h函数形式表达的虚拟dom树
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
      return traverseChildren(node);
    case NodeTypes.ELEMENT:
      return createElementVNode(node);
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

function createElementVNode(node) {
  const tag = createText({ content: node.tag }); //创建文本

  /* 解析属性节点和指令节点 */
  const propArr = createPropArr(node);
  const props = propArr?.length ? `{${propArr.join(", ")}}` : "null";

  /* 不需要单独的判断子元素的个数，通过遍历即可，但是为了存储的优化，需要进行判断 */
  const children = traverseChildren(node);
  if (props === "null" && children === "[]") {
    return `h(${tag})`;
  }
  if (children === "[]") {
    // 此时props不可能为 null
    return `h(${tag}, ${props})`;
  }
  return `h(${tag}, ${props}, ${children})`; // props可能为null，符合正常逻辑
}

function createPropArr(node) {
  const { props, directives } = node;
  return [
    ...props.map((prop) => `${props.name}: ${createText(prop.value)}`),
    ...directives.map((dir) => {
      /* 从ast中抽出dirname */
      switch (dir.name) {
        case "bind":
          return `${dir.arg.content}: ${createText(dir.exp)}`;
        case "on":
          const event = `on${capitalize(
            dir.arg.content
          )}`; /* 事件名称格式化，如onClick */

          let exp = dir.exp.content;

          /* 简单判断是否以括号结尾，并且不包含 => 即不是一个箭头函数 */
          if (/\([^)]*?\)$/.test(exp) && !exp.includes('=>')) {
            exp = `$event => {${exp}}`
          }

          return `${event}: ${exp}`;
        case "html":
          return `innerHTML: ${createText(dir.exp)}`;
        default:
          break;
      }
    }),
  ];
}

function traverseChildren(node) {
  const { children } = node;
  // 多级嵌套需要使用递归的形式进行解析，h函数中，子元素应该使用中括号包裹
  return (
    "[" +
    children
      .map((child) => {
        return traverseNode(child);
      })
      .join(", ") +
    "]"
  );
}
