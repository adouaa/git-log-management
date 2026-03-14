import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// 关键点：接收 mode 参数
export default defineConfig(({ mode }) => {
  // 加载环境变量
  // mode: 当前模式 (development, production, test)
  // process.cwd(): 项目根目录
  // 'VITE_': 只加载以 VITE_ 开头的变量
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // 获取端口号：
  // 1. 优先读取 .env 文件中的 VITE_API_PORT
  // 2. 如果没读到（比如生产环境没配），则默认为 '8080'
  const apiPort = env.VITE_API_PORT || '8080';

  return {
    plugins: [vue()],
    server: {
      port: 5173, // 前端端口保持不动
      proxy: {
        "/api": {
          // 动态拼接 target，不再写死 8080
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});