<div align="center">

# Creator Brand Skills

### 一个品牌输入，四套可复用的视觉系统。

用 Codex 把 Logo、图片、产品功能或产品想法变成可直接交付的视觉资产。

[English](README.md) · **简体中文** · [安装](#安装) · [本地验证](#本地验证)

</div>

## 四个 Skill，一套品牌工具组

| **01 · Logo to Clay** | **02 · Image to Sticker** |
| :---: | :---: |
| <img src="logo-to-clay/examples/generated/clay-render.png" alt="Threads 字标转换为深色黏土效果" width="560"> | <img src="image-to-sticker/examples/generated/recommended-preview.png" alt="Threads 字标转换为透明轮廓贴纸" width="560"> |
| Logo 或图标 → 黏土渲染图或真实 OBJ Mesh | 平面图片 → 忠于源图的透明贴纸 |
| [`$logo-to-clay`](logo-to-clay/) | [`$image-to-sticker`](image-to-sticker/) |

| **03 · Feature to Icons** | **04 · Product to Mascot** |
| :---: | :---: |
| <img src="feature-to-icons/examples/social-publishing-outline/icon-family-preview.png" alt="社交发布产品的轮廓图标族" width="560"> | <img src="product-to-mascot/examples/generated/threads-mascot-contact-sheet.png" alt="五姿势品牌 Mascot contact sheet" width="560"> |
| 3–20 个产品功能 → 一套一致、可编辑的 SVG 图标 | 产品事实 → 角色圣经与五张姿势参考图 |
| [`$feature-to-icons`](feature-to-icons/) | [`$product-to-mascot`](product-to-mascot/) |

作品表格使用同一个易识别的输入，方便直接比较不同转换效果。Threads 是 Meta
Platforms, Inc. 的商标；以上均为非官方演示，本项目与 Meta 无关联，也未获得其
认可或背书。

## 安装

最终用户通过标准 Skills CLI 从已发布仓库安装：

```bash
npx skills add AlbertAZ1992/creator-brand-skills
```

交互流程会让你选择 Skill、兼容 Agent 和安装范围。安装完成后新开一个 Codex
任务，一句话即可开始：

```text
Use $logo-to-clay 把这个 Logo 做成黏土版。
```

<details>
<summary><strong>安装全部、只装一个，或仅临时使用一次</strong></summary>

为 Codex 全局安装全部四个 Skill：

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill '*' --global --agent codex --yes
```

查看可用 Skill，或只安装其中一个：

```bash
npx skills add AlbertAZ1992/creator-brand-skills --list
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill image-to-sticker --global --agent codex
```

只启动一次，不保留安装：

```bash
npx skills use AlbertAZ1992/creator-brand-skills@logo-to-clay --agent codex
```

</details>

## 每个 Skill 会交付什么

| Skill | 输入 | 已验证的交付物 |
| --- | --- | --- |
| [`logo-to-clay`](logo-to-clay/) | Logo 或图标 | 黏土渲染 Prompt，或 OBJ、MTL、1024 px 预览图与 manifest |
| [`image-to-sticker`](image-to-sticker/) | Logo、字标、图标或徽章 | 512/1024/2048 px 透明贴纸、alpha proof、source card 与 manifest |
| [`feature-to-icons`](feature-to-icons/) | 3–20 个产品功能 | Phosphor SVG 图标族、预览、来源、光学指标与 manifest |
| [`product-to-mascot`](product-to-mascot/) | 产品事实 | 角色圣经、主参考图、四个姿势、contact sheet 与 manifest |

每个 Skill 都会先锁定源输入事实，再执行任务专属的后处理和真实文件校验：

```text
源输入事实 → 任务规格 → 受控生成
           → 确定性后处理 → 硬校验 → 可视证明 → manifest
```

## 本地验证

```bash
./scripts/verify.sh
```

该命令会为全部四个 Skill 运行 lint、格式检查、严格 TypeScript 检查、单元测试、
行为评测和真实交付物验证。GitHub Actions 会在 push 和 pull request 时运行同样
的包级检查。

<details>
<summary><strong>环境要求与仓库结构</strong></summary>

环境要求：

- Codex 或兼容的 Skill 运行环境
- Node.js 22 与 npm
- 完整重建所有视觉示例时需要 ImageMagick 和 `jq`

```bash
brew install imagemagick jq
```

```text
creator-brand-skills/
├── scripts/verify.sh
├── examples/
├── .github/workflows/
├── feature-to-icons/
├── image-to-sticker/
├── logo-to-clay/
└── product-to-mascot/
```

每个 Skill 自己维护 `SKILL.md`、UI metadata、实现、eval、schema、示例和 package
lock。仓库根目录没有共享 Node package，四个 Skill 可以独立安装和测试。

</details>

## License

MIT，见 [`LICENSE`](LICENSE)。第三方演示素材的说明见
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
