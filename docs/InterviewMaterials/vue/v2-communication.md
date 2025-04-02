---
outline: [2,3]
---

# Vue2 组件通信

## 1、父子通信

Vue2 父子通信的核心基于 ​单向数据流 原则，包含两种基础方式：

### Props 传参
父组件向子组件传递数据,子组件向父组件发送通知
### 双向绑定语法糖
简化父子双向绑定

#### .sync 修饰符（Vue 2.3+）​

```js
<!-- Parent -->
<Child :title.sync="parentTitle" />

<!-- Child内部 -->
this.$emit('update:title', newValue)
```

- 缺点
  - Vue3 已废弃：需用 v-model:title 替代，存在迁移成本

## 2、跨层级通信

## 3、全局通信

## 4、特殊场景方案

