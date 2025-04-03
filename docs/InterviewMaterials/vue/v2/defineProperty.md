---
outline: [2,3]
---
# Vue2 响应式原理深度解析

## 1、Observer 类详解

### 定义
- 当 Vue 初始化data数据属性的时候，发现存在`对象，数组`的数据会进行创建一个 Observer 实例。这个实例会递归遍历数据的所有属性，将它们转换为 ​响应式属性。
- ​每个对象/数组对应一个 Observer 实例：通过 __ob__ 属性关联，确保数据变化的追踪。

### 作用
管理依赖、处理数据变化的通知、递归观察子属性。

`1、​管理依赖（Dep）​​`
- 每个 Observer 实例内部有一个 dep 属性（对应一个 Dep 实例），用于收集依赖该对象/数组整体变化的 Watcher。
- 管理对象/数组自身的依赖，支持整体替换（obj 的 __ob__.dep 会通知依赖更新，触发视图重新渲染。）和数组变异的更新。

`2、数组的特殊处理（处理数据变化的通知）`
- 重写数组的变异方法，确保数组操作能触发更新。
- 数组的变异方法（如 push）会调用 __ob__.dep.notify()，通知所有依赖该数组的 Watcher。

`3、 递归处理嵌套对象/数组`
- 如果对象的属性值是一个嵌套对象或数组，Observer 会递归地为子对象也创建一个 Observer 实例，确保深层数据也是响应式的。

### 性能优化设计

- 避免重复观察：
如果对象已被观察（已有 __ob__ 属性），则直接复用现有 Observer 实例，避免重复递归。
- 跳过 VNode 对象：
如果数据是 VNode 实例（虚拟节点），则跳过观察（避免不必要的响应式开销）。

## 2、defineProperty 数据劫持

- 通过递归遍历 data 对象的所有属性，Object.defineProperty 为对象的每个属性定义 getter/setter
- 如果属性值是对象或数组，递归调用 Observer，确保深层数据也被劫持。

## 3、dep 依赖收集

答： 在 getter 中通过 Dep.depend() 收集`当前正在计算的 Watcher（如组件渲染函数、计算属性等）`，建立`数据与视图`的依赖关系。
> 只有模板/渲染函数/computed中的访问才会收集

### 依赖收集的触发条件
只有当 ​当前有活跃的 Watcher（即 Dep.target 存在）​ 且该 Watcher ​尚未收集过该属性的 Dep 时，访问属性才会触发依赖收集。

当 Vue 执行以下操作时，会创建并激活一个 Watcher（例如组件渲染、计算属性求值、侦听器回调等）：
- 组件首次渲染或更新（渲染 Watcher）。
- 计算属性被访问（计算属性 Watcher）。
- 手动调用 $watch 或 watch 选项（侦听器 Watcher）。

​全局变量 Dep.target：
- Vue 通过 Dep.target 标记当前活跃的 Watcher。只有在 Watcher 执行期间，Dep.target 才会指向该 Watcher。

### 何时不会触发依赖收集？
没有活跃的 Watcher

- 例如：在普通方法中访问数据（如 this.count），此时 Dep.target 为 null
- 示例：
```js
methods: {
  increment() {
    console.log(this.count); // 不会触发依赖收集
  }
}
```
- Watcher 已收集过该 Dep
  - Watcher 会记录自己订阅的所有 Dep（通过 watcher.deps），避免重复收集。
- 非响应式数据
  - 未被 Observer 处理的数据（如未在 data 中声明的动态属性）不会触发依赖收集。

### 依赖收集的典型场景
1. 组件渲染时
  - ​流程：
    - 渲染 Watcher 被激活 → Dep.target 指向该 Watcher。
    - 模板中使用的属性（如 {{ count }}）被访问 → 触发依赖收集。
  - ​结果：
    - 属性 count 的 Dep 中记录了渲染 Watcher，后续修改 count 会触发视图更新。

​2. 计算属性求值时
  - ​流程：
    - 计算属性 Watcher 被激活 → Dep.target 指向该 Watcher。
    - 计算属性的计算函数访问响应式数据（如 return this.count + 1） → 触发依赖收集。
  - ​结果：
    - 属性 count 的 Dep 中记录了计算属性 Watcher，后续修改 count 会触发计算属性重新计算。
​3. 侦听器初始化时
  - ​流程：
    - 侦听器 Watcher 被激活 → Dep.target 指向该 Watcher。
    - 侦听的属性（如 watch: { count() {} }）被访问 → 触发依赖收集。
  - ​结果:
    - 属性 count 的 Dep 中记录了侦听器 Watcher，后续修改 count 会触发回调执行。
## 4、 Watcher 派发更新

