# KyleKK04.github.io

个人网站源码，当前已经朝 `静态前台 + Git 内容数据 + 后台编辑/CMS + Agent 辅助维护` 的方向整理。

## 目录结构

```
├── index.html          # 主页
├── blog.html           # 博客列表 / 文章阅读
├── projects.html       # 项目列表
├── profile.html        # Profile 独立页
├── contact.html        # Contact 独立页
├── admin/              # Decap CMS 后台入口
│   ├── index.html
│   └── config.yml
├── content/            # Canonical content source
│   ├── projects/
│   │   └── *.md
│   ├── posts/
│   │   └── *.md
│   ├── site.json
│   ├── profile.json
│   └── contact.json
├── styles/
│   └── main.css        # 公共样式
├── scripts/
│   ├── markdown.js     # Markdown 解析器（共享）
│   ├── content-build.js
│   ├── content-validate.js
│   └── site-content.js
├── assets/
│   ├── favicon.svg     # 网站图标
│   └── uploads/        # CMS / 内容资源上传目录
├── posts/
│   ├── index.json      # 由 content/posts 生成的博客索引
│   └── *.md            # 由 content/posts 生成的博客文章
├── projects/
│   └── index.json      # 由 content/projects 生成的项目索引
├── CNAME               # 域名配置
├── package.json        # 内容构建 / 校验命令
└── README.md
```

## 当前内容源

- 项目内容请编辑 `content/projects/*.md`
- 博客内容请编辑 `content/posts/*.md`
- 站点文案请编辑 `content/site.json`
- Profile 内容请编辑 `content/profile.json`
- Contact 内容请编辑 `content/contact.json`

项目卡片可配置单独的游玩按钮：

- `playLink`
- `playLabel`

`projects/index.json`、`posts/index.json` 以及博客公开 Markdown 文件现在是生成产物，不建议手动维护。

## 内容构建

生成公开内容文件：

```bash
npm run content:build
```

校验内容结构：

```bash
npm run content:validate
```

构建并校验：

```bash
npm run content:sync
```

## Decap CMS

后台入口：

```text
/admin/
```

本地调试 Decap 本地代理：

```bash
npm run cms:local
```

当前 `admin/config.yml` 已经对齐到：

- `content/projects`
- `content/posts`
- `content/site.json`
- `content/profile.json`
- `content/contact.json`
- `assets/uploads`

## 本地预览

需要通过 HTTP 服务打开，例如：

```bash
npm run content:sync
python3 -m http.server 4173
```

然后访问 `http://localhost:4173/`。

## 部署

推送至 GitHub，由 GitHub Pages 提供静态站点。域名 `kylekk.com` 通过 `CNAME` 配置。

如果后续要让线上 CMS 真正可登录发布，还需要补充 GitHub auth / 托管端认证配置。当前仓库已经具备内容模型、构建脚本和后台 scaffold。
