import { hasChanged, isArray, isObject } from "../utils";
import { track, trigger } from "./effect";

/**
 * 为了能够正确的收集依赖，传入的target对象必须要再包裹一层，
 * 因为只适用对象本身则无法触发get操作！再次包裹一层就能够触发外层的get
 *
 * 但是在尝试后发现：Vue官方也没有做这个处理
 */
class Target {
  constructor(target) {
    this.value = target;
  }
}

const proxyMap = new WeakMap();

// reactive建立了一个响应式对象，即Proxy对象，它一般与effect函数建立联系
export function reactive(target) {
  /* 如果不是一个对象，不代理即不做任何处理 */
  if (!isObject(target)) {
    return target;
  }

  /* 特殊情况一：嵌套使用reactive，只代理一次，reactive(reactive(obj))，给obj添加私有的属性_isReactive */
  if (!isReactive(target)) {
    target._isReactive = true;
  }

  /* 特殊情况二：多个依赖依赖于同一个对象，只生成一个代理对象，使用一个WeakMap来存储每一个代理对象 */
  if (proxyMap.has(target)) {
    return reactive.get(target);
  }

  /* 如果是一个对象，那么就返回一个代理对象 */
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      /* 特殊情况六：嵌套的effect，会导致外层的effect丢失！在effect函数中利用栈解决 */
      track(target, key);
      /* 特殊情况四：深层代理，在vue2中所有的对象都被代理了，但是vue3可以选择哪些被代理 */
      // return res;
      return isObject(res) ? reactive(reactive) : res;
    },
    set(target, key, value, receiver) {
      /* 特殊情况三：只有值变化了才更新，如果前后是相同的值，不进行更新 */
      if (!hasChanged(target[key], value))
        return true; /* 注意set需要返回true代表更新成功，否则报错！ */
      const flag = Reflect.set(target, key, value, receiver);
      
      /* 特殊情况五：数组的问题，数组长度的问题 数组的key需要手动触发 */
      if (isArray(target) && key === 'length' && hasChanged(target.length, value)) {
        trigger(target, "length"); /* 数组的key需要手动触发 */
      }
      
      trigger(target, key); /* 必须等对象更新完成后再触发 */
      return flag;
    },
  });

  proxyMap.set(target, proxy);

  return proxy;
}

export function isReactive(target) {
  return !!(target && target._isReactive);
}
