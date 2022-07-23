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
    options: {
      delimiters: ["{{", "}}"] /* 分隔符，可配置 */,
    },
    source: content /* source保存原有的模板字符串 */,
  };
}

function parseChildren(context) {
  let nodes = [];
  while (!isEnd(context)) {
    const s = context.source;
    // 分为三个阶段，
    // 1. 解析元素节点，包括解析标签内部属性、指令等
    // 2. 解析内部节点：分为两个 文本节点和插值节点
    let node = null;
    if (s.startWith(context.options.delimiters[0])) {
      // 如果是给定的分割符号
      node = parseInterpolation(context);
    } else if (s.startWith("<")) {
      // 如果是一个起始的标签
      node = parseTag(context);
    } else {
      // 文本节点，假设给定的内容就是正常的，不含有特殊的符号
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function isEnd(context) {
  const s = context.source;
  return s.startWith("</") || s === "";
}

function parseInterpolation(context) {}

function parseTag(context) {}

function parseText(context) {
  const endTags = ["</", context.options.delimiters];

  // 三种结束方式
  // 1. 遇到插值的分隔符{{
  // 2. 遇到结束标签</
  // 3. 一行的末尾
  let textLen = context.source.length;
  textLen = endTags.reduce((prev, tag) => {
    let idx = context.source.findIndex(tag);
    if (idx !== -1) {
      prev = Math.min(prev, idx);
    }
    return prev;
  }, textLen);

  const content = context.substring(0, textLen);
  advanceBy(context, textLen);

  return {
    type: NodeTypes.TEXT,
    content,
  };
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
    context.source = advanceBy(context, match[0].length); // 第一个就是匹配成功的空白字符串
  }
}
