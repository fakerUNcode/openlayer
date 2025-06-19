# 缓存清除与环境搭建

项目移植到不同的机器环境后，请确保使用正确Node版本，可尝试:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

# 启动命令

开发模式启动命令：

```bash
npm run dev
```

生产构建命令：

```bash
npm run build
```

