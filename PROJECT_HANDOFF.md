# FJ / Signal Room 项目交接

更新日期：2026-08-19

## 1. 当前线上状态

- Netlify 项目：`fengsheng-field`
- 线上地址：https://fengsheng-field.netlify.app
- Netlify 管理后台：https://app.netlify.com/projects/fengsheng-field
- 站点 ID：`3fd6ae7b-ba98-416a-9506-d2021e1c4809`
- 当前状态：已恢复，首页和 `/api/scoreboard` 已验证返回 HTTP 200
- 本地项目目录：`/Users/sfless/fengjun-voices-site`
- 新代码仓库：https://github.com/zio00007777/fengsheng-field/tree/main
- 迁移状态：代码已推送到 GitHub `main`，Zeabur 服务尚未创建

## 2. 项目内容

网站只有两个阵营：

- 支持 TF 五代
- 反对时代峰峻

主要页面和功能：

- 首页引导式阵营问答
- 支持方礼物档位展示
- 每个 session 每小时领取一根应援棒
- 分数持久化和比分展示
- `/admin` 运营后台：查看比分、调整比分、编辑礼物档位、查看订单

## 3. 技术结构

- React 19 + vinext + Vite
- Nitro Node server preset，支持 Docker/Zeabur
- Supabase PostgreSQL 持久化数据
- Netlify Blobs 只作为历史数据迁移来源

迁移中的新数据源：Supabase PostgreSQL

- Project URL：`https://rfntxtqvvfnliktugywk.supabase.co`
- 建表 SQL：`supabase/migrations/20260819000000_initial.sql`
- 服务端环境变量：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`
- 环境变量模板：`DEPLOYMENT_ENV.example`

Supabase 数据表：

- `ledger`：比分事件
- `claims`：应援棒 session 冷却锁
- `config`：礼物配置
- `orders`：订单记录

## 4. 本地运行

```bash
cd /Users/sfless/fengjun-voices-site
npm install
npm run dev
```

检查命令：

```bash
npm run lint
npm test
npm run build
```

## 5. 部署

GitHub 仓库已准备好，部署分支为 `main`。项目根目录的 `Dockerfile` 会执行 Node server 构建并监听平台提供的 `PORT`。

Netlify 已绑定该项目。修改代码后：

```bash
cd /Users/sfless/fengjun-voices-site
npm run build
npx --yes netlify-cli deploy --prod
```

如果 CLI 要求选择目录，选择本次构建生成的 `dist`。

也可以进入 Netlify 项目后台手动部署。

### Zeabur 部署

项目根目录新增了 `Dockerfile`，Zeabur 会自动识别并使用它构建 Node 服务。Zeabur 服务环境变量中需要填入 `DEPLOYMENT_ENV.example` 中的服务端变量，端口使用平台提供的 `PORT`。

Zeabur 官方支持通过 Dockerfile 部署，并要求暴露服务端口：[Zeabur Dockerfile 部署说明](https://zeabur.com/docs/en-US/deploy/methods/dockerfile)。

## 6. 后台登录

- 后台地址：https://fengsheng-field.netlify.app/admin
- 登录密钥来自 Netlify 环境变量 `ADMIN_TOKEN`
- 不要把管理员密钥写入代码、Git 或交接文档

后台可做的事情：

- 查看当前支持/反对分数
- 手动增加任一阵营分数
- 修改礼物名称、价格和支持值
- 查看最近订单

## 7. 支付现状

当前是“支付宝静态二维码 + 用户等待后手动确认”的流程，不是支付宝服务端回调验真的自动支付。

Supabase 配置完成后，`/api/orders` 会创建 pending 订单并返回对应二维码；确认接口使用订单号，服务端执行等待时间和订单状态记录。若数据库未配置，接口会返回 `payment_not_configured`，不会产生扣款。

如果后续要升级为真正自动验真支付，必须先取得支付宝或微信支付等渠道的正式审核和商户参数，再补齐：

- 服务端下单
- 支付回调验签
- 幂等处理
- 订单状态查询
- 退款和对账
- 支付成功后再写入支持值

不要用个人收款码、他人商户号或虚假商品绕过风控。

## 8. 已修复问题

- 刷新页面重复领取应援棒：已用 session cookie 和服务端冷却锁修复
- 每次成功领取应援棒都会写入独立比分事件
- 页面刷新不会把比分恢复为初始值
- API 使用 `Cache-Control: no-store`
- 站点停用/恢复操作不影响 Blobs 数据

## 9. Git 状态

最近重要提交：

- `3f625f7`：迁移运行时数据层到 Supabase，添加 Zeabur Docker 部署
- `b950179`：迁移完整运行时到 Netlify
- `c5e620e`：持久化应援棒冷却状态

当前本地代码和 GitHub `main` 以 `3f625f7` 为基线。原 GitHub `gh-pages` 静态版本未覆盖。

## 10. 重要注意事项

- 不要提交任何 Netlify access token、`ADMIN_TOKEN`、支付证书或私钥
- Supabase 建表 SQL 执行完成后，先运行迁移预览，再运行正式迁移
- 支付接通前，不能把“获取安全支付链接”当作已完成支付
- 当前站点已恢复，但免费额度仍受 Netlify 团队月度 credits 限制
