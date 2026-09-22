"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/primitives";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // The server cannot know the resolved theme, so the icon is only rendered
  // after hydration to avoid a flash of the wrong glyph.
  React.useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Change theme">
          {mounted && theme === "dark" ? (
            <Moon className="size-4" />
          ) : mounted && theme === "light" ? (
            <Sun className="size-4" />
          ) : (
            <Monitor className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => setTheme(option.value)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <option.icon />
              {option.label}
            </span>
            {mounted && theme === option.value ? <Check className="size-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
