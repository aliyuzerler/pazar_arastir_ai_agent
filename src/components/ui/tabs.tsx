"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center gap-1 rounded-lg border border-border-subtle bg-surface-subtle p-1",
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  value,
  children,
  count,
}: {
  value: string;
  children: ReactNode;
  count?: number;
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-foreground data-[state=active]:bg-surface data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-sm"
    >
      {children}
      {typeof count === "number" ? (
        <span className="rounded bg-surface-subtle px-1.5 text-xs tabular-nums dark:bg-surface-elevated">
          {count}
        </span>
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsPrimitive.Content value={value} className={cn("mt-4 focus:outline-none", className)}>
      {children}
    </TabsPrimitive.Content>
  );
}
