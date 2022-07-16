import { computed } from "./reactivity/computed";
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
const calc = window.calc = computed(() => {
  console.log("此时的 num * 2 =", num.value * 2);
  return num.value * 2;
})
// effect(() => {
//   console.log("此时的calc是：", calc.value) /* 当依赖了计算属性，此时计算属性就会被执行了！如果没有这个依赖，那么只有当调用calc
//   .value才会重新计算！这里因为是依赖于computed的函数会在scheduler中被触发，所以会访问get，最终看到的结果是首次computed也会被计算，
//   可以通过查看注意当前的effect，判断calc的计算！ */
// })

const abs = window.abs = computed({
  set(value) {
    num.value = value /* 可以成功设置！ */
    console.log("set num value = ", value) 
  }
})