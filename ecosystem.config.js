module.exports = {
  apps: [
    {
      name: "git-log-manager", // 进程名称，以后用这个名字管理
      cwd: "./", // 指定工作目录为当前根目录 (这样 npm start 才能找到 backend 文件夹)
      script: "node", 
      args: "backend/app.js", // 这里填你后端的实际入口路径
      
      // 环境变量
      env: {
        NODE_ENV: "production",
        PORT: 8080 // 确保和你的后端代码一致
      },

      // 错误处理策略 (防止死循环重启)
      max_restarts: 10,
      restart_delay: 4000,

      // 日志配置 (可选，方便排查问题)
      error_file: "./logs/pm2-err.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      
      // 忽略监听这些文件夹的变化 (虽然 production 模式不监听，但写上更规范)
      ignore_watch: ["node_modules", "frontend/dist", "logs"]
    }
  ]
};