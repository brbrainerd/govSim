/**
 * Toast notification store. Components import { toasts, pushToast } and
 * the global <ToastViewport /> renders the stack.
 */

export type ToastVariant = "info"|"success"|"warning"|"danger";

export interface Toast {
  id:        number;
  variant:   ToastVariant;
  title?:    string;
  message:   string;
  /** Auto-dismiss after this many ms. 0 = sticky. */
  duration:  number;
}

let nextId = 1;

export const toasts = $state<{ items: Toast[] }>({ items: [] });

export function pushToast(
  message: string,
  opts: { variant?: ToastVariant; title?: string; duration?: number } = {}
): number {
  const id = nextId++;
  const t: Toast = {
    id,
    variant:  opts.variant ?? "info",
    title:    opts.title,
    message,
    duration: opts.duration ?? 4000,
  };
  toasts.items = [...toasts.items, t];
  if (t.duration > 0) {
    setTimeout(() => dismissToast(id), t.duration);
  }
  return id;
}

export function dismissToast(id: number) {
  toasts.items = toasts.items.filter(t => t.id !== id);
}

/** Convenience helpers. */
export const toast = {
  info:    (msg: string, title?: string) => pushToast(msg, { variant: "info",    title }),
  success: (msg: string, title?: string) => pushToast(msg, { variant: "success", title }),
  warning: (msg: string, title?: string) => pushToast(msg, { variant: "warning", title }),
  danger:  (msg: string, title?: string) => pushToast(msg, { variant: "danger",  title, duration: 8000 }),
  error:   (err: unknown, title = "Error") =>
    pushToast(String(err instanceof Error ? err.message : err), { variant: "danger", title, duration: 8000 }),
};
