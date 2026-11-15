/**
 * MANASARA UI component library — barrel export
 * Import from '@/components/ui' for any component below.
 */

// ── Button ──────────────────────────────────────────────────────────────────
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

// ── Input ────────────────────────────────────────────────────────────────────
export { Input } from './input';
export type { InputProps } from './input';

// ── Label ────────────────────────────────────────────────────────────────────
export { Label } from './label';

// ── Badge ────────────────────────────────────────────────────────────────────
export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';

// ── Card ─────────────────────────────────────────────────────────────────────
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

// ── Separator ─────────────────────────────────────────────────────────────────
export { Separator } from './separator';

// ── Toast ─────────────────────────────────────────────────────────────────────
export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './toast';
export type { ToastProps, ToastActionElement } from './toast';

// ── use-toast ──────────────────────────────────────────────────────────────
export { useToast, toast } from './use-toast';
export type { ToasterToast } from './use-toast';

// ── Toaster ───────────────────────────────────────────────────────────────────
export { Toaster } from './toaster';

// ── Dialog ────────────────────────────────────────────────────────────────────
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

// ── Select ────────────────────────────────────────────────────────────────────
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

// ── Checkbox ──────────────────────────────────────────────────────────────────
export { Checkbox } from './checkbox';

// ── Skeleton ──────────────────────────────────────────────────────────────────
export { Skeleton } from './skeleton';

// ── Spinner ───────────────────────────────────────────────────────────────────
export { Spinner } from './spinner';

// ── Alert ─────────────────────────────────────────────────────────────────────
export { Alert, AlertTitle, AlertDescription } from './alert';

// ── ScrollArea ────────────────────────────────────────────────────────────────
export { ScrollArea, ScrollBar } from './scroll-area';

// ── Tabs ──────────────────────────────────────────────────────────────────────
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// ── DropdownMenu ──────────────────────────────────────────────────────────────
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu';

// ── Textarea ──────────────────────────────────────────────────────────────────
export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

// ── Table ─────────────────────────────────────────────────────────────────────
export {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

// ── Switch ────────────────────────────────────────────────────────────────────
export { Switch } from './switch';
