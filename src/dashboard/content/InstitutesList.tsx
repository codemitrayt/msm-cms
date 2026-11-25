import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, DataTable, Logo, PageHeader, SearchInput, Select, useConfirm, type Column } from '../../ui';
import { ago, byId, downloadCsv, num } from '../../lib/format';
import { useCan } from '../Layout';
import type { Institute } from '../../data/types';
import { OWNERSHIPS, STATUSES, TYPES, opts, label } from './common';

export function InstitutesList() {
  const db = useStore((s) => s.db);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [f, setF] = useState({ status: '', type: '', ownership: '', state: '', stream: '', partner: '' });
  const [sel, setSel] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  const courseCount = useMemo(() => {
    const m = new Map<number, number>();
    db.courses.forEach((c) => m.set(c.instituteId, (m.get(c.instituteId) ?? 0) + 1));
    return m;
  }, [db.courses]);

  const rows = db.institutes.filter((i) => {
    const t = q.toLowerCase();
    if (t && !`${i.name} ${i.shortName} ${i.slug}`.toLowerCase().includes(t)) return false;
    if (f.status && i.status !== f.status) return false;
    if (f.type && i.type !== f.type) return false;
    if (f.ownership && i.ownership !== f.ownership) return false;
    if (f.state && i.stateId !== Number(f.state)) return false;
    if (f.stream && !i.streamIds.includes(Number(f.stream))) return false;
    if (f.partner && String(i.isPartner) !== f.partner) return false;
    return true;
  });

  const cols: Column<Institute>[] = [
    { key: 'name', header: 'Institution', sort: (r) => r.name, render: (r) => (
      <div className="flex items-center gap-3">
        <Logo text={r.logo} color={r.brandColor} size={34} />
        <div className="min-w-0"><div className="truncate font-medium text-slate-900">{r.name}</div><div className="text-xs text-slate-500">{r.shortName}{r.isPartner && <span className="ml-1.5 text-brand">• Partner</span>}</div></div>
      </div>
    ) },
    { key: 'city', header: 'City', sort: (r) => byId(db.cities, r.cityId)?.name ?? '', render: (r) => <span className="text-slate-600">{byId(db.cities, r.cityId)?.name}, {byId(db.states, r.stateId)?.name}</span> },
    { key: 'type', header: 'Type', render: (r) => <span className="capitalize text-slate-600">{r.type} · {label(r.ownership)}</span> },
    { key: 'status', header: 'Status', sort: (r) => r.status, render: (r) => <Badge>{r.status}</Badge> },
    { key: 'courses', header: 'Courses', className: 'text-right', sort: (r) => courseCount.get(r.id) ?? 0, render: (r) => courseCount.get(r.id) ?? 0 },
    { key: 'score', header: 'Score', className: 'text-right', sort: (r) => r.score, render: (r) => <span className={r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-amber-600' : 'text-red-600'}>{r.score}</span> },
    { key: 'views', header: 'Views', className: 'text-right', sort: (r) => r.views, render: (r) => num(r.views) },
    { key: 'updated', header: 'Updated', sort: (r) => r.updatedAt, render: (r) => <span className="text-xs text-slate-500">{ago(r.updatedAt)}</span> },
  ];

  const applyBulk = () => {
    if (!bulkStatus) return;
    if ((bulkStatus === 'published' || bulkStatus === 'archived') && !can('institutes.publish')) return toast('You do not have permission to publish', 'error');
    sel.forEach((id) => update('institutes', id, { status: bulkStatus as Institute['status'], publishedAt: bulkStatus === 'published' ? new Date().toISOString() : byId(db.institutes, id)?.publishedAt ?? null, updatedAt: new Date().toISOString() }));
    log(`bulk set status ${bulkStatus} on`, `${sel.length} institutions`);
    toast(`${sel.length} institutions set to ${label(bulkStatus)}`);
    setSel([]); setBulkStatus('');
  };
  const bulkDelete = async () => {
    if (!(await confirm(`Delete ${sel.length} institutions and their courses? This cannot be undone.`))) return;
    const ids = new Set(sel);
    remove('courses', db.courses.filter((c) => ids.has(c.instituteId)).map((c) => c.id));
    remove('institutes', sel);
    log('deleted', `${sel.length} institutions`);
    toast(`${sel.length} institutions deleted`);
    setSel([]);
  };

  return (
    <div>
      {node}
      <PageHeader title="Institutions" subtitle={`${db.institutes.length} institutions · ${db.institutes.filter((i) => i.status === 'published').length} published`}
        actions={<>
          <Button variant="outline" onClick={() => downloadCsv('institutions.csv', rows.map((r) => ({ id: r.id, name: r.name, short_name: r.shortName, slug: r.slug, type: r.type, ownership: r.ownership, status: r.status, city: byId(db.cities, r.cityId)?.name, state: byId(db.states, r.stateId)?.name, established: r.establishedYear, courses: courseCount.get(r.id) ?? 0, score: r.score, views: r.views, partner: r.isPartner, updated: r.updatedAt })))}><Download className="h-4 w-4" />CSV</Button>
          {can('institutes.create') && <Button onClick={() => nav('/admin/institutes/new')}><Plus className="h-4 w-4" />New institution</Button>}
        </>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <SearchInput value={q} onChange={setQ} placeholder="Search name or slug…" className="sm:col-span-3 lg:col-span-1" />
        <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} placeholder="All statuses" options={opts(STATUSES)} />
        <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} placeholder="All types" options={opts(TYPES)} />
        <Select value={f.ownership} onChange={(e) => setF({ ...f, ownership: e.target.value })} placeholder="All ownership" options={opts(OWNERSHIPS)} />
        <Select value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} placeholder="All states" options={db.states.map((s) => ({ value: s.id, label: s.name }))} />
        <Select value={f.stream} onChange={(e) => setF({ ...f, stream: e.target.value })} placeholder="All streams" options={db.streams.map((s) => ({ value: s.id, label: s.name }))} />
        <Select value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })} placeholder="Partner: any" options={[{ value: 'true', label: 'Partners only' }, { value: 'false', label: 'Non-partners' }]} />
      </div>
      {sel.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft/50 px-3 py-2 text-sm">
          <span className="font-medium">{sel.length} selected</span>
          <Select className="h-8 w-44" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} placeholder="Change status to…" options={opts(STATUSES)} />
          <Button size="sm" onClick={applyBulk} disabled={!bulkStatus}>Apply</Button>
          {can('institutes.delete') && <Button size="sm" variant="danger" onClick={bulkDelete}><Trash2 className="h-3.5 w-3.5" />Delete</Button>}
          <Button size="sm" variant="ghost" onClick={() => setSel([])}>Clear</Button>
        </div>
      )}
      <DataTable rows={rows} columns={cols} selectable selected={sel} onSelect={setSel} onRowClick={(r) => nav(`/admin/institutes/${r.id}`)} empty="No institutions match these filters" />
    </div>
  );
}
