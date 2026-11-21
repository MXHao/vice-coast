# 热湾狂飙：R17 九项第一人称恢复脚本

这是源码备份，不是 GitHub Pages 的试玩更新。此提交保存扩展编译器、解析器和复现说明，不含完整游戏 HTML、素材、音频、原始 QA 日志或任何玩家存档。

该版本把 SPAS12 接入既有八项，共有九项可选第一人称；另 47 项仍走原第三人称。紧凑触控仍沿用第三人称。离线核验包括 61 项 CPU 检查及两条常规路线各 29 次存档写入一致；未由浏览器或真机测过。56 项装备音效取自单独保管且获准用于本站的用户音频包，未纳入 GitHub。

使用 Node 24.22.3。需要从获授权渠道另行提供：确切上一版八项 HTML、确切全 56 项计时修正版 HTML、独立 Breakwater 复现输入包（含编译器及其依赖、素材与稽核输入）。在本地展开该输入包，保留它原有的依赖目录，并按本目录的编译器声明把受检构件准备在输入根下的 standalone-breakwater、previous-parser 和 scope-barrier 中。编译器按内容哈希校验，不会抓取外部资源或接受其他版本。源码本身不能独立重建完整游戏。

```sh
sha256sum -c SHA256SUMS
node --expose-internals tools/build-inline-nine-breakwater.mjs PRIOR_EIGHT_HTML FULL56_HTML INPUT_DIR OUTPUT_HTML RECEIPT_JSON
sha256sum OUTPUT_HTML
```

确切输入 SHA-256：
- 上一版八项：ae596506bcd296ce53ca3dcc194c65d143177568df54ce5ad32678343fc6f5ba
- 全 56 项计时修正版：df0b2db73e01dc2f5239e4740752e3156932d500eebabdff3773d6cdb871f864

目标输出为 32,122,756 字节，SHA-256 87caa135670470900e8bc9b20f1f3fd21141b960f237db7240e07c17f1cd2843。源码备份发布前用单独保管的输入从隔离目录重建，输出与已验证的九项版本逐字节相同。不要把输出或受限输入提交到 Git。
