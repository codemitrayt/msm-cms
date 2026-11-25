// Tabs that edit OTHER collections (courses, reviews, events…). These save
// straight to the store — they are not part of the institute draft.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pencil, Pin, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Empty, Field, Input, Modal, Select, Stars, Textarea, Toggle, useConfirm, cx } from '../../ui';
import { ago, date, inr } from '../../lib/format';
import type { Course, EventItem, UpdateItem } from '../../data/types';
import type { TabProps } from './InstituteWorkspace';
import { COURSE_STATUSES, NumInput, Section, opts } from './common';
import { AddCourseModal } from './AddCourseModal';
import { useCan } from '../Layout';

const Note = () => <span className="text-[11px] text-slate-400">Changes here save immediately</span>;

export function CoursesTab({ inst }: TabProps) {
  const db = useStore((s) => s.db);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [adding, setAdding] = useState(false);
  const courses = db.courses.filter((c) => c.instituteId === inst.id);
  const setStatus = (c: Course, status: Course['status']) => {
    if (status === 'published' && !can('courses.publish')) return toast('You cannot publish courses', 'error');
    update('courses', c.id, { status, updatedAt: new Date().toISOString() });
    log(`set ${status}`, c.name, c.id);
    toast(`${c.name} → ${status}`);
  };
  return (
    <Section title={`Courses (${courses.length})`} description={<Note />} actions={<>
      <Link to={`/admin/courses/${inst.id}`}><Button size="sm" variant="outline">Open course tree</Button></Link>
      <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" />Add course</Button>
    </>}>
      {node}
      <AddCourseModal inst={inst} open={adding} onClose={() => setAdding(false)} />
      {courses.length ? (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {courses.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <Link to={`/admin/courses/${inst.id}/${c.id}`} className="font-medium hover:text-brand">{c.name}</Link>
                <div className="text-xs text-slate-500">{db.modes.find((m) => m.id === c.modeId)?.name} · {c.durationValue} {c.durationUnit} · {c.totalSeats} seats · {inr(c.fees)}</div>
              </div>
              <Select className="h-8 w-32 text-xs" value={c.status} onChange={(e) => setStatus(c, e.target.value as Course['status'])} options={opts(COURSE_STATUSES)} />
              <Link to={`/admin/courses/${inst.id}/${c.id}`}><Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button></Link>
              {can('courses.delete') && <Button size="sm" variant="ghost" onClick={async () => { if (await confirm(`Delete ${c.name}?`)) { remove('courses', c.id); log('deleted course', c.name, c.id); toast('Course deleted'); } }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}
            </div>
          ))}
        </div>
      ) : <Empty text="No courses yet" />}
    </Section>
  );
}

