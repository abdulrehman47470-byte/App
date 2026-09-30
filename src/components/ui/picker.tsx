import { Check, ChevronRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from './button';
import { SearchInput } from './misc';
import { Sheet } from './sheet';
import { cn } from '@/lib/utils';

/** A row that opens a searchable single or multi-select sheet. */
export function PickerField({
  label,
  options,
  value,
  onChange,
  multiple,
  icon,
  placeholder = 'Select',
  searchPlaceholder,
  hint,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
  icon?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<string[]>(value);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? options.filter((o) => o.toLowerCase().includes(n)) : options;
  }, [q, options]);

  const openSheet = () => {
    setDraft(value);
    setQ('');
    setOpen(true);
  };
  const toggle = (o: string) => {
    if (!multiple) {
      onChange([o]);
      setOpen(false);
      return;
    }
    setDraft((d) => (d.includes(o) ? d.filter((x) => x !== o) : [...d, o]));
  };

  const summary = value.length ? (value.length > 2 ? `${value.slice(0, 2).join(', ')} +${value.length - 2}` : value.join(', ')) : placeholder;

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        className="flex min-h-14 w-full items-center gap-3 rounded-[14px] border border-line bg-bg-elevated px-4 py-2.5 text-left transition-colors hover:border-line-strong"
      >
        {icon && <span className="text-gold">{icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-text">{label}</span>
          <span className={cn('block truncate text-xs', value.length ? 'text-gold-light' : 'text-faint')}>{summary}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={label}
        description={hint ?? (multiple ? 'Choose all that apply.' : 'Choose one.')}
        footer={
          multiple ? (
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setDraft([])}>
                Clear
              </Button>
              <Button
                block
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                Done{draft.length ? ` (${draft.length})` : ''}
              </Button>
            </div>
          ) : undefined
        }
      >
        {options.length > 8 && (
          <SearchInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}`}
            aria-label={`Search ${label}`}
            className="sticky top-0 z-10 mb-2 bg-surface pb-2"
          />
        )}
        <ul role="listbox" aria-multiselectable={multiple} aria-label={label} className="divide-y divide-line/50">
          {filtered.map((o) => {
            const sel = (multiple ? draft : value).includes(o);
            return (
              <li key={o} role="option" aria-selected={sel}>
                <button
                  type="button"
                  onClick={() => toggle(o)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-[15px] text-text"
                >
                  {o}
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full border',
                      sel ? 'border-gold bg-gold text-gold-ink' : 'border-line-strong',
                    )}
                  >
                    {sel && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
          {!filtered.length && <li className="py-8 text-center text-sm text-muted">No matches for “{q}”.</li>}
        </ul>
      </Sheet>
    </>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors before:absolute before:-inset-2 before:content-[""]',
        checked ? 'border-gold bg-gold/80' : 'border-line-strong bg-surface-2',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-text shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
