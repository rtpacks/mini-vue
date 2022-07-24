import { compile, parse } from "./compiler";
import { createApp, render, h, Text, Fragment, nextTick } from "./runtime";
import { reactive, ref, computed, effect } from "./reactivity";

export const MiniVue = (window.MiniVue = {
  createApp,
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
});

// console.log(
//   parse(`<div v-on="ok">
//   Hello World {{Hello}}
//   <div>Hello 
//     World
//      {{Hello}}</div>
// </div>`)
// );
