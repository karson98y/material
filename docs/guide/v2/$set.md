---
 outline: [2,3]
---
# Vue.$set

## 1、`Vue.$set` 处理对象变成响应式背后的原理

答：获取当前对象的 Observer 实例，调用 defineReactive 转换成响应式，创建新的Dep实例， 通过 observer 实例下的 Dep，手动触发依赖通知

- 若目标为响应式对象，则调用 defineReactive 将新属性转换为响应式
- 手动触发依赖更新：dep.notify()
