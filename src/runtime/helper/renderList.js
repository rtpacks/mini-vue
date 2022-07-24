// 编译目标
// h(
//   Fragment,
//   null,
//   renderList(items, (item, index) => h('div', null, item + index))
// );

import { isArray, isNumber, isObject, isString } from "../../utils";

export function renderList(sources, renderItem) {
  // v-for可能存在的形式
  // Array，Object，String，Number
  if (
    isArray(sources) ||
    (isString(sources) && (sources = sources.split("")))
  ) {
    return sources.map((source, index) => renderItem(source, index));
  }

  let nodes = [];
  if (isNumber(sources)) {
    // const arr = Array.from({ length: sources }, (v, i) => i + 1);
    for (let i = 0; i < sources; i++) {
      nodes.push(renderItem(i + 1, i));
    }
    return nodes;
  }

  if (isObject(sources)) {
    // for in, for of, Object.keys
    return Object.keys(sources).map((key, index) =>
      renderItem(sources[key], key, index)
    );
  }
}
