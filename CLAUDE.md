# 代码规范

## 颜色使用

**禁止在 TSX/SCSS 中硬编码颜色值**。所有颜色必须使用 `common/theme` 中定义的 CSS 变量或颜色常量：

- TSX 中：通过 `style={{ backgroundColor: variable }}` 或内联样式引用 theme 变量
- SCSS 中：使用 `var(--color-xxx)` 或 `var(--text-color)` 等 CSS 变量

允许的硬编码颜色：
- `transparent`
- `inherit` / `unset` / `initial`
- CSS 变量引用如 `var(--xxx)`

检查方法：搜索 `#` 十六进制颜色（如 `#ccc`、`#808080`）或 `rgb(` / `rgba(` 字面量，如有疑问必须使用 theme 变量。

## i18n

所有用户可见的文本（按钮文字、标签、占位符等）必须使用 `t('key')` 国际化函数，禁止硬编码中文/英文文本。
