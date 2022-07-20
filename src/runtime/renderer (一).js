import { isFunction } from "../utils";
import { ShapeFlags } from "./vnode";

/**
 * render 渲染VNode，虚拟DOM很多种类型，相应的挂载到真实DOM上也是很多方式，也就是很多种类型的mount函数
 * @param {*} vnode
 * @param {HTML Element} container
 */
export function render(vnode, container) {
  mount(vnode, container);
}

export function mount(vnode, container) {
  /* 此时 & 的过程仅仅针对父级元素，能够确保仅仅父级元素在起作用，因为当前的ShapFlags，并没有定义子元素，所有的子元素标识都将在&的过程去除！ */
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    /* 如果是一个普通的元素 */
    mountElement(vnode, container);
    return;
  }
  if (shapeFlag & ShapeFlags.TEXT) {
    /* 如果是一个Text类型的节点 */
    mountText(vnode, container);
    return;
  }
  if (shapeFlag & ShapeFlags.FRAGMENT) {
    /* 如果是一个Fragment类型的节点 */
    mountFragment(vnode, container);
    return;
  }
  if (shapeFlag & ShapeFlags.COMPONENT) {
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
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountText(vnode, container); /* 因为mountText函数直接取children，所以这只需要传递vnode即可，为了规范！ */
    return;
  }
  if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
            isFunction(value) ? value : () => value
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
