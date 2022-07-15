import { effect } from "./reactivity/effect";
import { reactive } from "./reactivity/reactive";
import { ref } from "./reactivity/ref";

const manager = (window.manager = reactive({
  position: "manager",
  name: "张三",
  age: 18,
}));

const developer = (window.developer = reactive({
  position: "developer",
  name: "赵六",
  age: 24,
}));

const arr = (window.arr = reactive(["zs", "li", "wu"]));

// effect(() => {
//   console.log("developer", developer.age)
// })
// effect(() => {
//   console.log("manager", manager.name)
// })
// effect(() => { /* vue官方也没有实现此功能：单纯的使用某一个对象并没有使用对象的属性，此时这个effect不会生效！ */
//   console.log(`developer=${developer}, manager=${manager}`)
// })
// effect(() => {
//   console.log("arr[5] = ", arr[5])
// })
// effect(()=>{
//   console.log("arr.length = ", arr.length)
// })
// effect(() => {
//   effect(() => {
//     console.log("arr[1] = ", arr[1])
//   })
//   console.log("arr[3] = ", arr[3])
// })

const num = (window.num = ref(1));
const rarr = (window.rarr = ref([1, 2, 2]));
const obj = window.obj = ref({
  name: "张三",
  age: 18
})

effect(() => {
  console.log("此时的 num =", num.value); /* 之所以要使用.value的原因就是因为用一个对象来保存基本数据类型了！ */
});
effect(() => {
  console.log("使用ref定义对象类型：rarr[1]=", rarr.value[1]);
});
effect(() => {
  console.log("此时obj.name = ", obj.value.name)
})
effect(() => {
  console.log("此时obj.age = ", obj.value.age)
})