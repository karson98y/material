# Vue2 响应式原理深度解析
核心思想：自动追踪变化并更新

## 1、Vue2是如何通过Object.defineProperty实现数据劫持的？
> 请描述基本实现思路和关键代码结构

答：Vue2 使用 `Object.defineProperty` 对数据对象的每个属性进行劫持。核心思路是通过递归遍历 data 对象的所有属性，将其转换为 getter/setter。

```js
// 简化版数据劫持
function makeReactive(obj, key) {
  const dep = new Dep() // 每个属性对应一个Dep实例
  let value = obj[key]

  Object.defineProperty(obj, key, {
    get(){
      if(dep.target) {
        dep.depend(dep.target) // Watcher触发getter时收集依赖
      }
      return value
    },
    set(newValue) {
      if(newValue !== value) {
        value = newValue
        dep.notify() // 数据变化时通知更新
      }
    }
  })
}

// 原始数据
data: {
  count: 0
}

// Vue内部转换后
{
  count: {
    __ob__: { dep: new Dep() },  // 每个属性都有对应的Dep
    get: function reactiveGetter() { /*...*/ },
    set: function reactiveSetter(newVal) { /*...*/ }
  }
}

```
## 2、什么是依赖收集？Watcher和Dep的关系是怎样的？

答： 在 getter 中通过 Dep.depend() 收集`当前正在计算的 Watcher（如组件渲染函数、计算属性等）`，建立`数据与视图`的依赖关系。
> 只有模板/渲染函数/computed中的访问才会收集

### 当前正在计算的 watcher 解析
虽然每个组件只有一个渲染Watcher，但还存在其他类型的Watcher：

| Watcher类型       | 用途               | 数量规则               |
|-------------------|--------------------|------------------------|
| 渲染Watcher       | 组件模板渲染       | 每个组件1个            |
| 计算属性Watcher   | computed属性       | 每个计算属性1个        |
| 用户Watcher       | $watch或watch选项  | 每个监听器1个          |

### Watcher和Dep的关系是怎样的？
Dep（依赖管理器）​ 和 ​Watcher（观察者）​ 是 ​发布-订阅模式 的具体实现：

- ​Dep 负责 ​收集和管理依赖​（谁在用这个数据）。
- Watcher 负责 ​执行更新​（数据变了要做什么）。

关系本质：
- 一个 Dep 对于一个响应式的属性 （如 this.count 有一个专属的 countDep）。
- 一个 Watcher 可以对应 多个 Dep （如组件用了 count 和 name，它的 Watcher 会订阅 countDep 和 nameDep）。
- 一个 Dep 可以通知多个 Watcher​ （如多个组件都用到了 count，countDep 会通知所有相关 Watcher）。

**类比生活例子：**

Dep 是报社，维护一份订阅名单（subs）。

​Watcher 是读者：
- 读者可以订阅多家报社（一个 Watcher 依赖多个 Dep）。
- 报社可以服务多个读者（一个 Dep 通知多个 Watcher）。
​数据更新是出新报纸：报社只通知订阅了自己报纸的读者。

**为什么要双向记录？**

- Dep → Watcher​（subs）：数据变化时，知道要通知谁。
- Watcher → Dep​（deps）：组件销毁时，Watcher 能主动从所有 Dep 的订阅列表中移除自己（避免内存泄漏）。

**注意事项：**
- ​每个组件只有一个渲染 Watcher​（负责整个模板的更新），​没有其他​。
- ​模板中的属性更新时，Dep 会通知该组件的 ​渲染 Watcher，触发 ​整个组件的重新渲染​（但通过虚拟 DOM diff 优化，最终只更新变化的 DOM 节点）。


## 3、`Vue.$set` 处理对象变成响应式背后的原理

答：获取当前对象的 Observer 实例，调用 defineReactive 转换成响应式，创建新的Dep实例， 通过 observer 实例下的 Dep，手动触发依赖通知

- 若目标为响应式对象，则调用 defineReactive 将新属性转换为响应式
- 手动触发依赖更新：dep.notify()

### Observer实例解释：
负责将普通 JavaScript 对象转换为响应式对象, 给当前对象本身创建一个dep，将Observer实例挂载到当前对象的__ob__属性上，遍历对象属性，转为响应式

**Observer 是一个类，其主要职责是：**

