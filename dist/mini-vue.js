/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/runtime/index.js":
/*!******************************!*\
  !*** ./src/runtime/index.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Fragment": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_1__.Fragment),
/* harmony export */   "ShapeFlags": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags),
/* harmony export */   "Text": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_1__.Text),
/* harmony export */   "h": () => (/* reexport safe */ _vnode__WEBPACK_IMPORTED_MODULE_1__.h),
/* harmony export */   "mount": () => (/* reexport safe */ _renderer__WEBPACK_IMPORTED_MODULE_0__.mount),
/* harmony export */   "render": () => (/* reexport safe */ _renderer__WEBPACK_IMPORTED_MODULE_0__.render)
/* harmony export */ });
/* harmony import */ var _renderer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./renderer */ "./src/runtime/renderer.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");



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
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");


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
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ELEMENT) {
    mountElement(vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT) {
    mountText(vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
    mountComponent(vnode, container, anchor);
  }
  container._vnode =
    vnode; /* 注意：并不是所有的的真实DOM都存有虚拟dom，但是每一个虚拟dom都存有其真实dom的引用 */
}

function unmount(vnode) {
  const { shapeFlag } = vnode;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ELEMENT || shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT) {
    /* 普通的element和text节点通过移除children实现 */
    // unmountChildren(vnode);
    const { el } = vnode;
    el.parentNode.removeChild(el);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
    unmountFragment(vnode);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
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
    unmount(_vnode);
    _vnode = null;
    // todo
    return;
  }
  /* 同类型vnode，shapeFlag相同 */
  const { shapeFlag } = vnode;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ELEMENT) {
    patchElement(_vnode, vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT) {
    patchText(_vnode, vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.FRAGMENT) {
    patchFragment(_vnode, vnode, container, anchor);
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.COMPONENT) {
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

  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
    mountText(vnode, el); /* 注意层级关系 */
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
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

function mountComponent(vnode, container) {}

function mountChildren(children, container, anchor) {
  children.forEach((child) => mount(child, container, anchor));
}

// function unmountElement(vnode) {}
// function unmountText(vnode) {}

function unmountFragment(vnode) {}
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

function patchComponent(_vnode, vnode) {}

function patchChildren(_vnode, vnode, container, anchor) {
  /* 更新children函数 */
  const { shapeFlag: _shapeFlag, children: _children } = _vnode;
  const { shapeFlag, children } = vnode;

  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
    // 如果新vnode是TEXT_CHILDREN类型
    if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
      // container.textContent = children; /* 虚拟DOM应该保持在children中，后续检查以辨别是否与父元素的虚拟dom保持一致，验证正确，并不是vnode.textContent，而是children */
    } else if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(_children); /* 卸载旧组件！ */
      // container.textContent = children;
    } else if (_vnode === null) {
      // container.textContent = children;
    }
    if (_children !== children) {
      container.textContent = children;
    }
  } else if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
    // 如果新vnode是ARRAY_CHILDREN类型
    if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
      mountChildren(children, container, anchor);
    } else if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
      patchArrayChildren(_children, children, container, anchor);
    } else if (_vnode === null) {
      mountChildren(children, container, anchor);
    }
  } else if (vnode === null) {
    // 如果新vnode是null类型
    if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
    } else if (_shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_0__.ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(_children);
    } else if (_vnode === null) {
      // 都不存在即不执行任何操作！
    }
  }
}

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
          isFunction(value) ? value : () => value
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
/* harmony export */   "h": () => (/* binding */ h)
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


/***/ }),

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hasChanged": () => (/* binding */ hasChanged),
/* harmony export */   "isArray": () => (/* binding */ isArray),
/* harmony export */   "isFunction": () => (/* binding */ isFunction),
/* harmony export */   "isNumber": () => (/* binding */ isNumber),
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "isString": () => (/* binding */ isString)
/* harmony export */ });
function isObject(target) {
  return typeof target === 'object' && 
    target !== null 
}

function isFunction(getter) {
  return typeof getter === 'function'
}

function isArray(target) {
  return Array.isArray(target)
}

function isString(target) {
  return typeof target === 'string'
}

function isNumber(target) {
  return typeof target === 'number'
}

function hasChanged(origin, current) {
  return origin !== current && (!Number.isNaN(origin) && !Number.isNaN(current))
}

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
/* harmony import */ var _runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./runtime */ "./src/runtime/index.js");


// const vnode = h(
//   "div",
//   {
//     class: "a b",
//     style: {
//       border: "1px solid black",
//       "font-size": "14px",
//     },
//     onClick: () => console.log("click"),
//     id: "vnode",
//     checked: "",
//     custom: false,
//   },
//   [
//     h("ul", null, [
//       h("li", { style: { color: "red" } }, 1),
//       h("li", null, 2),
//       h("li", { style: { 'background-color': "blue" } }, 3),
//       h(Fragment, null, [h("li", null, 4), h("li", null, 5)]),
//       h("li", null, [h(Text, null, "Hello World")]),
//     ]),
//   ]
// );
(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.render)(
  (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("ul", null, [
    (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", { style: { color: "red" } }, 1),
    (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, 2),
    (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", { style: { "background-color": "blue" } }, 3),
    (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, []),
    (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Text, null, "Hello World")]),
  ]),
  document.body
);

setTimeout(() => {
  (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.render)(
    (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("ul", null, [
      /* 1，2，3都不重新创建dom元素，3修改属性 */
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", { style: { color: "red" } }, 1),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, 2),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", { style: { "background-color": "red" } }, 3),
      /* 由于新增了元素，所以会被创建并添加，注意ul的子元素长度是一样的，Fragment只会和Fragment对比，不会和Hello World最后一个li对比 */
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, 4), (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, 5)]),
      /* 不会重新创建元素，只会修改内容，所以造成的结果就是在原有的位置修改元素，而添加的4，5就在后面，因为这个你好世界所在的元素并未修改位置，只是修改内部的内容 */
      // 这种Fragment情况可以通过 anchor定位锚 + insertBefore API来解决，思想就是在插入之前确定位置
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Text, null, "你好 世界")]),
    ]),
    document.body
  );
}, 2000);

})();

/******/ })()
;