import { render, h, Fragment, Text } from "./runtime";

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
render(
  h("ul", null, [
    h("li", { style: { color: "red" } }, 1),
    h("li", null, 2),
    h("li", { style: { "background-color": "blue" } }, 3),
    h(Fragment, null, []),
    h("li", null, [h(Text, null, "Hello World")]),
  ]),
  document.body
);

setTimeout(() => {
  render(
    h("ul", null, [
      /* 1，2，3都不重新创建dom元素，3修改属性 */
      h("li", { style: { color: "red" } }, 1),
      h("li", null, 2),
      h("li", { style: { "background-color": "red" } }, 3),
      /* 由于新增了元素，所以会被创建并添加，注意ul的子元素长度是一样的，Fragment只会和Fragment对比，不会和Hello World最后一个li对比 */
      h(Fragment, null, [h("li", null, 4), h("li", null, 5)]),
      /* 不会重新创建元素，只会修改内容，所以造成的结果就是在原有的位置修改元素，而添加的4，5就在后面，因为这个你好世界所在的元素并未修改位置，只是修改内部的内容 */
      // 这种Fragment情况可以通过 anchor定位锚 + insertBefore API来解决，思想就是在插入之前确定位置
      h("li", null, [h(Text, null, "你好 世界")]),
    ]),
    document.body
  );
}, 2000);
