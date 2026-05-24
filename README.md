# OpenClaw Desktop Pet 🦞

一只可爱的瓢虫桌面宠物，基于 Electron + Canvas 构建。支持 AI 对话和 LX Music 音乐控制。

![Electron](https://img.shields.io/badge/Electron-33-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 功能特性

- 🐞 **渐变红色瓢虫动画** — 呼吸起伏、眨眼、触角摆动、心跳脉冲、腿部微动
- 💬 **AI 对话** — 接入 OpenClaw Gateway，支持流式输出和上下文记忆
- 🎵 **LX Music 控制** — 播放/暂停/上下曲/音量调节/收藏/进度条拖拽
- 🖱️ **桌面交互** — 拖拽移动、右键菜单、快捷键操作
- 😴 **智能状态** — 自动睡眠动画、消息提醒弹跳、开心飘红心
- 🎨 **扁平渐变风格** — 径向渐变身体、蓝光脉冲眼睛、环境柔光

## 📦 安装

### 方式一：下载安装包（推荐）

从 [Releases](https://github.com/Vangao2026/claw-desktop-pet/releases) 下载 `Claw Pet Setup.exe`，双击安装即可。

### 方式二：便携版

下载 `Claw-Pet-v1.0-win-x64.zip`，解压后双击 `Claw-Pet.exe` 运行，无需安装。

### 方式三：从源码运行

```bash
# 克隆项目
git clone https://github.com/Vangao2026/OpenClaw-Desktop-Pet.git
cd OpenClaw-Desktop-Pet

# 安装依赖
npm install

# 启动
npm start
```

## ⚙️ 配置

### OpenClaw Gateway（对话功能）

1. 右键瓢虫 → ⚙️ 设置
2. 填入 Gateway 地址和 Token
3. 确保 Gateway 已开启 HTTP 接口：

```json5
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

### LX Music（音乐控制）

1. 打开 LX Music 桌面版（v2.7.0+）
2. 设置 → 开放 API → 启用（默认端口 23330）
3. 瓢虫会自动检测并显示音乐控制面板

## 🎮 操作方式

| 操作 | 功能 |
|---|---|
| 🖱️ 双击瓢虫 | 打开/关闭对话框 |
| 🖱️ 拖拽瓢虫 | 移动位置 |
| 🖱️ 右键瓢虫 | 打开功能菜单 |
| ⌨️ `Ctrl+Shift+P` | 切换对话框 |
| ⌨️ `Ctrl+M` | 切换音乐控制面板 |
| ⌨️ `空格` | 播放/暂停（未输入时） |
| ⌨️ `←` / `→` | 上一曲 / 下一曲 |
| ⌨️ `Escape` | 关闭对话框 |

## 🏗️ 技术栈

| 组件 | 技术 |
|---|---|
| 桌面窗口 | Electron 33 + 透明无边框窗口 |
| 动画渲染 | HTML5 Canvas 径向渐变 |
| AI 对话 | OpenClaw Gateway（OpenAI 兼容 API） |
| 音乐控制 | LX Music Open API（HTTP） |
| 打包分发 | electron-builder (NSIS) / @electron/packager |

## 📁 项目结构

```
desktop-pet/
├── main.js              # Electron 主进程（窗口、托盘、IPC）
├── preload.js           # 安全桥接（contextBridge）
├── renderer/
│   ├── index.html       # 主页面结构
│   ├── style.css        # 样式（透明背景、渐变配色）
│   ├── pet.js           # 宠物动画引擎（状态机 + Canvas 渲染）
│   ├── chat.js          # 对话模块（OpenClaw Gateway SSE 流式）
│   ├── lxmusic.js       # LX Music 控制器（状态轮询 + 播放控制）
│   └── app.js           # 主应用逻辑（拖拽、菜单、UI 交互）
├── package.json
└── README.md
```

## 🔧 打包

```bash
# 前提：开启 Windows 开发者模式
# 设置 → 开发者选项 → 开发人员模式

# 打包为 NSIS 安装包
npm run build

# 打包为便携版
npx @electron/packager . Claw-Pet --platform=win32 --arch=x64 --out=dist --asar
```

## 📄 License

[MIT](LICENSE)
