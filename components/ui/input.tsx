import * as React from "react";

import { cn } from "@/lib/utils";

const fieldClasses =
  "flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClasses,
        "h-9 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClasses, "min-h-[72px] resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export { Input, Textarea };