- ​遍历对象属性，将它们转换为响应式属性（通过 Object.defineProperty）
- ​管理对象的依赖收集，通过关联的 Dep 实例
- ​处理数组的特殊情况，拦截数组变异方法

**Observer 创建条件**

1、纯对象
- 通过 {} 或 new Object() 创建的对象
- 使用 Object.create(null) 创建的对象

2、数组
- 包括空数组和包含各种元素的数组


**Observer 核心总结**
- ​建立响应式桥梁：通过 Object.defineProperty 将普通属性转换为响应式属性
- 管理依赖收集：通过关联的 Dep 实例管理对象层级的依赖
- 处理特殊场景：对数组进行特殊处理，重写变异方法
- 提供扩展能力：通过 __ob__ 暴露给外部 API（如 Vue.set）


## 4、请描述Observer类、Dep类、Watcher类三者之间的协作关系

**三者协作关系：**
- Observer：`将普通对象/数组转换为响应式对象`
  - 递归遍历对象属性，使用 Object.defineProperty 添加 getter/setter。
  - 为每个对象/数组创建关联的 Dep 实例（通过 __ob__ 属性）。
  - 重写数组的变异方法（push/pop 等）
- Dep：`管理依赖（收集和通知）` 作为发布者，管理所有 Watcher 依赖。
  - 每个响应式属性对应一个 Dep。
  - 维护订阅者列表（subs: Watcher[]）
  - 提供依赖收集（depend）和派发更新（notify）接口
- Watcher：`执行更新操作`
  - 分为渲染 Watcher、计算属性 Watcher 和用户 Watcher （$watch API 或 watch）
  - 在 getter 中收集依赖
  - 收到更新通知后执行回调（渲染/计算/监听回调）
  - 作为订阅者，在初始化（如组件渲染）时触发 getter，将自身（Dep.target）推入 Dep 的订阅队列。数据变化时，Dep 通知 Watcher 执行更新

**协作流程全解析：**

- 阶段一：`初始化响应式数据`
  - Observer 初始化：
    - 遍历 data 对象，为每个属性创建闭包中的 Dep 实例
    - 使用 Object.defineProperty 定义响应式 getter/setter
  - Watcher 创建：
    - 组件初始化时创建渲染 Watcher
    - 计算属性和 $watch 创建各自的 Watcher
- 阶段二：`阶段2：依赖收集过程`
  - Watcher 开始收集：
    - 设置 Dep.target = 当前Watcher
    - 执行求值函数（如渲染函数）
  - 属性访问触发 getter：
    - 在 getter 中调用 dep.depend()
    - 通过 Dep.target 建立双向依赖关系
  - 依赖关系建立：
    ```js 
     // Dep 中
      depend() {
        if (Dep.target) {
          Dep.target.addDep(this) // Watcher 记录 Dep
        }
      }
      // Watcher 中
      addDep(dep) {
        this.deps.push(dep)      // Watcher 记住自己依赖了哪些 Dep
        dep.addSub(this)         // Dep 记住哪些 Watcher 依赖自己
      }
    ```
- 阶段3：`数据更新派发`
  - 数据变更触发 setter：
    - 检查新值是否变化
    - 调用 dep.notify()
  - Dep 通知更新：
    ```js
      notify() {
        const subs = this.subs.slice()
        for (let i = 0; i < subs.length; i++) {
          subs[i].update() // 通知所有订阅者
        }
      }
    ```
  - Watcher 更新策略：
    - 同步 Watcher：立即执行
    - 异步 Watcher：推入队列，nextTick 批量执行



## 5、Vue2的异步更新队列如何工作？

Vue 将数据变更触发的 Watcher 更新存入队列（queueWatcher），通过 nextTick 延迟执行批处理，避免重复计算。

- 设计目标
   - 批量更新： `合并同一事件循环中的所有数据变更进行批量更新`
   - 避免重复渲染：防止频繁数据变更导致的无效渲染
   - 保证更新顺序：确保组件更新按父→子的合理顺序执行
   - 性能优化：利用微任务减少UI线程阻塞
- 异步更新优势
  - 连续多次修改，只会触发一次更新


## 6、nextTick的实现原理是什么？

- 收集所有修改内容，但不会立即更新
- 把更新任务放进一个"待办事项列表"
- 安排一个最快的调度去执行 `选择一个最快的送货方式`
  - 首选快递（微任务）​：Promise.then （外卖小哥）
  - 备选快递（微任务）​：MutationObserve (同城快递)
  - 普通快递（宏任务）​：setTimeout (邮政快递)


