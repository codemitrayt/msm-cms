// Shared UI kit for both Website and Dashboard. Plain Tailwind, no extra deps.
import clsx from 'clsx';
import { X, Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useStore } from './store';

export const cx = clsx;

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'blue' | 'outline';
export function Button({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer',
        size === 'sm' && 'h-8 px-3 text-xs', size === 'md' && 'h-9 px-4 text-sm', size === 'lg' && 'h-11 px-6 text-base',
        variant === 'primary' && 'bg-brand text-white hover:bg-brand-hover',
        variant === 'blue' && 'bg-cta-blue text-white hover:brightness-110',
        variant === 'secondary' && 'bg-slate-100 text-slate-800 hover:bg-slate-200',
        variant === 'outline' && 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        variant === 'ghost' && 'text-slate-600 hover:bg-slate-100',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
    />
  );
}

export const inputCls = 'h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15';
export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(inputCls, className)} />;
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(inputCls, 'h-auto min-h-24 py-2', className)} />;
}
export function Select({ className, options, placeholder, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[]; placeholder?: string }) {
  return (
    <select {...p} className={cx(inputCls, 'pr-8', className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block space-y-1', className)}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <span className={cx('relative h-5 w-9 rounded-full transition', checked ? 'bg-brand' : 'bg-slate-300')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition', checked ? 'left-4.5' : 'left-0.5')} />
      </span>
      {label}
    </button>
  );
}
export function SearchInput({ value, onChange, placeholder = 'Search…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-xl border border-slate-200 bg-white', className)}>{children}</div>;
}

