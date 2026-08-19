"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "ghost" | "danger" | "subtle" | "success";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-amber text-asphalt hover:bg-amber-light shadow-[0_8px_20px_-8px_rgba(245,183,0,0.6)]",
  ghost: "border border-line-strong text-fog bg-transparent hover:border-mist hover:bg-white/[0.03]",
  danger: "border border-red/50 text-red bg-transparent hover:bg-red/10",
  subtle: "bg-asphalt-3 text-fog hover:bg-white/[0.06] border border-line-strong",
  success: "bg-green text-asphalt hover:bg-green-light shadow-[0_8px_20px_-8px_rgba(47,214,153,0.5)]",
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-3 text-[14.5px]",
  sm: "px-3.5 py-2 text-[12.5px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", full, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg font-heading font-semibold transition-all duration-150",
          "hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          variantClasses[variant],
          sizeClasses[size],
          full && "w-full",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
