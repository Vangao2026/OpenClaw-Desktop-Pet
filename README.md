# Claw Desktop Pet 🐞

一只可爱的瓢虫桌面宠物，基于 Electron + Canvas 构建。

## 功能

- 🐞 渐变红色瓢虫动画（呼吸、眨眼、触角摆动、心跳脉冲）
- 💬 对话功能（接入 OpenClaw Gateway）
- 🎵 LX Music 播放控制（播放/暂停/上下曲/音量/收藏）
- 🖱️ 拖拽移动、右键菜单
- 😴 自动睡眠动画
- ❤️ 开心时飞出小红心

## 安装

### 下载安装包

从 [Releases](../../releases) 下载 `Claw Pet Setup 1.0.0.exe`，双击安装。

### 从源码运行

```bash
# 克隆项目
git clone https://github.com/Vangao2026/claw-desktop-pet.git
cd claw-desktop-pet

# 安装依赖
npm install

# 启动
npm start
```

### 打包

```bash
# 开启 Windows 开发者模式（解决符号链接权限问题）
# 设置 → 开发者选项 → 开发人员模式

# 打包为安装包
npm run build

# 或使用 electron-packager 打包为便携版
npx @electron/packager . Claw-Pet --platform=win32 --arch=x64 --out=dist --asar
```

## 配置

### OpenClaw Gateway（对话功能）

右键瓢虫 → ⚙️ 设置 → 填入 Gateway 地址和 Token

默认配置：
- Gateway: `http://127.0.0.1:18789`
- 需要开启 `gateway.http.endpoints.chatCompletions.enabled`

### LX Music（音乐控制）

确保 LX Music 桌面版正在运行，并启用开放 API 服务（默认端口 23330）。

## 快捷键

| 按键 | 功能 |
|---|---|
| 双击瓢虫 | 打开/关闭对话框 |
| `Ctrl+Shift+P` | 切换对话框 |
| `Ctrl+M` | 切换音乐控制面板 |
| `空格` | 播放/暂停（输入框未聚焦时） |
| `←` / `→` | 上一曲 / 下一曲 |
| `Escape` | 关闭对话框 |

## 技术栈

- **Electron** - 桌面窗口
- **HTML5 Canvas** - 像素动画渲染
- **OpenClaw Gateway** - AI 对话（OpenAI 兼容 API）
- **LX Music Open API** - 音乐控制

## 项目结构

```
desktop-pet/
├── main.js              # Electron 主进程
├── preload.js           # 安全桥接
├── renderer/
│   ├── index.html       # 主页面
│   ├── style.css        # 样式
│   ├── pet.js           # 宠物动画引擎
│   ├── chat.js          # 对话模块
│   ├── lxmusic.js       # LX Music 控制
│   └── app.js           # 主应用逻辑
├── package.json
└── README.md
```

## License

MIT
