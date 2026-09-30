import { ChevronDown } from 'lucide-react';
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-[14px] border border-line bg-bg-elevated px-4 text-[15px] text-text placeholder:text-faint transition-colors hover:border-line-strong focus:border-gold focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn(control, 'h-12', className)} {...p} />,
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => (
    <textarea ref={ref} className={cn(control, 'min-h-28 resize-y py-3 leading-relaxed', className)} {...p} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...p }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(control, 'h-12 appearance-none pr-10', className)} {...p}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        strokeWidth={1.5}
      />
    </div>
  ),
);
Select.displayName = 'Select';

/** Label + control + hint/error, with ids wired for accessibility. */
export function Field({
  label,
  hint,
  error,
  optional,
  children,
  aside,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  aside?: ReactNode;
  children: (id: string, describedBy?: string) => ReactNode;
}) {
  const id = useId();
  const descId = hint || error ? `${id}-desc` : undefined;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {optional && <span className="ml-1.5 text-xs font-normal text-faint">(optional)</span>}
        </label>
        {aside}
      </div>
      {children(id, descId)}
      {(hint || error) && (
        <p
          id={descId}
          className={cn('text-xs', error ? 'text-danger' : 'text-faint')}
          role={error ? 'alert' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
