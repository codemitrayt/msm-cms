import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, DataTable, Empty, Field, Input, Logo, Modal, PageHeader, SearchInput, Select, Textarea, useConfirm, type Column } from '../../ui';
import { byId, inr, slugify } from '../../lib/format';
import type { BaseCourse } from '../../data/types';
import { useCan } from '../Layout';
import { NumInput } from './common';
import { AddCourseModal } from './AddCourseModal';

export function BaseCoursesList() {
  const db = useStore((s) => s.db);
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [stream, setStream] = useState('');
  const [edit, setEdit] = useState<Partial<BaseCourse> | null>(null);
  const [newSpec, setNewSpec] = useState('');
  const [instPick, setInstPick] = useState('');

  const offering = (bid: number) => new Set(db.courses.filter((c) => c.baseCourseId === bid).map((c) => c.instituteId)).size;
  const rows = db.baseCourses.filter((b) => (!q || `${b.name} ${b.shortName}`.toLowerCase().includes(q.toLowerCase())) && (!stream || b.streamId === Number(stream)));
  const cols: Column<BaseCourse>[] = [
    { key: 'short', header: 'Base course', sort: (r) => r.shortName, render: (r) => <div><div className="font-medium">{r.shortName}</div><div className="text-xs text-slate-500">{r.name}</div></div> },
    { key: 'stream', header: 'Stream', render: (r) => byId(db.streams, r.streamId)?.name },
    { key: 'level', header: 'Level', render: (r) => byId(db.courseLevels, r.levelId)?.name },
    { key: 'dur', header: 'Duration', render: (r) => `${r.durationYears} yrs` },
    { key: 'spec', header: 'Specializations', render: (r) => { const s = db.specializations.filter((x) => x.baseCourseId === r.id); return <span className="text-xs text-slate-600">{s.length ? s.map((x) => x.name).join(', ') : '—'}</span>; } },
    { key: 'inst', header: 'Institutes', className: 'text-right', sort: (r) => offering(r.id), render: (r) => offering(r.id) },
    { key: 'act', header: '', render: (r) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEdit(r); }}><Pencil className="h-3.5 w-3.5" /></Button> },
  ];
  const save = () => {
    if (!edit?.name || !edit.shortName || !edit.streamId) return toast('Name, short name and stream are required', 'error');
    const data = { name: edit.name, shortName: edit.shortName, slug: edit.slug || slugify(edit.shortName), streamId: Number(edit.streamId), levelId: Number(edit.levelId ?? 1), durationYears: edit.durationYears ?? 3, description: edit.description ?? '' };
    if (edit.id) { update('baseCourses', edit.id, data); log('updated base course', data.shortName, edit.id); }
    else { const b = add('baseCourses', data); log('created base course', b.shortName, b.id); setEdit(b); toast('Base course created — add specializations below'); return; }
    toast('Base course saved'); setEdit(null);
  };
  const specs = edit?.id ? db.specializations.filter((s) => s.baseCourseId === edit.id) : [];
  return (
    <div>
      {node}
      <PageHeader title="Base courses" subtitle="Master list of degrees and their specializations. Institution courses are created from these."
        actions={<>
          <Select className="w-56" value={instPick} onChange={(e) => { setInstPick(e.target.value); if (e.target.value) nav(`/admin/base-courses/${e.target.value}`); }} placeholder="Open for an institution…" options={db.institutes.map((i) => ({ value: i.id, label: i.shortName }))} />
          {can('base_courses.create') && <Button onClick={() => setEdit({ levelId: 1, durationYears: 3 })}><Plus className="h-4 w-4" />New base course</Button>}
        </>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <SearchInput value={q} onChange={setQ} />
        <Select value={stream} onChange={(e) => setStream(e.target.value)} placeholder="All streams" options={db.streams.map((s) => ({ value: s.id, label: s.name }))} />
      </div>
      <DataTable rows={rows} columns={cols} pageSize={20} onRowClick={(r) => setEdit(r)} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Edit ${edit.shortName}` : 'New base course'}
        footer={<>
          {edit?.id && can('base_courses.delete') && <Button variant="ghost" className="mr-auto" onClick={async () => {
            const n = db.courses.filter((c) => c.baseCourseId === edit.id).length;
            if (n) return toast(`${n} courses use this base course — remove them first`, 'error');
            if (await confirm(`Delete ${edit.shortName}?`)) { remove('specializations', specs.map((s) => s.id)); remove('baseCourses', edit.id!); toast('Deleted'); setEdit(null); }
          }}><Trash2 className="h-4 w-4 text-red-600" />Delete</Button>}
          <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button>
        </>}>
        {edit && <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2"><Input value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Short name"><Input value={edit.shortName ?? ''} onChange={(e) => setEdit({ ...edit, shortName: e.target.value })} /></Field>
          <Field label="Slug"><Input value={edit.slug ?? ''} placeholder={slugify(edit.shortName ?? '')} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} /></Field>
          <Field label="Stream"><Select value={edit.streamId ?? ''} onChange={(e) => setEdit({ ...edit, streamId: Number(e.target.value) })} placeholder="Select" options={db.streams.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Level"><Select value={edit.levelId ?? 1} onChange={(e) => setEdit({ ...edit, levelId: Number(e.target.value) })} options={db.courseLevels.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="Duration (years)"><NumInput value={edit.durationYears} onChange={(v) => setEdit({ ...edit, durationYears: v ?? 1 })} /></Field>
          <Field label="Description" className="sm:col-span-2"><Textarea value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          {edit.id && <div className="sm:col-span-2">
            <div className="mb-1.5 text-xs font-medium text-slate-600">Specializations</div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {specs.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                  {s.name}
                  <button className="cursor-pointer text-slate-400 hover:text-red-600" onClick={() => {
                    if (db.courses.some((c) => c.specializationId === s.id)) return toast('Courses use this specialization', 'error');
                    remove('specializations', s.id);
                  }}>×</button>
                </span>
              ))}
              {!specs.length && <span className="text-xs text-slate-400">None</span>}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!newSpec.trim()) return; add('specializations', { name: newSpec.trim(), slug: slugify(newSpec), baseCourseId: edit.id! }); setNewSpec(''); }}>
              <Input className="h-8" value={newSpec} onChange={(e) => setNewSpec(e.target.value)} placeholder="Add specialization" />
              <Button size="sm" type="submit">Add</Button>
            </form>
          </div>}
        </div>}
      </Modal>
    </div>
  );
}

/** For one institution: base courses it offers (with their courses). */
export function InstituteBaseCourses() {
  const { instituteId, baseCourseId } = useParams();
  const db = useStore((s) => s.db);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const { confirm, node } = useConfirm();
  const [adding, setAdding] = useState<number | null>(null);
  const inst = byId(db.institutes, Number(instituteId));
  if (!inst) return <Empty text="Institution not found" />;
  const courses = db.courses.filter((c) => c.instituteId === inst.id);
  const offered = db.baseCourses.filter((b) => courses.some((c) => c.baseCourseId === b.id));
  const notOffered = db.baseCourses.filter((b) => !offered.includes(b));
  const focus = baseCourseId ? byId(db.baseCourses, Number(baseCourseId)) : undefined;
  const list = focus ? [focus] : offered;
  const removeBase = async (bid: number) => {
    const ids = courses.filter((c) => c.baseCourseId === bid).map((c) => c.id);
    if (!(await confirm(`Remove ${byId(db.baseCourses, bid)?.shortName} and its ${ids.length} courses from ${inst.shortName}?`))) return;
    remove('courses', ids);
    log('removed base course from', inst.shortName, inst.id);
    toast('Removed');
  };
  return (
    <div>
      {node}
      <Link to={focus ? `/admin/base-courses/${inst.id}` : '/admin/base-courses'} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" />{focus ? `${inst.shortName} base courses` : 'Base courses'}</Link>
      <PageHeader title={<span className="flex items-center gap-3"><Logo text={inst.logo} color={inst.brandColor} size={36} />{focus ? `${focus.shortName} at ${inst.shortName}` : `${inst.shortName} — base courses`}</span>}
        subtitle={focus ? focus.name : `${offered.length} base courses offered`}
        actions={!focus && <Select className="w-64" value="" onChange={(e) => e.target.value && setAdding(Number(e.target.value))} placeholder="+ Offer another base course" options={notOffered.map((b) => ({ value: b.id, label: `${b.shortName} — ${b.name}` }))} />} />
      {adding !== null && <AddCourseModal inst={inst} open baseCourseId={adding} onClose={() => setAdding(null)} />}
      {list.length ? (
        <div className="space-y-3">
          {list.map((b) => {
            const items = courses.filter((c) => c.baseCourseId === b.id);
            return (
              <div key={b.id} className="rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                  <Link to={`/admin/base-courses/${inst.id}/${b.id}`} className="flex-1 text-sm font-semibold hover:text-brand">{b.shortName} <span className="font-normal text-slate-500">· {byId(db.streams, b.streamId)?.name} · {items.length} courses</span></Link>
                  <Button size="sm" variant="outline" onClick={() => setAdding(b.id)}><Plus className="h-3.5 w-3.5" />Add course</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeBase(b.id)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                </div>
                {items.length ? items.map((c) => (
                  <Link key={c.id} to={`/admin/courses/${inst.id}/${c.id}`} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                    <span className="flex-1">{c.name}</span><span className="text-xs text-slate-500">{inr(c.fees)}</span><Badge>{c.status}</Badge><ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                )) : <div className="px-4 py-3 text-xs text-slate-400">Not offered yet</div>}
              </div>
            );
          })}
        </div>
      ) : <Empty text="No base courses offered yet" />}
    </div>
  );
}
