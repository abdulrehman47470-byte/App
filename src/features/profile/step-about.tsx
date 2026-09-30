import { BookOpen, Briefcase, Dumbbell, Globe2, Landmark, Music2, Palette, ShieldCheck, Lock } from 'lucide-react';
import type { ComponentType } from 'react';
import { PickerField, Switch } from '@/components/ui/picker';
import { ABOUT_YOU_FIELDS } from '@/data/options';
import type { AboutYou, Visibility } from '@/types';

const ICONS: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  industry: Briefcase, sports: Dumbbell, hobbies: Palette, firstResponder: ShieldCheck,
  languages: Globe2, religion: BookOpen, music: Music2, political: Landmark,
};

export function StepAbout({
  about,
  visibility,
  onChange,
  onVisibility,
}: {
  about: AboutYou;
  visibility: Visibility;
  onChange: (a: AboutYou) => void;
  onVisibility: (v: Visibility) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Optional: add more about yourself. It helps find members you will click with.</p>
      {ABOUT_YOU_FIELDS.map((f) => {
        const Icon = ICONS[f.id];
        const visKey = f.id as 'religion' | 'political';
        return (
          <div key={f.id} className="space-y-2">
            <PickerField
              label={f.label}
              options={f.options}
              value={about[f.id] ?? []}
              onChange={(v) => onChange({ ...about, [f.id]: v })}
              multiple={!f.sensitive}
              icon={<Icon className="size-5" strokeWidth={1.5} />}
              placeholder="Add"
              hint={f.sensitive ? 'Optional. Hidden unless you choose to show it. Never used for matching.' : undefined}
            />
            {f.sensitive && (
              <div className="ml-4 flex items-center justify-between gap-3 border-l border-line pl-4">
                <p className="text-xs text-muted">Show {f.label.toLowerCase()} on my profile</p>
                <Switch
                  label={`Show ${f.label} on my profile`}
                  checked={visibility[visKey]}
                  onCheckedChange={(v) => onVisibility({ ...visibility, [visKey]: v })}
                />
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-4 flex items-start gap-3 rounded-[14px] border border-line bg-surface/60 p-4 text-xs leading-relaxed text-muted">
        <Lock className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.5} />
        Religion, political affiliation and ethnicity are optional, can be hidden from other members, and are never
        used for matching. By adding them you consent to us storing this information. You can remove it at any time.
      </div>
    </div>
  );
}