### 核心作用
​依赖收集
 - 在初始化或更新阶段，Watcher 会访问响应式数据，触发数据的 getter，从而将自身（通过 Dep.target）收集到数据的依赖列表（Dep）中。

​派发更新
  - 当数据变化时，Dep 会通知所有订阅的 Watcher，触发其更新逻辑（如重新渲染组件）。

​管理异步更新
  - Watcher 的更新默认是异步的（通过队列批量处理），避免重复计算和渲染。

### 类型对比

| 类型                | 作用                          | 创建时机                         | 特点                                                                 |
|---------------------|-------------------------------|----------------------------------|----------------------------------------------------------------------|
| ​**渲染 Watcher**     | 负责组件的渲染                 | 组件挂载时 (`mountComponent`)    | 唯一性（每个组件一个）                                                |
| ​**计算属性 Watcher** | 处理计算属性的缓存逻辑         | 计算属性初始化时 (`initComputed`) | 惰性求值（`lazy: true`），依赖变化后标记为脏值，下次访问时重新计算       |
| ​**侦听器 Watcher**   | 执行用户定义的 `watch` 回调    | `$watch` 调用或 `watch` 选项解析 | 支持配置项：<br>- `immediate`（立即执行）<br>- `deep`（深度监听）<br>- `sync`（同步更新） |


## 5、 Watcher和Dep的关系是怎样的？
Dep（依赖管理器）​ 和 ​Watcher（观察者）​ 是 ​发布-订阅模式 的具体实现：

- ​Dep 负责 ​收集和管理依赖​（谁在用这个数据）。
- Watcher 负责 ​执行更新​（数据变了要做什么）。

关系本质：
- 一个 Dep 对于一个响应式的属性 （如 this.count 有一个专属的 countDep）。
- 一个 Watcher 可以对应 多个 Dep （如组件用了 count 和 name，它的 Watcher 会订阅 countDep 和 nameDep）。
- 一个 Dep 可以通知多个 Watcher​ （如多个组件都用到了 count，countDep 会通知所有相关 Watcher）。

**为什么要双向记录？**

- Dep → Watcher​（subs）：数据变化时，知道要通知谁。
- Watcher → Dep​（deps）：组件销毁时，Watcher 能主动从所有 Dep 的订阅列表中移除自己（避免内存泄漏）。

**注意事项：**
- ​每个组件只有一个渲染 Watcher​（负责整个模板的更新），​没有其他​。
- ​模板中的属性更新时，Dep 会通知该组件的 ​渲染 Watcher，触发 ​整个组件的重新渲染​（但通过虚拟 DOM diff 优化，最终只更新变化的 DOM 节点）。



## 6、Observer类、Dep类、Watcher类三者之间的协作关系

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

## 7、 面试回答模版

### 1. 核心机制
Vue 2 的响应式是通过 Object.defineProperty 递归劫持数据对象的属性，结合 发布-订阅模式 实现。具体分为 数据劫持、依赖收集、派发更新 三个阶段。

### 2. 关键流程

数据劫持

- 初始化时递归遍历 data，用 defineProperty 将每个属性转为 getter/setter
- 数组特殊处理：重写 push/pop 等7个变更方法（因为 defineProperty 无法监听数组索引变化）

依赖收集（Getter）

- 渲染时触发属性的 getter，当前组件的 Watcher 会被记录到对应属性的 Dep（依赖管理器）中
- 通过 Dep.target 静态属性动态管理依赖（避免全局污染）

派发更新（Setter）

- 数据修改触发 setter，通知 Dep 中的所有 Watcher 重新计算
- 组件级 Watcher 触发 _update，生成新 VNode 并通过 diff 算法 局部更新 DOM

### 3. 设计优化

 - 异步更新队列：多次数据变更合并到微任务队列（nextTick），避免重复渲染
 - 虚拟DOM：减少直接操作真实 DOM 的性能损耗

### 4、 局限性
- 无法检测动态添加/删除的属性（需用 Vue.set/Vue.delete）
- 对 ES6 Map/Set 无响应式支持

### 5、加分亮点
 对比 Vue 3：
- Vue 3 改用 Proxy 解决了 Vue 2 的局限性，可直接监听动态属性和集合类型。

源码级细节：

 - Dep 类实现发布者模式（depend() 收集依赖，notify() 触发更新）
 - Watcher 分为渲染 Watcher、计算属性 Watcher、用户 Watcher

实际场景问题：
 - 如果直接通过索引修改数组 arr[0]=1 不会触发更新，必须用 Vue.set 或重写的方法。

🚫 避免踩坑
- 不要混淆概念：虚拟 DOM 是渲染优化，不属于响应式核心
- 区分流程：依赖收集发生在 渲染阶段，派发更新在 数据变更阶段
- 准确术语：说清 Dep（依赖管理器）和 Watcher（订阅者）的关系