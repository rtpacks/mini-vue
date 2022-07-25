暂时告一段落，模板解析compiler与响应式reactivity、运行时runtime的关系并不大，compiler关键在于解析的各种细节，以及如何打上标识如patchFlag，静态提升等等，有时间完善。

diff是一个最长递增子序列的算法，vue的diff算法建立在react的diff之上，多增加了一些判断。即使没有diff，也是可以运行的，只是性能很差。

compiler、reactivity、runtime的基本功能都可以实现，但是目前还是有许多bug，如reactive对于多层对象 | 数组的依赖收集不完善，必须要将Proxy代理的对象的属性的地址更新才能够正常的响应，而vue3可以通过push一个元素数组就可以达到响应。

未完成部分

- 虚拟dom比较即diff

已完成部分

- reactivity响应式，包括effect、track、trigger、reactive、ref、computed等
- runtime运行时，包括render、h、mount(Element、Text...)、patch、resolveElementVNode等
- compiler
  - 模板解析parse
  - transform、generate生成h函数代码片段，即VNode树，使用with改变作用域

### 注意

尽管VNode有很多种类型，但真实DOM几乎都是标签节点、文本节点两种，通过createElement、createTextNode两个API创建。卸载真实DOM时，虽然不同的VNode对应不同的unmount，但是最终都是通过removeChild来实现。

### 标记

生成h函数时，判断props与children的代码，将小范围置前，大范围置后，优化代码

```js
if (props === "null" && children === "[]") {
  return `h(${tag})`;
}
if (children === "[]") {
  // 此时props不可能为 null
  return `h(${tag}, ${props})`;
}
return `h(${tag}, ${props}, ${children})`; // props可能为null，符合正常逻辑
```

### 节流

vue中的调度器实现是一个节流的过程，但是因为jobs是可变的，看起来又有点像防抖的过程。防抖节流不重要，重要的是理解这种设计。

```js
/**
 * scheduler是一个类似节流的过程，
 * 但同时jobs是可变的，又有类似防抖的过程，
 * 如果执行一个job就删除一个job，那么就是一个节流的过程
 */
let jobs = [];

export function scheduler(job) {
  // 如果队列不包含相同的job，进行push
  if (!jobs.includes(job)) {
    jobs.push(job);
    flushJobs(); /* 类似节流函数 */
  }
}

let isFlushing = false;
const RESOLVED = Promise.resolve();
let curr = null;
function flushJobs() {
  if (!isFlushing) {
    isFlushing = true; /* 在刷新job的过程中，可能还会有push过程 */
    curr = RESOLVED.then(() => {
      /* 将render函数放入到微任务队列中，也就是一个类似节流的过程 */
      jobs.forEach((job) => job());
    })
      .catch(console.log)
      .finally(() => {
        isFlushing = false;
        jobs = []; /* 清空 */
      });
  }
}
```

### 踩坑记录

- 不同类型的组件，卸载旧组件后挂载新组件，而不是继续patch！因为与别人的流程不一致，需要自己想清楚流程规划。

```js
  if (!isSameVNodeType(_vnode, vnode)) {
    // 类型不同，卸载旧vnode，需要更新锚位置，即新vnode插入的位置
    // anchor = _vnode.anchor || _vnode.el.nextSibling;
    anchor = _vnode.el.nextSibling || _vnode.anchor;
    unmount(_vnode);
    mount(vnode, container, anchor);
    _vnode = null; // 不放在unmount中，vnode可能还会复用，但类型不同肯定不复用
    return;
  }
```

- v-if 、v-else 相邻

vue的v-if/v-else必须要相邻，否则else指令不生效。当然可以改造成不相邻的形式，但是实现会比较复杂，思路是：在遍历children中，如果找到if指令，那么拿到parent节点，parent.children继续往下找，直到找到else指令或者children结束，并且每遍历一个child就需要children原地删除一个，否则会形成重复遍历。
