import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  // 프로젝트 루트 (HTML 파일들이 있는 위치)
  root: "./",

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
    https: false,
    port: 8080,
    host: true,
  },

  // 플러그인
  plugins: [
    basicSsl(),
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
});
