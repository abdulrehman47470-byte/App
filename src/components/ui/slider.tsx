import * as SliderPrimitive from '@radix-ui/react-slider';

export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  labels,
}: {
  value: number[];
  onValueChange: (v: number[]) => void;
  min: number;
  max: number;
  step?: number;
  labels: string[];
}) {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      className="relative flex h-11 w-full touch-none select-none items-center"
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-surface-2">
        <SliderPrimitive.Range className="gold-gradient absolute h-full" />
      </SliderPrimitive.Track>
      {value.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={labels[i]}
          className="block size-6 rounded-full border-2 border-gold-light bg-gold shadow-[var(--shadow-glow)] transition-transform hover:scale-110"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
