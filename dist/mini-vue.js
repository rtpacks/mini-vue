/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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

function effect(fn) {
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
  return effectFn();
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
    ?.forEach((effect) => effect());
}


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
      return (0,_utils__WEBPACK_IMPORTED_MODULE_0__.isObject)(res) ? reactive(reactive) : res;
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
    reactive函数同样也是如此，必须要使用对象的某一个属性，单纯使用对象不适用某个对象的属性是不会加入依赖的！*/
    if (!(0,_utils__WEBPACK_IMPORTED_MODULE_0__.hasChanged)(this._value, value)) {
      return ;
    }
    this._value = convert(value) /* 此时也需要转换，如果传入的数据一个引用类型的数据，那么就需要转换一下！ */
    ;(0,_effect__WEBPACK_IMPORTED_MODULE_1__.trigger)(this, 'value') 
  }
}

/* ref函数用于记忆基本数据类型，引用数据类型都交给reactive函数 */
/* 因为基本数据类型存储在栈上，所以难以判断是否为同一个对象，用一个对象实现存储，和reactive一样 */
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

/***/ "./src/utils/index.js":
/*!****************************!*\
  !*** ./src/utils/index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hasChanged": () => (/* binding */ hasChanged),
/* harmony export */   "isArray": () => (/* binding */ isArray),
/* harmony export */   "isObject": () => (/* binding */ isObject),
/* harmony export */   "isString": () => (/* binding */ isString)
/* harmony export */ });
function isObject(target) {
  return typeof target === 'object' && 
    target !== null 
}

function isString(target) {
  return typeof target === 'string'
}

function isArray(target) {
  return Array.isArray(target)
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
/* harmony import */ var _reactivity_effect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reactivity/effect */ "./src/reactivity/effect.js");
/* harmony import */ var _reactivity_reactive__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./reactivity/reactive */ "./src/reactivity/reactive.js");
/* harmony import */ var _reactivity_ref__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./reactivity/ref */ "./src/reactivity/ref.js");




const manager = (window.manager = (0,_reactivity_reactive__WEBPACK_IMPORTED_MODULE_1__.reactive)({
  position: "manager",
  name: "张三",
  age: 18,
}));

const developer = (window.developer = (0,_reactivity_reactive__WEBPACK_IMPORTED_MODULE_1__.reactive)({
  position: "developer",
  name: "赵六",
  age: 24,
}));

const arr = (window.arr = (0,_reactivity_reactive__WEBPACK_IMPORTED_MODULE_1__.reactive)(["zs", "li", "wu"]));

// effect(() => {
//   console.log("developer", developer.age)
// })
// effect(() => {
//   console.log("manager", manager.name)
// })
// effect(() => { /* vue官方也没有实现此功能：单纯的使用某一个对象并没有使用对象的属性，此时这个effect不会生效！ */
//   console.log(`developer=${developer}, manager=${manager}`)
// })
// effect(() => {
//   console.log("arr[5] = ", arr[5])
// })
// effect(()=>{
//   console.log("arr.length = ", arr.length)
// })
// effect(() => {
//   effect(() => {
//     console.log("arr[1] = ", arr[1])
//   })
//   console.log("arr[3] = ", arr[3])
// })

const num = (window.num = (0,_reactivity_ref__WEBPACK_IMPORTED_MODULE_2__.ref)(1));
const rarr = (window.rarr = (0,_reactivity_ref__WEBPACK_IMPORTED_MODULE_2__.ref)([1, 2, 2]));
const obj = window.obj = (0,_reactivity_ref__WEBPACK_IMPORTED_MODULE_2__.ref)({
  name: "张三",
  age: 18
})

;(0,_reactivity_effect__WEBPACK_IMPORTED_MODULE_0__.effect)(() => {
  console.log("此时的 num =", num.value); /* 之所以要使用.value的原因就是因为用一个对象来保存基本数据类型了！ */
});
(0,_reactivity_effect__WEBPACK_IMPORTED_MODULE_0__.effect)(() => {
  console.log("使用ref定义对象类型：rarr[1]=", rarr.value[1]);
});
(0,_reactivity_effect__WEBPACK_IMPORTED_MODULE_0__.effect)(() => {
  console.log("此时obj.name = ", obj.value.name)
})
;(0,_reactivity_effect__WEBPACK_IMPORTED_MODULE_0__.effect)(() => {
  console.log("此时obj.age = ", obj.value.age)
})
})();

/******/ })()
;