1.
Role: Senior Full-Stack Architect
Task: 打通 E-Joy 系统的 GraphQL WebSocket 实时订阅链路，实现后厨大屏无刷新接单。

执行步骤与架构红线 (Strictly Follow):

阶段 1：后端实时广播改造 (apps/order-service)

引入依赖：确保后端安装了 graphql-subscriptions。创建一个全局的 PubSub 实例（暂用内存模式即可，后续再换 Redis PubSub）。

配置网关：检查 app.module.ts 中的 GraphQLModule 配置，确保开启了 installSubscriptionHandlers: true（或对应的 WebSocket 配置）。

暴露 Subscription：在 OrderResolver 中新增 @Subscription 装饰器修饰的 orderCreated 方法。

埋点广播：在 OrderService 的 createOrder 逻辑最末尾（落库成功后），调用 pubSub.publish('orderCreated', { orderCreated: order })。

阶段 2：前端 WebSocket 链路基建 (apps/customer-web)

引入依赖：确保前端安装了 graphql-ws。

双端分裂链路：重构 src/lib/apollo.ts。使用 @apollo/client 的 split 函数和 getMainDefinition，判断操作类型。

如果是 query/mutation，走原有的 httpLink（带上 Auth Token）。

如果是 subscription，走基于 graphql-ws 的 GraphQLWsLink，连接到我们 .env.local 里的 VITE_GRAPHQL_WS_URL。

阶段 3：后厨大屏 UI (apps/customer-web/src/pages/kitchen)

创建大屏路由：新建 /kitchen 页面。

数据绑定：使用 useSubscription 监听 orderCreated。

UI 渲染：用 Tailwind 画一个暗色调的酷炫面板（适合厨房环境）。维护一个本地状态数组，每当收到新的 Subscription 推送，就把新订单置顶追加到列表中，并附带一个简单的 CSS 闪烁动画（类似 animate-pulse）提示新单到来。

请按顺序输出修改的核心文件代码，并确保前后端编译无误。
2.
