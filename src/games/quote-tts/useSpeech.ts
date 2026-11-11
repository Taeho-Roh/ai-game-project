// 브라우저 내장 음성 읽기(Web Speech API, speechSynthesis) — 돈이 들지 않고 API 키도 필요 없어요.
import { useCallback, useEffect, useRef, useState } from "react";
import { pickKoreanVoice } from "./voice";

export type SpeechStatus =
  /** 음성 목록을 확인하는 중 */
  | "checking"
  /** 한국어 음성으로 읽을 수 있어요 (voice 가 null 이면 기기 기본 한국어 음성에 맡김) */
  | "ready"
  /** 음성 기능은 있지만 한국어 음성이 없어요 */
  | "no-korean-voice"
  /** 이 브라우저는 음성 읽기를 지원하지 않아요 */
  | "unsupported";

const VOICE_WAIT_MS = 1500;

function hasSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>(() => (hasSpeech() ? "checking" : "unsupported"));
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [failed, setFailed] = useState(false);
  // 일부 브라우저는 말하는 도중 utterance 가 정리되면 onend 가 안 와요 — 참조를 붙잡아 둠
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!hasSpeech()) return;
    const synth = window.speechSynthesis;
    let settled = false;

    const evaluate = (final: boolean) => {
      if (settled) return;
      const voices = synth.getVoices();
      const picked = pickKoreanVoice(voices);
      if (picked) {
        settled = true;
        setVoice(picked);
        setStatus("ready");
      } else if (final) {
        settled = true;
        // 목록이 아예 비어 있으면(일부 안드로이드) 한국어로 읽어 달라고만 요청해 봐요.
        setStatus(voices.length === 0 ? "ready" : "no-korean-voice");
      }
    };

    evaluate(false);
    const onChange = () => evaluate(false);
    synth.addEventListener?.("voiceschanged", onChange);
    const timer = window.setTimeout(() => evaluate(true), VOICE_WAIT_MS);
    return () => {
      settled = true;
      window.clearTimeout(timer);
      synth.removeEventListener?.("voiceschanged", onChange);
      synth.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, rate = 1) => {
      if (!hasSpeech()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice?.lang ?? "ko-KR";
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = 1; // 음높이를 바꿔 특정인 목소리를 흉내 내지 않아요
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = (e) => {
        setSpeaking(false);
        if (e.error !== "interrupted" && e.error !== "canceled") setFailed(true);
      };
      utterRef.current = u;
      setFailed(false);
      setSpeaking(true);
      synth.speak(u);
    },
    [voice],
  );

  const stop = useCallback(() => {
    if (!hasSpeech()) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { status, voice, speaking, failed, speak, stop };
}

export type Speech = ReturnType<typeof useSpeech>;

/** 음성으로 들을 수 없는 상황인지 (그럼 대사를 글자로 감점 없이 보여 줘요) */
export function speechUnavailable(speech: Pick<Speech, "status" | "failed">): boolean {
  return speech.status === "unsupported" || speech.status === "no-korean-voice" || speech.failed;
}

export function speechStatusMessage(speech: Pick<Speech, "status" | "failed">): string | null {
  if (speech.status === "unsupported") return "이 브라우저는 음성 읽기를 지원하지 않아요. 대사를 글자로 보여 드릴게요(감점 없음).";
  if (speech.status === "no-korean-voice")
    return "이 기기에 한국어 음성이 없어요. 대사를 글자로 보여 드릴게요(감점 없음). 휴대폰 설정에서 한국어 음성을 내려받으면 들을 수 있어요.";
  if (speech.failed) return "음성을 재생하지 못했어요. 대사를 글자로 보여 드릴게요(감점 없음).";
  if (speech.status === "checking") return "음성을 준비하고 있어요…";
  return null;
}
