暂时告一段落，模板解析与响应式reactivity、运行时runtime的关系并不大，compiler关键在于解析的各种细节，以及如何打上标识如patchFlag，静态提升等等，有时间完善。虚拟dom的比较diff是一个最长递增子序列的算法，vue的diff算法建立在react的diff之上，多增加了一些判断，即使没有diff，也是可以运行的，只是性能很差。

未完成部分

- 虚拟dom比较即diff
- 模板解析parse、transform、generate

已完成部分

- reactivity响应式，包括effect、track、trigger、reactive、ref、computed等
- runtime运行时，包括render、h、mount(Element、Text...)、patch等
