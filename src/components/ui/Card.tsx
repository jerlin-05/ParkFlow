import { HTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-line-strong bg-panel/90 backdrop-blur-sm shadow-panel",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
