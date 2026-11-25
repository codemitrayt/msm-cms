import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { useStore, useCol, nowIso } from '../../store';
import type { Career, PressRelease } from '../../data/types';
import { Badge, Button, DataTable, Field, Input, Logo, PageHeader, RichText, SearchInput, Select, Sheet, Stat, useConfirm } from '../../ui';
import { ago, date } from '../../lib/format';
import { useCan } from '../Layout';
import { PreviewLink, STATUS_OPTIONS, StatusControl } from './shared';

export function PressReleasesPage() {
  const rows = useCol('pressReleases');
  const { add, update, remove, toast, log } = useStore();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [edit, setEdit] = useState<(Omit<PressRelease, 'id'> & { id?: number }) | null>(null);
  const view = rows.filter((r) => (!q || `${r.title} ${r.publication}`.toLowerCase().includes(q.toLowerCase())) && (!status || r.status === status)).sort((a, b) => b.date.localeCompare(a.date));
  const save = () => {
    if (!edit) return;
    if (!edit.title.trim() || !edit.publication.trim()) return toast('Title and publication are required', 'error');
    const { id, ...d } = edit;
    const data = { ...d, logo: d.logo || d.publication.split(' ').map((w) => w[0]).join('').slice(0, 3) };
    if (id) { update('pressReleases', id, data); toast('Saved'); log('updated press release', d.title, id); }
    else { const c = add('pressReleases', data); toast('Press release added'); log('created press release', c.title, c.id); }
    setEdit(null);
  };
  return (
    <div>
      <PageHeader title="Press Releases" subtitle="Media coverage shown on the website's press page."
        actions={<><PreviewLink href="/press" />{can('press_releases.create') && <Button onClick={() => setEdit({ title: '', publication: '', url: '', logo: '', date: new Date().toISOString().slice(0, 10), status: 'draft' })}><Plus className="h-4 w-4" />Add</Button>}</>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <SearchInput className="sm:col-span-2" value={q} onChange={setQ} placeholder="Search…" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUS_OPTIONS} />
      </div>
      <DataTable rows={view} onRowClick={(r) => setEdit(r)}
        columns={[
          { key: 'p', header: 'Publication', render: (r) => <div className="flex items-center gap-2"><Logo text={r.logo} size={32} color="#16181d" /><span className="font-medium">{r.publication}</span></div> },
          { key: 't', header: 'Headline', render: (r) => <span className="line-clamp-1">{r.title}</span> },
          { key: 'd', header: 'Date', sort: (r) => r.date, render: (r) => <span className="whitespace-nowrap text-xs">{date(r.date)}</span> },
          { key: 's', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit press release' : 'New press release'}
        footer={<>
          {edit?.id && can('press_releases.delete') && <Button variant="ghost" className="mr-auto text-red-600" onClick={async () => { if (await confirm('Delete this press release?')) { remove('pressReleases', edit.id!); toast('Deleted'); setEdit(null); } }}><Trash2 className="h-4 w-4" />Delete</Button>}
          <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button>
        </>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Headline *"><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Publication *"><Input value={edit.publication} onChange={(e) => setEdit({ ...edit, publication: e.target.value })} /></Field>
              <Field label="Logo text" hint="Initials if empty"><Input value={edit.logo} maxLength={4} onChange={(e) => setEdit({ ...edit, logo: e.target.value.toUpperCase() })} /></Field>
              <Field label="Article URL"><Input value={edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} placeholder="https://" /></Field>
              <Field label="Date"><Input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
            </div>
            <Field label="Status"><StatusControl mod="press_releases" value={edit.status} onChange={(s) => setEdit({ ...edit, status: s })} /></Field>
          </div>
        )}
      </Sheet>
      {node}
    </div>
  );
}

export function CareersPage() {
  const rows = useCol('careers');
  const { add, update, remove, toast, log } = useStore();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('');
  const [edit, setEdit] = useState<(Omit<Career, 'id'> & { id?: number }) | null>(null);
  const depts = [...new Set(rows.map((r) => r.department))];
  const view = rows.filter((r) => (!q || `${r.title} ${r.location}`.toLowerCase().includes(q.toLowerCase())) && (!status || r.status === status) && (!dept || r.department === dept));
  const save = () => {
    if (!edit) return;
    if (!edit.title.trim() || !edit.department.trim() || !edit.location.trim()) return toast('Title, department and location are required', 'error');
    const { id, ...d } = edit;
    if (id) { update('careers', id, d); toast('Job saved'); log('updated job', d.title, id); }
    else { const c = add('careers', { ...d, postedAt: nowIso() }); toast('Job posted'); log('posted job', c.title, c.id); }
    setEdit(null);
  };
  return (
    <div>
      <PageHeader title="Careers" subtitle="Job openings on the website's careers page."
        actions={<><PreviewLink href="/careers" />{can('careers.create') && <Button onClick={() => setEdit({ title: '', department: '', location: '', type: 'full-time', experience: '', description: '', status: 'open', applicants: 0, postedAt: nowIso() })}><Plus className="h-4 w-4" />Post a job</Button>}</>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Open roles" value={rows.filter((r) => r.status === 'open').length} />
        <Stat label="Total applicants" value={rows.reduce((s, r) => s + r.applicants, 0)} icon={<Users className="h-4 w-4" />} />
        <Stat label="Departments" value={depts.length} />
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search jobs…" />
        <Select value={dept} onChange={(e) => setDept(e.target.value)} placeholder="All departments" options={depts.map((d) => ({ value: d, label: d }))} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Open & closed" options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]} />
      </div>
      <DataTable rows={view} onRowClick={(r) => setEdit(r)}
        columns={[
          { key: 't', header: 'Role', sort: (r) => r.title, render: (r) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-slate-500">{r.department} · {r.location}</div></div> },
          { key: 'ty', header: 'Type', className: 'hidden md:table-cell', render: (r) => <span className="text-xs capitalize">{r.type}</span> },
          { key: 'e', header: 'Experience', className: 'hidden lg:table-cell', render: (r) => <span className="text-xs">{r.experience}</span> },
          { key: 'a', header: 'Applicants', sort: (r) => r.applicants, render: (r) => <span className="tabular-nums">{r.applicants}</span> },
          { key: 's', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { key: 'p', header: 'Posted', sort: (r) => r.postedAt, className: 'hidden sm:table-cell', render: (r) => <span className="text-xs text-slate-500">{ago(r.postedAt)}</span> },
        ]} />
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit job' : 'Post a job'} width="max-w-3xl"
        footer={<>
          {edit?.id && can('careers.delete') && <Button variant="ghost" className="mr-auto text-red-600" onClick={async () => { if (await confirm('Delete this job?')) { remove('careers', edit.id!); toast('Deleted'); setEdit(null); } }}><Trash2 className="h-4 w-4" />Delete</Button>}
          <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button>
        </>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Job title *"><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Department *"><Input list="career-depts" value={edit.department} onChange={(e) => setEdit({ ...edit, department: e.target.value })} /><datalist id="career-depts">{depts.map((d) => <option key={d} value={d} />)}</datalist></Field>
              <Field label="Location *"><Input value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} /></Field>
              <Field label="Type"><Select value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Career['type'] })} options={[{ value: 'full-time', label: 'Full-time' }, { value: 'internship', label: 'Internship' }, { value: 'contract', label: 'Contract' }]} /></Field>
              <Field label="Experience"><Input value={edit.experience} onChange={(e) => setEdit({ ...edit, experience: e.target.value })} placeholder="2–4 years" /></Field>
              <Field label="Status"><Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as Career['status'] })} options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]} /></Field>
              <Field label="Applicants"><Input type="number" value={edit.applicants} onChange={(e) => setEdit({ ...edit, applicants: Number(e.target.value) })} /></Field>
            </div>
            <div><div className="mb-1 text-xs font-medium text-slate-600">Description</div><RichText value={edit.description} onChange={(h) => setEdit({ ...edit, description: h })} /></div>
          </div>
        )}
      </Sheet>
      {node}
    </div>
  );
}
