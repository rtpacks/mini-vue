import { isString } from "../utils";
import { render } from "./renderer";
import { h } from "./vnode";

export function createApp(root) {
  const app = {
    mount(container) {
      if (isString(container)) {
        container = document.querySelector(container);
      }
      render(h(root), container);
    },
  };
  return app;
}
