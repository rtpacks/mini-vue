import { compile, parse } from "./compiler";
import {
  createApp,
  resolveComponentName,
  render,
  h,
  Text,
  Fragment,
  nextTick,
  renderList,
} from "./runtime";
import { reactive, ref, computed, effect } from "./reactivity";

export const MiniVue = (window.MiniVue = {
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
  resolveComponentName,
});

// console.log(
//   parse(`<div v-on="ok">
//   Hello World {{Hello}}
//   <div>Hello
//     World
//      {{Hello}}</div>
// </div>`)
// );
