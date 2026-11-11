import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold leading-5", {
  variants: {
    variant: {
      default: "bg-ink text-paper",
      outline: "border border-ink/25 text-ink",
      caption: "bg-caption text-ink",
      sky: "bg-sky/15 text-[#1F5FA8]",
      sample: "border border-dashed border-ink/50 bg-white text-ink",
      onScreen: "bg-white/12 text-white/85 ring-1 ring-white/20",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// eslint-disable-next-line react-refresh/only-export-components
export { Badge, badgeVariants };
