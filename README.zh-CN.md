<div align="center">

# Creator Brand Skills

### 四个开源 Agent Skills，把产品输入真正做成可交付的品牌资产。

黏土 Logo 渲染与 OBJ Mesh · 透明 PNG 贴纸 · 可编辑 SVG 图标族 ·
可复用产品 Mascot

[![Verify](https://github.com/AlbertAZ1992/creator-brand-skills/actions/workflows/verify.yml/badge.svg)](https://github.com/AlbertAZ1992/creator-brand-skills/actions/workflows/verify.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-17142c.svg)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-4-5b4bdb.svg)](#四个-skill一套生产工具组)

[English](README.md) · **简体中文** · [安装](#安装) ·
[产物](#最终会拿到什么) · [验证](#本地验证)

</div>

## 四个 Skill，一套生产工具组

| **01 · Logo to Clay** | **02 · Image to Sticker** |
| :---: | :---: |
| <img src="logo-to-clay/examples/generated/clay-render.png" alt="原创放射形标志制作成钴蓝色黏土雕塑" width="560"> | <img src="image-to-sticker/examples/generated/recommended-preview.png" alt="原创 Peach Planet 插画制作成透明轮廓贴纸" width="560"> |
| Logo 几何 → 宣传渲染图 + 可选 OBJ Mesh | 平面图 → 忠于源图的透明 PNG |
| [`$logo-to-clay`](logo-to-clay/) | [`$image-to-sticker`](image-to-sticker/) |

| **03 · Feature to Icons** | **04 · Product to Mascot** |
| :---: | :---: |
| <img src="feature-to-icons/examples/creative-workflow-duotone/showcase-preview.png" alt="为创作工作流制作的六枚双色图标" width="560"> | <img src="product-to-mascot/examples/generated/mori-mascot-preview.png" alt="纸艺飞蛾 Mori 的主参考和工作姿势" width="560"> |
| 3–20 个产品功能 → 一套经过校验的 SVG 图标 | 产品事实 → 角色圣经 + 五个锁定姿势 |
| [`$feature-to-icons`](feature-to-icons/) | [`$product-to-mascot`](product-to-mascot/) |

上面每张 Hero 都来自 Skill 自己描述的真实生产链路。用于吸引人的作品预览与
干净交付物、机器校验证据彼此分离；全部演示身份和图形均为本仓库原创。

## 一句话就能开始

| 目标 | 复制到 Codex |
| --- | --- |
| 制作黏土 Logo | `Use $logo-to-clay 把这个 Logo 做成精致的黏土渲染图和 OBJ Mesh。` |
| 制作透明贴纸 | `Use $image-to-sticker 把这张图做成透明轮廓贴纸。` |
| 制作一套图标 | `Use $feature-to-icons 为这些产品功能制作一致的 SVG 图标。` |
| 设计品牌 Mascot | `Use $product-to-mascot 根据这些产品事实设计一套可复用的 Mascot。` |

## 最终会拿到什么

| Skill | 输入与视觉控制 | 可交付文件 |
| --- | --- | --- |
| [`logo-to-clay`](logo-to-clay/) | 简单 SVG/PNG Logo；图片、Mesh 或两者；独立物体或浮雕；黏土色、深度、棚拍或透明背景 | 生成图与最终 Prompt；OBJ、MTL、凹凸 PNG、1024 px 预览、manifest JSON |
| [`image-to-sticker`](image-to-sticker/) | 透明或纯色背景的 Logo、图标、徽章、字标、扁平插画；0–44 px 轮廓、自定义颜色、四种确定性材质、±12° 旋转、512/1024 px | 透明 RGBA PNG、alpha-proof PNG、可复现 source-card JSON、manifest JSON |
| [`feature-to-icons`](feature-to-icons/) | 3–20 个功能名与产品语境；线性 light/regular/bold、填充或双色；自定义颜色；24/32/48 px 网格 | 每项功能一个可编辑 SVG、规格与来源 JSON、SVG/PNG 图标族预览、光学校验 manifest JSON |
| [`product-to-mascot`](product-to-mascot/) | 产品事实，以及可选受众、性格、Mascot 类型、视觉媒介、品牌色或现有品牌参考 | 角色圣经 JSON、五张全尺寸参考 PNG、contact sheet、校验 manifest JSON |

## 为什么这些产物经得住继续使用

| **先锁定输入** | **真的能交付** | **结果可验证** |
| :---: | :---: | :---: |
| 创作前锁定 Logo、原图、功能含义或产品事实 | 返回真实 RGBA、SVG、OBJ/MTL、PNG 和 JSON，不只是 Prompt 或 Mockup | 执行透明度、几何、来源、光学或角色一致性检查并记录结果 |

```text
源输入事实 → 任务规格 → 受控生成
           → 确定性后处理 → 硬校验 → 可视证明 → manifest
```

这个边界很重要：黏土宣传图可以有审美表达，OBJ 仍保持确定性；贴纸材质可以
改变观感，alpha 几何不变；图标语义始终追溯到同一套固定版本的图标库；Mascot
只有在角色身份锁定后才变化姿势。

## 先看作品范围，再看验收证据

| Skill | 作品视图 | 验收视图 |
| --- | --- | --- |
| Logo to Clay | [黏土宣传图与两种 3D 形态](logo-to-clay/examples/) | OBJ 面、材质链接、孔洞、1024 px 预览、通过的 manifest |
| Image to Sticker | [轮廓、颜色、旋转与四种正面材质](image-to-sticker/examples/) | 透明资源、灰度 alpha 证明、拓扑与来源 manifest |
| Feature to Icons | [九种产品语境、样式与线重组合](feature-to-icons/examples/) | 每功能独立 SVG、固定 Phosphor 来源、光学指标、无隐藏 fallback |
| Product to Mascot | [Mori 主参考与五姿势角色集](product-to-mascot/examples/) | 角色圣经、五张全尺寸参考图、contact sheet、通过的 manifest |

## 安装

通过标准 Skills CLI 从已发布仓库安装：

```bash
npx skills add AlbertAZ1992/creator-brand-skills
```

交互流程会让你选择 Skill、兼容 Agent 和安装范围。安装完成后新开一个 Codex
任务即可使用。

<details>
<summary><strong>安装全部、只装一个，或仅临时使用一次</strong></summary>

```bash
# 为 Codex 全局安装全部四个 Skill
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill '*' --global --agent codex --yes

# 查看或只安装一个 Skill
npx skills add AlbertAZ1992/creator-brand-skills --list
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill image-to-sticker --global --agent codex

# 仅启动一次，不保留安装
npx skills use AlbertAZ1992/creator-brand-skills@logo-to-clay --agent codex
```

</details>

## 本地验证

```bash
./scripts/verify.sh
```

它会为四个 Skill 运行 lint、格式检查、严格 TypeScript、单元测试、行为评测、
已提交示例检查和真实交付物校验。GitHub Actions 会运行同样的包级验证。

环境要求是 Node.js 22 与 npm。重建全部视觉示例还需要 ImageMagick 和 `jq`
（`brew install imagemagick jq`）。每个 Skill 目录自己维护 `SKILL.md`、UI metadata、
实现、schema、eval 与示例，因此四个包可以独立安装。

## License

MIT，见 [`LICENSE`](LICENSE)。包级第三方代码说明见
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
