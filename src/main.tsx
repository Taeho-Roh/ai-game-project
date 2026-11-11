import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 글꼴은 npm 패키지(OFL 라이선스)로 같이 묶어요 — 외부 글꼴 서버에 접속하지 않아요.
import "@fontsource/black-han-sans/400.css";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
