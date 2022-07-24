/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/compiler/ast.js":
/*!*****************************!*\
  !*** ./src/compiler/ast.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ElementTypes": () => (/* binding */ ElementTypes),
/* harmony export */   "NodeTypes": () => (/* binding */ NodeTypes),
/* harmony export */   "createRoot": () => (/* binding */ createRoot)
/* harmony export */ });
/* 定义不同的节点类型，如元素节点、属性节点、指令节点、文本节点、插值节点等，共有七种类型 */
const NodeTypes = {
  ROOT: "ROOT" /* 根节点 */,
  ELEMENT: "ELEMENT" /* 元素节点 */,
  TEXT: "TEXT" /* 文本节点 */,
  SIMPLE_EXPRESSION: "SIMPLE_EXPRESSION" /* 表达式节点 */,
  INTERPOLATION: "INTERPOLATION" /* 插值节点 mustache语法 */,
  ATTRIBUTE: "ATTRIBUTE" /* 属性节点 */,
  DIRECTIVE: "DIRECTIVE" /* 指令节点 */,
};

const ElementTypes = {
  ELEMENT: "ELEMENT" /* 普通标签 */,
  COMPONENT: "COMPONENT" /* 组件，自定义标签 */,
};

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}


/***/ }),

/***/ "./src/compiler/codegen.js":
/*!*********************************!*\
  !*** ./src/compiler/codegen.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "generate": () => (/* binding */ generate)
/* harmony export */ });
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! . */ "./src/compiler/index.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");