**nextTick执行时机**

在当前同步代码执行完后，在所有微任务之前，DOM已经更新完成
- 与Promise的区别：nextTick回调比Promise.then更早执行
- 与setTimeout的区别：比所有宏任务都早执行

## 7、vue2 有哪些弊端，为此有哪些改进？

### 核心架构弊端

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


 ### 开发体验问题
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

 ### 三、工程化问题

**1、体积较大**
  - 问题:
    - 包含所有功能的全量包较大（~20KB gzipped）
    - 按需加载支持有限
  - 改进方案：
    - Vue3：更好的 Tree-shaking
    - Vue2：使用 babel-plugin-import 部分导入


## 核心记忆锚点

**响应式核心三要素**
 - [数据劫持] → Observer 递归包装对象属性为 getter/setter  
 - [依赖管理] → Dep 作为订阅中心，每个属性对应一个 Dep 实例  
 - [更新触发] → Watcher 作为订阅者，连接数据变化与具体操作（如渲染）

**数据变化到视图更新的完整链路**

`setter` → `dep.notify()` → `watcher.update()` → `queueWatcher()` → `nextTick(flushSchedulerQueue)` → `flushSchedulerQueue` → `watcher.run()` → `组件渲染` → `patch()`

- 假设修改数据 this.data.a = 1：
- 触发 data.a 的 setter
- dep.notify() 通知所有依赖此属性的 Watcher
- 每个 Watcher 调用 update() → 进入 queueWatcher() `临时容器 ,当前待更新的 Watcher 队列管理器,像一个 任务收件箱，临时存放所有需要处理的通知（Watcher），并统一安排处理时间。`
- queueWatcher() 将 Watcher 加入队列，并调用 nextTick(flushSchedulerQueue)
- 当前事件循环结束，执行微任务（如 Promise.then）
- 执行 flushSchedulerQueue：排序并执行所有 Watcher 的 run() `flushSchedulerQueue 队列的 调度执行器, 立即执行的队列, 像一个 任务处理器，从收件箱（queue）中取出任务，按规则排序后批量执行。`
- 渲染 Watcher 的 run() → 重新渲染组件 → 生成新 VNode → 调用 patch()`差异对比器（最小化更新真实 DOM）` 更新 DOM

**特殊场景处理**
- 对象：Vue.set 动态添加响应式属性
- 数组：原型链劫持 + 对 splice/push 等方法的包裹
- 异步队列：避免重复计算，合并同一事件循环内的数据变更

用流程图代替文字
```md
[Data Change]  
  → (触发setter)  
  → [Dep通知所有Watcher]  
  → (Watcher进入异步队列)  
  → [nextTick触发队列刷新]  
  → [渲染Watcher重新计算]  
  → [生成新VNode → patch DOM]
```

**高频易错点预判**

- 为什么不是深度优先收集依赖？
  - （Watcher 是在 getter 触发时动态收集的，天然是深度优先）

- 同一个数据被多个组件使用时，如何保证正确更新？
  - （每个组件实例有独立的渲染 Watcher，各自被对应 Dep 收集）


## 刻意练习建议
用 20 行代码实现迷你响应式系统（仅核心逻辑）：
```js
class Dep {
  constructor() { this.subs = new Set(); }
  depend() { Dep.target && this.subs.add(Dep.target); }
  notify() { this.subs.forEach(watcher => watcher.update()); }
}

function defineReactive(obj, key) {
  const dep = new Dep();
  let value = obj[key];
  Object.defineProperty(obj, key, {
    get() { dep.depend(); return value; },
    set(newVal) { value = newVal; dep.notify(); }
  });
}

class Watcher {
  constructor(getter) {
    this.getter = getter;
    this.get();
  }
  get() {
    Dep.target = this;
    this.getter();
    Dep.target = null;
  }
  update() { this.get(); }
}
```

用 Chrome 调试 Vue 的响应式过程：

- 在 node_modules/vue/dist/vue.js 中搜索 defineReactive 函数
- 在 getter/setter 和 dep.notify() 处打上断点
- 观察数据修改时的调用栈和变量变化

## 结束语

Vue2 的这些设计在当时是合理的权衡，但随着前端复杂度提升，Vue3 通过架构级的改进解决了这些痛点。对于新项目建议直接采用 Vue3，现有大型项目可逐步迁移。