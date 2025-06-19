项目移植到不同的机器环境后，请确保使用正确Node版本，可尝试:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

