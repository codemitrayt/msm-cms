import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, Plus, Save, Trash2, Undo2 } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, ChipSelect, DataTable, Empty, Field, Input, Logo, PageHeader, RichText, SearchInput, Select, Tabs, useConfirm, cx, type Column } from '../../ui';
import { ago, byId, inr, slugify } from '../../lib/format';
import type { Course } from '../../data/types';
import { useCan } from '../Layout';
import { COURSE_STATUSES, NumInput, Section, opts } from './common';
import { AddCourseModal } from './AddCourseModal';

export function CoursesHome() {
  const db = useStore((s) => s.db);
  const nav = useNavigate();
  const [view, setView] = useState<'institutes' | 'search'>('institutes');
  const [q, setQ] = useState('');
  const [f, setF] = useState({ stream: '', status: '', mode: '' });
  const counts = useMemo(() => {
    const m = new Map<number, { total: number; pub: number }>();
    db.courses.forEach((c) => { const x = m.get(c.instituteId) ?? { total: 0, pub: 0 }; x.total++; if (c.status === 'published') x.pub++; m.set(c.instituteId, x); });
    return m;
  }, [db.courses]);
  const insts = db.institutes.filter((i) => !q || `${i.name} ${i.shortName}`.toLowerCase().includes(q.toLowerCase()));
  const courses = db.courses.filter((c) => {
    if (q && !`${c.name} ${byId(db.institutes, c.instituteId)?.shortName}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (f.stream && c.streamId !== Number(f.stream)) return false;
    if (f.status && c.status !== f.status) return false;
    if (f.mode && c.modeId !== Number(f.mode)) return false;
    return true;
  });
  const cols: Column<Course>[] = [
    { key: 'name', header: 'Course', sort: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'inst', header: 'Institution', sort: (r) => byId(db.institutes, r.instituteId)?.shortName ?? '', render: (r) => byId(db.institutes, r.instituteId)?.shortName },
    { key: 'stream', header: 'Stream', render: (r) => byId(db.streams, r.streamId)?.name },
    { key: 'mode', header: 'Mode', render: (r) => byId(db.modes, r.modeId)?.name },
    { key: 'fees', header: 'Fees', className: 'text-right', sort: (r) => r.fees, render: (r) => inr(r.fees) },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge>{r.status}</Badge> },
    { key: 'upd', header: 'Updated', sort: (r) => r.updatedAt, render: (r) => <span className="text-xs text-slate-500">{ago(r.updatedAt)}</span> },
  ];
  return (
    <div>
      <PageHeader title="Courses" subtitle={`${db.courses.length} courses across ${counts.size} institutions · ${db.courses.filter((c) => c.status === 'pending').length} pending approval`} />
      <Tabs className="mb-4" value={view} onChange={setView} tabs={[{ value: 'institutes', label: 'By institution' }, { value: 'search', label: 'All courses' }]} />
      <div className="mb-3 grid gap-2 sm:grid-cols-4">
        <SearchInput value={q} onChange={setQ} placeholder={view === 'institutes' ? 'Search institution…' : 'Search course or institution…'} />
        {view === 'search' && <>
          <Select value={f.stream} onChange={(e) => setF({ ...f, stream: e.target.value })} placeholder="All streams" options={db.streams.map((s) => ({ value: s.id, label: s.name }))} />
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} placeholder="All statuses" options={opts(COURSE_STATUSES)} />
          <Select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })} placeholder="All modes" options={db.modes.map((s) => ({ value: s.id, label: s.name }))} />
        </>}
      </div>
      {view === 'institutes' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {insts.map((i) => {
            const c = counts.get(i.id) ?? { total: 0, pub: 0 };
            return (
              <Link key={i.id} to={`/admin/courses/${i.id}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand/40 hover:shadow-sm">
                <Logo text={i.logo} color={i.brandColor} size={40} />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{i.name}</div><div className="text-xs text-slate-500">{c.total} courses · {c.pub} published</div></div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            );
          })}
        </div>
      ) : (
        <DataTable rows={courses} columns={cols} onRowClick={(r) => nav(`/admin/courses/${r.instituteId}/${r.id}`)} />
      )}
    </div>
  );
}

