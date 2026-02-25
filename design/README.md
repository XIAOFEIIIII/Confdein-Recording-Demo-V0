# 设计 Token 使用说明

## 单一数据源

所有视觉 token 定义在 **`tokens.ts`**。改这里即可全站生效。

- **colors**：主色、背景、边框、选中色
- **typography**：字体族、字号、字重、行高
- **spacing**：4px 基准的间距
- **radius**：圆角
- **shadow**：阴影

## 在样式里使用

应用启动时会执行 `injectDesignTokens()`，把 token 注入为 CSS 变量到 `:root`。

在 **className** 里用 Tailwind 任意值引用变量，例如：

```tsx
className="bg-[var(--color-paper)] text-[var(--color-ink)] rounded-[var(--radius-lg)] p-[var(--spacing-4)]"
```

常用变量名（kebab-case）：

- 颜色：`--color-ink`, `--color-paper`, `--color-surface`, `--color-surface-active`, `--color-border-subtle`, `--color-border-warm`, `--color-accent`, `--color-accent-contrast`
- 字体：`--font-body`, `--font-title`, `--font-handwriting`, `--font-handwriting-roman`
- 字号：`--text-xs` ~ `--text-display`
- 字重：`--font-weight-regular`, `--font-weight-medium`, `--font-weight-semibold`, `--font-weight-bold`
- 行高：`--leading-tight`, `--leading-normal`, `--leading-relaxed`
- 间距：`--spacing-0` ~ `--spacing-12`
- 圆角：`--radius-sm` ~ `--radius-full`
- 阴影：`--shadow-nav`, `--shadow-nav-active`, `--shadow-soft`

## 在 JS/TS 里使用

需要内联样式或传给图表库时，直接引用对象：

```ts
import { tokens } from './design/tokens';

// 内联
style={{ color: tokens.colors.ink, padding: tokens.spacing[4] }}

// 图表
stroke: tokens.colors.ink
```

## 以后换主题（如 Claude 风格）

在 `tokens.ts` 里可以：

1. 加一个 `theme: 'paper' | 'claude'`，根据 theme 导出不同 token 对象；或  
2. 直接改当前 `tokens` 里各字段的取值（例如把 `ink` 改成 `#1F1A17`，`paper` 改成 `#F7F3EC`）。

组件只要用 `var(--color-ink)` 这类变量，无需改组件代码。
