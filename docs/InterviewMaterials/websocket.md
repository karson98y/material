# Websocket 常见面试题

WebSocket 是一种基于 ​TCP 的 ​全双工通信协议，用于在 ​单个持久连接 上实现客户端（如浏览器）和服务端之间的 ​低延迟双向数据交换。

## Websocket 建立连接都有哪些步骤
WebSocket 建立连接的过程主要分为 **​握手阶段** 和 **​数据传输阶段**

### 一、握手阶段（HTTP Upgrade）​
WebSocket 连接通过 HTTP/HTTPS 协议发起，通过 Upgrade 头切换为 WebSocket 协议。

##### 1、客户端请求（Client Handshake）​
客户端发送一个 HTTP GET 请求，包含以下关键头信息：

```http
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket          # 请求升级为 WebSocket 协议
Connection: Upgrade         # 表示需要升级连接
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==  # 随机生成的 Base64 密钥（16字节）
Sec-WebSocket-Version: 13   # WebSocket 协议版本（通常为 13）
Origin: https://example.com # 可选，用于安全校验
```

##### 2、服务端响应（Server Handshake）​
服务端验证请求后，返回 HTTP 101 Switching Protocols 响应：
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket          # 确认协议升级
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=  # 对客户端 Key 的校验值
```

`Sec-WebSocket-Accept` 生成规则：
将客户端的 `Sec-WebSocket-Key` 拼接固定 GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11`，然后计算 SHA-1 哈希，最后转为 `Base64`.


### 二、连接建立
握手成功后，TCP 连接保持打开状态，但协议从 HTTP 切换为 WebSocket。

后续所有通信通过 WebSocket 数据帧（Frame）传输，不再使用 HTTP。

### 三、数据传输
​数据帧格式：WebSocket 使用轻量级的二进制帧（Frame）传递数据，包含操作码（如文本/二进制）、掩码（客户端到服务端需掩码）、负载长度等。

​通信模式：全双工通信，客户端和服务端可随时主动发送消息。

### 四、连接关闭
任一方发送关闭帧（Close Frame）即可终止连接：

##### 关键注意事项

​跨域限制：受同源策略约束，可通过 Origin 头校验或 CORS 配置。

​加密：建议使用 wss://（WebSocket over TLS）保证安全。

​心跳机制：可通过 Ping/Pong 帧（操作码 0x9/0xA）保持连接活性。

### 示例代码：客户端
```js
const ws = new Websocket('ws://xxx')

ws.open = function() {
  console.log('连接已建立')
  ws.send({type: 'msg', data: '发送第一条消息'})
}

ws.onmessage = function(event) {
  console.log('收到服务端的消息', event.data)
}

ws.onclose = function () {
  console.log('连接已关闭')
}

ws.onerror = function() {
  console.log('报错')
}

```
##### 口诀速记
客户端带Key，服务端算Accept，101响应验明正身，然后开始聊天

```md
"一请求，二升级，三校验，四双工，五关闭"
对应：

客户端发送HTTP升级请求
服务端返回101升级通过响应
密钥校验（Key/Accept）
建立双工通信
关闭帧终止连接
```

## readyState 状态检测
readyState属性返回实例对象的当前状态，共有四种。

- CONNECTING：值为0，表示正在连接。
- OPEN：值为1，表示连接成功，可以通信了。
- CLOSING：值为2，表示连接正在关闭。
- CLOSED：值为3，表示连接已经关闭，或者打开连接失败。


## 心跳检测的作用是什么
定期发送 Ping/Pong 帧，伪装成“活动流量”，欺骗中间设备保持连接。

**一句话记忆： 防设备掐线、防网络假活、防端口回收、防协议兼容**

### 主要防止的问题
| 问题类型            | 具体表现                               | 心跳解决方案                      |
|---------------------|----------------------------------------|----------------------------------|
| 中间设备超时        | Nginx/防火墙自动断开空闲连接           | 定期 Ping 维持"活动"状态         |
| 假连接（Zombie）    | 网络异常但 TCP 未及时断开              | Ping 超时快速检测失效            |
| 移动网络/NAT 回收   | 运营商回收空闲端口导致连接失效         | 心跳间隔短于 NAT 超时时间        |
| 协议兼容性问题      | 某些设备不处理标准 Ping 帧             | 改用自定义文本心跳               |

## 手写一个简单的服务端（Node.js 示例）

```js
const Websocket = require('ws') // 引入 websocket 
const server = new WebSocket.Server({port: 3000}) // 创建一个服务，设置端口

// 服务进行监听
server.on('connection', (ws) => {
  ws.on('message', (message) => {
    // 收到客户端的消息，在这里回应
    console.log(`Received: ${message}`);
    ws.send(`Echo: ${message}`);
  });
});
```
## 和 HTTP 的区别是什么？
关键点：协议升级、持久连接、双向通信、数据帧。

| 关键区别         | WebSocket                          | HTTP                    |
|------------------|-----------------------------------|-------------------------|
| ​**协议升级**     | 通过HTTP握手升级为独立协议(101状态码) | 始终保持HTTP协议        |
| ​**连接方式**     | 持久长连接(单连接复用)             | 短连接(默认请求后关闭)  |
| ​**通信模式**     | 全双工双向通信                     | 半双工单向请求/响应     |
| ​**数据传输格式** | 二进制帧(头部仅2-14字节)           | 文本HTTP报文(头部臃肿)  |

## 如何保证低延迟
要保证 WebSocket 的低延迟通信，需要从 ​网络层、协议层、服务端、客户端 全链路优化。

`最优解 = 物理距离优化（按需） + 协议层优化（必选） + 代码级优化（必选）`

### 协议层优化
  - 使用二进制帧（如 Protocol Buffers）替代 JSON。
  - 启用压缩（perMessageDeflate）。
  
```js
const wss = new WebSocket.Server({ 
  perMessageDeflate: { 
    threshold: 1024 // 1KB 以上数据压缩
  } 
});
```

### ​传输层优化

启用 TCP Fast Open（减少握手 RTT）。

探索 QUIC 协议（HTTP/3 + WebSocket over QUIC）。

### ​代码级优化

异步非阻塞处理消息，避免主线程阻塞。

客户端使用 Web Worker 分离计算密集型任务。


### 低延迟的四个核心原则：

- ​短链路​（物理距离 + 高效协议）
- 轻数据​（压缩 + 二进制）
- 异步流​（非阻塞处理 + 多线程）
- 端智能​（客户端节流 + 分离计算）

## 如何检测是否已安装软件

- 使用自定义协议（如果成功会存在弹窗）
- 通过socket 状态判断（只能检测是否已运行，需配合提示优化交互）