type FeeRow = Pick<Course, 'id' | 'name' | 'tuitionFees' | 'hostelFees' | 'oneTimeFees' | 'feeForCommission' | 'feeDiscountPercent' | 'fees'>;
export function CourseFeesTab({ inst }: TabProps) {
  const all = useStore((s) => s.db.courses);
  const update = useStore((s) => s.update);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const courses = all.filter((c) => c.instituteId === inst.id);
  const pickRow = (c: Course): FeeRow => ({ id: c.id, name: c.name, tuitionFees: c.tuitionFees, hostelFees: c.hostelFees, oneTimeFees: c.oneTimeFees, feeForCommission: c.feeForCommission, feeDiscountPercent: c.feeDiscountPercent, fees: c.fees });
  const [rows, setRows] = useState<FeeRow[]>(() => courses.map(pickRow));
  useEffect(() => setRows(courses.map(pickRow)), [courses.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = rows.filter((r) => { const c = courses.find((x) => x.id === r.id); return c && JSON.stringify(pickRow(c)) !== JSON.stringify(r); });
  const patch = (id: number, p: Partial<FeeRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const saveAll = () => {
    dirty.forEach((r) => update('courses', r.id, { tuitionFees: r.tuitionFees, hostelFees: r.hostelFees, oneTimeFees: r.oneTimeFees, feeForCommission: r.feeForCommission, feeDiscountPercent: r.feeDiscountPercent, fees: r.tuitionFees + r.oneTimeFees, updatedAt: new Date().toISOString() }));
    log('edited fees of', `${dirty.length} courses (${inst.shortName})`, inst.id);
    toast(`Saved fees for ${dirty.length} courses`);
  };
  const c = 'h-8 text-xs w-28';
  return (
    <Section title="Course fees" description="Total fee = tuition + one-time. Fee for commission is the 1st-year fee used for CRM commission."
      actions={<><Button size="sm" variant="ghost" disabled={!dirty.length} onClick={() => setRows(courses.map(pickRow))}>Reset</Button><Button size="sm" disabled={!dirty.length} onClick={saveAll}>Save all{dirty.length ? ` (${dirty.length})` : ''}</Button></>}>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs text-slate-500"><tr><th className="p-1">Course</th><th className="p-1">Tuition (total)</th><th className="p-1">Hostel / yr</th><th className="p-1">One-time</th><th className="p-1">Fee for commission</th><th className="p-1">Discount %</th><th className="p-1 text-right">Total</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const changed = dirty.some((d) => d.id === r.id);
                return (
                  <tr key={r.id} className={cx(changed && 'bg-amber-50')}>
                    <td className="p-1 font-medium">{r.name}</td>
                    <td className="p-1"><NumInput className={c} value={r.tuitionFees} onChange={(v) => patch(r.id, { tuitionFees: v ?? 0 })} /></td>
                    <td className="p-1"><NumInput className={c} value={r.hostelFees} onChange={(v) => patch(r.id, { hostelFees: v ?? 0 })} /></td>
                    <td className="p-1"><NumInput className={c} value={r.oneTimeFees} onChange={(v) => patch(r.id, { oneTimeFees: v ?? 0 })} /></td>
                    <td className="p-1"><NumInput className={c} value={r.feeForCommission} onChange={(v) => patch(r.id, { feeForCommission: v ?? 0 })} /></td>
                    <td className="p-1"><NumInput className="h-8 w-20 text-xs" value={r.feeDiscountPercent} onChange={(v) => patch(r.id, { feeDiscountPercent: Math.min(100, Math.max(0, v ?? 0)) })} /></td>
                    <td className="p-1 text-right text-xs tabular-nums">{inr(r.tuitionFees + r.oneTimeFees)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty text="No courses — add courses first" />}
    </Section>
  );
}

export function ReviewsTab({ inst }: TabProps) {
  const reviews = useStore((s) => s.db.reviews).filter((r) => r.instituteId === inst.id);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const [f, setF] = useState('pending');
  const rows = reviews.filter((r) => !f || r.status === f);
  return (
    <Section title="Reviews" description={<Note />} actions={<Select className="h-8 w-36" value={f} onChange={(e) => setF(e.target.value)} placeholder="All" options={opts(['pending', 'approved', 'rejected'])} />}>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2"><Stars value={r.rating} /><span className="font-medium text-sm">{r.title}</span><Badge>{r.status}</Badge></div>
                <div className="flex gap-1">
                  {r.status !== 'approved' && <Button size="sm" variant="outline" onClick={() => { update('reviews', r.id, { status: 'approved' }); toast('Review approved'); }}><Check className="h-3.5 w-3.5 text-emerald-600" />Approve</Button>}
                  {r.status !== 'rejected' && <Button size="sm" variant="outline" onClick={() => { update('reviews', r.id, { status: 'rejected' }); toast('Review rejected', 'info'); }}><X className="h-3.5 w-3.5 text-red-600" />Reject</Button>}
                  <Button size="sm" variant="ghost" onClick={() => { remove('reviews', r.id); toast('Review deleted'); }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                </div>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{r.body}</p>
              <div className="mt-1 text-xs text-slate-400">{r.author} · {r.course} · batch {r.year} · {ago(r.createdAt)}</div>
            </div>
          ))}
        </div>
      ) : <Empty text={`No ${f || ''} reviews`} />}
    </Section>
  );
}

