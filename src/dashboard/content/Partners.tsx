import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, DataTable, Field, Input, Logo, Modal, PageHeader, SearchInput, Select, Stat, Toggle, useConfirm, type Column } from '../../ui';
import { byId, date, downloadCsv } from '../../lib/format';
import type { PartnerInstitute } from '../../data/types';
import { useCan } from '../Layout';
import { NumInput, opts } from './common';

export function PartnersPage() {
  const db = useStore((s) => s.db);
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [edit, setEdit] = useState<Partial<PartnerInstitute> | null>(null);
  const inst = (p: PartnerInstitute) => byId(db.institutes, p.instituteId);
  const rows = db.partnerInstitutes.filter((p) => (!q || `${inst(p)?.name} ${inst(p)?.shortName} ${p.contactPerson}`.toLowerCase().includes(q.toLowerCase())) && (!status || p.mouStatus === status));
  const cols: Column<PartnerInstitute>[] = [
    { key: 'inst', header: 'Institution', sort: (r) => inst(r)?.name ?? '', render: (r) => { const i = inst(r); return i ? <Link to={`/admin/institutes/${i.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 hover:text-brand"><Logo text={i.logo} color={i.brandColor} size={30} /><span className="font-medium">{i.shortName}</span></Link> : '—'; } },
    { key: 'since', header: 'Partner since', sort: (r) => r.partnerSince, render: (r) => date(r.partnerSince) },
    { key: 'comm', header: 'Commission', className: 'text-right', sort: (r) => r.commissionPercent, render: (r) => `${r.commissionPercent}%` },
    { key: 'mou', header: 'MOU', sort: (r) => r.mouStatus, render: (r) => <Badge>{r.mouStatus}</Badge> },
    { key: 'online', header: 'Online', render: (r) => (r.onlinePartner ? <Badge tone="new">online</Badge> : '—') },
    { key: 'contact', header: 'Contact', render: (r) => <div className="text-xs"><div>{r.contactPerson}</div><div className="text-slate-500">{r.contactEmail}</div></div> },
    { key: 'act', header: '', render: (r) => <div className="flex">
      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEdit(r); }}><Pencil className="h-3.5 w-3.5" /></Button>
      {can('partner_institutes.delete') && <Button size="sm" variant="ghost" onClick={async (e) => { e.stopPropagation(); if (await confirm(`Remove ${inst(r)?.shortName} as partner?`)) { remove('partnerInstitutes', r.id); update('institutes', r.instituteId, { isPartner: false }); log('removed partner', inst(r)?.shortName ?? '', r.instituteId); toast('Partner removed'); } }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}
    </div> },
  ];
  const save = () => {
    if (!edit?.instituteId) return toast('Pick an institution', 'error');
    const data = { instituteId: Number(edit.instituteId), partnerSince: edit.partnerSince ?? new Date().toISOString().slice(0, 10), commissionPercent: edit.commissionPercent ?? 10, contactPerson: edit.contactPerson ?? '', contactEmail: edit.contactEmail ?? '', mouStatus: edit.mouStatus ?? 'pending', onlinePartner: edit.onlinePartner ?? false };
    if (edit.id) update('partnerInstitutes', edit.id, data);
    else {
      if (db.partnerInstitutes.some((p) => p.instituteId === data.instituteId)) return toast('Already a partner', 'error');
      add('partnerInstitutes', data);
    }
    update('institutes', data.instituteId, { isPartner: true, onlineCourses: data.onlinePartner || (byId(db.institutes, data.instituteId)?.onlineCourses ?? false) });
    log(edit.id ? 'updated partner' : 'added partner', byId(db.institutes, data.instituteId)?.shortName ?? '', data.instituteId);
    toast('Partner saved'); setEdit(null);
  };
  const candidates = db.institutes.filter((i) => edit?.id ? true : !db.partnerInstitutes.some((p) => p.instituteId === i.id));
  return (
    <div>
      {node}
      <PageHeader title="Partner institutes" subtitle="Institutions with an MOU. Partners get the Partner badge and priority placement on the website."
        actions={<>
          <Button variant="outline" onClick={() => downloadCsv('partners.csv', rows.map((p) => ({ institute: inst(p)?.name, since: p.partnerSince, commission: p.commissionPercent, mou: p.mouStatus, online: p.onlinePartner, contact: p.contactPerson, email: p.contactEmail })))}><Download className="h-4 w-4" />CSV</Button>
          {can('partner_institutes.create') && <Button onClick={() => setEdit({ mouStatus: 'pending', commissionPercent: 10 })}><Plus className="h-4 w-4" />Add partner</Button>}
        </>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Stat label="Partners" value={db.partnerInstitutes.length} />
        <Stat label="Active MOU" value={db.partnerInstitutes.filter((p) => p.mouStatus === 'active').length} />
        <Stat label="Pending / expired" value={db.partnerInstitutes.filter((p) => p.mouStatus !== 'active').length} />
        <Stat label="Avg commission" value={`${db.partnerInstitutes.length ? Math.round(db.partnerInstitutes.reduce((a, p) => a + p.commissionPercent, 0) / db.partnerInstitutes.length) : 0}%`} />
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <SearchInput value={q} onChange={setQ} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All MOU statuses" options={opts(['active', 'pending', 'expired'])} />
      </div>
      <DataTable rows={rows} columns={cols} onRowClick={(r) => setEdit(r)} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit partner' : 'Add partner'} footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Institution" className="sm:col-span-2"><Select disabled={!!edit.id} value={edit.instituteId ?? ''} onChange={(e) => setEdit({ ...edit, instituteId: Number(e.target.value) })} placeholder="Select institution" options={candidates.map((i) => ({ value: i.id, label: i.name }))} /></Field>
          <Field label="Partner since"><Input type="date" value={edit.partnerSince ?? ''} onChange={(e) => setEdit({ ...edit, partnerSince: e.target.value })} /></Field>
          <Field label="Commission %"><NumInput value={edit.commissionPercent} onChange={(v) => setEdit({ ...edit, commissionPercent: v ?? 0 })} /></Field>
          <Field label="MOU status"><Select value={edit.mouStatus} onChange={(e) => setEdit({ ...edit, mouStatus: e.target.value as PartnerInstitute['mouStatus'] })} options={opts(['active', 'pending', 'expired'])} /></Field>
          <div className="flex items-end pb-2"><Toggle checked={!!edit.onlinePartner} onChange={(v) => setEdit({ ...edit, onlinePartner: v })} label="Online partner" /></div>
          <Field label="Contact person"><Input value={edit.contactPerson ?? ''} onChange={(e) => setEdit({ ...edit, contactPerson: e.target.value })} /></Field>
          <Field label="Contact email"><Input value={edit.contactEmail ?? ''} onChange={(e) => setEdit({ ...edit, contactEmail: e.target.value })} /></Field>
        </div>}
      </Modal>
    </div>
  );
}
