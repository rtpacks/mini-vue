import { isVoidTag, isNativeTag, camelize } from "../utils";
import { createRoot, ElementTypes, NodeTypes } from "./ast";

export function parse(content) {
  /* 保存原有字符串，并加上一些配置信息 */
  const context = createParseContext(content);
  /* 通过context及配置信息，编译children的ast */
  // debugger
  const children = parseChildren(context);
  /* 生成编译后带有根节点的初始抽象语法树 */
  return createRoot(children);
}

function createParseContext(content) {
  return {
    options: {
      delimiters: ["{{", "}}"], //分隔符，可配置,
      isVoidTag, // 为了跨平台设计的
      isNativeTag,
    },
    source: content, //source保存原有的模板字符串 */
  };
}

function parseChildren(context) {
  let nodes = [];
  while (!isTextEnd(context)) {
    const s = context.source;
    // 分为三个阶段，
    // 1. 解析元素节点，包括解析标签内部属性、指令等
    // 2. 解析内部节点：分为两个 文本节点和插值节点
    let node = null;
    if (s.startsWith(context.options.delimiters[0])) {
      // 如果是给定的分割符号
      node = parseInterpolation(context);
    } else if (s.startsWith("<")) {
      // 如果是一个起始的标签
      node = parseElement(context);
    } else {
      // 文本节点，假设给定的内容就是正常的，不含有特殊的符号
      node = parseText(context);
    }
    nodes.push(node);
  }

  let removedWhiteSpaces = false;
  // 对空白字符做优化处理
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === NodeTypes.TEXT) {
      // 如果是文本节点，区分文本节点内容是否全是空白
      // /^[\t\r\n\f ]*$/
      // debugger
      if (/[^\t\r\n\f ]/.test(node.content)) {
        /* 如果文本内容有一些字符 */
        node.content = node.content.replace(/[\t\r\n\f ]+/g, " "); // 将多个空格替换成一个空格
      } else {
        /* 如果全是空白，做出一些判断进行节点的删除 */
        const prev = nodes[i - 1];
        const next = nodes[i + 1];
        // 如果其中一个为undefined或前后一个都是元素节点，并且node带有换行符，删除节点
        if (
          !prev ||
          !next ||
          (prev.type === NodeTypes.ELEMENT &&
            next.type === NodeTypes.ELEMENT &&
            /[\r\n]/.test(node.content))
        ) {
          /* 删除节点 */
          removedWhiteSpaces = true;
          nodes[i] = null;
        } else {
          node.content = " ";
        }
      }
    }
  }

  return removedWhiteSpaces
    ? nodes.filter((node) => {
        return !node;
      })
    : nodes;
}

function isTextEnd(context) {
  const s = context.source;
  return s === "" || s.startsWith("</");
}

function parseInterpolation(context) {
  // 一种形式：遇到左大括号，即分隔符好的左符号
  const [open, close] = context.options.delimiters;
  advanceBy(context, open.length); // 移除左边分割符号
  advanceSpaces(context)
  const len = context.source.indexOf(close); // 不要和数组的方法findIndex混淆了
  const content = sliceStr(context, len).trim(); // 获取插值变量，注意需要去除空格
  advanceBy(context, close.length); // 移除右边分隔符号
  advanceSpaces(context)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      isStatic: false,
    },
  };
}

// <div id="foo" v-if="show">Text {{name}}</div>
function parseElement(context) {
  // 解析分为三部分
  // 1. 开始标签
  // 2. children
  // 3. 结束标签
  // debugger;

  const element = parseTag(context); // 开始标签
  if (element.isSelfClosing) {
    // 如果是自闭合的标签，可以返回
    return element;
  }
  // debugger
  element.children = parseChildren(context); // children
  parseTag(context); // 结束标签
  return element;
}

