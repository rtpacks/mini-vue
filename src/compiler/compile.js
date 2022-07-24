import { generate } from "./codegen";
import { parse } from "./parse";

export function compile(template) {
  const ast = parse(template); // 解析模板得到ast
  const code = generate(ast); // 解析ast得到一段可执行的代码
  return code;
}
