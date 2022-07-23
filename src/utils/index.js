export function isObject(target) {
  return typeof target === "object" && target !== null;
}

export function isFunction(getter) {
  return typeof getter === "function";
}

export function isArray(target) {
  return Array.isArray(target);
}

export function isString(target) {
  return typeof target === "string";
}

export function isNumber(target) {
  return typeof target === "number";
}

export function hasChanged(origin, current) {
  return origin !== current && !Number.isNaN(origin) && !Number.isNaN(current);
}

export function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : " "));
}

const HTML_TAGS =
  "html,body,base,head,link,meta,style,title,address,article,aside,footer," +
  "header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption," +
  "figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code," +
  "data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup," +
  "time,u,var,wbr,area,audio,map,track,video,embed,object,param,source," +
  "canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td," +
  "th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup," +
  "option,output,progress,select,textarea,details,dialog,menu," +
  "summary,template,blockquote,iframe,tfoot";

const VOID_TAGS =
  "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";

function makeMap(str) {
  const map = str
    .split(",")
    // 逗号运算符会返回后一个的表达式，如(,map)返回map，(1,2,3,alert)("世界你好")可以成功调用alert！
    .reduce((map, item) => ((map[item] = true), map), Object.create(null));
  return (val) => !!map[val];
}

export const isVoidTag = makeMap(VOID_TAGS);
export const isNativeTag = makeMap(HTML_TAGS);
