# Creator Brand Skills

[English](README.md) · **简体中文**

这是四个可独立调用的 Creator Brand Skills：把 Logo、图片、产品功能和产品语义
转成可复用的视觉资产。每个 Skill 都带有可重复运行的评测，并验证真实交付文件，
而不是只检查 Prompt 写得像不像。

## Skills

| Skill | 输入 | 已验证的输出 |
| --- | --- | --- |
| [`logo-to-clay`](logo-to-clay/) | Logo 或图标 | 黏土渲染 Prompt，或 OBJ、MTL、1024 px 预览图与 manifest |
| [`image-to-sticker`](image-to-sticker/) | 简单 Logo、图标、徽章或平面插画 | 一个 512/1024/2048 px 透明贴纸、透明通道证明、source card 与 manifest |
| [`feature-to-icons`](feature-to-icons/) | 3–20 个产品功能 | Phosphor SVG 图标族、预览、来源信息、光学指标与 manifest |
| [`product-to-mascot`](product-to-mascot/) | 产品事实 | 角色圣经、主参考图、四个姿势、contact sheet 与 manifest |

`logo-to-clay`、`image-to-sticker` 和 `feature-to-icons` 构成核心视觉资产工具组；
`product-to-mascot` 则把能力延伸到可复用的品牌角色系统。

## 环境要求

- Codex 或兼容的 Skill 运行环境
- Node.js 22 与 npm
- 重新生成或完整验证 `image-to-sticker` 示例时需要 ImageMagick 的 `magick`
  和 `jq`

macOS 可以运行：

```bash
brew install imagemagick jq
```

## 安装

最终用户通过标准 Skills CLI 从已发布仓库安装：

```bash
npx skills add AlbertAZ1992/creator-brand-skills
```

交互流程会让你选择 Skill、兼容 Agent 和安装范围。为 Codex 全局安装全部四个
Skill，并跳过交互确认：

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill '*' --global --agent codex --yes
```

也可以先查看可用 Skill，或只安装其中一个：

```bash
npx skills add AlbertAZ1992/creator-brand-skills --list
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill logo-to-clay --global --agent codex
```

如果只想临时启动一次终端会话，不保留安装：

```bash
npx skills use AlbertAZ1992/creator-brand-skills@logo-to-clay --agent codex
```

安装完成后新开一个 Codex 任务；如果 Skill 没有马上出现，再重启 Codex。需要
本地 TypeScript 运行时的 Skill 会在首次使用时准备锁定依赖并完成构建。

## 核心 Skill 怎么实际调用

用户不需要把全部参数说一遍。附上需要的源文件，一句话即可：

```text
Use $logo-to-clay 把这个 Logo 做成黏土版。
```

```text
Use $image-to-sticker 把这张图片做成贴纸。
```

```text
Use $feature-to-icons 为搜索、筛选、团队共享、云同步做一套图标。
```

每个 Skill 都会使用文档中的默认值。只有主体、材质、输出模式或设计系统确实
重要时，用户才需要补充。每个 Skill 的 README 解释请求模式和选项；
[`examples/`](examples/) 提供可复制的完整测试与验收标准。

## 核心 Skill 的实际效果

### Logo to Clay · 图片生成路线

![生成的黏土 Logo](logo-to-clay/examples/generated/clay-render.png)

### Logo to Clay · 已验证的 Mesh 路线

![Object 与 Relief Mesh 预览](logo-to-clay/examples/generated/mesh-forms.png)

### Image to Sticker · 支持的样式

![贴纸样式总览](image-to-sticker/examples/generated/style-overview.png)

### Feature to Icons · 48 px 图标族

![AI Workspace 图标族](feature-to-icons/examples/ai-workspace-outline-48/icon-family-preview.png)

## 自动验证

一次验证全部四个 Skill：

```bash
./scripts/verify.sh
```

每个包都会运行 lint、格式检查、严格 TypeScript 检查、单元测试、行为评测和
真实交付物评测：

- `logo-to-clay` 检查 OBJ 几何、MTL 引用、1024 px 预览图与 manifest。
- `image-to-sticker` 检查真实 RGBA、四角透明度、主体覆盖率、alpha proof 与
  manifest。
- `feature-to-icons` 检查功能覆盖、固定版本 Phosphor 来源、SVG 安全、光学
  指标、可编辑源文件、PNG 光栅化和 manifest。
- `product-to-mascot` 检查角色圣经、五张必需参考图、1280 x 256 contact sheet
  和 manifest。

GitHub Actions 会在 push 和 pull request 时运行同样的包级验证。

## 稳定输出的方法

```text
源输入事实 → 任务规格 → 受控生成
           → 确定性后处理 → 硬校验 → 可视证明 → manifest
```

## 仓库结构

```text
creator-brand-skills/
├── scripts/verify.sh        # 全量或按名称复现验证
├── examples/                # 可复制请求与验收方法
├── .github/workflows/       # 包级验证矩阵
├── feature-to-icons/
├── image-to-sticker/
├── logo-to-clay/
└── product-to-mascot/
```

每个 Skill 自己维护 `SKILL.md`、UI metadata、实现、eval、schema、架构说明和
package lock。仓库根目录刻意不再放 Node package 或共享 `node_modules`，避免
四个 Skill 在安装和测试上互相绑死。

## License

MIT，见 [`LICENSE`](LICENSE)。
