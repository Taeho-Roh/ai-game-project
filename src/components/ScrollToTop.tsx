import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** 화면을 옮길 때 맨 위에서 시작 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
