// function boxMullerTransform() {
//     let u = 0, v = 0;
//     while (u === 0) u = Math.random(); // 防止 u 为 0
//     while (v === 0) v = Math.random(); // 防止 v 为 0
//     return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
// }

// let randomNum = (boxMullerTransform() + 1) / 2; // 转换为 [0, 1) 范围内的随机数
// console.log(randomNum);
// export function 