function parseTag(context) {
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  // 正则分组改变优先级, match[0]包含<，而match[1]不包含<，只是标签名
  const tag = match[1]; // 标签名
  advanceBy(context, match[0].length); // 去除<div
  advanceSpaces(context); // 去除空格

  /* 属性节点、指令节点 */
  const { props, directives } = parseAttributes(context);

  // 自闭合形式，但是<br>也是正确的，需要另外一个函数的辅助
  const isSelfClosing =
    context.source.startsWith("/>") || context.options.isVoidTag(tag);
  advanceBy(context, isSelfClosing ? 2 : 1); // 自闭合截取2，非自闭合截取1
  advanceSpaces(context) // 每当advanceBy后，需要注意去掉空格，但是不一定是一次advanceBy就一次advanceSpaces()

  const tagType = isComponent(context, tag)
    ? ElementTypes.COMPONENT
    : ElementTypes.ELEMENT;

  return {
    type: NodeTypes.ELEMENT,
    tag, // 标签名,
    tagType, // 是组件还是原生元素,
    props, // 属性节点数组,
    directives, // 指令数组
    isSelfClosing, // 是否是自闭合标签,
    children: [],
  };
}

function parseAttributes(context) {
  const props = [];
  const directives = [];

  function isTagEnd(context) {
    const s = context.source;
    return s === "" || s.startsWith(">") || s.startsWith("/>");
  }

  while (!isTagEnd(context)) {
    const attr = parseSingleAttribute(context);
    if (attr.type === NodeTypes.DIRECTIVE) {
      directives.push(attr);
    } else {
      props.push(attr);
    }
  }

  return { props, directives };
}

function parseSingleAttribute(context) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
  // 分为两种匹配，第一个key=value结构，如id="app"，第二个没有key=value结构，如checkd
  const name = match[0];
  advanceBy(context, name.length);
  advanceSpaces(context);

  let value = null;
  const s = context.source;
  if (s[0] === "=") {
    /* 如果是key=value结构 */
    advanceBy(context, 1); // 去除等号
    advanceSpaces(context); // 去除多余的空格
    value = parseAttributeValue(context);
  }

  // 指令节点，通过name判断，一定是v-, @, :开头
  if (/^(v-|@|:)/.test(name)) {
    let dirName = null;
    let arg = null;
    // 三种形式
    if (name[0] === ":") {
      dirName = "bind";
      arg = name.slice(1);
    } else if (name[0] === "@") {
      dirName = "on";
      arg = name.slice(1);
    } else if (name.startsWith("v-")) {
      [dirName, arg] = name.slice(2).split(":");
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name,
      exp: value && {
        //等号之后的内容
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      },
      arg: arg && {
        // 等号之前的内容
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: camelize(arg),
        isStatic: true,
      },
    };
  }

  // 普通的属性节点
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    },
  };
}

function parseAttributeValue(context) {
  // 三种情况：双引号，单引号，没有引号，默认都是带有引号的
  const quote = context.source[0];
  advanceBy(context, 1); //去除第一个引号
  const end = context.source.indexOf(quote);
  const content = sliceStr(context, end);
  advanceBy(context, 1); // 去除后一个引号
  advanceSpaces(context); // 去除空格
  return { content };
}

function parseText(context) {
  /* 注意：结束的标志不是</，而是<，因为中间还可以子元素节点 */
  const endTags = ["<", context.options.delimiters[0]];

  // 三种结束方式
  // 1. 遇到插值的分隔符{{
  // 2. 遇到结束标签</
  // 3. 一行的末尾
  let textLen = context.source.length;
  textLen = endTags.reduce((prev, tag) => {
    const idx = context.source.indexOf(tag);
    if (idx !== -1) {
      prev = Math.min(prev, idx);
    }
    return prev;
  }, textLen);

  const content = sliceStr(context, textLen);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function sliceStr(context, textLen) {
  const content = context.source.slice(0, textLen);
  advanceBy(context, textLen);
  advanceSpaces(context);
  return content;
}

function advanceBy(context, numberOfCharacters) {
  // 指定前进的字符数量，即
  context.source = context.source.slice(numberOfCharacters);
}
function advanceSpaces(context) {
  // 将下一个非空白字符前的空白字符串去掉
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  // 如果匹配到相应的空白字符串
  if (match) {
    advanceBy(context, match[0].length); // 第一个就是匹配成功的空白字符串
  }
}

function isComponent(context, tag) {
  return !context.options.isNativeTag(tag);
}
