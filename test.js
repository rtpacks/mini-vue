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

// slice 将截取的返回

const s = "    woshi   ";
console.log(s.match(/^([\t\r\n\f ])+/));

// console.log(s.substring(0, s.indexOf("w")))
console.log(s.slice(0, s.indexOf("w")));
console.log(s.slice(s.indexOf("w")));

const div = "<div> Hello </div>";
const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(div);
console.log(match);

/* () 和 , 表示运算符，特别是,逗号运算符，会返回后一个表达式 */
console.log((1, 2));
console.log((1, 2, 3, 4));
/* 对于中括号[]来说，也会有比较奇怪的时候，但是请记住：js的数组是对象！对象可以用[]取值 
第一个中括号表示数组对象，第二个中括号表示用key取值，[1][0]==1, [1][1]==undefined */

// [1,2,3,4]对象，[1,2]==[(1,2)]=[2]，所以[1,2,3,4][1,2]=[1,2,3,4][2]=3
console.log([1, 2, 3, 4][(1, 2)]); 

console.log([].map(child => "<>").join(','), "===")

console.log(/(\+\+|--|\+=|-=|\*=|\/=)?[\t ]*?$/.test('() i++ \n\n'))

console.log({} instanceof HTMLElement)