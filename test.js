// const str = "hello";

// switch (typeof str) {
//   case "number" | "string":
//     console.log("可以组合！");
//     break;
//   default:
//     console.log("不可以组合，错误的写法");
// }

// const obj = { 1: 1, 2: 2, 3: 2, 4: 4 };
// for (const key in obj) {
//   console.log(key, obj[key]);
// }

// console.log([1, 2, 3, 4].slice(1));

// let hello = true;
// const RESOLVED = Promise.resolve();

// RESOLVED.then().finally(() => {
//   console.log("----");
//   hello = false;
// });

// RESOLVED.then(() => {
//   console.log("++++", hello);
//   hello = "Hello";
// });

// Promise.resolve()
//   .then(() => {
//     console.log(hello);
//   })
//   .finally(() => {
//     console.log(hello);
//   });

// let ans = 0
// let s = "6463375576651656565"
// s = "26376256545637532656"
// for (const d of s) {
//   ans += parseInt(d)
//   console.log(d);
// }
// console.log(ans / 20)


const s = "    woshi   "
console.log(s.match(/^([\t\r\n\f ])+/))

// console.log(s.substring(0, s.indexOf("w")))
console.log(s.slice(s.indexOf("w")))