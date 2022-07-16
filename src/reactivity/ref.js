import { hasChanged, isObject } from "../utils";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  constructor(value) {
    this._isRef = true;
    /* 用私有属性来实现功能，通过简便的写法，即get value() set value()即可完成相应的get set捕获！ */
    // 如果是一个对象，则用reactive来实现
    // 无论是基本数据类型还是引用数据类型，最终都是存储在一个对象的_value属性中的
    this._value = convert(value); /* 需要用convert来转换，否则引用类型的数据无法捕获！ */
  }

  /* vue3中实现基本数据类型的响应还是Object.definedProperty，注意是基本数据类型！ */
  get value() {
    track(this, 'value')
    return this._value /* 注意：此时返回的是私有属性的值！ */
  }
  set value(value) { /* 注意：使用ref包装的对象特别注意没有引用对象属性，不会被加入依赖的！
    reactive函数同样也是如此，必须要使用对象的某一个属性，单纯使用对象不使用某个对象的属性是不会加入依赖的！而ref一定要使用.value取出才能够获得响应式！*/
    if (!hasChanged(this._value, value)) {
      return ;
    }
    this._value = convert(value) /* 此时也需要转换，如果传入的数据一个引用类型的数据，那么就需要转换一下！ */
    trigger(this, 'value') 
  }
}

/* ref函数用于记忆基本数据类型，引用数据类型都交给reactive函数 */
/* 因为基本数据类型存储在栈上，所以难以判断是否为同一个对象，用一个对象实现存储，和reactive一样。 */
export function ref(value) {
  if (isRef(value)) {
    return value;
  }
  return new RefImpl(value); /* 用一个对象来存储，因为基本数据类型不能在同一个内存地址上，
  所以在判断是否为同一个变量时应该使用一个对象来存储这些基本数据类型的变量，以方便进行比较是否为同一个变量对象 */
}

/* ref函数的实现喝reactive函数实现类似，包括特殊的功能等！ */
export function isRef(value) {
  return !!(value && value._isRef);
}

export function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
