import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  // 프로젝트 루트 (HTML 파일들이 있는 위치)
  root: ".",

  // 빌드 설정
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },

  // 개발 서버 설정
  server: {
    port: 8080,
    host: true,
  },

  // 플러그인
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
});
