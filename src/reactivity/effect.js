let activeEffect;

/**
 * 一个对象可以有多个属性
 * 一个属性可以在多个effect中使用
 * 一个effect可以同时使用多个不同的对象|对象属性
 *
 * 分析依赖关系，确定是对象|对象属性的变化导致effect，
 * 那么应该这样设计依赖关系结构
 * AMap：key为target，value为一个BMap 解释：区分不同对象的AMap
 * BMap：key为对象的不同属性，value为一个CSet 解释：区分一个对象的不同属性
 * CSet：存储effect 解释：存储所有依赖于某个对象的某个属性的effect，可以使用数组，但是需要进行去重，使用Set更合适
 * 注意：这些关系结构都是基于：对象|对象属性的变量导致effect的执行
 */
let targetMap = new WeakMap(); /* 区分不同的对象 */
let keyMap; /* 区分同一个对象的不同属性，不同targetMap元素生成不同的keyMap */
let effectSet; /* 存储所有依赖于某个对象的某个属性的effect */

let effectStack = [];

export function effect(fn, options = {}) {
  const effectFn = () => {
    let result;
    try {
      activeEffect =
        effectFn; /* 当前的函数会被标记，在reactive代理对象的get操作收集依赖时，activeEffect会被收集，此时的fn就是对应变量的依赖项 */
      effectStack.push(activeEffect);
      result = fn();
    } catch (error) {
      /* watchEffect默认调用，用户的函数可能出错，但是不能影响库代码 */
      console.error(error);
    } finally {
      activeEffect =
        undefined; /* 必须要重新置为null或者undefined，否则在进行判断收集使会出错 */
      // 为了解决嵌套的effect，需要从effectFns中弹出
      // effectStack.pop(); /* 已经被记录过了！ */
      // activeEffect = effectStack.length ? effectStack.pop() : undefined;
      effectStack.pop();
      /* 如果为0，length-1=-1不会报错，而是一个undefined，js数组越界不会报错，访问只会返回undefined */
      activeEffect = effectStack[effectStack.length - 1];
      return result;
    }
  };
  if (!options.lazy) {
    effectFn();
  }
  effectFn.scheduler = options.scheduler;
  return effectFn;
}

/* track 收集依赖 */
export function track(target, key) {
  /* 如果不存在activeEffect，返回即可 */
  if (!activeEffect) {
    return;
  }

  /* ================可以使用三元表达式====================== */

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map())); /* 另外一种写法 */
  }

  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }

  deps.add(activeEffect);
}

/* trigger 触发依赖 */
export function trigger(target, key) {
  /* 更新触发，取出targetMap中的target，keyMap中的effectSet */
  targetMap
    .get(target)
    ?.get(key)
    ?.forEach((effect) => {
      /* 如果有调度器，应该只调用调度器，其余的操作由调度器来完成。
        这是不同于watchEffect的逻辑，通过调用调度器来实现不立即更新，
        这是computed依赖的变量更新了，不是要依赖于computed的函数立即更新。
        scheduler通知_ditry变化，而后scheduler自身中再调用computed的trigger通知依赖自身的函数，
        达到computed的知道自身依赖的变量更新了，但是不马上计算，
        只有依赖于自身的函数使用了我，我才判断是否重新计算的功能
        如果依赖于computed的变量没有访问，那么computed就不会重新计算，
        因为计算的过程在get捕获中！只有访问了才能重新计算！ */
      effect.scheduler ? effect.scheduler(effect) : effect();
    });
}
