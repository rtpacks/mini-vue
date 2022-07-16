/* 无论是基本数据还是传入的函数，都是放入一个对象中存储，不同的是为了设计computed的缓存特性增加了lazy与scheduler调用
    lazy避免第一次运行，通过effect函数保存scheduler，最后在trigger中判断是否有调度器，
    如果有调度器调用调度器，否则才是调用传入的函数

    通过自身的属性_dirty判断自身的依赖是否更新
    通过get捕获中的track，捕获依赖自身的那些函数
    通过调度器调用时，进行触发依赖于自身的函数，注意：computed自身的依赖与依赖自身的变量是两个概念！
 */

import { isFunction } from "../utils";
import { effect, track, trigger } from "./effect";

class ComputedImpl {
  constructor(options) {
    this._setter = options.setter;
    this._value = undefined; /* 当前的值 */
    this._dirty = true; /* 表示computed依赖的变量有更新，不是依赖computed的函数！ */
    this.effect = effect(options.getter, {
      lazy: true,
      scheduler: () => {
        /* 调度器是为了满足缓存的特性而设计的！trigger只会调用调度器，通过调度器控制_ditry来更新，并且不会直接调用 */
        if (!this._dirty) {
          // 如果未更新不需要重新计算
          this._dirty = true; /* 当scheduler被调用时，表示的变量发生了更新，但是getter不会被调用，而是自身的value被引用即触发get操作时才会判断_dirty并决定是否重新计算 */
          trigger(
            this,
            "value"
          ); /* 通知依赖自身的函数更新，通过get捕获判断_dirty重新计算，注意和trigger函数中进行区分！ */
        }
      },
    }); /* 修改effect函数，如果传入了lazy初始默认不执行，如果传入了scheduler，则保存在自身上！ */
  }

  get value() {
    if (this._dirty) {
      // 通过判断自身依赖的变量是否发生了更新，从而确定自身是否更新
      this._dirty = false; // 重新计算后，将_dirty置为false
      this._value =
        this.effect(); /* 此时调用的函数是从effect函数中返回的，是getter操作被封装成一个effectFn，最后返回的 */
      track(this, "value"); /* 第一次默认进行会被收集依赖 */
    }
    return this._value;
  }

  set value(value) {
    /* 判断是否只读！ */
    this._setter(value)
  }
}

export function computed(getterOrOption) {
  let getter = () => {}
  let setter = () => {
    console.error("The computed is readonly！");
  };

  let options = isFunction(getterOrOption)
    ? { getter: getterOrOption, setter }
    : { getter: getterOrOption.getter || getter, setter: getterOrOption.set || setter };
  
  return new ComputedImpl(options)
}
