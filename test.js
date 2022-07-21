const str = "hello";

switch (typeof str) {
  case "number" | "string":
    console.log("可以组合！");
    break;
  default:
    console.log("不可以组合，错误的写法");
}

const obj = {1:1,2:2,3:2,4:4}
for (const key in obj) {
  console.log(key, obj[key])
}

console.log([1,2,3,4].slice(1))
