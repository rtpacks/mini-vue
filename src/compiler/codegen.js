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
      // 指令节点都在元素节点中，所以处理元素节点的同时也是处理指令节点，
      // 并且对于v-for v-if 等能够改变dom结构的结构型指令来说，需要配合runtime进行实现
      // runtime中的helper，对于v-for为renderList
      return resolveElementVNode(node);
    // return createElementVNode(node);
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

function resolveElementVNode(node) {
  const { directives } = node;
  const tag = createText({ content: node.tag }); // tag应该为字符串

  // debugger;
  // 特殊的指令如v-for，v-if，v-model处理，而普通的bind，on等在createElementVNode中处理
  const forNode = pluck(directives, "for");
  if (forNode) {
    // 编译目标
    // <div v-for="(item, index) in items">{{item + index}}</div>
    // h(
    //   Fragment,
    //   null,
    //   renderList(items, (item, index) => h('div', null, item + index))
    // );
    const [args, sources] = forNode.exp.content.split(/\sin\s|\sof\s/); // in of 相同
    return `h(
      Fragment, 
      null, 
      renderList(
        ${sources.trim()}, ${args.trim()} => ${resolveElementVNode(node)})
      )`;
  }

  const ifNode = pluck(directives, "if");
  if (ifNode) {
    // 编译目标
    // <div v-if="ok"></div>
    // ok ? h('div') : h(Text, null, ''); 空文本节点
    const condition = ifNode.exp.content;
    return `${condition} 
      ? ${resolveElementVNode(node)} 
      : h(Text, null, '')`;
  }

  return createElementVNode(node);
}

function createElementVNode(node) {
  const tag = createText({ content: node.tag }); //创建文本

  const props = formatProps(node);

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
    ...props.map((prop) => `${prop.name}: ${createText(prop.value)}`),
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

          /* 不包含 => 即不是一个箭头函数 */
          if (
            (/\([^)]*?\)$/.test(exp) || // 带有括号形式
              /\+\+|--|\+=|-=|\*=|\/=|\%=|==|===/.test(exp)) && // ++ -- 形式
            !exp.includes("=>") // 不是箭头函数
          ) {
            exp = `$event => {${exp}}`;
          }

          return `${event}: ${exp}`;
        case "html":
          return `innerHTML: ${createText(dir.exp)}`;
        default:
          return `${dir.arg?.content || dir.name}: ${createText(dir.exp)}`;
        // return dir; // 没有处理的不能原样返回
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

function formatProps(node) {
  // 每一个不同的指令节点，不能共用，因为pluck会删除元素
  /* 解析属性节点和指令节点，生成对应的字符串格式 */
  const propArr = createPropArr(node);
  return propArr?.length ? `{${propArr.join(", ")}}` : "null";
}

/**
 * 表示接受一个指令集合、指令名称、是否移除指令
 * @param {*} directives
 * @param {*} name
 * @param {Boolean} remove:true
 */
function pluck(directives = [], name, remove = true) {
  const idx = directives.findIndex((dir) => dir.name === name); // 找对应名字的指令
  const dir = directives[idx];
  if (dir && remove) {
    directives.splice(idx, 1); // 如果存在，并且需要删除，则删除对应的指令节点
  }
  return dir;
}