export function InstituteCourseTree() {
  const { instituteId } = useParams();
  const db = useStore((s) => s.db);
  const update = useStore((s) => s.update);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const inst = byId(db.institutes, Number(instituteId));
  const [adding, setAdding] = useState<number | null | undefined>(undefined);
  const [collapsed, setCollapsed] = useState<number[]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [bulk, setBulk] = useState('');
  if (!inst) return <Empty text="Institution not found" />;
  const courses = db.courses.filter((c) => c.instituteId === inst.id);
  const groups = [...new Set(courses.map((c) => c.baseCourseId))].map((bid) => ({ base: byId(db.baseCourses, bid), items: courses.filter((c) => c.baseCourseId === bid) }));
  const applyBulk = () => {
    if (bulk === 'published' && !can('courses.publish')) return toast('You cannot publish courses', 'error');
    sel.forEach((id) => update('courses', id, { status: bulk as Course['status'], updatedAt: new Date().toISOString() }));
    log(`bulk set ${bulk} on`, `${sel.length} courses (${inst.shortName})`, inst.id);
    toast(`${sel.length} courses → ${bulk}`);
    setSel([]); setBulk('');
  };
  return (
    <div>
      <Link to="/admin/courses" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" />Courses</Link>
      <PageHeader title={<span className="flex items-center gap-3"><Logo text={inst.logo} color={inst.brandColor} size={36} />{inst.name}</span>} subtitle={`${courses.length} courses in ${groups.length} base courses`}
        actions={<>
          <Link to={`/admin/institutes/${inst.id}/course-fees`}><Button variant="outline">Edit all fees</Button></Link>
          <Button onClick={() => setAdding(null)}><Plus className="h-4 w-4" />Add course</Button>
        </>} />
      {adding !== undefined && <AddCourseModal inst={inst} open onClose={() => setAdding(undefined)} baseCourseId={adding ?? undefined} />}
      {sel.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft/50 px-3 py-2 text-sm">
          <span className="font-medium">{sel.length} selected</span>
          <Select className="h-8 w-40" value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="Set status…" options={opts(COURSE_STATUSES)} />
          <Button size="sm" disabled={!bulk} onClick={applyBulk}>Apply</Button>
          <Button size="sm" variant="ghost" onClick={() => setSel([])}>Clear</Button>
        </div>
      )}
      {groups.length ? (
        <div className="space-y-3">
          {groups.map(({ base, items }) => {
            const bid = base?.id ?? 0;
            const closed = collapsed.includes(bid);
            const allSel = items.every((c) => sel.includes(c.id));
            return (
              <div key={bid} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2">
                  <button className="cursor-pointer" onClick={() => setCollapsed(closed ? collapsed.filter((x) => x !== bid) : [...collapsed, bid])}>{closed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                  <input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? sel.filter((x) => !items.some((c) => c.id === x)) : [...new Set([...sel, ...items.map((c) => c.id)])])} />
                  <div className="flex-1 text-sm font-semibold">{base?.shortName} <span className="font-normal text-slate-500">— {base?.name}</span></div>
                  <span className="text-xs text-slate-500">{items.length}</span>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(bid)}><Plus className="h-3.5 w-3.5" />Specialization</Button>
                </div>
                {!closed && items.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 border-t border-slate-100 px-3 py-2 pl-10 text-sm">
                    <input type="checkbox" checked={sel.includes(c.id)} onChange={() => setSel(sel.includes(c.id) ? sel.filter((x) => x !== c.id) : [...sel, c.id])} />
                    <Link to={`/admin/courses/${inst.id}/${c.id}`} className="min-w-0 flex-1 hover:text-brand">
                      <div className="font-medium">{c.specializationId ? byId(db.specializations, c.specializationId)?.name : 'General'}</div>
                      <div className="text-xs text-slate-500">{c.name} · {byId(db.modes, c.modeId)?.name} · {inr(c.fees)}</div>
                    </Link>
                    <Badge>{c.status}</Badge>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : <Empty text="No courses yet" />}
    </div>
  );
}

export function CourseEditor() {
  const { instituteId, courseId } = useParams();
  const nav = useNavigate();
  const db = useStore((s) => s.db);
  const stored = byId(db.courses, Number(courseId));
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [d, setD] = useState<Course | undefined>(stored);
  useEffect(() => setD(stored), [courseId]); // eslint-disable-line react-hooks/exhaustive-deps
  const inst = byId(db.institutes, Number(instituteId));
  if (!stored || !d || !inst) return <Empty text="Course not found" />;
  const set = (p: Partial<Course>) => setD({ ...d, ...p });
  const dirty = JSON.stringify(d) !== JSON.stringify(stored);
  const specs = db.specializations.filter((s) => s.baseCourseId === d.baseCourseId);
  const scheduleTotal = d.feeSchedule.reduce((a, b) => a + (b.amount || 0), 0);
  const save = (extra: Partial<Course> = {}, msg = 'Saved') => {
    const next = { ...d, ...extra, updatedAt: new Date().toISOString() };
    update('courses', d.id, next); setD(next);
    log(msg === 'Saved' ? 'updated course' : msg.toLowerCase(), `${d.name} (${inst.shortName})`, d.id);
    toast(`${d.name}: ${msg}`);
  };
  const genSchedule = (unit: 'Year' | 'Semester') => {
    const n = unit === 'Year' ? d.durationValue : d.durationValue * 2;
    const per = Math.round(d.tuitionFees / Math.max(1, n));
    set({ feeSchedule: Array.from({ length: n }, (_, i) => ({ label: `${unit} ${i + 1}`, amount: per })) });
  };
  return (
    <div className="mx-auto max-w-5xl">
      {node}
      <button onClick={async () => { if (!dirty || (await confirm('Discard unsaved changes?'))) nav(`/admin/courses/${inst.id}`); }} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 cursor-pointer"><ArrowLeft className="h-4 w-4" />{inst.shortName} courses</button>
      <PageHeader title={<span className="flex flex-wrap items-center gap-2">{d.name}<Badge>{stored.status}</Badge>{dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">Unsaved changes</span>}</span>}
        subtitle={`${inst.name} · /college/${inst.slug}/courses/${d.slug}`}
        actions={<>
          <a href={`#/college/${inst.slug}/courses/${d.slug}?preview=1`} target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink className="h-4 w-4" />Preview</Button></a>
          {dirty && <Button variant="ghost" onClick={() => setD(stored)}><Undo2 className="h-4 w-4" />Discard</Button>}
          <Button variant="outline" disabled={!dirty} onClick={() => save()}><Save className="h-4 w-4" />Save</Button>
          {stored.status === 'draft' && !can('courses.publish') && <Button variant="blue" onClick={() => save({ status: 'pending' }, 'Sent for approval')}>Send for approval</Button>}
          {stored.status !== 'published' && can('courses.publish') && <Button onClick={() => save({ status: 'published' }, 'Published')}>{stored.status === 'pending' ? 'Approve & publish' : 'Publish'}</Button>}
          {stored.status === 'published' && can('courses.publish') && <Button variant="secondary" onClick={() => save({ status: 'draft' }, 'Unpublished')}>Unpublish</Button>}
          {can('courses.delete') && <Button variant="ghost" onClick={async () => { if (await confirm(`Delete ${d.name}?`)) { remove('courses', d.id); log('deleted course', d.name, d.id); toast('Course deleted'); nav(`/admin/courses/${inst.id}`); } }}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
        </>} />
      <div className="flex items-center gap-2 pb-4 text-xs text-slate-500">
        {COURSE_STATUSES.map((s, i) => <span key={s} className="flex items-center gap-2">{i > 0 && <ChevronRight className="h-3 w-3" />}<span className={cx('rounded-full px-2 py-0.5', stored.status === s ? 'bg-brand text-white' : 'bg-slate-100')}>{s}</span></span>)}
      </div>
      <div className="space-y-4">
        <Section title="Course">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Slug"><Input value={d.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} /></Field>
            <Field label="Base course"><Select value={d.baseCourseId} onChange={(e) => { const b = byId(db.baseCourses, Number(e.target.value)); if (b) set({ baseCourseId: b.id, streamId: b.streamId, specializationId: null, durationValue: b.durationYears }); }} options={db.baseCourses.map((b) => ({ value: b.id, label: b.shortName }))} /></Field>
            <Field label="Specialization"><Select value={d.specializationId ?? ''} onChange={(e) => set({ specializationId: e.target.value ? Number(e.target.value) : null })} placeholder="None (general)" options={specs.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            <Field label="Stream"><Select value={d.streamId} onChange={(e) => set({ streamId: Number(e.target.value) })} options={db.streams.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            <Field label="Mode"><Select value={d.modeId} onChange={(e) => set({ modeId: Number(e.target.value) })} options={db.modes.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            <Field label="Course type"><Select value={d.courseTypeId} onChange={(e) => set({ courseTypeId: Number(e.target.value) })} options={db.courseTypes.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Duration"><NumInput value={d.durationValue} onChange={(v) => set({ durationValue: v ?? 1 })} /></Field>
              <Field label="Unit"><Select value={d.durationUnit} onChange={(e) => set({ durationUnit: e.target.value as Course['durationUnit'] })} options={opts(['years', 'months', 'semesters'])} /></Field>
              <Field label="Seats"><NumInput value={d.totalSeats} onChange={(v) => set({ totalSeats: v ?? 0 })} /></Field>
            </div>
            <Field label="Description" className="sm:col-span-2"><RichText value={d.description} onChange={(description) => set({ description })} minHeight={120} /></Field>
          </div>
        </Section>
        <Section title="Fees" description="Internal fee for commission and the year/semester schedule are used by CRM and Fin Flow.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tuition fees (total)" hint={inr(d.tuitionFees)}><NumInput value={d.tuitionFees} onChange={(v) => set({ tuitionFees: v ?? 0, fees: (v ?? 0) + d.oneTimeFees })} /></Field>
            <Field label="One-time fees" hint={inr(d.oneTimeFees)}><NumInput value={d.oneTimeFees} onChange={(v) => set({ oneTimeFees: v ?? 0, fees: d.tuitionFees + (v ?? 0) })} /></Field>
            <Field label="Total fees" hint="Tuition + one-time"><Input disabled value={inr(d.fees)} /></Field>
            <Field label="Hostel fees / year" hint={inr(d.hostelFees)}><NumInput value={d.hostelFees} onChange={(v) => set({ hostelFees: v ?? 0 })} /></Field>
            <Field label="Fee for commission" hint="1st-year fee"><NumInput value={d.feeForCommission} onChange={(v) => set({ feeForCommission: v ?? 0 })} /></Field>
            <Field label="Discount %"><NumInput value={d.feeDiscountPercent} onChange={(v) => set({ feeDiscountPercent: Math.min(100, Math.max(0, v ?? 0)) })} /></Field>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-slate-600">Fee schedule <span className={cx('ml-2', scheduleTotal !== d.tuitionFees ? 'text-amber-600' : 'text-slate-400')}>total {inr(scheduleTotal)}{scheduleTotal !== d.tuitionFees && ` (tuition is ${inr(d.tuitionFees)})`}</span></div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => genSchedule('Year')}>Yearly</Button>
                <Button size="sm" variant="outline" onClick={() => genSchedule('Semester')}>Semester-wise</Button>
                <Button size="sm" variant="ghost" onClick={() => set({ feeSchedule: [...d.feeSchedule, { label: `Year ${d.feeSchedule.length + 1}`, amount: 0 }] })}><Plus className="h-3.5 w-3.5" />Row</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {d.feeSchedule.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input className="h-8 w-40 text-xs" value={r.label} onChange={(e) => set({ feeSchedule: d.feeSchedule.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <NumInput className="h-8 w-40 text-xs" value={r.amount} onChange={(v) => set({ feeSchedule: d.feeSchedule.map((x, j) => (j === i ? { ...x, amount: v ?? 0 } : x)) })} />
                  <span className="w-20 text-xs text-slate-500">{inr(r.amount)}</span>
                  <Button size="sm" variant="ghost" onClick={() => set({ feeSchedule: d.feeSchedule.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                </div>
              ))}
            </div>
          </div>
        </Section>
        <Section title="Eligibility & exams">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min. 10th %"><NumInput value={d.tenthPercentage} onChange={(v) => set({ tenthPercentage: v })} /></Field>
            <Field label="Min. 12th %"><NumInput value={d.twelfthPercentage} onChange={(v) => set({ twelfthPercentage: v })} /></Field>
            <Field label="Min. UG %"><NumInput value={d.ugPercentage} onChange={(v) => set({ ugPercentage: v })} /></Field>
            <Field label="Exams accepted" className="sm:col-span-3"><ChipSelect options={db.exams.map((e) => ({ value: e.id, label: e.shortName }))} value={d.examIds} onChange={(v) => set({ examIds: v })} /></Field>
          </div>
        </Section>
        <Section title="Placements">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Average salary (LPA)"><NumInput step={0.1} value={d.averageSalaryLpa} onChange={(v) => set({ averageSalaryLpa: v })} /></Field>
            <Field label="Highest salary (LPA)"><NumInput step={0.1} value={d.highestSalaryLpa} onChange={(v) => set({ highestSalaryLpa: v })} /></Field>
          </div>
        </Section>
      </div>
    </div>
  );
}
