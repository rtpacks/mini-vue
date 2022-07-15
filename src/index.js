import {effect} from './reactivity/effect'
import { reactive } from './reactivity/reactive'


const manager = window.manager = reactive({
  position: "manager",
  name: "张三",
  age: 18
})

const developer = window.developer = reactive({
  position: "developer",
  name: "赵六",
  age: 24
})

effect(() => {
  console.log("developer", developer.age)
})
effect(() => {
  console.log("manager", manager.name)
})
effect(() => {
  console.log(`developer=${developer}, manager=${manager}`)
})