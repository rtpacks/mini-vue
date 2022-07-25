import { patch, unmount } from "./renderer";
import { scheduler } from "./scheduler";
import { normalizeVNode } from "./vnode";

import { compile } from "../compiler";
import { effect, reactive } from "../reactivity";

// 组件由两个阶段生成
// 第一阶段是原生的不经过h函数包裹的组件对象 如 {setup(){}, render() {return h('div', null, "我是小明")}}
// 第二阶段是经过h函数包裹的vnode对象，如 h(Comp, vnodeProps);

// vnode的props属性有两种：1. 内部使用的props父传子，2.组件attrs标签属性
// 组件对象：Component，虚拟DOM：vnode

function fallThrough(instance, subTree) {
  subTree.props = {
    ...(instance.attrs || {}),
    ...(subTree.props || {}),
  };
}

function patchInsProps(instance, vnode) {
  const { type: Component, props: vnodeProps } = vnode; /* 获取组件对象 */

  // 区分不同的属性
  instance.props ||= {};
  instance.attrs ||= {};
  for (const key in vnodeProps) {
    if (Component.props?.includes(key)) {
      instance.props[key] = vnodeProps[key];
    } else {
      instance.attrs[key] = vnodeProps[key];
    }
  }
  instance.props = reactive(instance.props); /* 做响应式处理 */
}

export function mountComponent(vnode, container, anchor) {
  const { type: Component } = vnode;

  const instance = (vnode.component = {
    props: null,
    attrs: null,

    setupState: null,
    ctx: null,

    subTree: null,
    patch: null,

    next: null,
  });

  patchInsProps(instance, vnode);

  // 对于vue3，执行setup函数，获取返回值setupState，通过effect确定响应数据，最终通过render产出vnode，render接收ctx
  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs,
  });
  instance.ctx = {
    ...instance.props,
    ...instance.setupState,
  };

  // 判断render函数是否存在，如果不存在，通过generate生成的h代码片段，通过new Function生成render函数
  if (!Component.render && Component.template) {
    let { template } = Component;

    if (template[0] === "#") {
      /* 如果是一个#开头的mount 如#template */
      const el = document.querySelector(template);
      template = el ? el.innerHTML : "";
      // 删除原template节点
      el.parentNode.removeChild(el);
    }

    const code = compile(template);
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
          resolveComponent,
        } = MiniVue;
        return ${code} ;
      }`
    );
  }

  console.log("组件的render");

  // 执行render函数
  /* 通过effect默认执行代表mount，当变量发生改变时也会重新执行 */
  instance.patch = effect(
    () => {
      const preTree = instance.subTree;
      /* 生成vnode，存储在自身的subTree属性，作为旧tree */
      const subTree = (instance.subTree = normalizeVNode(
        Component.render(instance.ctx)
      ));

      console.log("patch执行了")

      // preTree存在，表示更新
      if (preTree) {
        // next存在，被动更新
        if (instance.next) {
          vnode = instance.next;
          instance.next = null;
          patchInsProps(instance, vnode);
          instance.ctx = {
            ...instance.props,
            ...instance.setupState,
          };
        }
      }

      // 当返回单根节点时，属性继承
      fallThrough(instance, subTree);
      /* 并不会造成递归，因为render函数生成vnode不再是Comp对象，生成的是div等vnode */
      patch(preTree, subTree, container, anchor);
      vnode.el = subTree.el;
    },
    {
      scheduler: scheduler, //trigger优先执行scheduler，并将传入的fn传入scheduler函数,
    }
  );
}

export function patchComponent(_vnode, vnode, container, anchor) {
  vnode.component = _vnode.component;
  vnode.component.next = vnode;
  vnode.component.patch();
}

export function unmountComponent(vnode) {
  unmount(vnode.component.subTree);
}
