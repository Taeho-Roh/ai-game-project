import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold transition-[transform,box-shadow,background-color,color] duration-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-[1.15em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** 화면의 주 행동 — 자막 노랑 스티커 */
        default:
          "border-2 border-ink bg-caption text-ink shadow-sticker hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        dark: "border-2 border-ink bg-ink text-paper shadow-sticker hover:bg-ink/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline: "border-2 border-ink bg-white text-ink hover:bg-paper active:translate-y-px",
        soft: "border border-ink/15 bg-white text-ink hover:border-ink/40",
        ghost: "text-ink hover:bg-ink/5",
        link: "text-ink underline underline-offset-4 decoration-2 decoration-caption hover:decoration-ink",
      },
      size: {
        default: "h-12 rounded-xl px-5 text-base",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-14 rounded-2xl px-6 text-lg",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(asChild ? {} : { type: type ?? "button" })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
