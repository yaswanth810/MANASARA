/**
 * use-toast.ts
 * Lightweight toast state manager — no external state lib required.
 * Inspired by shadcn/ui's toast hook pattern.
 */

import * as React from 'react';
import type { ToastActionElement, ToastProps } from './toast';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY_MS = 1_000_000; // effectively kept until dismissed

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

/** Map of toast-id → timeout handle used for auto-removal after animation */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string, dispatch: React.Dispatch<Action>) {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY_MS);
  toastTimeouts.set(toastId, timeout);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case 'DISMISS_TOAST': {
      const { toastId } = action;
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts:
          action.toastId === undefined
            ? []
            : state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

/* ─── Singleton listener pattern so toasts work outside React components ── */
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return String(count);
}

type Listeners = Array<React.Dispatch<Action>>;
const listeners: Listeners = [];
let memoryState: State = { toasts: [] };

function globalDispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(action));
}

/* ─── Public toast() helper ─────────────────────────────────────────────── */
type ToastOptions = Omit<ToasterToast, 'id'>;

function toast(opts: ToastOptions) {
  const id = genId();

  function update(props: Partial<ToasterToast>) {
    globalDispatch({ type: 'UPDATE_TOAST', toast: { ...props, id } });
  }
  function dismiss() {
    globalDispatch({ type: 'DISMISS_TOAST', toastId: id });
  }

  globalDispatch({
    type: 'ADD_TOAST',
    toast: { ...opts, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } },
  });

  return { id, dismiss, update };
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */
function useToast() {
  const [state, dispatch] = React.useReducer(reducer, memoryState);

  React.useEffect(() => {
    const listener: React.Dispatch<Action> = () => {
      // Re-sync local state from the global snapshot
      dispatch({ type: 'REMOVE_TOAST' }); // triggers a full re-render via our memo
    };

    // We actually use a simpler approach: just forward state updates
    const syncListener: React.Dispatch<Action> = (action) => {
      dispatch(action);
    };

    listeners.push(syncListener);
    return () => {
      const idx = listeners.indexOf(syncListener);
      if (idx > -1) listeners.splice(idx, 1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      globalDispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

export { useToast, toast };
export type { ToasterToast };
