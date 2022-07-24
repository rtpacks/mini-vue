暂时告一段落，模板解析与响应式reactivity、运行时runtime的关系并不大，compiler关键在于解析的各种细节，以及如何打上标识如patchFlag，静态提升等等，有时间完善。虚拟dom的比较diff是一个最长递增子序列的算法，vue的diff算法建立在react的diff之上，多增加了一些判断，即使没有diff，也是可以运行的，只是性能很差。

未完成部分

- 虚拟dom比较即diff

已完成部分

- reactivity响应式，包括effect、track、trigger、reactive、ref、computed等
- runtime运行时，包括render、h、mount(Element、Text...)、patch等
- compiler
  - 模板解析parse
  - transform、generate生成h函数代码片段，即VNode树

### 注意

支持多个根节点，vue3的特性

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
