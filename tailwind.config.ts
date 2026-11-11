import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// 디자인 토큰 — "예능 자막" 콘셉트
//   ink(먹색) #17142B · paper(연보라 종이) #F4F2FA · caption(자막 노랑) #FFD83D
//   mint(정답) #23C99A · pink(땡) #FF4F8B · sky(노래 그림) #4FA3FF · screen(화면) #100E1F
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      fontFamily: {
        sans: [
          "'Pretendard Variable'",
          "Pretendard",
          "-apple-system",
          "'Apple SD Gothic Neo'",
          "'Malgun Gothic'",
          "'Noto Sans KR'",
          "sans-serif",
        ],
        display: ["'Black Han Sans'", "'Pretendard Variable'", "'Malgun Gothic'", "sans-serif"],
      },
      colors: {
        ink: "#17142B",
        paper: "#F4F2FA",
        caption: "#FFD83D",
        mint: "#23C99A",
        pink: "#FF4F8B",
        sky: "#4FA3FF",
        screen: "#100E1F",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sticker: "3px 3px 0 0 #17142B",
        "sticker-sm": "2px 2px 0 0 #17142B",
      },
      keyframes: {
        "caption-pop": {
          "0%": { transform: "scale(0.6) rotate(-4deg)", opacity: "0" },
          "60%": { transform: "scale(1.08) rotate(1deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-1.5deg)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        "wave-bar": {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        "subtitle-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "caption-pop": "caption-pop 420ms cubic-bezier(.2,.9,.3,1.3) both",
        shake: "shake 360ms ease-in-out",
        "wave-bar": "wave-bar 900ms ease-in-out infinite",
        "subtitle-in": "subtitle-in 280ms ease-out both",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
