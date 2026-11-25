// Small helpers shared by the publishing screens.
import { ExternalLink, ArrowUp, ArrowDown, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PublishStatus, Id } from '../../data/types';
import { Button, Badge, Select, cx } from '../../ui';
import { useCan } from '../Layout';

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export function PreviewLink({ href, label = 'Preview on website', size = 'md' }: { href: string; label?: string; size?: 'sm' | 'md' }) {
  const sep = href.includes('?') ? '&' : '?';
  return (
    <a href={`#${href}${sep}preview=1`} target="_blank" rel="noreferrer"
      className={cx('inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 hover:bg-slate-50', size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm')}>
      <ExternalLink className="h-3.5 w-3.5" />{label}
    </a>
  );
}

/**
 * Status control obeying permissions: users with `<mod>.publish` choose any
 * status; others can only keep a draft or submit it for review.
 */
export function StatusControl({ mod, value, onChange }: { mod: string; value: PublishStatus; onChange: (s: PublishStatus) => void }) {
  const can = useCan();
  if (can(`${mod}.publish`)) {
    return <Select value={value} onChange={(e) => onChange(e.target.value as PublishStatus)} options={STATUS_OPTIONS} />;
  }
  return (
    <div className="flex items-center gap-2">
      <Badge>{value}</Badge>
      {value === 'draft' && <Button size="sm" variant="outline" type="button" onClick={() => onChange('in_review')}>Submit for review</Button>}
      {value === 'in_review' && <Button size="sm" variant="ghost" type="button" onClick={() => onChange('draft')}>Back to draft</Button>}
    </div>
  );
}

/** Ordered multi-pick list with up/down/remove. */
export function OrderedPicker({ ids, onChange, label, options }: { ids: Id[]; onChange: (ids: Id[]) => void; label: (id: Id) => ReactNode; options: { value: number; label: string }[] }) {
  const move = (i: number, d: number) => { const n = [...ids]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  const rest = options.filter((o) => !ids.includes(o.value));
  return (
    <div className="space-y-2">
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {ids.map((id, i) => (
          <div key={id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
            <span className="w-5 text-xs text-slate-400">{i + 1}</span>
            <span className="flex-1 truncate">{label(id)}</span>
            <button type="button" className="rounded p-1 hover:bg-slate-100 cursor-pointer" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" className="rounded p-1 hover:bg-slate-100 cursor-pointer" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" className="rounded p-1 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => onChange(ids.filter((x) => x !== id))}><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {!ids.length && <div className="px-3 py-3 text-xs text-slate-400">None selected</div>}
      </div>
      {rest.length > 0 && <Select value="" placeholder="+ Add…" options={rest} onChange={(e) => e.target.value && onChange([...ids, Number(e.target.value)])} />}
    </div>
  );
}

export function Counter({ value, max }: { value: string; max: number }) {
  return <span className={cx('text-[11px]', value.length > max ? 'text-red-600' : 'text-slate-400')}>{value.length}/{max}</span>;
}

export const numOrNull = (v: string) => (v === '' ? null : Number(v));
