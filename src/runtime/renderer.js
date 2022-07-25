import { ShapeFlags } from "./vnode";
import { mountComponent, patchComponent, unmountComponent } from "./component";
import { isFunction } from "../utils";

/**
 * 渲染VNode，每种vnode对应不同的mount/unmount/patch函数
 * 真实DOM只存在两种节点，标签和文本(包括注释)
 * createElement | createTextNode 两种方式
 * type关注自身，shapeFlag关注自身与children，方便运算
 * @param {*} vnode
 * @param {HTML Element} container
 */
export function render(vnode, container) {
  // _vnode即旧vnode，将_vnode放在对应真实DOM上，方便进行与新VNode的diff对比
  const { _vnode } = container;
  if (!vnode) {
    unmount(_vnode); // 新vnode不存在，卸载旧vnode，后续流程均存在vnode
  } else {
    patch(_vnode, vnode, container); // 更新
  }
  container._vnode = vnode; // 代表旧vnode
}

export function mount(vnode, container, anchor) {
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    mountElement(vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    mountText(vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.COMPONENT) {
    mountComponent(vnode, container, anchor);
  }
}

export function unmount(vnode) {
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT || shapeFlag & ShapeFlags.TEXT) {
    /* 所有真实DOM的移除：Element和Text节点通过移除children实现 */
    const { el } = vnode;
    el.parentNode.removeChild(el);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    unmountFragment(vnode);
  } else if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode);
  }
}

export function patch(_vnode, vnode, container, anchor) {
  // debugger
  if (!_vnode) {
    // 挂载
    mount(vnode, container, anchor);
    return;
  }

  if (!isSameVNodeType(_vnode, vnode)) {
    // 类型不同，卸载旧vnode，需要更新锚位置，即新vnode插入的位置
    // anchor = _vnode.anchor || _vnode.el.nextSibling; 错误
    // debugger
    anchor = _vnode.el?.nextSibling || _vnode.anchor;
    unmount(_vnode);
    mount(vnode, container, anchor);
    _vnode = null; // 不放在unmount中，vnode可能还会复用，但类型不同肯定不复用
    return;
  }
  //  debugger
  /* 同类型vnode，shapeFlag相同 */
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    patchElement(_vnode, vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    patchText(_vnode, vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    patchFragment(_vnode, vnode, container, anchor);
  } else if (shapeFlag & ShapeFlags.COMPONENT) {
    patchComponent(_vnode, vnode, container, anchor);
  }
}

function isSameVNodeType(_vnode, vnode) {
  return _vnode.type === vnode.type;
}

function mountElement(vnode, container, anchor) {
  const { type, props, shapeFlag } = vnode;
  const el = document.createElement(type);
  patchProps(null, props, el); /* 用patch改造mount */

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountText(vnode, el);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode.children, el);
  }

  container.insertBefore(el, anchor);
  vnode.el = el; /* 为了在更新时拿到对应的真实dom */
  vnode.anchor = anchor;
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

  // 思想：在初始Fragment子元素数组中，创建开始和结束两个空文本节点作为锚定位【"", ..., ""】

  const startAnchor = document.createTextNode("");
  const endAnchor = document.createTextNode("");
  vnode.el = startAnchor;
  vnode.anchor = endAnchor;

  // 使用的是insertBefore函数，endAnchor可以起到定位作用
  // anchor参数未指定或为undefined，默认在最后插入，和appendChild的功能一致
  // container.appendChild(startAnchor);
  // container.appendChild(endAnchor);
  container.insertBefore(startAnchor, anchor);
  container.insertBefore(endAnchor, anchor);

  // 将endAnchor作为参数一致传递下去，最终会传递到自身，使用即可
  mountChildren(vnode.children, container, endAnchor);
}

function mountChildren(children, container, anchor) {
  children.forEach((child) => mount(child, container, anchor));
}

function unmountFragment(vnode) {
  // 添加了anchor后，还需要删除刚开始添加的两个子元素，不能直接调用unmountChildren
  let { el: curr, anchor } = vnode;
  const parent = el.parentNode;
  while (curr !== anchor) {
    /* anchor是最后一个节点 */
    let next = curr.nextSibling;
    parent.removeChild(curr);
    curr = next;
  }
  parent.removeChild(anchor);
}

function unmountChildren(children) {
  children.forEach((child) => unmount(child));
}

function patchElement(_vnode, vnode, container) {
  vnode.el = _vnode.el;
  patchProps(_vnode.props, vnode.props, vnode.el);
  patchChildren(_vnode, vnode, vnode.el);
}

function patchText(_vnode, vnode, container, anchor) {
  vnode.el = _vnode.el;
  vnode.anchor = _vnode.anchor;
  vnode.el.textContent = vnode.children; /* 更新真实dom的内容 */
}

function patchFragment(_vnode, vnode, container) {
  // anchor传递给新vnode
  const startAnchor = (vnode.el = _vnode.el);
  const endAnchor = (vnode.anchor = _vnode.anchor);
  patchChildren(_vnode, vnode, container, endAnchor);
}

function patchChildren(_vnode, vnode, container, anchor) {
  /* 更新children函数 */
  const { shapeFlag: _shapeFlag, children: _children } = _vnode;
  const { shapeFlag, children } = vnode;

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 如果新vnode是TEXT_CHILDREN类型
    if (_shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // container.textContent = children;
    } else if (_shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(_children); /* 卸载旧组件！ */
      // container.textContent = children;
    } else if (_vnode === null) {
      // container.textContent = children;
    }
    if (_children !== children) {
      container.textContent = children;
    }
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 如果新vnode是ARRAY_CHILDREN类型
    if (_shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
      mountChildren(children, container, anchor);
    } else if (_shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      patchArrayChildren(_children, children, container, anchor);
    } else if (_vnode === null) {
      mountChildren(children, container, anchor);
    }
  } else if (vnode === null) {
    // 如果新vnode是null类型
    if (_shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
    } else if (_shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
  // debugger;
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
