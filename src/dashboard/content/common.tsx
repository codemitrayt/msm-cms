import type { ReactNode } from 'react';
import type { Course, Institute } from '../../data/types';
import { Card, Input, cx } from '../../ui';

export const TYPES: Institute['type'][] = ['university', 'college', 'institute'];
export const OWNERSHIPS: Institute['ownership'][] = ['government', 'private', 'deemed', 'public_private'];
export const STATUSES: Institute['status'][] = ['draft', 'in_review', 'published', 'archived'];
export const COURSE_STATUSES: Course['status'][] = ['draft', 'pending', 'published'];
export const label = (s: string) => s.replace(/_/g, ' ').replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const opts = (arr: string[]) => arr.map((v) => ({ value: v, label: label(v) }));

export function Section({ title, description, actions, children, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cx('p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

export function NumInput({ value, onChange, className, step, placeholder }: { value: number | null | undefined; onChange: (v: number | null) => void; className?: string; step?: number; placeholder?: string }) {
  return (
    <Input type="number" step={step} placeholder={placeholder} className={className} value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
  );
}

/** College score: a checklist of profile completeness, 0-100. */
export function scoreChecklist(inst: Institute, courseCount: number) {
  const checks = [
    { label: 'About (200+ characters)', ok: inst.about.replace(/<[^>]+>/g, '').length >= 200 },
    { label: 'Cover image', ok: !!inst.cover },
    { label: 'Gallery (4+ photos)', ok: inst.gallery.length >= 4 },
    { label: 'At least one course', ok: courseCount > 0 },
    { label: 'Contact email & phone', ok: !!inst.email && !!inst.phone },
    { label: 'Address & pincode', ok: !!inst.campusAddress && !!inst.pincode },
    { label: 'Amenities (3+)', ok: inst.amenityIds.length >= 3 },
    { label: 'Top recruiters', ok: inst.topRecruiterIds.length > 0 },
    { label: 'Placement data', ok: inst.placementData.length > 0 },
    { label: 'Rankings', ok: inst.rankings.length > 0 },
    { label: 'Cut-off data', ok: inst.cutoffData.length > 0 },
    { label: 'SEO title & description', ok: !!inst.seo.title && !!inst.seo.description },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { checks, score };
}
