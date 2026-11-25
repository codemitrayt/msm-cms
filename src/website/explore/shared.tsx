import { useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStore, nowIso } from '../../store';
import { Button, Input, Field, cx } from '../../ui';
import type { Lead, PublishStatus } from '../../data/types';

/** True when ?preview=1 is set: drafts are visible too. */
export function usePreview() {
  const [sp] = useSearchParams();
  return sp.get('preview') === '1';
}
export const visible = (status: PublishStatus | string, preview: boolean) => preview || status === 'published';

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto max-w-7xl px-4 pb-24 pt-6', className)}>{children}</div>;
}

export function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {c.to ? <Link to={c.to} className="hover:text-brand">{c.label}</Link> : <span className="text-slate-700">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-slate-900">{children}</h2>
      {action}
    </div>
  );
}

const PHONE_RE = /^[6-9]\d{9}$/;
export const validPhone = (p: string) => PHONE_RE.test(p.replace(/\D/g, '').slice(-10)) && p.replace(/\D/g, '').length >= 10;

/** Create a Lead record (returns it). */
export function useCreateLead() {
  const add = useStore((s) => s.add);
  const crm = useStore((s) => s.config.crmPushEnabled);
  const loc = useLocation();
  return (data: Partial<Lead> & { name: string; phone: string; source: Lead['source'] }) =>
    add('leads', {
      email: '', stateId: null, cityId: null, courseInterest: '', instituteId: null, page: loc.pathname, status: 'new', pushedToCrm: crm, notes: '', createdAt: nowIso(),
      ...data,
    });
}

/** Small inline lead form: name + phone (+ optional email). Pre-fills from logged-in student. */
export function LeadForm({ onSubmit, cta = 'Submit', withEmail, compact }: { onSubmit: (v: { name: string; phone: string; email: string }) => void; cta?: string; withEmail?: boolean; compact?: boolean }) {
  const student = useStore((s) => s.student);
  const toast = useStore((s) => s.toast);
  const [name, setName] = useState(student?.name ?? '');
  const [phone, setPhone] = useState(student?.phone ?? '');
  const [email, setEmail] = useState(student?.email ?? '');
  return (
    <form
      className={cx('grid gap-3', compact ? 'sm:grid-cols-[1fr_1fr_auto] items-end' : '')}
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 2) return toast('Please enter your name', 'error');
        if (!validPhone(phone)) return toast('Enter a valid 10-digit mobile number', 'error');
        if (withEmail && email && !/^\S+@\S+\.\S+$/.test(email)) return toast('Enter a valid email', 'error');
        onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      }}
    >
      <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></Field>
      <Field label="Mobile number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" /></Field>
      {withEmail && <Field label="Email (optional)"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>}
      <Button type="submit" className={compact ? '' : 'w-full'}>{cta}</Button>
    </form>
  );
}

/** Download a generated text "file" (stand-in for real PDFs). */
export function downloadText(filename: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/pdf' }));
  a.download = filename;
  a.click();
}

export const fmtDay = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
