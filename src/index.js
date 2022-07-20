import { render, h, Fragment, Text } from "./runtime";

const vnode = h(
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
    h("ul", null, [
      h("li", { style: { color: "red" } }, 1),
      h("li", null, 2),
      h("li", { style: { 'background-color': "blue" } }, 3),
      h(Fragment, null, [h("li", null, 4), h("li", null, 5)]),
      h("li", null, [h(Text, null, "Hello World")]),
    ]),
  ]
);
render(vnode, document.body);