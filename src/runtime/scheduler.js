// 调度的出现是为了性能的提高，即通过合并相同的操作，只执行一次渲染，这样就可以提高性能，调度的实现和计算属性的实现是很类似的
/**
 * scheduler是一个类似节流的过程，
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

export function nextTick(fn) {
  return curr /* 如果队列中存在任务，那么需要使用当前的promise，如果不存在则使用RESOLVED */
    ? curr.then(fn).finally(() => {
        curr = null;
      })
    : RESOLVED.then(fn);
}
