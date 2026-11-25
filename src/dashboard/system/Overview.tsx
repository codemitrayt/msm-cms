import { Link } from 'react-router-dom';
import { Building2, BookOpen, ClipboardList, FileText, Inbox, Users, Plus, Upload, Eye } from 'lucide-react';
import { useStore } from '../../store';
import { Card, PageHeader, Stat, Button, Badge } from '../../ui';
import { ago, compact, num } from '../../lib/format';

function Bars({ data, color = 'bg-brand' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <div className="w-32 shrink-0 truncate capitalize text-slate-600">{d.label.replace(/-/g, ' ')}</div>
          <div className="h-5 flex-1 rounded bg-slate-100">
            <div className={`h-5 rounded ${color}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="w-8 text-right tabular-nums text-slate-700">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

function Columns({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-44 items-end gap-1.5">
      {data.map((d) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center gap-1">
          <div className="text-[10px] tabular-nums text-slate-500 opacity-0 group-hover:opacity-100">{d.value}</div>
          <div className="w-full rounded-t bg-brand/80 transition group-hover:bg-brand" style={{ height: `${(d.value / max) * 130 + 2}px` }} />
          <div className="text-[10px] text-slate-400">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const db = useStore((s) => s.db);
  const day = 86400000;
  const t = Date.now();
  const leadsIn = (days: number) => db.leads.filter((l) => t - new Date(l.createdAt).getTime() < days * day).length;
  const sources = Object.entries(db.leads.reduce<Record<string, number>>((m, l) => ({ ...m, [l.source]: (m[l.source] ?? 0) + 1 }), {}))
    .map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(t - (13 - i) * day);
    const key = d.toISOString().slice(0, 10);
    return { label: d.getDate().toString(), value: db.leads.filter((l) => l.createdAt.slice(0, 10) === key).length };
  });
  const statusOf = (rows: { status: string }[]) => ['published', 'in_review', 'draft', 'pending'].map((s) => ({ s, n: rows.filter((r) => r.status === s).length })).filter((x) => x.n);
  const content = [
    { label: 'Institutions', rows: db.institutes },
    { label: 'Courses', rows: db.courses },
    { label: 'Exams', rows: db.exams },
    { label: 'Articles', rows: db.articles },
    { label: 'Landing pages', rows: db.landingPages },
  ];
  const topColleges = [...db.institutes].sort((a, b) => b.views - a.views).slice(0, 6);
  const topArticles = [...db.articles].sort((a, b) => b.views - a.views).slice(0, 6);

  return (
    <div>
      <PageHeader title="Overview" subtitle="Snapshot of content and enquiries across the website"
        actions={<>
          <Link to="/admin/institutes/new"><Button size="sm"><Plus className="h-4 w-4" />New institution</Button></Link>
          <Link to="/admin/articles/new"><Button size="sm" variant="outline"><Plus className="h-4 w-4" />New article</Button></Link>
          <Link to="/admin/uploads"><Button size="sm" variant="outline"><Upload className="h-4 w-4" />Bulk upload</Button></Link>
        </>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Published institutes" value={db.institutes.filter((i) => i.status === 'published').length} hint={`${db.institutes.length} total`} icon={<Building2 className="h-4 w-4" />} />
        <Stat label="Courses" value={num(db.courses.filter((c) => c.status === 'published').length)} hint={`${db.courses.length} total`} icon={<BookOpen className="h-4 w-4" />} />
        <Stat label="Exams" value={db.exams.filter((e) => e.status === 'published').length} hint={`${db.exams.length} total`} icon={<ClipboardList className="h-4 w-4" />} />
        <Stat label="Articles" value={db.articles.filter((a) => a.status === 'published').length} hint={`${db.articles.length} total`} icon={<FileText className="h-4 w-4" />} />
        <Stat label="Leads" value={leadsIn(1)} hint={`today · ${leadsIn(7)} in 7 days`} icon={<Inbox className="h-4 w-4" />} />
        <Stat label="Students" value={db.students.length} hint={`${db.students.filter((s) => s.verified).length} verified`} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Leads — last 14 days</h3><Link to="/admin/leads" className="text-xs text-brand">View leads</Link></div>
          <Columns data={days} />
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Leads by source</h3>
          <Bars data={sources} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Content status</h3>
          <div className="space-y-3">
            {content.map((c) => (
              <div key={c.label}>
                <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-slate-700">{c.label}</span><span className="text-slate-400">{c.rows.length}</span></div>
                <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                  {statusOf(c.rows).map(({ s, n }) => (
                    <div key={s} title={`${s}: ${n}`} style={{ width: `${(n / c.rows.length) * 100}%` }} className={s === 'published' ? 'bg-emerald-500' : s === 'draft' ? 'bg-slate-400' : 'bg-amber-400'} />
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">{statusOf(c.rows).map(({ s, n }) => <span key={s} className="capitalize">{s.replace('_', ' ')} {n}</span>)}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Top viewed colleges</h3>
          <ul className="space-y-2 text-sm">
            {topColleges.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="w-4 text-xs text-slate-400">{i + 1}</span>
                <Link to={`/admin/institutes/${c.id}`} className="flex-1 truncate hover:text-brand">{c.shortName}</Link>
                <span className="flex items-center gap-1 text-xs text-slate-500"><Eye className="h-3 w-3" />{compact(c.views)}</span>
              </li>
            ))}
          </ul>
          <h3 className="mb-3 mt-5 text-sm font-semibold">Top viewed articles</h3>
          <ul className="space-y-2 text-sm">
            {topArticles.map((a, i) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className="w-4 text-xs text-slate-400">{i + 1}</span>
                <Link to={`/admin/articles/${a.id}`} className="flex-1 truncate hover:text-brand">{a.title}</Link>
                <span className="text-xs text-slate-500">{compact(a.views)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Recent activity</h3>
          <ul className="space-y-3">
            {db.activity.slice(0, 12).map((a) => (
              <li key={a.id} className="flex gap-2 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand/70" />
                <div className="min-w-0">
                  <div className="text-slate-700"><span className="font-medium">{a.user}</span> {a.action} <span className="font-medium">{a.entity}</span></div>
                  <div className="text-xs text-slate-400">{ago(a.at)}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {db.leads.filter((l) => l.status === 'new').length > 0 && <Link to="/admin/leads"><Badge tone="new">{`${db.leads.filter((l) => l.status === 'new').length} new leads`}</Badge></Link>}
            {db.reviews.filter((r) => r.status === 'pending').length > 0 && <Badge tone="pending">{`${db.reviews.filter((r) => r.status === 'pending').length} reviews pending`}</Badge>}
          </div>
        </Card>
      </div>
    </div>
  );
}
