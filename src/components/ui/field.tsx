import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const baseField =
  "h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm text-foreground placeholder:text-text-secondary/70 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-status-info";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(baseField, "h-auto min-h-20 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(baseField, "pr-8", className)} {...props} />;
}

export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-text-secondary">
      {children}
      {required ? (
        <span aria-hidden className="ml-0.5 text-status-danger">
          *
        </span>
      ) : null}
    </label>
  );
}

/** Alan altındaki doğrulama/hata mesajı; id ile input aria-describedby bağlanır. */
export function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-status-danger">
      {children}
    </p>
  );
}
