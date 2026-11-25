import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Send, Phone, Mail } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, DataTable, Field, Input, PageHeader, SearchInput, Select, Sheet, Tabs, Textarea, cx, type Column } from '../../ui';
import { byId, date, dateTime, downloadCsv } from '../../lib/format';
import { useCan } from '../Layout';
import type { Lead, PredictorLead } from '../../data/types';

const STATUSES: Lead['status'][] = ['new', 'contacted', 'interested', 'not-interested', 'converted'];
const SOURCES: Lead['source'][] = ['talk-to-counsellor', 'apply-now', 'brochure', 'predictor', 'contact', 'signup', 'compare'];
const opt = (xs: string[]) => xs.map((x) => ({ value: x, label: x.replace(/-/g, ' ') }));

function StudentLeads() {
  const db = useStore((s) => s.db);
  const update = useStore((s) => s.update);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [inst, setInst] = useState('');
  const [state, setState] = useState('');
  const [crm, setCrm] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sel, setSel] = useState<number[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [bulk, setBulk] = useState('');

  const rows = useMemo(() => db.leads.filter((l) => {
    const t = q.toLowerCase();
    if (t && ![l.name, l.email, l.phone, l.courseInterest].some((x) => x.toLowerCase().includes(t))) return false;
    if (status && l.status !== status) return false;
    if (source && l.source !== source) return false;
    if (inst && l.instituteId !== +inst) return false;
    if (state && l.stateId !== +state) return false;
    if (crm && String(l.pushedToCrm) !== crm) return false;
    if (from && l.createdAt.slice(0, 10) < from) return false;
    if (to && l.createdAt.slice(0, 10) > to) return false;
    return true;
  }), [db.leads, q, status, source, inst, state, crm, from, to]);

  const counts = STATUSES.map((s) => ({ s, n: db.leads.filter((l) => l.status === s).length }));
  const lead = db.leads.find((l) => l.id === openId);
  const canEdit = can('leads.edit');

  const push = (ids: number[]) => {
    ids.forEach((id) => update('leads', id, { pushedToCrm: true }));
    toast(`${ids.length} lead${ids.length > 1 ? 's' : ''} pushed to CRM`);
    log('pushed to CRM', `${ids.length} leads`);
  };
  const exportCsv = () => downloadCsv('student-leads.csv', rows.map((l) => ({
    id: l.id, name: l.name, email: l.email, phone: l.phone, state: byId(db.states, l.stateId)?.name ?? '', city: byId(db.cities, l.cityId)?.name ?? '',
    course: l.courseInterest, institute: byId(db.institutes, l.instituteId)?.name ?? '', source: l.source, page: l.page, status: l.status, pushedToCrm: l.pushedToCrm, createdAt: l.createdAt,
  })));

  const cols: Column<Lead>[] = [
    { key: 'name', header: 'Student', sort: (l) => l.name, render: (l) => <div><div className="font-medium">{l.name}</div><div className="text-xs text-slate-500">{l.phone}</div></div> },
    { key: 'course', header: 'Course', render: (l) => l.courseInterest || '—' },
    { key: 'inst', header: 'Institute', render: (l) => <span className="text-slate-600">{byId(db.institutes, l.instituteId)?.shortName ?? '—'}</span> },
    { key: 'city', header: 'Location', render: (l) => <span className="text-slate-600">{[byId(db.cities, l.cityId)?.name, byId(db.states, l.stateId)?.name].filter(Boolean).join(', ') || '—'}</span> },
    { key: 'source', header: 'Source', render: (l) => <span className="text-xs capitalize text-slate-600">{l.source.replace(/-/g, ' ')}</span> },
    { key: 'status', header: 'Status', sort: (l) => l.status, render: (l) => <Badge>{l.status}</Badge> },
    { key: 'crm', header: 'CRM', render: (l) => (l.pushedToCrm ? <Badge tone="published">pushed</Badge> : <Badge tone="draft">not pushed</Badge>) },
    { key: 'at', header: 'Received', sort: (l) => l.createdAt, render: (l) => <span className="text-xs text-slate-500">{dateTime(l.createdAt)}</span> },
  ];

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <button onClick={() => setStatus('')} className={cx('rounded-xl border p-3 text-left cursor-pointer', !status ? 'border-brand bg-brand-soft' : 'border-slate-200 bg-white')}>
          <div className="text-xs text-slate-500">All</div><div className="text-xl font-semibold">{db.leads.length}</div>
        </button>
        {counts.map(({ s, n }) => (
          <button key={s} onClick={() => setStatus(status === s ? '' : s)} className={cx('rounded-xl border p-3 text-left cursor-pointer', status === s ? 'border-brand bg-brand-soft' : 'border-slate-200 bg-white')}>
            <div className="text-xs capitalize text-slate-500">{s.replace('-', ' ')}</div><div className="text-xl font-semibold">{n}</div>
          </button>
        ))}
      </div>
      <Card className="mb-3 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput className="lg:col-span-2" value={q} onChange={setQ} placeholder="Name, email, phone, course" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={opt(STATUSES)} placeholder="All statuses" />
          <Select value={source} onChange={(e) => setSource(e.target.value)} options={opt(SOURCES)} placeholder="All sources" />
          <Select value={inst} onChange={(e) => setInst(e.target.value)} options={db.institutes.map((i) => ({ value: i.id, label: i.shortName }))} placeholder="All institutes" />
          <Select value={state} onChange={(e) => setState(e.target.value)} options={db.states.map((i) => ({ value: i.id, label: i.name }))} placeholder="All states" />
          <Select value={crm} onChange={(e) => setCrm(e.target.value)} options={[{ value: 'true', label: 'Pushed to CRM' }, { value: 'false', label: 'Not pushed' }]} placeholder="CRM: any" />
          <div className="flex gap-1 lg:col-span-2"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" /></div>
        </div>
      </Card>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">{rows.length} leads</span>
        {sel.length > 0 && canEdit && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">
            {sel.length} selected
            <select value={bulk} onChange={(e) => {
              const v = e.target.value as Lead['status']; setBulk('');
              if (!v) return;
              sel.forEach((id) => update('leads', id, { status: v }));
              toast(`${sel.length} leads marked ${v}`); log(`marked ${v}`, `${sel.length} leads`);
            }} className="h-7 rounded bg-slate-700 px-2 text-xs">
              <option value="">Change status…</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button size="sm" variant="secondary" onClick={() => { push(sel); setSel([]); }}><Send className="h-3.5 w-3.5" />Push to CRM</Button>
            <button className="text-xs underline cursor-pointer" onClick={() => setSel([])}>Clear</button>
          </div>
        )}
        <div className="ml-auto"><Button size="sm" variant="outline" onClick={exportCsv}><Download className="h-4 w-4" />Download CSV</Button></div>
      </div>
      <DataTable rows={rows} columns={cols} selectable={canEdit} selected={sel} onSelect={setSel} onRowClick={(l) => setOpenId(l.id)} />

      <Sheet open={!!lead} onClose={() => setOpenId(null)} title={lead?.name}
        footer={lead && <>
          {!lead.pushedToCrm && canEdit && <Button variant="blue" onClick={() => push([lead.id])}><Send className="h-4 w-4" />Push to CRM</Button>}
          <Button variant="outline" onClick={() => setOpenId(null)}>Close</Button>
        </>}>
        {lead && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${lead.phone}`}><Button size="sm" variant="outline"><Phone className="h-4 w-4" />{lead.phone}</Button></a>
              {lead.email && <a href={`mailto:${lead.email}`}><Button size="sm" variant="outline"><Mail className="h-4 w-4" />{lead.email}</Button></a>}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ['Course interest', lead.courseInterest || '—'],
                ['Institute', byId(db.institutes, lead.instituteId) ? <Link className="text-brand" to={`/admin/institutes/${lead.instituteId}`}>{byId(db.institutes, lead.instituteId)!.name}</Link> : '—'],
                ['State', byId(db.states, lead.stateId)?.name ?? '—'], ['City', byId(db.cities, lead.cityId)?.name ?? '—'],
                ['Source', <span className="capitalize">{lead.source.replace(/-/g, ' ')}</span>], ['Page', <Link className="text-brand" to={lead.page}>{lead.page}</Link>],
                ['Received', dateTime(lead.createdAt)], ['CRM', lead.pushedToCrm ? 'Pushed' : 'Not pushed'],
              ].map(([k, v], i) => <div key={i}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5">{v}</dd></div>)}
            </dl>
            <Field label="Status">
              <Select disabled={!canEdit} value={lead.status} onChange={(e) => { update('leads', lead.id, { status: e.target.value as Lead['status'] }); toast('Status updated'); log(`marked ${e.target.value}`, lead.name, lead.id); }} options={opt(STATUSES)} />
            </Field>
            <Field label="Notes">
              <Textarea disabled={!canEdit} defaultValue={lead.notes} key={lead.id} onBlur={(e) => { if (e.target.value !== lead.notes) { update('leads', lead.id, { notes: e.target.value }); toast('Notes saved'); } }} placeholder="Call notes, follow-up…" />
            </Field>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function PredictorLeads() {
  const db = useStore((s) => s.db);
  const [exam, setExam] = useState('');
  const [pred, setPred] = useState('');
  const [q, setQ] = useState('');
  const rows = db.predictorLeads.filter((l) => (!exam || l.examId === +exam) && (!pred || l.predictor === pred) && (!q || (l.name + l.phone).toLowerCase().includes(q.toLowerCase())));
  const cols: Column<PredictorLead>[] = [
    { key: 'name', header: 'Student', render: (l) => <div><div className="font-medium">{l.name}</div><div className="text-xs text-slate-500">{l.phone}</div></div> },
    { key: 'exam', header: 'Exam', render: (l) => byId(db.exams, l.examId)?.shortName ?? '—' },
    { key: 'pred', header: 'Predictor', render: (l) => <Badge tone="new">{l.predictor}</Badge> },
    { key: 'in', header: 'Input', render: (l) => l.input },
    { key: 'res', header: 'Result', render: (l) => l.result },
    { key: 'at', header: 'When', sort: (l) => l.createdAt, render: (l) => <span className="text-xs text-slate-500">{date(l.createdAt)}</span> },
  ];
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput className="w-64" value={q} onChange={setQ} placeholder="Name or phone" />
        <Select className="w-44" value={exam} onChange={(e) => setExam(e.target.value)} options={db.exams.map((e) => ({ value: e.id, label: e.shortName }))} placeholder="All exams" />
        <Select className="w-44" value={pred} onChange={(e) => setPred(e.target.value)} options={opt(['college', 'percentile', 'rank'])} placeholder="All predictors" />
        <div className="ml-auto"><Button size="sm" variant="outline" onClick={() => downloadCsv('predictor-leads.csv', rows.map((l) => ({ ...l, exam: byId(db.exams, l.examId)?.shortName })))}><Download className="h-4 w-4" />Download CSV</Button></div>
      </div>
      <DataTable rows={rows} columns={cols} />
    </div>
  );
}

export default function Leads() {
  const [tab, setTab] = useState<'student' | 'predictor'>('student');
  const n = useStore((s) => s.db.predictorLeads.length);
  return (
    <div>
      <PageHeader title="Student Leads" subtitle="Enquiries from the website — counsellor forms, apply now, brochures, predictors" />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'student', label: 'Student leads' }, { value: 'predictor', label: `Predictor leads (${n})` }]} />
      {tab === 'student' ? <StudentLeads /> : <PredictorLeads />}
    </div>
  );
}
