// Legal and policy copy. PHASE 0 PLACEHOLDERS ONLY.
// TODO(requirements): Phase 7 replaces these with the exact text of the client's documents
// (Privacy Policy, Terms and Conditions, Code of Ethics, Indemnification), stored in
// /content/legal/*.md, effective date August 13, 2026. Never edit or invent legal wording here;
// keep "[Insert ... address]" placeholders from the source docs visible.

export const EFFECTIVE_DATE = 'August 13, 2026';

/** Short summary shown during sign-up. Wording from the approved concept board; confirm against Code of Ethics.docx. */
export const ETHICS_SUMMARY = [
  { title: 'Respect and inclusion', body: 'Treat every member with courtesy, whatever their experience level or background.' },
  { title: 'No underage use', body: 'Daily Stogie is for adults 21 and over. Never involve minors.' },
  { title: 'No illegal activity', body: 'Follow local laws, including smoking and tobacco regulations.' },
  { title: 'No harassment', body: 'No threats, hate speech, unwanted advances or repeated unwanted contact.' },
  { title: 'Keep it classy', body: 'Keep conversations respectful. No selling, spam or solicitation.' },
];

export const PHOTO_RULES = [
  'Genuine and recent: clearly shows your face',
  'No explicit or suggestive content',
  'No logos or advertisements',
  'No stock images or photos of other people',
];

export interface LegalDoc {
  slug: 'privacy' | 'terms' | 'ethics' | 'indemnification';
  title: string;
  source: string;
}

export const LEGAL_DOCS: LegalDoc[] = [
  { slug: 'privacy', title: 'Privacy Policy', source: 'Privacy Policy.docx' },
  { slug: 'terms', title: 'Terms & Conditions', source: 'Terms and Conditions.docx' },
  { slug: 'ethics', title: 'Stogie Ethics', source: 'Code of Ethics.docx' },
  { slug: 'indemnification', title: 'Indemnification Clause', source: 'Indemnification.docx' },
];
