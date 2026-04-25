---
name: React19 + shadcn/ui 开发规范
description: React19 + Vite + shadcn/ui + Tailwind + Axios 统一编码规范
---

## Rules
- 全局使用 shadcn/ui 官方组件，不手写基础UI
- 样式全部使用 Tailwind，禁止自定义全局css
- 采用组件化拆分：页面组件 / 通用组件 / 工具hooks
- Axios 统一封装请求、响应拦截器、错误统一提示
- 支持 PDF 上传预览、文件格式校验
- 适配 GitHub Pages 打包部署，静态资源路径正确
- 页面风格简洁商务风，适配后台评审系统

## Workflow
1. 统一接口请求封装
2. 页面分模块：上传区、JD输入区、结果展示区
3. 数据结构化渲染，卡片/表格展示

## Examples
```jsx
import { Button, Card, Textarea, Upload } from "@/components/ui";