import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type GitAidIconProps = SVGProps<SVGSVGElement> & {
  variant?: "color" | "mono";
};

export function GitAidIcon({
  className,
  variant = "color",
  ...props
}: GitAidIconProps) {
  const mono = variant === "mono";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <image
        href="/GitAid.png"
        x="0"
        y="0"
        width="64"
        height="64"
        preserveAspectRatio="xMidYMid meet"
        className={mono ? "grayscale" : undefined}
      />
    </svg>
  );
}