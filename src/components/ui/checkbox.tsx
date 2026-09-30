import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { useId, type ReactNode } from 'react';

export function CheckboxRow({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-line-strong bg-bg-elevated transition-colors before:absolute before:-inset-2.5 before:content-[''] data-[state=checked]:border-gold data-[state=checked]:bg-gold"
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-4 text-gold-ink" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-muted">
        {children}
      </label>
    </div>
  );
}
