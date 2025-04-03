# vue2 有哪些弊端，为此有哪些改进？

## 核心架构弊端

**1、响应式系统的局限性**
  - 问题：`基于 Object.defineProperty 的实现`
    - 无法检测对象属性的添加/删除
    - 数组变异方法需要特殊处理
    - 初始化时递归遍历对象性能消耗大
  - 改进方案: 
    - Vue3：改用 Proxy 实现响应式
    - 临时方案：使用 Vue.set/Vue.delete

 **2、虚拟 DOM 性能瓶颈**
  - 问题:
    - 全量对比虚拟 DOM
    - 组件级别颗粒度较粗
  - 改进方案：
    - Vue3：引入编译时优化（Patch Flags）动态节点
    - 优化手段：合理使用 key，避免 v-if/v-for 共用


 ## 开发体验问题
 **1、逻辑复用困难**
  - 问题：Mixins 存在命名冲突
    - 命名冲突：多个 Mixins 可能定义相同的 data、methods 或生命周期钩子，导致覆盖。
    - 隐式依赖：难以追踪属性和方法的来源。
    - 全局污染：所有混入内容都会注入到组件中，即使未使用。
  - 改进方案：
    - Vue3：Composition API
    - Vue2：使用 Renderless Components（无渲染组件） 或 Scoped Slots（作用域插槽）
      - Renderless Components 只管理逻辑（无模板），通过 ​Scoped Slots 将数据和方法暴露给子组件。
子组件通过插槽按需使用，避免命名污染。

**定义 Renderless 组件**
```js
// Renderless 组件（无模板）
export default {
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  render() {
    // 通过 scoped slot 暴露数据和方法
    return this.$scopedSlots.default({
      count: this.count,
      increment: this.increment
    });
  }
};
```
**在父组件中使用**
```js
<template>
  <counter-logic v-slot="{ count, increment }">
    <!-- 按需使用，命名完全可控 -->
    <button @click="increment">点击增加: {{ count }}</button>
  </counter-logic>
</template>

<script>
import CounterLogic from "./CounterLogic.vue";
export default {
  components: { CounterLogic }
};
</script>
```

**何时选择 Renderless 组件？**

- 需要复用复杂逻辑​（如表单验证、异步请求）。
- 多个组件共享相同逻辑但 UI 不同。
- 项目较大，需避免命名冲突。


**何时仍用 Mixins？**

- 简单工具方法（如 formatDate）。
- 小型项目，逻辑简单且无命名冲突风险。

**总结**

通过 ​Renderless Components + Scoped Slots，你可以将 Vue 2 的逻辑复用从 Mixins 的“隐式共享”转变为“显式传递”，彻底解决命名冲突问题，同时提升代码可维护性。这一模式也是 Vue 3 ​Composition API 的设计前身，迁移到 Vue 3 时会更加顺畅。

 ## 工程化问题

**1、体积较大**
  - 问题:
    - 包含所有功能的全量包较大（~20KB gzipped）
    - 按需加载支持有限
  - 改进方案：
    - Vue3：更好的 Tree-shaking
    - Vue2：使用 babel-plugin-import 部分导入