export function EventsTab({ inst }: TabProps) {
  const db = useStore((s) => s.db);
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const events = db.events.filter((e) => e.instituteId === inst.id);
  const updates = db.updates.filter((u) => u.instituteId === inst.id);
  const [ev, setEv] = useState<Partial<EventItem> | null>(null);
  const [up, setUp] = useState<Partial<UpdateItem> | null>(null);
  const saveEv = () => {
    if (!ev?.title || !ev.date) return toast('Title and date are required', 'error');
    if (ev.id) update('events', ev.id, ev);
    else add('events', { title: ev.title, instituteId: inst.id, examId: null, date: ev.date, endDate: ev.endDate ?? null, type: ev.type ?? 'admission', link: ev.link ?? `#/college/${inst.slug}`, status: ev.status ?? 'published' });
    toast('Event saved'); setEv(null);
  };
  const saveUp = () => {
    if (!up?.title) return toast('Title is required', 'error');
    if (up.id) update('updates', up.id, up);
    else add('updates', { title: up.title, body: up.body ?? '', instituteId: inst.id, examId: null, pinned: up.pinned ?? false, status: up.status ?? 'published', createdAt: new Date().toISOString() });
    toast('Update saved'); setUp(null);
  };
  return (
    <div className="space-y-4">
      <Section title={`Events (${events.length})`} description={<Note />} actions={<Button size="sm" onClick={() => setEv({ type: 'admission', status: 'published' })}><Plus className="h-3.5 w-3.5" />Add event</Button>}>
        {events.length ? events.map((e) => (
          <div key={e.id} className="flex items-center gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
            <div className="w-24 text-xs text-slate-500">{date(e.date)}</div>
            <div className="flex-1 font-medium">{e.title}</div>
            <Badge tone="new">{e.type}</Badge><Badge>{e.status}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setEv(e)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={() => { remove('events', e.id); toast('Event deleted'); }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
          </div>
        )) : <Empty text="No events" />}
      </Section>
      <Section title={`Updates (${updates.length})`} description={<Note />} actions={<Button size="sm" onClick={() => setUp({ status: 'published' })}><Plus className="h-3.5 w-3.5" />Add update</Button>}>
        {updates.length ? updates.map((u) => (
          <div key={u.id} className="flex items-start gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
            <div className="w-24 text-xs text-slate-500">{date(u.createdAt)}</div>
            <div className="flex-1"><div className="font-medium">{u.pinned && <Pin className="mr-1 inline h-3 w-3 text-brand" />}{u.title}</div><div className="text-xs text-slate-500">{u.body}</div></div>
            <Badge>{u.status}</Badge>
            <Button size="sm" variant="ghost" onClick={() => setUp(u)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={() => { remove('updates', u.id); toast('Update deleted'); }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
          </div>
        )) : <Empty text="No updates" />}
      </Section>
      <Modal open={!!ev} onClose={() => setEv(null)} title={ev?.id ? 'Edit event' : 'New event'} size="sm" footer={<Button onClick={saveEv}>Save</Button>}>
        {ev && <div className="space-y-3">
          <Field label="Title"><Input value={ev.title ?? ''} onChange={(e) => setEv({ ...ev, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Date"><Input type="date" value={ev.date ?? ''} onChange={(e) => setEv({ ...ev, date: e.target.value })} /></Field>
            <Field label="End date"><Input type="date" value={ev.endDate ?? ''} onChange={(e) => setEv({ ...ev, endDate: e.target.value || null })} /></Field>
          </div>
          <Field label="Type"><Select value={ev.type} onChange={(e) => setEv({ ...ev, type: e.target.value as EventItem['type'] })} options={opts(['admission', 'exam', 'webinar', 'fair', 'deadline'])} /></Field>
          <Field label="Link"><Input value={ev.link ?? ''} onChange={(e) => setEv({ ...ev, link: e.target.value })} /></Field>
          <Field label="Status"><Select value={ev.status} onChange={(e) => setEv({ ...ev, status: e.target.value as EventItem['status'] })} options={opts(['draft', 'published'])} /></Field>
        </div>}
      </Modal>
      <Modal open={!!up} onClose={() => setUp(null)} title={up?.id ? 'Edit update' : 'New update'} size="sm" footer={<Button onClick={saveUp}>Save</Button>}>
        {up && <div className="space-y-3">
          <Field label="Title"><Input value={up.title ?? ''} onChange={(e) => setUp({ ...up, title: e.target.value })} /></Field>
          <Field label="Body"><Textarea value={up.body ?? ''} onChange={(e) => setUp({ ...up, body: e.target.value })} /></Field>
          <Toggle checked={!!up.pinned} onChange={(v) => setUp({ ...up, pinned: v })} label="Pinned" />
          <Field label="Status"><Select value={up.status} onChange={(e) => setUp({ ...up, status: e.target.value as UpdateItem['status'] })} options={opts(['draft', 'published'])} /></Field>
        </div>}
      </Modal>
    </div>
  );
}

export function ArticlesTab({ inst }: TabProps) {
  const db = useStore((s) => s.db);
  const articles = db.articles.filter((a) => a.instituteId === inst.id);
  return (
    <Section title={`Articles (${articles.length})`} description="College news and guides linked to this institution."
      actions={<Link to={`/admin/articles/new?instituteId=${inst.id}`}><Button size="sm"><Plus className="h-3.5 w-3.5" />New article</Button></Link>}>
      {articles.length ? articles.map((a) => (
        <div key={a.id} className="flex items-center gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
          <div className="min-w-0 flex-1">
            <Link to={`/admin/articles/${a.id}/edit`} className="font-medium hover:text-brand">{a.title}</Link>
            <div className="text-xs text-slate-500">{db.authors.find((x) => x.id === a.authorId)?.name} · {a.views.toLocaleString('en-IN')} views · {ago(a.updatedAt)}</div>
          </div>
          <Badge>{a.status}</Badge>
          <Link to={`/admin/articles/${a.id}/edit`}><Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button></Link>
        </div>
      )) : <Empty text="No articles linked to this institution" />}
    </Section>
  );
}
