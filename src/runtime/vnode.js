import { isReactive } from "../reactivity/reactive";
import { isArray, isNumber, isObject, isString } from "../utils";

export const ShapeFlags = {
  ELEMENT: 1, // 00000001
  TEXT: 1 << 1, // 00000010
  FRAGMENT: 1 << 2, // 00000100
  COMPONENT: 1 << 3, // 00001000
  TEXT_CHILDREN: 1 << 4, // 00010000
  ARRAY_CHILDREN: 1 << 5, // 00100000
  CHILDREN: (1 << 4) | (1 << 5), //00110000
};

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");

/**
 * h 生成VNode
 * @param {string | Object | Text | Fragment} type
 * @param {Object | null} props
 * @param {string | number | Array} children
 * @returns VNode
 */
export function h(type, props, children) {
  let shapeFlag = 0;
  switch (typeof type /* 判断自身 */) {
    case "object":
      shapeFlag |= ShapeFlags.COMPONENT; /* 组件对象 */
      break;
    case "string":
      shapeFlag |= ShapeFlags.ELEMENT; /* 普通元素标签 */
      break;
    case "symbol" /* 符号类型要么是TEXT要么是FRAGMENT */:
      shapeFlag |= type === Text ? ShapeFlags.TEXT : ShapeFlags.FRAGMENT;
      break;
  }
  switch (typeof children /* 判断 */) {
    case "object":
      shapeFlag |= isArray(children)
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

  if (props) {
    // 更新了props，需要重新浅拷贝触发render
    if (isReactive(props)) { 
      props = Object.assign({}, props);
    }
    // reactive state objects need to be cloned since they are likely to be
    if (isReactive(props.style)) {
      props.style = Object.assign({}, props.style);
    }
  }

  return {
    type,
    props,
    children,
    shapeFlag,
    el: null /* 代表当前虚拟dom对应的真实dom */,
    anchor: null /* 锚用于定位 */,
  };
}

export function normalizeVNode(vnode) {
  if (isArray(vnode)) {
    return h(Fragment, null, vnode);
  }
  if (isObject(vnode)) {
    return vnode;
  }
  if (isString(vnode) || isNumber(vnode)) {
    return h(Text, null, vnode.toString());
  }
}
