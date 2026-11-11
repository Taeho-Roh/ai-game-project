import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { buttonVariants } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <AppShell>
      <div className="py-16 text-center">
        <p className="caption-text text-[44px] [--cap-fill:#FF4F8B]">땡!</p>
        <h1 className="mt-4 text-lg font-extrabold">이 주소에는 퀴즈가 없어요</h1>
        <p className="mt-1 text-sm text-ink/60">주소가 바뀌었거나 내려간 퀴즈예요. 목록에서 다시 골라 주세요.</p>
        <Link to="/" className={buttonVariants({ className: "mt-6" })}>
          퀴즈 목록 보기
        </Link>
      </div>
    </AppShell>
  );
}