// 接受一段语法树，返回对应的以h函数形式表达的虚拟dom树
function generate(ast) {
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
    case ___WEBPACK_IMPORTED_MODULE_0__.NodeTypes.ROOT:
      return traverseChildren(node);
    case ___WEBPACK_IMPORTED_MODULE_0__.NodeTypes.ELEMENT:
      // 指令节点都在元素节点中，所以处理元素节点的同时也是处理指令节点，
      // 并且对于v-for v-if 等能够改变dom结构的结构型指令来说，需要配合runtime进行实现
      // runtime中的helper，对于v-for为renderList
      return resolveElementVNode(node);
    // return createElementVNode(node);
    case ___WEBPACK_IMPORTED_MODULE_0__.NodeTypes.INTERPOLATION:
      return createInterpolationVNode(node);
    case ___WEBPACK_IMPORTED_MODULE_0__.NodeTypes.TEXT:
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
  const { tag, directives } = node;
  // debugger;
  // 特殊的指令如v-for，v-if，v-model处理，而普通的bind，on等在createElementVNode中处理
  const forNode = pluck(directives, "for");
  if (forNode) {
    // 如果存在v-for指令节点
    // <div v-for="(item, index) in items">{{item + index}}</div>
    // 编译目标
    // h(
    //   Fragment,
    //   null,
    //   renderList(items, (item, index) => h('div', null, item + index))
    // );

    const props = formatProps(node);

    const [args, sources] = forNode.exp.content.split(/\sin\s|\sof\s/); // in of 相同
    return `h(
      Fragment, 
      null, 
      renderList(
        ${sources}, 
        ${args} => h('${tag}', ${props}, ${traverseChildren(node)}))
      )`;
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
          const event = `on${(0,_utils__WEBPACK_IMPORTED_MODULE_1__.capitalize)(
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
          break;
      }
    }),
  ];
}

function formatProps(node) {
  /* 解析属性节点和指令节点，生成对应的字符串格式 */
  const propArr = createPropArr(node);
  return propArr?.length ? `{${propArr.join(", ")}}` : "null";
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


/***/ }),

/***/ "./src/compiler/compile.js":
/*!*********************************!*\
  !*** ./src/compiler/compile.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "compile": () => (/* binding */ compile)
/* harmony export */ });
/* harmony import */ var _codegen__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./codegen */ "./src/compiler/codegen.js");
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./parse */ "./src/compiler/parse.js");



function compile(template) {
  const ast = (0,_parse__WEBPACK_IMPORTED_MODULE_1__.parse)(template); // 解析模板得到ast
  const code = (0,_codegen__WEBPACK_IMPORTED_MODULE_0__.generate)(ast); // 解析ast得到一段可执行的代码
  return code;
}


/***/ }),

/***/ "./src/compiler/index.js":
/*!*******************************!*\
  !*** ./src/compiler/index.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ElementTypes": () => (/* reexport safe */ _ast__WEBPACK_IMPORTED_MODULE_0__.ElementTypes),
/* harmony export */   "NodeTypes": () => (/* reexport safe */ _ast__WEBPACK_IMPORTED_MODULE_0__.NodeTypes),
/* harmony export */   "compile": () => (/* reexport safe */ _compile__WEBPACK_IMPORTED_MODULE_1__.compile),
/* harmony export */   "createRoot": () => (/* reexport safe */ _ast__WEBPACK_IMPORTED_MODULE_0__.createRoot),
/* harmony export */   "generate": () => (/* reexport safe */ _codegen__WEBPACK_IMPORTED_MODULE_2__.generate),
/* harmony export */   "parse": () => (/* reexport safe */ _parse__WEBPACK_IMPORTED_MODULE_3__.parse)
/* harmony export */ });
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");
/* harmony import */ var _compile__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./compile */ "./src/compiler/compile.js");
/* harmony import */ var _codegen__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./codegen */ "./src/compiler/codegen.js");
/* harmony import */ var _parse__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./parse */ "./src/compiler/parse.js");






/***/ }),

/***/ "./src/compiler/parse.js":
/*!*******************************!*\
  !*** ./src/compiler/parse.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "parse": () => (/* binding */ parse)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _ast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ast */ "./src/compiler/ast.js");



function parse(content) {
  /* 保存原有字符串，并加上一些配置信息 */
  const context = createParseContext(content);
  /* 通过context及配置信息，编译children的ast */
  // debugger
  const children = parseChildren(context);
  /* 生成编译后带有根节点的初始抽象语法树 */
  return (0,_ast__WEBPACK_IMPORTED_MODULE_1__.createRoot)(children);
}

function createParseContext(content) {
  return {
    options: {
      delimiters: ["{{", "}}"], //分隔符，可配置,
      isVoidTag: _utils__WEBPACK_IMPORTED_MODULE_0__.isVoidTag, // 为了跨平台设计的
      isNativeTag: _utils__WEBPACK_IMPORTED_MODULE_0__.isNativeTag,
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
    if (node.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT) {
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
          (prev.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT &&
            next.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT &&
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

  return removedWhiteSpaces ? nodes.filter((node) => node) : nodes;
}

function isTextEnd(context) {
  const s = context.source;
  return s === "" || s.startsWith("</");
}

function parseInterpolation(context) {
  // 一种形式：遇到左大括号，即分隔符好的左符号
  const [open, close] = context.options.delimiters;
  advanceBy(context, open.length); // 移除左边分割符号
  advanceSpaces(context);
  const len = context.source.indexOf(close); // 不要和数组的方法findIndex混淆了
  const content = sliceStr(context, len).trim(); // 获取插值变量，注意需要去除空格
  advanceBy(context, close.length); // 移除右边分隔符号
  // advanceSpaces(context); 此时不能移除剩余的空格，后续会有空格优化！如{{index}} : {{item}}

  return {
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.INTERPOLATION,
    content: {
      type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
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
  advanceSpaces(context); // 每当advanceBy后，需要注意去掉空格，但是不一定是一次advanceBy就一次advanceSpaces()

  const tagType = isComponent(context, tag)
    ? _ast__WEBPACK_IMPORTED_MODULE_1__.ElementTypes.COMPONENT
    : _ast__WEBPACK_IMPORTED_MODULE_1__.ElementTypes.ELEMENT;

  return {
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ELEMENT,
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
    if (attr.type === _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.DIRECTIVE) {
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
      [dirName, arg] = name.slice(2).split(":"); // v-if v-on v-model不存在arg，而v-bind:class存在arg
    }

    return {
      type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        //等号之后的内容
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      },
      arg: arg && {
        // 等号之前的内容
        type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.SIMPLE_EXPRESSION,
        content: (0,_utils__WEBPACK_IMPORTED_MODULE_0__.camelize)(arg),
        isStatic: true,
      },
    };
  }

  // 普通的属性节点
  return {
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT,
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
    type: _ast__WEBPACK_IMPORTED_MODULE_1__.NodeTypes.TEXT,
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


/***/ }),

/***/ "./src/reactivity/computed.js":
/*!************************************!*\
  !*** ./src/reactivity/computed.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computed": () => (/* binding */ computed)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");
/* 无论是基本数据还是传入的函数，都是放入一个对象中存储，不同的是为了设计computed的缓存特性增加了lazy与scheduler调用
    lazy避免第一次运行，通过effect函数保存scheduler，最后在trigger中判断是否有调度器，
    如果有调度器调用调度器，否则才是调用传入的函数

    通过自身的属性_dirty判断自身的依赖是否更新
    通过get捕获中的track，捕获依赖自身的那些函数
    通过调度器调用时，进行触发依赖于自身的函数，注意：computed自身的依赖与依赖自身的变量是两个概念！
 */




class ComputedImpl {
  constructor(options) {
    this._setter = options.setter;
    this._value = undefined; /* 当前的值 */
    this._dirty = true; /* 表示computed依赖的变量有更新，不是依赖computed的函数！ */
    this.effect = (0,_effect__WEBPACK_IMPORTED_MODULE_1__.effect)(options.getter, {
      lazy: true,
      scheduler: () => {
        /* 调度器是为了满足缓存的特性而设计的！trigger只会调用调度器，通过调度器控制_ditry来更新，并且不会直接调用 */
        if (!this._dirty) {
          // 如果未更新不需要重新计算
          this._dirty = true; /* 当scheduler被调用时，表示的变量发生了更新，但是getter不会被调用，而是自身的value被引用即触发get操作时才会判断_dirty并决定是否重新计算 */
          (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(
            this,
            "value"
          ); /* 通知依赖自身的函数更新，通过get捕获判断_dirty重新计算，注意和trigger函数中进行区分！ */
        }
      },
    }); /* 修改effect函数，如果传入了lazy初始默认不执行，如果传入了scheduler，则保存在自身上！ */
  }

  get value() {
    if (this._dirty) {
      // 通过判断自身依赖的变量是否发生了更新，从而确定自身是否更新
      this._dirty = false; // 重新计算后，将_dirty置为false
      this._value =
        this.effect(); /* 此时调用的函数是从effect函数中返回的，是getter操作被封装成一个effectFn，最后返回的 */
      (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(this, "value"); /* 第一次默认进行会被收集依赖 */
    }
    return this._value;
  }

  set value(value) {
    /* 判断是否只读！ */
    this._setter(value)
  }
}

function computed(getterOrOption) {
  let getter = () => {}
  let setter = () => {
    console.error("The computed is readonly！");
  };

  let options = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isFunction)(getterOrOption)
    ? { getter: getterOrOption, setter }
    : { getter: getterOrOption.getter || getter, setter: getterOrOption.set || setter };
  
  return new ComputedImpl(options)
}


/***/ }),

/***/ "./src/reactivity/effect.js":
/*!**********************************!*\
  !*** ./src/reactivity/effect.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "effect": () => (/* binding */ effect),
/* harmony export */   "track": () => (/* binding */ track),
/* harmony export */   "trigger": () => (/* binding */ trigger)
/* harmony export */ });
let activeEffect;

/**
 * 一个对象可以有多个属性
 * 一个属性可以在多个effect中使用
 * 一个effect可以同时使用多个不同的对象|对象属性
 *
 * 分析依赖关系，确定是对象|对象属性的变化导致effect，
 * 那么应该这样设计依赖关系结构
 * AMap：key为target，value为一个BMap 解释：区分不同对象的AMap
 * BMap：key为对象的不同属性，value为一个CSet 解释：区分一个对象的不同属性
 * CSet：存储effect 解释：存储所有依赖于某个对象的某个属性的effect，可以使用数组，但是需要进行去重，使用Set更合适
 * 注意：这些关系结构都是基于：对象|对象属性的变量导致effect的执行
 */
let targetMap = new WeakMap(); /* 区分不同的对象 */
let keyMap; /* 区分同一个对象的不同属性，不同targetMap元素生成不同的keyMap */
let effectSet; /* 存储所有依赖于某个对象的某个属性的effect */

let effectStack = [];

function effect(fn, options = {}) {
  const effectFn = () => {
    let result;
    try {
      activeEffect =
        effectFn; /* 当前的函数会被标记，在reactive代理对象的get操作收集依赖时，activeEffect会被收集，此时的fn就是对应变量的依赖项 */
      effectStack.push(activeEffect);
      result = fn();
    } catch (error) {
      /* watchEffect默认调用，用户的函数可能出错，但是不能影响库代码 */
      console.error(error);
    } finally {
      activeEffect =
        undefined; /* 必须要重新置为null或者undefined，否则在进行判断收集使会出错 */
      // 为了解决嵌套的effect，需要从effectFns中弹出
      // effectStack.pop(); /* 已经被记录过了！ */
      // activeEffect = effectStack.length ? effectStack.pop() : undefined;
      effectStack.pop();
      /* 如果为0，length-1=-1不会报错，而是一个undefined，js数组越界不会报错，访问只会返回undefined */
      activeEffect = effectStack[effectStack.length - 1];
      return result;
    }
  };
  if (!options.lazy) {
    effectFn();
  }
  effectFn.scheduler = options.scheduler;
  return effectFn;
}

/* track 收集依赖 */
function track(target, key) {
  /* 如果不存在activeEffect，返回即可 */
  if (!activeEffect) {
    return;
  }

  /* ================可以使用三元表达式====================== */

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map())); /* 另外一种写法 */
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffect);
}

/* trigger 触发依赖 */
function trigger(target, key) {
  /* 更新触发，取出targetMap中的target，keyMap中的effectSet */
  targetMap
    .get(target)
    ?.get(key)
    ?.forEach((effect) => {
      /* 如果有调度器，应该只调用调度器，其余的操作由调度器来完成。
        这是不同于watchEffect的逻辑，通过调用调度器来实现不立即更新，
        这是computed依赖的变量更新了，不是要依赖于computed的函数立即更新。
        scheduler通知_ditry变化，而后scheduler自身中再调用computed的trigger通知依赖自身的函数，
        达到computed的知道自身依赖的变量更新了，但是不马上计算，
        只有依赖于自身的函数使用了我，我才判断是否重新计算的功能
        如果依赖于computed的变量没有访问，那么computed就不会重新计算，
        因为计算的过程在get捕获中！只有访问了才能重新计算！ */
      effect.scheduler ? effect.scheduler(effect) : effect();
    });
}


/***/ }),

/***/ "./src/reactivity/index.js":
/*!*********************************!*\
  !*** ./src/reactivity/index.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "computed": () => (/* reexport safe */ _computed__WEBPACK_IMPORTED_MODULE_2__.computed),
/* harmony export */   "effect": () => (/* reexport safe */ _effect__WEBPACK_IMPORTED_MODULE_3__.effect),
/* harmony export */   "reactive": () => (/* reexport safe */ _reactive__WEBPACK_IMPORTED_MODULE_0__.reactive),
/* harmony export */   "ref": () => (/* reexport safe */ _ref__WEBPACK_IMPORTED_MODULE_1__.ref)
/* harmony export */ });
/* harmony import */ var _reactive__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reactive */ "./src/reactivity/reactive.js");
/* harmony import */ var _ref__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ref */ "./src/reactivity/ref.js");
/* harmony import */ var _computed__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./computed */ "./src/reactivity/computed.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");






/***/ }),

/***/ "./src/reactivity/reactive.js":
/*!************************************!*\
  !*** ./src/reactivity/reactive.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isReactive": () => (/* binding */ isReactive),
/* harmony export */   "reactive": () => (/* binding */ reactive)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");



/**
 * 为了能够正确的收集依赖，传入的target对象必须要再包裹一层，
 * 因为只适用对象本身则无法触发get操作！再次包裹一层就能够触发外层的get
 *
 * 但是在尝试后发现：Vue官方也没有做这个处理
 */
class Target {
  constructor(target) {
    this.value = target;
  }
}

const proxyMap = new WeakMap();

// reactive建立了一个响应式对象，即Proxy对象，它一般与effect函数建立联系
function reactive(target) {
  /* 如果不是一个对象，不代理即不做任何处理 */
  if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(target)) {
    return target;
  }

  /* 特殊情况一：嵌套使用reactive，只代理一次，reactive(reactive(obj))，给obj添加私有的属性_isReactive */
  if (!isReactive(target)) {
    target._isReactive = true;
  }

  /* 特殊情况二：多个依赖依赖于同一个对象，只生成一个代理对象，使用一个WeakMap来存储每一个代理对象 */
  if (proxyMap.has(target)) {
    return reactive.get(target);
  }

  /* 如果是一个对象，那么就返回一个代理对象 */
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      /* 特殊情况六：嵌套的effect，会导致外层的effect丢失！在effect函数中利用栈解决 */
      (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(target, key);
      /* 特殊情况四：深层代理，在vue2中所有的对象都被代理了，但是vue3可以选择哪些被代理 */
      // return res;
      return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(res) ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      /* 特殊情况三：只有值变化了才更新，如果前后是相同的值，不进行更新 */
      if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(target[key], value))
        return true; /* 注意set需要返回true代表更新成功，否则报错！ */
      const flag = Reflect.set(target, key, value, receiver);
      
      /* 特殊情况五：数组的问题，数组长度的问题 数组的key需要手动触发 */
      if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(target) && key === 'length' && (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(target.length, value)) {
        (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, "length"); /* 数组的key需要手动触发 */
      }
      
      (0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(target, key); /* 必须等对象更新完成后再触发 */
      return flag;
    },
  });

  proxyMap.set(target, proxy);

  return proxy;
}

function isReactive(target) {
  return !!(target && target._isReactive);
}


/***/ }),

/***/ "./src/reactivity/ref.js":
/*!*******************************!*\
  !*** ./src/reactivity/ref.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "convert": () => (/* binding */ convert),
/* harmony export */   "isRef": () => (/* binding */ isRef),
/* harmony export */   "ref": () => (/* binding */ ref)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _effect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./effect */ "./src/reactivity/effect.js");
/* harmony import */ var _reactive__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactive */ "./src/reactivity/reactive.js");




class RefImpl {
  constructor(value) {
    this._isRef = true;
    /* 用私有属性来实现功能，通过简便的写法，即get value() set value()即可完成相应的get set捕获！ */
    // 如果是一个对象，则用reactive来实现
    // 无论是基本数据类型还是引用数据类型，最终都是存储在一个对象的_value属性中的
    this._value = convert(value); /* 需要用convert来转换，否则引用类型的数据无法捕获！ */
  }

  /* vue3中实现基本数据类型的响应还是Object.definedProperty，注意是基本数据类型！ */
  get value() {
    (0,_effect__WEBPACK_IMPORTED_MODULE_1__.track)(this, 'value')
    return this._value /* 注意：此时返回的是私有属性的值！ */
  }
  set value(value) { /* 注意：使用ref包装的对象特别注意没有引用对象属性，不会被加入依赖的！
    reactive函数同样也是如此，必须要使用对象的某一个属性，单纯使用对象不使用某个对象的属性是不会加入依赖的！而ref一定要使用.value取出才能够获得响应式！*/
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(this._value, value)) {
      return ;
    }
    this._value = convert(value) /* 此时也需要转换，如果传入的数据一个引用类型的数据，那么就需要转换一下！ */
    ;(0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value') 
  }
}

/* ref函数用于记忆基本数据类型，引用数据类型都交给reactive函数 */
/* 因为基本数据类型存储在栈上，所以难以判断是否为同一个对象，用一个对象实现存储，和reactive一样。 */
function ref(value) {
  if (isRef(value)) {
    return value;
  }
  return new RefImpl(value); /* 用一个对象来存储，因为基本数据类型不能在同一个内存地址上，
  所以在判断是否为同一个变量时应该使用一个对象来存储这些基本数据类型的变量，以方便进行比较是否为同一个变量对象 */
}

/* ref函数的实现喝reactive函数实现类似，包括特殊的功能等！ */
function isRef(value) {
  return !!(value && value._isRef);
}

function convert(value) {
  return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(value) ? (0,_reactive__WEBPACK_IMPORTED_MODULE_2__.reactive)(value) : value;
}


/***/ }),

/***/ "./src/runtime/createApp.js":
/*!**********************************!*\
  !*** ./src/runtime/createApp.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createApp": () => (/* binding */ createApp)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _renderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./renderer */ "./src/runtime/renderer.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");




function createApp(root) {
  const app = {
    mount(container) {
      if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(container)) {
        container = document.querySelector(container);
      }

      if (!root.template && !root.render) {
        /* 如果既没有template模板，也没有render函数，那么就是以mount中的内容为主，
        经过上一个if的流程，此时的container可能已经是一个HTML元素节点了，需要判断 */
        const app =
          container instanceof HTMLElement
            ? container
            : document.querySelector(container);
        root.template = app.innerHTML;
        app.innerHTML = ""; // 需要清空原有的元素
      }

      (0,_renderer__WEBPACK_IMPORTED_MODULE_1__.render)((0,_vnode__WEBPACK_IMPORTED_MODULE_2__.h)(root), container);
    },
  };
  return app;
}


/***/ }),

/***/ "./src/runtime/helper/index.js":
/*!*************************************!*\
  !*** ./src/runtime/helper/index.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "renderList": () => (/* reexport safe */ _renderList__WEBPACK_IMPORTED_MODULE_0__.renderList)
/* harmony export */ });
/* harmony import */ var _renderList__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./renderList */ "./src/runtime/helper/renderList.js");


/***/ }),

/***/ "./src/runtime/helper/renderList.js":
/*!******************************************!*\
  !*** ./src/runtime/helper/renderList.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "renderList": () => (/* binding */ renderList)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../utils */ "./src/utils/index.js");
// 编译目标
// h(
//   Fragment,
//   null,
//   renderList(items, (item, index) => h('div', null, item + index))
// );



function renderList(sources, renderItem) {
  // v-for可能存在的形式
  // Array，Object，String，Number
  if (
    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(sources) ||
    ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(sources) && (sources = sources.split("")))
  ) {
    return sources.map((source, index) => renderItem(source, index));
  }

  let nodes = [];
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(sources)) {
    // const arr = Array.from({ length: sources }, (v, i) => i + 1);
    for (let i = 0; i < sources; i++) {
      nodes.push(renderItem(i + 1, i));
    }
    return nodes;
  }

  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(sources)) {
    // for in, for of, Object.keys
    return Object.keys(sources).map((key, index) =>
      renderItem(sources[key], key, index)
    );
  }
}


/***/ }),

/***/ "./src/runtime/index.js":
/*!******************************!*\
  !*** ./src/runtime/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_3__.Fragment),
/* harmony export */   "ShapeFlags": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_3__.ShapeFlags),
/* harmony export */   "Text": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_3__.Text),
/* harmony export */   "createApp": () => (/* reexport safe */ _createApp__WEBPACK_IMPORTED_MODULE_0__.createApp),
/* harmony export */   "h": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_3__.h),
/* harmony export */   "mount": () => (/* reexport safe */ _renderer__WEBPACK_IMPORTED_MODULE_1__.mount),
/* harmony export */   "nextTick": () => (/* reexport safe */ _scheduler__WEBPACK_IMPORTED_MODULE_2__.nextTick),
/* harmony export */   "render": () => (/* reexport safe */ _renderer__WEBPACK_IMPORTED_MODULE_1__.render),
/* harmony export */   "renderList": () => (/* reexport safe */ _helper__WEBPACK_IMPORTED_MODULE_4__.renderList)
/* harmony export */ });
/* harmony import */ var _createApp__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./createApp */ "./src/runtime/createApp.js");
/* harmony import */ var _renderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./renderer */ "./src/runtime/renderer.js");
/* harmony import */ var _scheduler__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./scheduler */ "./src/runtime/scheduler.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _helper__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./helper */ "./src/runtime/helper/index.js");







/***/ }),

/***/ "./src/runtime/renderer.js":
/*!*********************************!*\
  !*** ./src/runtime/renderer.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mount": () => (/* binding */ mount),
/* harmony export */   "render": () => (/* binding */ render),
/* harmony export */   "unmount": () => (/* binding */ unmount)
/* harmony export */ });
/* harmony import */ var _reactivity_reactive__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reactivity/reactive */ "./src/reactivity/reactive.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _reactivity_effect__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../reactivity/effect */ "./src/reactivity/effect.js");
/* harmony import */ var _scheduler__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./scheduler */ "./src/runtime/scheduler.js");
/* harmony import */ var _compiler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../compiler */ "./src/compiler/index.js");







/**
 * render 渲染VNode，虚拟DOM很多种类型，相应的挂载到真实DOM上也是很多方式，也就是很多种类型的unmount/patch函数
 * @param {*} vnode
 * @param {HTML Element} container
 */
function render(vnode, container) {
  // 将虚拟DOM挂载到真实的DOM元素上，方便保留以进行与新VNode的diff对比！
  // 新vnode代表旧vnode的最新状态
  // vnode为当前新生成的vnode，_vnode是原有的vnode，进行diff比对无论如何都要生成vnode，优化在于通过比对决定是否操作是否操作真实DOM
  // 如果新的vnode被生成了即代表没有被卸载，就需要进行patch进行更新，否则如果新vnode不存在就代表要将对应的旧vnode卸载，
  // 因为代表旧vnode的最新状态的新vnode已经不存在了！

  const { _vnode } = container; /* 取出就vnode */
  if (!vnode) {
    /* 如果新vnode已经不存在，卸载旧vnode */
    unmount(_vnode);
  } else {
    /* 如果新vnode存在，那么就进行diff比对，即patch俗称打补丁 */
    patch(_vnode, vnode, container);
  }
}

function mount(vnode, container, anchor) {
  const { shapeFlag } = vnode;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ELEMENT) {
    mountElement(vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT) {
    mountText(vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.COMPONENT) {
    mountComponent(vnode, container, anchor);
  }
  container._vnode =
    vnode; /* 注意：并不是所有的的真实DOM都存有虚拟dom，但是每一个虚拟dom都存有其真实dom的引用 */
}

function unmount(vnode) {
  const { shapeFlag } = vnode;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ELEMENT || shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT) {
    /* 普通的element和text节点通过移除children实现 */
    // unmountChildren(vnode);
    const { el } = vnode;
    el.parentNode.removeChild(el);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.FRAGMENT) {
    unmountFragment(vnode);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.COMPONENT) {
    unmountComponent(vnode);
  }
}

function patch(_vnode, vnode, container, anchor) {
  if (!_vnode) {
    /* 如果旧vnode不存在，代表此时是一个挂载mount的过程！ */
    mount(vnode, container, anchor);
    return;
  }
  if (!isSameVNodeType(_vnode, vnode)) {
    /* 如果旧vnode存在，但是和新产生的vnode不一样，卸载旧vnode，挂载新vnode */
    /* 如果不是相同的节点，设置下一个节点为anchor，即在下一个节点前进行插入才是正确的，
    但是对于Fragment多设置了一个endAnchor */
    anchor = (_vnode.anchor || _vnode.el).nextSibling();
    unmount(_vnode);
    _vnode = null;
  }
  /* 同类型vnode，shapeFlag相同 */
  const { shapeFlag } = vnode;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ELEMENT) {
    patchElement(_vnode, vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT) {
    patchText(_vnode, vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.FRAGMENT) {
    patchFragment(_vnode, vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.COMPONENT) {
    patchComponent(_vnode, vnode, container, anchor);
  }
}

function isSameVNodeType(_vnode, vnode) {
  /* 同一种节点与同一类型的节点是不一样的 */
  return _vnode.type === vnode.type;
}

function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlag } = vnode;
  const el = document.createElement(type);
  patchProps(null, props, el); /* 用patch改造mount */

  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
    mountText(vnode, el); /* 注意层级关系 */
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode.children, el);
  }
  // container.appendChild(el); /* 添加子元素 */
  // 使用insertBefore指定位置添加元素
  container.insertBefore(el, anchor);
  vnode.el = el; /* 为了在更新时拿到对应的真实dom节点，保存真实dom地址 */
}

function mountText(vnode, container, anchor) {
  /* 文本节点，没有标签！ */
  const textNode = document.createTextNode(vnode.children);
  // container.appendChild(textNode); /* 添加子元素 */
  container.insertBefore(textNode, anchor);
  vnode.el = textNode;
}

function mountFragment(vnode, container, anchor) {
  /* 将当前的Fragment子元素挂载到Fragment父元素上*/
  // 思想：在Fragment子元素数组中，创建开始和结束两个空节点作为锚定位，初始时vnode的el、anchor为null，
  // 此时将el赋值为一个空节点，后续会被修改为对应的真实dom节点。el的初始设定不会影响，但是endAnchor就可以起到定位
  // 因为每一次更新或者挂载时，都会将前一个el作为后一个el，后一个被挂载时生成新的取代原有的el属性，
  // 而最后一个anchor每次都会被传递，所以可以认为每一个子元素的anchor都是一样的，就是最后一个空节点
  // 之所以是最后一个，因为每次使用的API都是insertBefore

  const startAnchor = document.createTextNode("");
  const endAnchor = document.createTextNode("");
  vnode.el = startAnchor;
  vnode.anchor = endAnchor;
  /* 初始Fragment首先添加两个空节点作为锚，然后将endAnchor作为参数一致传递下去，
  只要有appEndChild都需要替换为insertBefor，并且insertBefore的参数就是anchor
  传递下去，最终会传递到本身，使用即可，此时的anchor为undefined，可以使用appendChild也可以使用insertBefore
  insertBefore的anchor参数未指定，则默认在最后插入，和appendChild的功能一致
   */

  container.appendChild(startAnchor);
  container.appendChild(endAnchor);
  // container.insertBefore(startAnchor, anchor)
  // container.insertBefore(endAnchor, anchor)

  mountChildren(vnode.children, container, endAnchor);
}

function mountComponent(vnode, container, anchor) {
  // 组件是一个对象，由两个阶段生成，vue3的组件和react的类式组件非常类似，都具有render函数，通过render产出vnode
  // 第一阶段是原生的不经过h函数包裹的对象，此时是组件对象如 {props:[], render() {return h('div', null, "我是小明")}}
  // 第二阶段是经过h函数包裹的对象，此时是vnode对象 如 h(Comp, vnodeProps);
  // 对于vnode的props属性，有两种情况：第一是内部使用的props父传子，第二是组件本身的attrs标签属性，两者不同

  const { type: Component, props: vnodeProps } = vnode; /* 获取组件对象 */

  const instance = {
    props: null,
    attrs: null,

    setupState: null,
    ctx: null,

    subTree: null,
    patch: null,
  };
  // initProps() 区分不同的属性
  instance.props ||= {};
  instance.attrs ||= {};
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      instance.props[key] = vnodeProps[key];
    } else {
      instance.attrs[key] = vnodeProps[key];
    }
  }
  instance.props = (0,_reactivity_reactive__WEBPACK_IMPORTED_MODULE_0__.reactive)(instance.props); /* 做响应式处理 */

  // 对于vue3，执行setup函数，获取返回值setupState，通过effect确定响应数据，最终通过render产出vnode，render接收ctx
  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });
  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  // 判断render函数是否存在，如果不存在，通过generate执行后生成的代码片段，通过new Function生成render函数
  if (!Component.render) {
    let { template } = Component;

    if (template[0] === "#") {
      /* 如果是一个#开头的挂载 如#template，而不是直接写模板 */
      const el = document.querySelector(template);
      template = el ? el.innerHTML : "";
      // 删除原template节点
      el.parentNode.removeChild(el);
    }

    const code = (0,_compiler__WEBPACK_IMPORTED_MODULE_5__.compile)(template);
    // 通过new Function生成可执行代码，同时为了便于解决参数问题，使用with改变作用域链
    Component.render = new Function(
      "ctx",
      `with(ctx) {
        const {
          createApp,
          parse,
          render,
          h,
          Text,
          Fragment,
          nextTick,
          reactive,
          ref,
          computed,
          effect,
          compile,
          renderList,
        } = MiniVue;
        return ${code}
      }`
    );
  }

  // 执行render函数
  instance.patch = () => {
    const preTree = instance.subTree;
    /* 生成vnode，并保存在自身的subTree中，作为原有的subTree */
    const subTree = (instance.subTree = (0,_vnode__WEBPACK_IMPORTED_MODULE_1__.normalizeVNode)(
      Component.render(instance.ctx)
    ));
    vnode.el = subTree.el = preTree ? preTree.el : null;
    /* 根据vue文档，当返回单个根节点时，非instance.props的vnodeProps，将自动添加到根节点的attribute中，即将instance.attrs添加到根节点的attributes中 */
    subTree.props = {
      ...(subTree.props || {}),
      ...(instance.attrs || {}),
    };
    /* 并不会造成递归调用形式，因为render函数生成vnode不再是comp了 */
    patch(preTree, subTree, container, anchor);
  };
  /* 通过effect默认执行代表mount，当相应的变量发生改变时也会重新执行 */
  (0,_reactivity_effect__WEBPACK_IMPORTED_MODULE_3__.effect)(instance.patch, {
    scheduler:
      _scheduler__WEBPACK_IMPORTED_MODULE_4__.scheduler /* 如果有scheduler，那么trigger会优先执行scheduler，并将传入的fn，传入到scheduler中 */,
  });
}

function mountChildren(children, container, anchor) {
  children.forEach((child) => mount(child, container, anchor));
}

// function unmountElement(vnode) {}
// function unmountText(vnode) {}

function unmountFragment(vnode) {
  // 添加了anchor后，还需要删除刚开始添加的两个子元素，不能直接调用unmountChildren
  let { el: curr, anchor } = vnode;
  const parent = el.parentNode;
  while (curr !== anchor) {
    /* anchor是最后一个节点 */
    let next = curr.nextSibling();
    parent.removeChild(curr);
    curr = next;
  }
  parent.removeChild(anchor);
}
function unmountComponent(vnode) {}

function unmountChildren(children) {
  children.forEach((child) => unmount(child));
}

function patchElement(_vnode, vnode, container) {
  /* 不再需要检查_vnode是否存在 */
  vnode.el = _vnode.el;
  patchProps(_vnode.props, vnode.props, vnode.el);
  patchChildren(_vnode, vnode, vnode.el);
}

function patchText(_vnode, vnode) {
  _vnode.el.textContent = vnode.children; /* 更新真实dom的内容 */
  vnode.el = _vnode.el;
}

function patchFragment(_vnode, vnode, container) {
  /* anchor传递给下一个节点 */
  const startAnchor = (vnode.el = _vnode.el);
  const endAnchor = (vnode.anchor = _vnode.anchor);
  patchChildren(_vnode, vnode, container, endAnchor);
}

function patchComponent(_vnode, vnode, anchor) {}

function patchChildren(_vnode, vnode, container, anchor) {
  /* 更新children函数 */
  const { shapeFlag: _shapeFlag, children: _children } = _vnode;
  const { shapeFlag, children } = vnode;

  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
    // 如果新vnode是TEXT_CHILDREN类型
    if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
      // container.textContent = children; /* 虚拟DOM应该保持在children中，后续检查以辨别是否与父元素的虚拟dom保持一致，验证正确，并不是vnode.textContent，而是children */
    } else if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(_children); /* 卸载旧组件！ */
      // container.textContent = children;
    } else if (_vnode === null) {
      // container.textContent = children;
    }
    if (_children !== children) {
      container.textContent = children;
    }
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
    // 如果新vnode是ARRAY_CHILDREN类型
    if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
      mountChildren(children, container, anchor);
    } else if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
      patchArrayChildren(_children, children, container, anchor);
    } else if (_vnode === null) {
      mountChildren(children, container, anchor);
    }
  } else if (vnode === null) {
    // 如果新vnode是null类型
    if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
    } else if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(_children);
    } else if (_vnode === null) {
      // 都不存在即不执行任何操作！
    }
  }
}

/* patchUnkeyChildren，后续完善diff过程 */
function patchArrayChildren(_children, children, container, anchor) {
  const [_len, len] = [_children.length, children.length];
  const baseLen = Math.min(_len, len);
  for (let i = 0; i < baseLen; i++) {
    /* 更新元素 */
    patch(_children[i], children[i], container, anchor);
  }
  if (_len > len) {
    /* 如果旧len大于新len，卸载多余的 */
    unmountChildren(_children.slice(baseLen));
  } else if (_len < len) {
    /* 增加新元素 */
    mountChildren(children.slice(baseLen), container, anchor);
  }
}

const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
function patchProps(_props, props, el) {
  _props = _props || {};
  props = props || {};

  for (const key in _props) {
    /* 如果新props不包含的key，通过patch移除 */
    if (!props[key]) {
      patchSingleProp(_props[key], null, key, el);
    }
  }
  for (const key in props) {
    /* 新的props */
    const _value = _props[key];
    const value = props[key];
    if (_value !== value)
      /* 不相等进行更新，仅更新style样式 */
      patchSingleProp(_value, value, key, el);
  }
}
function patchSingleProp(_value, value, key, el) {
  _value = _value || ""; /* 如果传入的为null，默认参数形式会报错！ */
  value ||= "";
  switch (key) {
    case "class":
      el.className = value; /* 去除false null类型 */
      break;
    case "style":
      for (const styleName in _value) {
        if (!value[styleName]) {
          el.style[styleName] = ""; /* 移除新props中没有的style */
        }
      }
      for (const styleName in value) {
        el.style[styleName] = value[styleName];
      }
      break;
    default:
      if (/^on[^a-z]/.test(key)) {
        if (_value) {
          /* 移除原有的事件 */
          el.removeEventListener(key.slice(2).toLowerCase(), _value);
        }
        el.addEventListener(
          key.slice(2).toLowerCase(),
          (0,_utils__WEBPACK_IMPORTED_MODULE_2__.isFunction)(value) ? value : () => value
        );
        return;
      }
      /* 属性设置，分为可直接读取与不可直接读取 */
      if (domPropsRE.test(key)) {
        el[key] = value;
      } else if (value !== false && value !== null) {
        // 如果是false | null，那么setAttribute会将false转成字符串，此时就代表了true，应该去掉
        el.setAttribute(key, value);
      }
  }
}


/***/ }),

/***/ "./src/runtime/scheduler.js":
/*!**********************************!*\
  !*** ./src/runtime/scheduler.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "nextTick": () => (/* binding */ nextTick),
/* harmony export */   "scheduler": () => (/* binding */ scheduler)
/* harmony export */ });
// 调度的出现是为了性能的提高，即通过合并相同的操作，只执行一次渲染，这样就可以提高性能，调度的实现和计算属性的实现是很类似的
/**
 * scheduler是一个类似节流的过程，
 * 但同时jobs是可变的，又有类似防抖的过程，
 * 如果执行一个job就删除一个job，那么就是一个节流的过程
 */
let jobs = [];

function scheduler(job) {
  // 如果队列不包含相同的job，进行push
  if (!jobs.includes(job)) {
    jobs.push(job);
    flushJobs(); /* 类似节流函数 */
  }
}

let isFlushing = false;
const RESOLVED = Promise.resolve();
let curr = null;
function flushJobs() {
  if (!isFlushing) {
    isFlushing = true; /* 在刷新job的过程中，可能还会有push过程 */
    curr = RESOLVED.then(() => {
      /* 将render函数放入到微任务队列中，也就是一个类似节流的过程 */
      jobs.forEach((job) => job());
    })
      .catch(console.log)
      .finally(() => {
        isFlushing = false;
        jobs = []; /* 清空 */
      });
  }
}

function nextTick(fn) {
  return curr /* 如果队列中存在任务，那么需要使用当前的promise，如果不存在则使用RESOLVED */
    ? curr.then(fn).finally(() => {
        curr = null;
      })
    : RESOLVED.then(fn);
}


/***/ }),

/***/ "./src/runtime/vnode.js":
/*!******************************!*\
  !*** ./src/runtime/vnode.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* binding */ Fragment),
/* harmony export */   "ShapeFlags": () => (/* binding */ ShapeFlags),
/* harmony export */   "Text": () => (/* binding */ Text),
/* harmony export */   "h": () => (/* binding */ h),
/* harmony export */   "normalizeVNode": () => (/* binding */ normalizeVNode)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");


const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
};

const Text = Symbol("Text");
const Fragment = Symbol("Fragment");

/**
 * h 生成VNode
 * @param {string | Object | Text | Fragment} type
 * @param {Object | null} props
 * @param {string | number | Array} children
 * @returns VNode
 */
function h(type, props, children) {
  let shapeFlag = 0;
  switch (typeof type /* 判断自身 */) {
    case "object":
      shapeFlag |= ShapeFlags.COMPONENT; /* 组件对象 */
      break;
    case "string":
      shapeFlag |= ShapeFlags.ELEMENT; /* 普通元素标签 */
    case "symbol" /* 符号类型要么是TEXT要么是FRAGMENT */:
      shapeFlag |= type === Text ? ShapeFlags.TEXT : ShapeFlags.FRAGMENT;
  }
  switch (typeof children /* 判断自身 */) {
    case "object":
      shapeFlag |= (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(children)
        ? ShapeFlags.ARRAY_CHILDREN
        : 0; /* 如果是数组，那么添加进shapeFlag中，否则不变 */
      break;
    case "number":
    case "boolean":
    case "string":
      shapeFlag |= ShapeFlags.TEXT_CHILDREN;
      children = children.toString();
      break;
  }

  // return {
  //   type,
  //   props,
  //   children,
  //   shapeFlag,
  // };
  return {
    type,
    props,
    children,
    shapeFlag,
    el: null, /* 代表当前虚拟dom对应的真实dom */
    anchor: null, /* 锚用于定位 */
  };
}

function normalizeVNode(vnode) {
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isArray)(vnode)) {
    return h(Fragment, null, vnode)
  }
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(vnode)) {
    return vnode
  }
  if ((0,_utils__WEBPACK_IMPORTED_MODULE_0__.isString)(vnode) || (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isNumber)(vnode)) {
    return h(Text, null, vnode.toString())
  }
}

/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "camelize": () => (/* binding */ camelize),
/* harmony export */   "capitalize": () => (/* binding */ capitalize),
/* harmony export */   "hasChanged": () => (/* binding */ hasChanged),
/* harmony export */   "isArray": () => (/* binding */ isArray),
/* harmony export */   "isFunction": () => (/* binding */ isFunction),
/* harmony export */   "isNativeTag": () => (/* binding */ isNativeTag),
/* harmony export */   "isNumber": () => (/* binding */ isNumber),
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "isString": () => (/* binding */ isString),
/* harmony export */   "isVoidTag": () => (/* binding */ isVoidTag)
/* harmony export */ });
function isObject(target) {
  return typeof target === "object" && target !== null;
}

function isFunction(getter) {
  return typeof getter === "function";
}

function isArray(target) {
  return Array.isArray(target);
}

function isString(target) {
  return typeof target === "string";
}

function isNumber(target) {
  return typeof target === "number";
}

function hasChanged(origin, current) {
  return origin !== current && !Number.isNaN(origin) && !Number.isNaN(current);
}

function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : " "));
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

const HTML_TAGS =
  "html,body,base,head,link,meta,style,title,address,article,aside,footer," +
  "header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption," +
  "figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code," +
  "data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup," +
  "time,u,var,wbr,area,audio,map,track,video,embed,object,param,source," +
  "canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td," +
  "th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup," +
  "option,output,progress,select,textarea,details,dialog,menu," +
  "summary,template,blockquote,iframe,tfoot";

const VOID_TAGS =
  "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";

function makeMap(str) {
  const map = str
    .split(",")
    // 逗号运算符会返回后一个的表达式，如(,map)返回map，(1,2,3,alert)("世界你好")可以成功调用alert！
    .reduce((map, item) => ((map[item] = true), map), Object.create(null));
  return (val) => !!map[val];
}

const isVoidTag = makeMap(VOID_TAGS);
const isNativeTag = makeMap(HTML_TAGS);


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MiniVue": () => (/* binding */ MiniVue)
/* harmony export */ });
/* harmony import */ var _compiler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./compiler */ "./src/compiler/index.js");
/* harmony import */ var _runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./runtime */ "./src/runtime/index.js");
/* harmony import */ var _reactivity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactivity */ "./src/reactivity/index.js");




const MiniVue = (window.MiniVue = {
  createApp: _runtime__WEBPACK_IMPORTED_MODULE_1__.createApp,
  parse: _compiler__WEBPACK_IMPORTED_MODULE_0__.parse,
  render: _runtime__WEBPACK_IMPORTED_MODULE_1__.render,
  h: _runtime__WEBPACK_IMPORTED_MODULE_1__.h,
  Text: _runtime__WEBPACK_IMPORTED_MODULE_1__.Text,
  Fragment: _runtime__WEBPACK_IMPORTED_MODULE_1__.Fragment,
  nextTick: _runtime__WEBPACK_IMPORTED_MODULE_1__.nextTick,
  reactive: _reactivity__WEBPACK_IMPORTED_MODULE_2__.reactive,
  ref: _reactivity__WEBPACK_IMPORTED_MODULE_2__.ref,
  computed: _reactivity__WEBPACK_IMPORTED_MODULE_2__.computed,
  effect: _reactivity__WEBPACK_IMPORTED_MODULE_2__.effect,
  compile: _compiler__WEBPACK_IMPORTED_MODULE_0__.compile,
  renderList: _runtime__WEBPACK_IMPORTED_MODULE_1__.renderList,
});

// console.log(
//   parse(`<div v-on="ok">
//   Hello World {{Hello}}
//   <div>Hello
//     World
//      {{Hello}}</div>
// </div>`)
// );
})();

/******/ })()
;