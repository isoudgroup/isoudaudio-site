# 阿里云企业邮箱发信接入核验

核验日期：2026-10-12。网站：isoudaudio.com。收件人：Lisa Li，lisa_li@rawisoud.com。

## 当前结论

可采用“网站询盘接口 -> 阿里云 SMTP -> Lisa 邮箱”的方案，作为接入候选。已验证服务器和本机网络连接；尚未验证邮箱账号权限、Cloudflare 生产网络或实际投递。当前线上 `/api/inquiry` 仍返回 `available=false`。

| 项目 | 结果 |
| --- | --- |
| rawisoud.com MX | mx1/mx2/mx3.qiye.aliyun.com |
| rawisoud.com SPF | v=spf1 include:spf.qiye.aliyun.com -all |
| SMTP 主机 | smtp.qiye.aliyun.com |
| 端口和加密 | 465，连接建立时即使用 TLS，验证服务器证书与主机名 |
| 本机连接 | TLS 1.3，证书验证通过，服务器返回 220 和 EHLO 250 |
| 认证声明 | PLAIN、LOGIN、XOAUTH2、XALIOAUTH；不代表任何账号已认证 |
| 邮箱登录 | 浏览器停在登录入口，账号 SMTP 权限未知 |
| 实际发信、Lisa 收件 | 未测试 |

## 接入配置

发件地址必须使用已存在、可认证的企业邮箱，并与 SMTP 登录账号一致。优先核验 Lisa 现有邮箱；独立网站发信账号仅在已有账号或经用户决定后使用。买家邮箱放在 Reply-To，不能用买家邮箱冒充发件人。收件人由后端固定为 Lisa，不允许表单指定任意收件人。

拟用生产变量（配置完成之前不要启用发信）：

| 名称 | 类型 | 值或用途 |
| --- | --- | --- |
| SMTP_HOST | 普通变量 | smtp.qiye.aliyun.com |
| SMTP_PORT | 普通变量 | 465 |
| SMTP_USER | 普通变量 | 已核验的完整企业邮箱地址 |
| SMTP_PASSWORD | Cloudflare Secret | 该账号的第三方客户端安全密码；不写入仓库、日志或聊天 |

现有接口只有 Cloudflare `INQUIRY_EMAIL.send()` 路径，添加上述变量本身不会接通。实施时须增加 SMTP 发送实现并验证 Cloudflare 运行环境。推荐先在预览环境验证 `nodejs_compat` 与维护中的 SMTP 库（如 Nodemailer），保留 TLS 证书校验；无需开启 Cloudflare Email Sending。Cloudflare 官方支持 TCP/TLS 出站连接，但本轮只验证本机连接，不能据此断言边缘环境连接成功。若需要独立 Worker，应使用私有 Service binding 并禁止公开邮件中继。

## 用户登录后核验

1. 在 https://qiye.aliyun.com/ 登录拟用发件邮箱。无需向聊天提供密码。
2. 查看“设置 -> 更多设置 -> 账户与安全 -> 账户安全 -> 三方客户端登录安全管理”。先核对现有设置，不切换账号安全策略。
3. 管理员确认该账号具备 SMTP 服务权限、第三方客户端访问未被禁止。若受限制，只讨论该账号例外，不关闭企业全局策略。
4. 若需要新建客户端安全密码，由用户完成验证码及凭据生成，并在指定生产 Secret 中输入。启用安全密码可能影响正在使用旧密码的客户端，应先核对现有设备。
5. 在 Cloudflare 预览环境执行 TLS 和认证核验。认证成功仍不等于投递成功。
6. 经授权向 Lisa 发送明确标注的测试询盘，分别核对无附件、一个小附件、Reply-To 回复路径，以及发送失败后表单保留内容。记录服务器接受与 Lisa 实际收件两项结果。
7. 通过后部署生产，保持法英表单、仅姓名和邮箱必填、3 MB 附件限制与 24 小时回复说明。可用性只说明配置状态，不代表客户邮件已收件。

本方案沿用现有邮箱订阅，不需要替换 MX/SPF 或购买 Cloudflare 发信产品。实际发送限额及 Cloudflare 用量仍需以现有账户为准。网站询盘不能扩展为批量推广邮件；阿里云对系统批量邮件建议另用邮件推送产品。

## 可重复的只读检查

在项目目录运行 `node tools/probe-aliyun-smtp.mjs`。工具仅做 TLS、EHLO、QUIT，不读取密码、不登录邮箱、不发送邮件。本机检查结果不能替代 Cloudflare 实测。

## 官方依据

- [阿里邮箱服务器地址与端口](https://help.aliyun.com/zh/document_detail/36576.html)
- [SMTP 程序发信](https://help.aliyun.com/zh/document_detail/36687.html)
- [第三方客户端安全密码](https://help.aliyun.com/zh/document_detail/444269.html)
- [管理员访问权限](https://help.aliyun.com/zh/document_detail/606337.html)
- [Cloudflare TCP sockets](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)
- [Cloudflare TLS 支持](https://developers.cloudflare.com/workers/runtime-apis/nodejs/tls/)
- [Pages Secrets 与绑定](https://developers.cloudflare.com/pages/functions/bindings/)
