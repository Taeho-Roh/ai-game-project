import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// 포트: D:\Taeho 의 다른 프로젝트가 9000~9007 을 씁니다
// (ADMIN 9000 · PPOP 9001 · BT 9002 · HAY 9003 · BUFFET 9004 · 미니게임 9006 · 파티퀴즈 9007).
// 이 프로젝트는 개발 9008, 미리보기(vite preview) 9018.
export default defineConfig({
  server: {
    host: "::",
    port: 9008,
    strictPort: true,
  },
  preview: {
    port: 9018,
    strictPort: true,
  },
  build: {
    // 글꼴 조각(woff/woff2)을 CSS 안에 base64 로 넣지 않아요 — CSS 가 커져서 첫 화면이 늦어져요.
    // 브라우저는 unicode-range 로 필요한 글자 조각만 따로 내려받아요.
    assetsInlineLimit: (filePath: string) => (/\.(woff2?|ttf|otf)$/i.test(filePath) ? false : undefined),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
