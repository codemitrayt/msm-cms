import { useState } from 'react';
import { CalendarDays, List, Pin, Plus, Trash2 } from 'lucide-react';
import { useStore, useCol, nowIso } from '../../store';
import type { EventItem, UpdateItem } from '../../data/types';
import { Badge, Button, Card, DataTable, Empty, Field, Input, PageHeader, SearchInput, Select, Sheet, Textarea, Toggle, cx, useConfirm } from '../../ui';
import { ago, byId, date } from '../../lib/format';
import { useCan } from '../Layout';
import { STATUS_OPTIONS, StatusControl } from './shared';

const TYPES: EventItem['type'][] = ['admission', 'exam', 'webinar', 'fair', 'deadline'];
const typeColor: Record<string, string> = { admission: 'bg-emerald-500', exam: 'bg-blue-500', webinar: 'bg-violet-500', fair: 'bg-amber-500', deadline: 'bg-red-500' };

export function EventsPage() {
  const events = useCol('events');
  const institutes = useCol('institutes');
  const exams = useCol('exams');
  const { add, update, remove, toast, log } = useStore();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [edit, setEdit] = useState<(Omit<EventItem, 'id'> & { id?: number }) | null>(null);

  const rows = events.filter((e) => (!q || e.title.toLowerCase().includes(q.toLowerCase())) && (!type || e.type === type) && (!status || e.status === status))
    .sort((a, b) => a.date.localeCompare(b.date));
  const months = rows.reduce<Record<string, EventItem[]>>((m, e) => { const k = e.date.slice(0, 7); (m[k] ??= []).push(e); return m; }, {});
  const linked = (e: EventItem) => byId(institutes, e.instituteId)?.shortName ?? byId(exams, e.examId)?.name ?? '—';

  const save = () => {
    if (!edit) return;
    if (!edit.title.trim() || !edit.date) return toast('Title and date are required', 'error');
    if (edit.endDate && edit.endDate < edit.date) return toast('End date is before start date', 'error');
    const { id, ...d } = edit;
    if (id) { update('events', id, d); log('updated event', d.title, id); toast('Event saved'); }
    else { const c = add('events', d); log('created event', c.title, c.id); toast('Event created'); }
    setEdit(null);
  };

  return (
    <div>
      <PageHeader title="Events" subtitle="Admission, exam and webinar dates shown on the website."
        actions={<>
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            <button onClick={() => setView('calendar')} className={cx('rounded-md p-1.5 cursor-pointer', view === 'calendar' && 'bg-slate-100')}><CalendarDays className="h-4 w-4" /></button>
            <button onClick={() => setView('list')} className={cx('rounded-md p-1.5 cursor-pointer', view === 'list' && 'bg-slate-100')}><List className="h-4 w-4" /></button>
          </div>
          {can('events.create') && <Button onClick={() => setEdit({ title: '', instituteId: null, examId: null, date: new Date().toISOString().slice(0, 10), endDate: null, type: 'admission', link: '', status: 'draft' })}><Plus className="h-4 w-4" />New event</Button>}
        </>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search events…" />
        <Select value={type} onChange={(e) => setType(e.target.value)} placeholder="All types" options={TYPES.map((t) => ({ value: t, label: t }))} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUS_OPTIONS} />
      </div>
      {view === 'calendar' ? (
        <div className="space-y-5">
          {Object.entries(months).map(([m, list]) => (
            <div key={m}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">{new Date(`${m}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} <span className="font-normal text-slate-400">· {list.length}</span></h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((e) => (
                  <Card key={e.id} className="flex cursor-pointer gap-3 p-3 hover:border-slate-300" onClick={() => setEdit(e)}>
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 py-1">
                      <span className="text-lg font-semibold leading-none">{new Date(e.date).getDate()}</span>
                      <span className="text-[10px] uppercase text-slate-500">{new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-medium">{e.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><span className={cx('h-2 w-2 rounded-full', typeColor[e.type])} /><span className="capitalize">{e.type}</span>· {linked(e)}</div>
                    </div>
                    <Badge>{e.status}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {!rows.length && <Empty text="No events" />}
        </div>
      ) : (
        <DataTable rows={rows} onRowClick={(e) => setEdit(e)}
          columns={[
            { key: 'd', header: 'Date', sort: (e) => e.date, render: (e) => <span className="whitespace-nowrap">{date(e.date)}{e.endDate && ` – ${date(e.endDate)}`}</span> },
            { key: 't', header: 'Title', sort: (e) => e.title, render: (e) => <span className="font-medium">{e.title}</span> },
            { key: 'ty', header: 'Type', render: (e) => <span className="inline-flex items-center gap-1.5 text-xs capitalize"><span className={cx('h-2 w-2 rounded-full', typeColor[e.type])} />{e.type}</span> },
            { key: 'l', header: 'Linked to', className: 'hidden md:table-cell', render: (e) => <span className="text-xs">{linked(e)}</span> },
            { key: 's', header: 'Status', render: (e) => <Badge>{e.status}</Badge> },
          ]} />
      )}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit event' : 'New event'}
        footer={<>
          {edit?.id && can('events.delete') && <Button variant="ghost" className="mr-auto text-red-600" onClick={async () => { if (await confirm('Delete this event?')) { remove('events', edit.id!); toast('Event deleted'); setEdit(null); } }}><Trash2 className="h-4 w-4" />Delete</Button>}
          <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button>
        </>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Title *"><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start date *"><Input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
              <Field label="End date"><Input type="date" value={edit.endDate ?? ''} onChange={(e) => setEdit({ ...edit, endDate: e.target.value || null })} /></Field>
              <Field label="Type"><Select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as EventItem['type'] })} options={TYPES.map((t) => ({ value: t, label: t }))} /></Field>
              <Field label="Link" hint="e.g. #/exams/jee-main"><Input value={edit.link} onChange={(e) => setEdit({ ...edit, link: e.target.value })} /></Field>
              <Field label="Institute"><Select value={edit.instituteId ?? ''} placeholder="None" onChange={(e) => setEdit({ ...edit, instituteId: e.target.value ? Number(e.target.value) : null })} options={institutes.map((n) => ({ value: n.id, label: n.shortName }))} /></Field>
              <Field label="Exam"><Select value={edit.examId ?? ''} placeholder="None" onChange={(e) => setEdit({ ...edit, examId: e.target.value ? Number(e.target.value) : null })} options={exams.map((x) => ({ value: x.id, label: x.name }))} /></Field>
            </div>
            <Field label="Status"><StatusControl mod="events" value={edit.status} onChange={(s) => setEdit({ ...edit, status: s })} /></Field>
          </div>
        )}
      </Sheet>
      {node}
    </div>
  );
}

