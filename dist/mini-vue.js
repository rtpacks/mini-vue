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
/* harmony import */ var _reactivity_reactive__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../reactivity/reactive */ "./src/reactivity/reactive.js");
/* harmony import */ var _vnode__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vnode */ "./src/runtime/vnode.js");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils */ "./src/utils/index.js");
/* harmony import */ var _reactivity_effect__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../reactivity/effect */ "./src/reactivity/effect.js");





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
  (0,_reactivity_effect__WEBPACK_IMPORTED_MODULE_3__.effect)(instance.patch);
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
/* harmony import */ var _reactivity_ref__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reactivity/ref */ "./src/reactivity/ref.js");
/* harmony import */ var _runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./runtime */ "./src/runtime/index.js");



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

// render(
//   h("ul", null, [
//     h("li", { style: { color: "red" } }, 1),
//     h("li", null, 2),
//     h("li", { style: { "background-color": "blue" } }, 3),
//     h(Fragment, null, []),
//     h("li", null, [h(Text, null, "Hello World")]),
//   ]),
//   document.body
// );

// setTimeout(() => {
//   render(
//     h("ul", null, [
//       /* 1，2，3都不重新创建dom元素，3修改属性 */
//       h("li", { style: { color: "red" } }, 1),
//       h("li", null, 2),
//       h("li", { style: { "background-color": "red" } }, 3),
//       /* 由于新增了元素，所以会被创建并添加，注意ul的子元素长度是一样的，Fragment只会和Fragment对比，不会和Hello World最后一个li对比 */
//       h(Fragment, null, [h("li", null, 4), h("li", null, 5)]),
//       /* 不会重新创建元素，只会修改内容，所以造成的结果就是在原有的位置修改元素，而添加的4，5就在后面，因为这个你好世界所在的元素并未修改位置，只是修改内部的内容 */
//       // 这种Fragment情况可以通过 anchor定位锚 + insertBefore API来解决，思想就是在插入之前确定位置
//       h("li", null, [h(Text, null, "你好 世界")]),
//     ]),
//     document.body
//   );
// }, 2000);

// const Comp = {
//   props: ["foo"],
//   render(ctx) {
//     return h("div", { class: "a", id: ctx.bar }, ctx.foo);
//   },
// };

// const props = {
//   foo: "foo",
//   bar: "bar",
// };

// const vnode = h(Comp, props);

// render(vnode, document.body);

const Comp = {
  setup() {
    const count = (0,_reactivity_ref__WEBPACK_IMPORTED_MODULE_0__.ref)(0);
    const add = () => count.value++;
    const sub = () => count.value--;
    const dateTime = (0,_reactivity_ref__WEBPACK_IMPORTED_MODULE_0__.ref)("2022-07-22 00:00:00");
    setInterval(() => {
      dateTime.value = new Date().toLocaleString()
    }, 1000);
    console.log("setup执行");
    return {
      count,
      add,
      sub,
      dateTime,
    };
  },
  render(ctx) {
    return [
      (0,_runtime__WEBPACK_IMPORTED_MODULE_1__.h)("div", null, `counter: ${ctx.count.value}`) /* 并没有处理去掉value */,
      (0,_runtime__WEBPACK_IMPORTED_MODULE_1__.h)("button", { onClick: ctx.sub }, "-"),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_1__.h)("button", { onClick: ctx.add }, "+"),
      (0,_runtime__WEBPACK_IMPORTED_MODULE_1__.h)("div", null, `DateTime：${ctx.dateTime.value}`),
    ];
  },
};
const vnode = (0,_runtime__WEBPACK_IMPORTED_MODULE_1__.h)(Comp, null);
(0,_runtime__WEBPACK_IMPORTED_MODULE_1__.render)(vnode, document.body);

})();

/******/ })()
;