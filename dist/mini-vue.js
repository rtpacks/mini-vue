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
/* harmony export */   "mount": () => (/* reexport safe */ _render__WEBPACK_IMPORTED_MODULE_0__.mount),
/* harmony export */   "render": () => (/* reexport safe */ _render__WEBPACK_IMPORTED_MODULE_0__.render)
/* harmony export */ });
/* harmony import */ var _render__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./render */ "./src/runtime/render.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");



/***/ }),

/***/ "./src/runtime/render.js":
/*!*******************************!*\
  !*** ./src/runtime/render.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mount": () => (/* binding */ mount),
/* harmony export */   "render": () => (/* binding */ render)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");



/**
 * render 渲染VNode，虚拟DOM很多种类型，相应的挂载到真实DOM上也是很多方式，也就是很多种类型的mount函数
 * @param {*} vnode
 * @param {HTML Element} container
 */
function render(vnode, container) {
  mount(vnode, container);
}

function mount(vnode, container) {
  /* 此时 & 的过程仅仅针对父级元素，能够确保仅仅父级元素在起作用，因为当前的ShapFlags，并没有定义子元素，所有的子元素标识都将在&的过程去除！ */
  const { shapeFlag } = vnode;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ELEMENT) {
    /* 如果是一个普通的元素 */
    mountElement(vnode, container);
    return;
  }
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT) {
    /* 如果是一个Text类型的节点 */
    mountText(vnode, container);
    return;
  }
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.FRAGMENT) {
    /* 如果是一个Fragment类型的节点 */
    mountFragment(vnode, container);
    return;
  }
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.COMPONENT) {
    /* 如果是一个组件对象 */
    mountComponent(vnode, container);
    return;
  }
}

function mountElement(vnode, container) {
  const { type, props } = vnode;
  const el = document.createElement(type);
  mountProps(props, el);
  mountChildren(vnode, el);
  container.appendChild(el); /* 注意添加子元素不可少！ */
}

function mountText(vnode, container) {
  /* 如果只是一个文本节点，一个父元素中还有其他的元素，剩余的文本没有被包裹！，直接挂载元素即可，因为一个文本节点只是添加了文本元素 */
  const textNode = document.createTextNode(vnode.children);
  container.appendChild(textNode); /* 注意添加子元素不可少！ */
}

function mountFragment(vnode, container) {
  /* Fragment直接将当前的Fragment子元素挂载到Fragment父元素上！相当于缩减了一级 */
  mountChildren(vnode, container);
}

function mountComponent(vnode, container) {}

function mountChildren(vnode, container) {
  const { children, shapeFlag } = vnode;
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.TEXT_CHILDREN) {
    mountText(vnode, container); /* 因为mountText函数直接取children，所以这只需要传递vnode即可，为了规范！ */
    return;
  }
  if (shapeFlag & _vnode__WEBPACK_IMPORTED_MODULE_1__.ShapeFlags.ARRAY_CHILDREN) {
    children.forEach((child) => {
      mount(child, container);
    });
    return;
  }
}

// 大写字母或者是以特殊属性名开头的属性
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;

function mountProps(props, el) {
  /* 一个标签的属性情况很复杂，需要很多的边界处理！ */
  /* 使用for in的在于能够更方便的拿到key，并且能够遍历对象的key，防止传入的是对象，但是使用数组的方法造成错误。 */
  for (const key in props) {
    const value = props[key];
    switch (key) {
      case "class":
        el.className = value;
        break;
      case "style":
        /* 传入的style是一个对象，进行遍历即可 */
        for (const styleName in value) {
          el.style[styleName] =
            value[
              styleName
            ]; /* 取出赋值即可，防止是一个对象，不能使用数组的方法！使用最普通的for即可 */
        }
        break;
      default:
        /* 考虑事件的情况，on开头， /^on[A-Z]/ */
        if (/^on[^a-z]/.test(key)) {
          /* 注意：这里命名还包括了其他的命名如：on123，虽然不符合规范，但是还是有可能的，即使不正确！ */
          el.addEventListener(
            key.slice(2).toLowerCase(),
            (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isFunction)(value) ? value : () => value
          );
        } else if (domPropsRE.test(key)) {
          /* 特殊的属性 如果是普通的属性，不能通过setAttribute进行设置的，或者通过setAttribute会出现异常的！ */
          el[key] = value;
        } else {
          /* 普通的属性设置，如果是false | null，那么setAttribute会将false转成字符串，此时就代表了true，应该去掉 */
          /* 如果在setAttribute之后，则应该使用removeAttribute去除 */

          // !(value===false | value===null) && el.setAttribute(key, value)
          if (value !== false && value !== null) {
            el.setAttribute(key, value);
          }
        }
        break;
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

  return {
    type,
    props,
    children,
    shapeFlag,
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


const vnode = (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(
  "div",
  {
    class: "a b",
    style: {
      border: "1px solid black",
      "font-size": "14px",
    },
    onClick: () => console.log("click"),
    id: "vnode",
    checked: "",
    custom: false,
  },
  [
    (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("ul", null, [
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", { style: { color: "red" } }, 1),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, 2),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", { style: { 'background-color': "blue" } }, 3),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, 4), (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, 5)]),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)("li", null, [(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.h)(_runtime__WEBPACK_IMPORTED_MODULE_0__.Text, null, "Hello World")]),
    ]),
  ]
);
(0,_runtime__WEBPACK_IMPORTED_MODULE_0__.render)(vnode, document.body);
})();

/******/ })()
;