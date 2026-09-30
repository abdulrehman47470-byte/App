import { Info } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Chip } from '@/components/ui/chip';
import { PickerField, Switch } from '@/components/ui/picker';
import { WheelPicker } from '@/components/ui/wheel-picker';
import {
  BIO_MAX,
  COUNTRIES_PLACEHOLDER,
  ETHNICITIES_PLACEHOLDER,
  GENDERS_PLACEHOLDER,
  PRONOUNS,
  STATES_BY_COUNTRY,
  USER_TYPES,
} from '@/data/options';
import { ageFromDob, MIN_AGE } from '@/lib/utils';
import type { MyProfile } from '@/types';

export const ZIP_PATTERNS: Record<string, RegExp> = {
  'United States': /^\d{5}(-\d{4})?$/,
  Canada: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
};

export function demographicsErrors(d: MyProfile) {
  const e: Partial<Record<keyof MyProfile, string>> = {};
  if (!d.name.trim()) e.name = 'Name is required.';
  if (!d.userType) e.userType = 'Choose your cigar knowledge level.';
  if (!d.country) e.country = 'Choose a country.';
  if (!d.city.trim()) e.city = 'City is required.';
  const zipRe = ZIP_PATTERNS[d.country];
  if (d.zip && zipRe && !zipRe.test(d.zip.trim())) e.zip = `Enter a valid ${d.country === 'Canada' ? 'postal' : 'ZIP'} code.`;
  if (d.website && !/^https?:\/\/\S+\.\S+/.test(d.website)) e.website = 'Start with https://';
  return e;
}

const HANDLE = /^@?[A-Za-z0-9._]{1,30}$/;

export function StepDemographics({
  d,
  patch,
  showErrors,
}: {
  d: MyProfile;
  patch: (p: Partial<MyProfile>) => void;
  showErrors: boolean;
}) {
  const errors = showErrors ? demographicsErrors(d) : {};
  const states = STATES_BY_COUNTRY[d.country];
  const computedAge = d.dob ? ageFromDob(d.dob) : d.age || MIN_AGE;

  return (
    <div className="space-y-5">
      <Field label="Name" error={errors.name} hint="Prefilled from sign-up. Only your first name shows on cards.">
        {(id, desc) => <Input id={id} aria-describedby={desc} value={d.name} onChange={(e) => patch({ name: e.target.value })} autoComplete="name" />}
      </Field>

      <Field label="Age" hint={d.dob ? 'Calculated from your verified date of birth.' : `Minimum ${MIN_AGE}.`}>
        {() => (
          <WheelPicker
            label="Age"
            min={MIN_AGE}
            max={99}
            value={computedAge}
            disabled={!!d.dob}
            onChange={(age) => patch({ age })}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Gender">
          {(id) => (
            // TODO(needs-client): "Gender preference" = own gender or who to match with? Placeholder list.
            <Select id={id} value={d.gender ?? ''} onChange={(e) => patch({ gender: e.target.value || undefined })}>
              <option value="">Select</option>
              {GENDERS_PLACEHOLDER.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Pronouns">
          {(id) => (
            <Select id={id} value={d.pronouns ?? ''} onChange={(e) => patch({ pronouns: e.target.value || undefined })}>
              <option value="">Select</option>
              {PRONOUNS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="space-y-2">
        <Field label="Ethnicity" optional>
          {(id) => (
            <Select id={id} value={d.ethnicity ?? ''} onChange={(e) => patch({ ethnicity: e.target.value || undefined })}>
              <option value="">Prefer not to say</option>
              {ETHNICITIES_PLACEHOLDER.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface/60 px-4 py-2.5">
          <p className="text-xs text-muted">Show ethnicity on my profile. Never used for matching.</p>
          <Switch
            label="Show ethnicity on my profile"
            checked={d.visibility.ethnicity}
            onCheckedChange={(v) => patch({ visibility: { ...d.visibility, ethnicity: v } })}
          />
        </div>
      </div>

      <div className="h-px bg-line" />

      <Field label="Country" error={errors.country}>
        {() => (
          <PickerField
            label="Country"
            options={COUNTRIES_PLACEHOLDER}
            value={d.country ? [d.country] : []}
            onChange={([c]) => patch({ country: c, state: '' })}
            searchPlaceholder="Search country"
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={d.country === 'Canada' ? 'Province' : 'State'}>
          {(id) =>
            states ? (
              <Select id={id} value={d.state} onChange={(e) => patch({ state: e.target.value })}>
                <option value="">Select</option>
                {states.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            ) : (
              <Input id={id} value={d.state} onChange={(e) => patch({ state: e.target.value })} placeholder="Region" />
            )
          }
        </Field>
        <Field label={d.country === 'United States' ? 'ZIP code' : 'Postal code'} error={errors.zip}>
          {(id, desc) => (
            <Input id={id} aria-describedby={desc} value={d.zip} onChange={(e) => patch({ zip: e.target.value })} inputMode={d.country === 'United States' ? 'numeric' : 'text'} autoComplete="postal-code" />
          )}
        </Field>
      </div>

      <Field label="City" error={errors.city}>
        {(id, desc) => <Input id={id} aria-describedby={desc} value={d.city} onChange={(e) => patch({ city: e.target.value })} autoComplete="address-level2" />}
      </Field>

      <div className="h-px bg-line" />

      <div>
        <p className="mb-1 text-sm font-medium text-text">Cigar knowledge</p>
        <p className="mb-3 text-xs text-faint">Shown as a badge on your card and profile.</p>
        <div role="radiogroup" aria-label="Cigar knowledge" className="flex flex-wrap gap-2">
          {USER_TYPES.map((t) => (
            <Chip key={t.id} role="radio" label={t.label} selected={d.userType === t.id} onToggle={() => patch({ userType: t.id })} />
          ))}
        </div>
        {errors.userType && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {errors.userType}
          </p>
        )}
      </div>

      <Field label="Biography" aside={<span className="text-xs text-faint">{d.bio.length}/{BIO_MAX}</span>}>
        {(id) => (
          <Textarea
            id={id}
            maxLength={BIO_MAX}
            value={d.bio}
            onChange={(e) => patch({ bio: e.target.value })}
            placeholder="Tell members about yourself: favorite smokes, go-to lounge, what you're looking for…"
          />
        )}
      </Field>

      <Field label="Website" optional error={errors.website}>
        {(id, desc) => <Input id={id} aria-describedby={desc} type="url" value={d.website} onChange={(e) => patch({ website: e.target.value })} placeholder="https://" />}
      </Field>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium text-text">
          Social media <span className="text-xs font-normal text-faint">(optional)</span>
        </legend>
        {(
          [
            ['instagram', 'Instagram', '@username'],
            ['facebook', 'Facebook', '@username'],
            ['linkedin', 'LinkedIn', 'linkedin.com/in/username'],
          ] as const
        ).map(([key, label, ph]) => {
          const v = d[key];
          const invalid = showErrors && v && (key === 'linkedin' ? !/linkedin\.com\/in\/\S+|^@?[\w-]{3,}$/.test(v) : !HANDLE.test(v));
          return (
            <Field key={key} label={label} error={invalid ? `Enter a valid ${label} handle.` : undefined}>
              {(id, desc) => <Input id={id} aria-describedby={desc} value={v} onChange={(e) => patch({ [key]: e.target.value })} placeholder={ph} />}
            </Field>
          );
        })}
      </fieldset>

      <p className="flex items-start gap-2 text-xs text-faint">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Gender, pronoun, ethnicity and country lists are placeholders until the client supplies the final lists.
      </p>
    </div>
  );
}
