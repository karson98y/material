import{_ as r,c as o,o as h,ag as a,j as t,a as l,t as s}from"./chunks/framework.DPDPlp3K.js";const g=JSON.parse('{"title":"Vue2 响应式原理深度解析","description":"","frontmatter":{"outline":[2,3]},"headers":[],"relativePath":"vue/v2/defineProperty.md","filePath":"vue/v2/defineProperty.md","lastUpdated":null}'),d={name:"vue/v2/defineProperty.md"};function n(i,e,p,c,u,b){return h(),o("div",null,[e[3]||(e[3]=a("",32)),t("ul",null,[t("li",null,[e[1]||(e[1]=l("​流程： ")),t("ul",null,[e[0]||(e[0]=t("li",null,"渲染 Watcher 被激活 → Dep.target 指向该 Watcher。",-1)),t("li",null,"模板中使用的属性（如 "+s(i.count)+"）被访问 → 触发依赖收集。",1)])]),e[2]||(e[2]=t("li",null,[l("​结果： "),t("ul",null,[t("li",null,"属性 count 的 Dep 中记录了渲染 Watcher，后续修改 count 会触发视图更新。")])],-1))]),e[4]||(e[4]=a("",47))])}const W=r(d,[["render",n]]);export{g as __pageData,W as default};
