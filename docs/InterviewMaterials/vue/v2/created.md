---
outline: [2,3]
---
# 生命周期总览

必考的核心生命周期钩子

## 初始化创建阶段

### beforeCreated 
触发时机
 - Vue 实例初始化后，​数据观测（Data Observer）和事件/生命周期初始化之前执行
 - `data、methods、computed、DOM` 均不可访问。

核心用途
- 极低使用率：常规业务逻辑几乎用不到。

特殊场景：
- 在 Vue 插件开发中注入全局逻辑（如 Vuex 的初始化）。
- 自定义 SSR（服务端渲染）逻辑。

#### 面试问题
​Q: beforeCreate 中能访问 Vuex 的 state 吗？

​A: `不能，此时 Vuex 还未注入（通常插件注入在 created 之后）。`

### created 

触发时机
 - 数据观测、属性计算完成，但 ​DOM 未挂载。
 - data、methods、computed ​已可用，`DOM）不可用`

​核心作用：
- 初始化非 DOM 数据​（如从 LocalStorage 读取配置）。
- ​异步请求​（需注意组件销毁时的请求取消）。
- 事件监听​（如使用 EventBus 跨组件通信）。

注意问题：
 - 避免阻塞操作：长时间同步任务会延迟渲染。
 - ​处理异步请求的竞态问题​（如组件销毁后响应到达时的错误处理）。

#### 面试问题​

- Q: 为什么不在 beforeCreate 中发请求？
- A: data 未初始化，无法操作数据。

- ​Q: created 和 mounted 异步请求的区别？
​- A: created 的请求更早发出，减少等待时间，但无法操作 DOM；mounted 可操作 DOM，但可能延迟用户体验。 

## 挂载阶段
### beforeMount
触发时机
- 编译模板生成渲染函数后，​首次渲染 DOM 前执行。
- ​此时的 DOM 状态： `虚拟 DOM 存在`，`但真实 DOM 未生成。`

​核心用途
- 极少使用：通常情况下无需在此阶段操作。

特殊场景：
- SSR（服务端渲染）中的混合（Hydration）前操作。
- 在渲染前对虚拟 DOM 进行修改（需谨慎）。
​
#### 面试问题
- ​Q: beforeMount 能访问 $el 吗？
​- A: 不能，此时 $el 还未替换为真实 DOM（还是占位符如 <!-- -->）。

### mounted 

触发时机
- 真实 DOM 完成渲染，​可访问所有 DOM 节点。
- ​注意：子组件可能尚未全部挂载（需用 this.$nextTick 确保）。

核心用途
- 操作 DOM 元素：集成图表库（如 ECharts）、地图（如高德地图）。
- 添加全局事件​（如 window.addEventListener('resize', callback)）。
- 获取元素尺寸或位置​（如 this.$el.offsetHeight）。

​核心作用：
- ​DOM 操作：组件 DOM 已渲染完成，可安全操作 DOM 或集成第三方库（如图表、地图）。
- ​事件监听：添加全局事件（如 window.addEventListener）。

注意事项
- ​避免同步修改数据导致死循环：修改数据后可能触发重新渲染。
- ​清理外部库的副作用：如销毁第三方库实例。

#### 面试问题
- Q:在 mounted 中修改数据会发生什么? 
- A: `触发重新渲染，可能进入更新阶段。` 在 mounted 中频繁修改数据（如循环中大量赋值），可能导致多次重复渲染。
- Q: mounted 一定能获取到所有子组件的 DOM 吗？
- A: 不一定，可通过 this.$nextTick(() => {}) 确保子组件挂载完成。

## 更新阶段
### beforeUpdate
触发时机
- 数据变动后，​DOM 重新渲染前触发。

核心用途
- ​高效场景：
  - 获取更新前的 DOM 状态（如滚动位置）。
  - 记录数据快照（调试或回滚逻辑）。

注意事项
- ​避免数据修改：容易导致循环更新。

### updated

触发时机
- DOM 已根据最新数据完成渲染。

核心用途
- ​外部库的动态更新：
  - 当数据变化导致 DOM 变化后，更新第三方库（如重新渲染图表）。

注意事项
- ​不可修改触发更新的数据：
- 如必须修改，请通过条件判断终止递归。
​
#### 面试问题
- Q: updated 适合处理数据吗？
- A: 不适合，应尽量在 watch 或计算属性中处理。

## 销毁阶段
### beforeDestroy
触发时机
- 实例销毁前，​此时所有功能仍可用。

​核心用途（资源清理）
 - 移除事件监听（如 window.removeEventListener）。
 - 清除定时器、动画帧。
 - 断开 WebSocket 连接。
 - 重置第三方库状态（如地图销毁）。

#### 面试问题
- ​Q: 组件销毁后，为何仍需手动清理全局事件？
- A: 全局事件不属于当前组件，销毁后若不解除引用，会导致内存泄露。

### destroyed

触发时机
 - 实例销毁完成，​所有子组件也已销毁。
 
核心用途
- ​极小众用途：
  - 记录组件销毁日志（如埋点上报）。
​
#### 面试问题
- ​Q: 可以在 destroyed 中释放资源吗？
- A: 不建议，beforeDestroy 更合适，此时实例尚未销毁。

## 缓存

### activated 和 deactivated

触发条件
- 组件被` <keep-alive> `包裹时，切换显示状态触发：
- activated: 从缓存中激活时。
- deactivated: 切换出去进入缓存时。
​
核心用途
- ​缓存组件状态管理：
- 保留滚动条位置。
- 恢复/暂停动画（如视频播放器）。

#### 面试问题
- ​Q: activated 等同于 mounted 吗？
- A: 不等同，缓存组件首次加载时才走 mounted，二次激活走 activated。

## 父子组件生命周期执行顺序详解

挂载阶段
```text
父 beforeCreate → 父 created → 父 beforeMount →  
子 beforeCreate → 子 created → 子 beforeMount → 子 mounted →  
父 mounted
```

更新阶段（父组件数据变化）​

```text
父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated
```

销毁阶段
```text
父 beforeDestroy → 子 beforeDestroy → 子 destroyed → 父 destroyed
```

#### 高频面试问题
- Q: 如果在子组件的 mounted 中修改父组件数据，会触发父组件的更新吗？
- A: 会！父组件的重新渲染将触发父 beforeUpdate → 子 beforeUpdate → ...

