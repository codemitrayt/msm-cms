import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, BadgeCheck } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, DataTable, Empty, Logo, PageHeader, SearchInput, Select, type Column } from '../../ui';
import { ago, byId, date, dateTime, downloadCsv, inr } from '../../lib/format';
import type { Student } from '../../data/types';

export function StudentsList() {
  const db = useStore((s) => s.db);
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [ver, setVer] = useState('');
  const rows = db.students.filter((s) => (!q || [s.name, s.email, s.phone].some((x) => x.toLowerCase().includes(q.toLowerCase()))) && (!ver || String(s.verified) === ver));
  const cols: Column<Student>[] = [
    { key: 'name', header: 'Student', sort: (s) => s.name, render: (s) => <div><div className="flex items-center gap-1 font-medium">{s.name}{s.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />}</div><div className="text-xs text-slate-500">{s.email || s.phone}</div></div> },
    { key: 'phone', header: 'Phone', render: (s) => s.phone },
    { key: 'city', header: 'City', render: (s) => byId(db.cities, s.cityId)?.name ?? '—' },
    { key: 'stream', header: 'Interest', render: (s) => byId(db.streams, s.preferredStreamId)?.name ?? '—' },
    { key: 'bm', header: 'Bookmarks', sort: (s) => s.bookmarks.length, render: (s) => s.bookmarks.length },
    { key: 'act', header: 'Activity', sort: (s) => s.activity.length, render: (s) => s.activity.length },
    { key: 'seen', header: 'Last seen', sort: (s) => s.lastSeenAt, render: (s) => <span className="text-xs text-slate-500">{ago(s.lastSeenAt)}</span> },
    { key: 'joined', header: 'Joined', sort: (s) => s.createdAt, render: (s) => <span className="text-xs text-slate-500">{date(s.createdAt)}</span> },
  ];
  return (
    <div>
      <PageHeader title="Student Activity" subtitle="Registered students, their bookmarks and what they did on the website"
        actions={<Button size="sm" variant="outline" onClick={() => downloadCsv('students.csv', rows.map((s) => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, city: byId(db.cities, s.cityId)?.name ?? '', bookmarks: s.bookmarks.length, verified: s.verified, lastSeenAt: s.lastSeenAt, createdAt: s.createdAt })))}><Download className="h-4 w-4" />Download CSV</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput className="w-72" value={q} onChange={setQ} placeholder="Name, email or phone" />
        <Select className="w-44" value={ver} onChange={(e) => setVer(e.target.value)} options={[{ value: 'true', label: 'Verified' }, { value: 'false', label: 'Unverified' }]} placeholder="All students" />
      </div>
      <DataTable rows={rows} columns={cols} onRowClick={(s) => nav(`/admin/students/${s.id}`)} />
    </div>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const db = useStore((s) => s.db);
  const s = db.students.find((x) => x.id === Number(id));
  if (!s) return <Empty text="Student not found" action={<Link to="/admin/students" className="text-brand">Back</Link>} />;
  const digits = (p: string) => p.replace(/\D/g, '').slice(-10);
  const leads = db.leads.filter((l) => digits(l.phone) === digits(s.phone) || (!!s.email && l.email.toLowerCase() === s.email.toLowerCase()));
  const bookmarks = s.bookmarks.map((b) => byId(db.institutes, b)).filter(Boolean);
  return (
    <div>
      <Link to="/admin/students" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" />Students</Link>
      <PageHeader title={<span className="flex items-center gap-2">{s.name}{s.verified ? <Badge tone="published">verified</Badge> : <Badge tone="draft">unverified</Badge>}</span>} subtitle={`Joined ${date(s.createdAt)} · last seen ${ago(s.lastSeenAt)}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Profile</h3>
          <dl className="space-y-2.5 text-sm">
            {[['Email', s.email || '—'], ['Phone', s.phone], ['City', byId(db.cities, s.cityId)?.name ?? '—'], ['Preferred stream', byId(db.streams, s.preferredStreamId)?.name ?? '—'], ['Qualification', s.qualification || '—']].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
          <h3 className="mb-2 mt-6 text-sm font-semibold">Leads ({leads.length})</h3>
          {leads.length ? (
            <ul className="space-y-2 text-sm">
              {leads.map((l) => (
                <li key={l.id} className="rounded-lg border border-slate-100 p-2">
                  <div className="flex items-center justify-between"><span className="capitalize">{l.source.replace(/-/g, ' ')}</span><Badge>{l.status}</Badge></div>
                  <div className="text-xs text-slate-500">{byId(db.institutes, l.instituteId)?.shortName ?? l.courseInterest} · {date(l.createdAt)}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">No leads matched by phone/email.</p>}
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Bookmarked colleges ({bookmarks.length})</h3>
          {bookmarks.length ? (
            <ul className="space-y-2">
              {bookmarks.map((i) => (
                <li key={i!.id} className="flex items-center gap-3">
                  <Logo text={i!.logo} color={i!.brandColor} size={34} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/institutes/${i!.id}`} className="block truncate text-sm font-medium hover:text-brand">{i!.name}</Link>
                    <div className="text-xs text-slate-500">{byId(db.cities, i!.cityId)?.name} · from {inr(i!.minFee)}</div>
                  </div>
                  <Link to={`/college/${i!.slug}`} className="text-xs text-brand">View</Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">No bookmarks.</p>}
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Activity timeline</h3>
          <ol className="relative space-y-3 border-l border-slate-200 pl-4">
            {s.activity.map((a, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute -left-[21.5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brand/70" />
                <div><span className="font-medium">{a.action}</span> {a.target && <span className="text-slate-600">— {a.target}</span>}</div>
                <div className="text-xs text-slate-400">{dateTime(a.at)}</div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