const tones: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200', active: 'bg-emerald-50 text-emerald-700 ring-emerald-200', open: 'bg-emerald-50 text-emerald-700 ring-emerald-200', approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200', done: 'bg-emerald-50 text-emerald-700 ring-emerald-200', converted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  draft: 'bg-slate-100 text-slate-600 ring-slate-200', closed: 'bg-slate-100 text-slate-600 ring-slate-200', disabled: 'bg-slate-100 text-slate-600 ring-slate-200', archived: 'bg-slate-100 text-slate-600 ring-slate-200',
  in_review: 'bg-amber-50 text-amber-700 ring-amber-200', pending: 'bg-amber-50 text-amber-700 ring-amber-200', invited: 'bg-amber-50 text-amber-700 ring-amber-200', processing: 'bg-amber-50 text-amber-700 ring-amber-200', contacted: 'bg-amber-50 text-amber-700 ring-amber-200',
  new: 'bg-blue-50 text-blue-700 ring-blue-200', interested: 'bg-violet-50 text-violet-700 ring-violet-200', queued: 'bg-blue-50 text-blue-700 ring-blue-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200', failed: 'bg-red-50 text-red-700 ring-red-200', expired: 'bg-red-50 text-red-700 ring-red-200', 'not-interested': 'bg-red-50 text-red-700 ring-red-200',
};
export function Badge({ children, tone, className }: { children: ReactNode; tone?: string; className?: string }) {
  const key = tone ?? (typeof children === 'string' ? children : '');
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset capitalize', tones[key] ?? 'bg-slate-100 text-slate-700 ring-slate-200', className)}>{typeof children === 'string' ? children.replace(/[_-]/g, ' ') : children}</span>;
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-[8vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('w-full rounded-2xl bg-white shadow-2xl', size === 'sm' && 'max-w-md', size === 'md' && 'max-w-xl', size === 'lg' && 'max-w-3xl', size === 'xl' && 'max-w-5xl')}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** Right-side drawer, used by dashboard editors. */
export function Sheet({ open, onClose, title, children, footer, width = 'max-w-2xl' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('flex h-full w-full flex-col bg-white shadow-2xl', width)}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{ msg: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = (msg: string) => new Promise<boolean>((resolve) => setState({ msg, resolve }));
  const node = (
    <Modal open={!!state} onClose={() => { state?.resolve(false); setState(null); }} title="Are you sure?" size="sm"
      footer={<><Button variant="outline" onClick={() => { state?.resolve(false); setState(null); }}>Cancel</Button><Button variant="danger" onClick={() => { state?.resolve(true); setState(null); }}>Confirm</Button></>}>
      <p className="text-sm text-slate-600">{state?.msg}</p>
    </Modal>
  );
  return { confirm, node };
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('flex gap-1 overflow-x-auto border-b border-slate-200 scrollbar-none', className)}>
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition cursor-pointer', value === t.value ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export interface Column<T> { key: string; header: ReactNode; render: (row: T) => ReactNode; className?: string; sort?: (row: T) => string | number }
export function DataTable<T extends { id: number }>({ rows, columns, pageSize = 15, onRowClick, selectable, selected, onSelect, empty = 'Nothing here yet' }: {
  rows: T[]; columns: Column<T>[]; pageSize?: number; onRowClick?: (r: T) => void; selectable?: boolean; selected?: number[]; onSelect?: (ids: number[]) => void; empty?: string;
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  useEffect(() => setPage(0), [rows.length]);
  const col = sort && columns.find((c) => c.key === sort.key);
  const sorted = col?.sort ? [...rows].sort((a, b) => { const x = col.sort!(a); const y = col.sort!(b); return (x > y ? 1 : x < y ? -1 : 0) * sort!.dir; }) : rows;
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice(page * pageSize, page * pageSize + pageSize);
  const sel = new Set(selected ?? []);
  const allOnPage = view.length > 0 && view.every((r) => sel.has(r.id));
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {selectable && <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allOnPage} onChange={() => onSelect?.(allOnPage ? [...sel].filter((id) => !view.some((r) => r.id === id)) : [...new Set([...sel, ...view.map((r) => r.id)])])} /></th>}
              {columns.map((c) => (
                <th key={c.key} className={cx('px-3 py-2.5 font-medium', c.sort && 'cursor-pointer select-none hover:text-slate-800', c.className)}
                  onClick={() => c.sort && setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}>
                  {c.header}{sort?.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {view.map((r) => (
              <tr key={r.id} onClick={() => onRowClick?.(r)} className={cx('hover:bg-slate-50', onRowClick && 'cursor-pointer', sel.has(r.id) && 'bg-brand-soft/40')}>
                {selectable && <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(r.id)} onChange={() => onSelect?.(sel.has(r.id) ? [...sel].filter((x) => x !== r.id) : [...sel, r.id])} /></td>}
                {columns.map((c) => <td key={c.key} className={cx('px-3 py-2.5 align-middle', c.className)}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty text={empty} />}
      </div>
      {rows.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          <span>{page * pageSize + 1}–{Math.min(rows.length, (page + 1) * pageSize)} of {rows.length}</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span>{page + 1} / {pages}</span>
            <Button size="sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Empty({ text = 'Nothing here yet', action }: { text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-sm text-slate-500">
      <Inbox className="h-8 w-8 text-slate-300" />
      {text}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">{label}{icon}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </Card>
  );
}

/** Institute/exam logo: coloured square with initials. */
export function Logo({ text, color = '#fa0000', size = 48, className }: { text: string; color?: string; size?: number; className?: string }) {
  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-sm', className)} style={{ background: color, width: size, height: size, fontSize: size * 0.32 }}>
      {text}
    </div>
  );
}

/** Image with gradient fallback (offline-safe). */
export function Img({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <div className={cx('bg-gradient-to-br from-slate-200 via-slate-100 to-brand-soft', className)} />;
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={cx('object-cover', className)} />;
}

/** Render a lucide icon by name (names stored in data). */
export function DynIcon({ name, className }: { name: string; className?: string }) {
  const C = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <C className={className} />;
}

export function Html({ html, className }: { html: string; className?: string }) {
  return <div className={cx('prose-lite', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-amber-500', className)}>
      {[1, 2, 3, 4, 5].map((i) => <Icons.Star key={i} className={cx('h-3.5 w-3.5', i <= Math.round(value) ? 'fill-current' : 'opacity-30')} />)}
    </span>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => dismiss(t.id)}
          className={cx('pointer-events-auto min-w-64 max-w-sm cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg', t.tone === 'success' && 'bg-emerald-600', t.tone === 'error' && 'bg-red-600', t.tone === 'info' && 'bg-slate-800')}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

/** Small rich-text editor: contentEditable with a basic toolbar. Value is HTML. */
export function RichText({ value, onChange, minHeight = 220 }: { value: string; onChange: (html: string) => void; minHeight?: number }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => { if (el && el.innerHTML !== value && document.activeElement !== el) el.innerHTML = value; }, [el, value]);
  const cmd = (c: string, arg?: string) => { document.execCommand(c, false, arg); if (el) onChange(el.innerHTML); };
  const btn = 'rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 cursor-pointer';
  return (
    <div className="rounded-lg border border-slate-300 focus-within:border-brand">
      <div className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-slate-50 p-1">
        <button type="button" className={btn} onClick={() => cmd('formatBlock', 'h2')}>H2</button>
        <button type="button" className={btn} onClick={() => cmd('formatBlock', 'h3')}>H3</button>
        <button type="button" className={btn} onClick={() => cmd('formatBlock', 'p')}>P</button>
        <button type="button" className={cx(btn, 'font-bold')} onClick={() => cmd('bold')}>B</button>
        <button type="button" className={cx(btn, 'italic')} onClick={() => cmd('italic')}>I</button>
        <button type="button" className={btn} onClick={() => cmd('insertUnorderedList')}>• List</button>
        <button type="button" className={btn} onClick={() => cmd('insertOrderedList')}>1. List</button>
        <button type="button" className={btn} onClick={() => { const u = prompt('Link URL'); if (u) cmd('createLink', u); }}>Link</button>
        <button type="button" className={btn} onClick={() => cmd('insertHTML', '<table><tr><th>Column 1</th><th>Column 2</th></tr><tr><td>Value</td><td>Value</td></tr></table><p></p>')}>Table</button>
        <button type="button" className={btn} onClick={() => cmd('removeFormat')}>Clear</button>
      </div>
      <div ref={setEl} contentEditable suppressContentEditableWarning className="prose-lite px-3 py-2 text-sm outline-none" style={{ minHeight }}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)} />
    </div>
  );
}

/** Multi-select as checkbox chips. */
export function ChipSelect({ options, value, onChange }: { options: { value: number; label: string }[]; value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button type="button" key={o.value} onClick={() => onChange(on ? value.filter((x) => x !== o.value) : [...value, o.value])}
            className={cx('rounded-full border px-2.5 py-1 text-xs transition cursor-pointer', on ? 'border-brand bg-brand-soft text-brand' : 'border-slate-300 text-slate-600 hover:border-slate-400')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