export function UpdatesPage() {
  const updates = useCol('updates');
  const institutes = useCol('institutes');
  const exams = useCol('exams');
  const { add, update, remove, toast, log } = useStore();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');
  const [edit, setEdit] = useState<(Omit<UpdateItem, 'id'> & { id?: number }) | null>(null);
  const rows = updates.filter((u) => (!q || u.title.toLowerCase().includes(q.toLowerCase())) && (!status || u.status === status)
    && (!link || (link === 'inst' ? u.instituteId : link === 'exam' ? u.examId : !u.instituteId && !u.examId)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));

  const save = () => {
    if (!edit) return;
    if (!edit.title.trim()) return toast('Title is required', 'error');
    const { id, ...d } = edit;
    if (id) { update('updates', id, d); log('updated update', d.title, id); toast('Update saved'); }
    else { const c = add('updates', { ...d, createdAt: nowIso() }); log('posted update', c.title, c.id); toast('Update posted'); }
    setEdit(null);
  };

  return (
    <div>
      <PageHeader title="Updates" subtitle="Latest news ticker items for institutes and exams."
        actions={can('updates.create') && <Button onClick={() => setEdit({ title: '', body: '', instituteId: null, examId: null, pinned: false, status: 'draft', createdAt: nowIso() })}><Plus className="h-4 w-4" />New update</Button>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search updates…" />
        <Select value={link} onChange={(e) => setLink(e.target.value)} placeholder="All" options={[{ value: 'inst', label: 'Institute updates' }, { value: 'exam', label: 'Exam updates' }, { value: 'global', label: 'Global' }]} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUS_OPTIONS} />
      </div>
      <DataTable rows={rows} onRowClick={(u) => setEdit(u)}
        columns={[
          { key: 't', header: 'Update', render: (u) => <div><div className="font-medium">{u.pinned && <Pin className="mr-1 inline h-3.5 w-3.5 fill-brand text-brand" />}{u.title}</div><div className="line-clamp-1 text-xs text-slate-500">{u.body}</div></div> },
          { key: 'l', header: 'Linked to', className: 'hidden md:table-cell', render: (u) => <span className="text-xs">{byId(institutes, u.instituteId)?.shortName ?? byId(exams, u.examId)?.name ?? 'Global'}</span> },
          { key: 's', header: 'Status', render: (u) => <Badge>{u.status}</Badge> },
          { key: 'c', header: 'Posted', sort: (u) => u.createdAt, className: 'hidden sm:table-cell', render: (u) => <span className="text-xs text-slate-500">{ago(u.createdAt)}</span> },
        ]} />
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit update' : 'New update'}
        footer={<>
          {edit?.id && can('updates.delete') && <Button variant="ghost" className="mr-auto text-red-600" onClick={async () => { if (await confirm('Delete this update?')) { remove('updates', edit.id!); toast('Deleted'); setEdit(null); } }}><Trash2 className="h-4 w-4" />Delete</Button>}
          <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button>
        </>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Title *"><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Body"><Textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institute"><Select value={edit.instituteId ?? ''} placeholder="None" onChange={(e) => setEdit({ ...edit, instituteId: e.target.value ? Number(e.target.value) : null })} options={institutes.map((n) => ({ value: n.id, label: n.shortName }))} /></Field>
              <Field label="Exam"><Select value={edit.examId ?? ''} placeholder="None" onChange={(e) => setEdit({ ...edit, examId: e.target.value ? Number(e.target.value) : null })} options={exams.map((x) => ({ value: x.id, label: x.name }))} /></Field>
            </div>
            <Toggle checked={edit.pinned} onChange={(v) => setEdit({ ...edit, pinned: v })} label="Pin to top" />
            <Field label="Status"><StatusControl mod="updates" value={edit.status} onChange={(s) => setEdit({ ...edit, status: s })} /></Field>
          </div>
        )}
      </Sheet>
      {node}
    </div>
  );
}
