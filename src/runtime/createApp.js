import { camelize, capitalize, isString } from "../utils";
import { render } from "./renderer";
import { h } from "./vnode";

let components = {};
export function createApp(root) {
  components = root.components || {};
  const app = {
    mount(container) {
      if (isString(container)) {
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

      render(h(root), container);
    },
  };
  return app;
}

export function resolveComponent(name) {
  return (
    components[name] ||
    components[camelize(name)] ||
    components[capitalize(camelize(name))]
  );
}
