import { NodeTypes } from ".";
import { capitalize } from "../utils";

// 接受一段语法树，返回对应的以h函数代码片段形式表达的虚拟dom树
export function generate(ast) {
  return traverseNode(ast);
}

/**
 * 编译节点树，关注四个基本的节点类型，生成h函数的字符串
 * 注意，这些函数都是生成h函数的代码，即一段代码文本，而不是直接执行函数
 * 刚开始执行必然是ROOT节点，parent首先是undefined，
 * traverseChildren函数是parent参数的真正入口
 * @param {*} node
 * @returns
 */
function traverseNode(node, parent) {
  switch (node.type) {
    case NodeTypes.ROOT:
      return traverseChildren(node);
    case NodeTypes.ELEMENT:
      // 指令节点都在元素节点中，处理元素节点的同时也处理指令节点
      // 对于v-for v-if 等能够改变dom结构的结构型指令来说，需要配合runtime进行实现
      // v-for使用renderList

      // traverseChildren是parent参数的真正入口
      return resolveElementVNode(node, parent);
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

function resolveElementVNode(node, parent) {
  const { directives } = node;
  // 特殊的指令如v-for，v-if处理，而普通的bind，on，v-model(on、bind的语法糖)等在createElementVNode中处理
  const forNode = pluck(directives, "for");
  if (forNode) {
    // <div v-for="(item, index) in items">{{item + index}}</div>
    // 编译目标
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
        ${sources.trim()}, 
        ${args.trim()} => ${resolveElementVNode(node, parent)})
      )`;
  }

  const ifNode = pluck(directives, "if") || pluck(directives, "else-if");
  if (ifNode) {
    // <div v-if="ok"></div>
    // v-if编译目标
    // ok ? h('div') : h(Text, null, ''); 空文本节点

    // <h1 v-if="ok"></h1>
    // <h2 v-else></h2>
    // <h3></h3>
    // v-else编译目标
    // [
    //   ok ? h("h1") : h("h2"),
    //   h("h3")
    // ]

    // <h1 v-if="ok"></h1>
    // <h2 v-else-if="ok2"></h2>
    // v-else-if编译目标
    // ok
    // ? h('h1')
    // : ok2
    //   ? h('h2')
    //   : h(Text, null, '');

    const condition = ifNode.exp.content;
    let ifExp = `${resolveElementVNode(node, parent)}`;
    let elseExp = `h(Text, null, '')`; // 默认的else表达式

    // 当前node是ifNode的父节点，elseNode存放于当前node的parent的后续children中，需要与当前node相邻，中间可以存在空白字符节点，只需要检查下一个Element类型的节点是否包含else指令，如果是需要删除中间的空白字符节点，不需要一直判断下去
    // 需要parent节点才能拿到children，改造函数resolveElementVNode(node, parent)，traverseChildren是parent参数的真正入口
    const ifIdx = parent.children.indexOf(node);
    let idx = ifIdx;
    while (idx < parent.children.length) {
      const child = parent.children[++idx];
      // 检查下一个ELEMENT节点，而不是下一个节点
      if (child?.type === NodeTypes.ELEMENT) {
        // 如果存在elseIfNode，删除中间空白节点，但是此时else-if不能删除，可以看成是小范围的if，在ifNode时删除即可
        if (pluck(child.directives, "else-if", false)) {
          parent.children.splice(ifIdx, idx - ifIdx);
          elseExp = `${resolveElementVNode(child, parent)}`;
        }
        // 如果存在elseNode，删除中间的空白字符节点
        if (pluck(child.directives, "else")) {
          parent.children.splice(ifIdx, idx - ifIdx); // 需要先删除，否则会重复
          elseExp = `${resolveElementVNode(child, parent)}`;
        }
        break; // 只检查下一个ELEMENT类型的节点
      }
    }
    return `${condition} ? ${ifExp} : ${elseExp}`;
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
  // v-model是一个on+bind的语法糖，使用map不会自动更新length，提前设置
  const vModel = pluck(node.directives, "model");
  if (vModel) {
    directives.push(
      {
        type: NodeTypes.DIRECTIVE,
        name: "bind",
        exp: vModel.exp, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "value",
          isStatic: true,
        }, // 表达式节点
      },
      {
        type: NodeTypes.DIRECTIVE,
        name: "on",
        exp: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `($event) => ${vModel.exp.content} = $event.target.value`,
          isStatic: false,
        }, // 表达式节点
        arg: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "input",
          isStatic: true,
        }, // 表达式节点
      }
    );
  }

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
  // 特别注意map会返回一个相同长度的数组，但是在map的过程中，可能会返回item === undefined的元素，需要filter去除，或者使用reduce
  return (
    "[" +
    children
      .map((child) => traverseNode(child, node))
      .filter((child) => child)
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
