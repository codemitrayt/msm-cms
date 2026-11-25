import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, IndianRupee, Users, ArrowRight, ListChecks } from 'lucide-react';
import { useCol } from '../../store';
import { Badge, Card, Empty, Html, Logo, SearchInput, Select, cx } from '../../ui';
import { compact, inr } from '../../lib/format';
import type { Exam } from '../../data/types';
import { Crumbs, Page, fmtDay, usePreview, visible } from './shared';
import { NotFound } from '../core/NotFound';

const examColor = (id: number) => ['#1f5eff', '#0f766e', '#7c3aed', '#c2410c', '#be123c', '#0369a1'][id % 6];

export function nextDate(e: Exam) {
  const today = new Date().toISOString().slice(0, 10);
  return e.dates.filter((d) => (d.end ?? d.start) >= today).sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;
}

export function ExamCard({ exam }: { exam: Exam }) {
  const nd = nextDate(exam);
  return (
    <Card className="flex flex-col p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <Logo text={exam.logo} color={examColor(exam.id)} size={44} />
        <div className="min-w-0 flex-1">
          <Link to={`/exams/${exam.slug}`} className="font-semibold text-slate-900 hover:text-brand">{exam.name} 2027</Link>
          <div className="truncate text-xs text-slate-500">{exam.fullName}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone="new">{exam.level}</Badge>
            <Badge>{exam.mode}</Badge>
            {exam.status !== 'published' && <Badge>{exam.status}</Badge>}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
        <div><div className="text-slate-500">Conducted by</div><div className="font-medium line-clamp-2">{exam.conductingBody}</div></div>
        <div><div className="flex items-center gap-1 text-slate-500"><IndianRupee className="h-3 w-3" />Fee</div><div className="font-medium">{inr(exam.applicationFee)}</div></div>
        <div><div className="flex items-center gap-1 text-slate-500"><Users className="h-3 w-3" />Applicants</div><div className="font-medium">{compact(exam.registrations)}</div></div>
      </div>
      {nd && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
          <CalendarDays className="h-3.5 w-3.5 text-brand" />
          <span className="font-medium">{nd.event}:</span> {fmtDay(nd.start)}{nd.tentative && <span className="text-slate-400">(tentative)</span>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs font-medium">
        <Link to={`/exams/${exam.slug}/registration`} className="text-slate-600 hover:text-brand">Application</Link>
        <Link to={`/exams/${exam.slug}/syllabus`} className="text-slate-600 hover:text-brand">Syllabus</Link>
        <Link to={`/exams/${exam.slug}/exam-pattern`} className="text-slate-600 hover:text-brand">Pattern</Link>
        {exam.hasCollegePredictor && <Link to={`/exams/${exam.slug}/college-predictor`} className="text-brand">College predictor</Link>}
      </div>
    </Card>
  );
}

export function ExamsPage() {
  const preview = usePreview();
  const exams = useCol('exams');
  const streams = useCol('streams');
  const listings = useCol('examListings');
  const [q, setQ] = useState('');
  const [stream, setStream] = useState('');
  const [level, setLevel] = useState('');
  const [mode, setMode] = useState('');
  const list = useMemo(
    () =>
      exams.filter(
        (e) =>
          visible(e.status, preview) &&
          (!q || `${e.name} ${e.fullName} ${e.conductingBody}`.toLowerCase().includes(q.toLowerCase())) &&
          (!stream || e.streamIds.includes(Number(stream))) &&
          (!level || e.level === level) &&
          (!mode || e.mode === mode),
      ),
    [exams, preview, q, stream, level, mode],
  );
  return (
    <div>
      <div className="bg-gradient-to-r from-brand-dark to-slate-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Exams' }]} />
          <h1 className="text-3xl font-bold">Entrance Exams in India 2027</h1>
          <p className="mt-1 max-w-2xl text-slate-300">Dates, registration, syllabus, pattern, results and predictors for {exams.filter((e) => visible(e.status, preview)).length} national, state and university-level exams.</p>
        </div>
      </div>
      <Page>
        <div className="mb-5 flex flex-wrap gap-2">
          {listings.filter((l) => visible(l.status, preview)).map((l) => (
            <Link key={l.id} to={`/exam-list/${l.slug}`} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-brand hover:text-brand">
              <ListChecks className="h-3.5 w-3.5" /> {l.title}
            </Link>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-4">
            <Card className="space-y-3 p-4">
              <div className="text-sm font-semibold">Filters</div>
              <Select value={stream} onChange={(e) => setStream(e.target.value)} placeholder="All streams" options={streams.map((s) => ({ value: s.id, label: s.name }))} />
              <Select value={level} onChange={(e) => setLevel(e.target.value)} placeholder="All levels" options={['national', 'state', 'university'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
              <Select value={mode} onChange={(e) => setMode(e.target.value)} placeholder="All modes" options={['online', 'offline', 'hybrid'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
              {(stream || level || mode || q) && (
                <button className="text-xs font-medium text-brand cursor-pointer" onClick={() => { setStream(''); setLevel(''); setMode(''); setQ(''); }}>Clear all</button>
              )}
            </Card>
          </aside>
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-600"><b>{list.length}</b> exams found</div>
              <SearchInput value={q} onChange={setQ} placeholder="Search exams…" className="w-full sm:w-72" />
            </div>
            {list.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((e) => <ExamCard key={e.id} exam={e} />)}</div>
            ) : (
              <Card><Empty text="No exams match these filters" /></Card>
            )}
          </div>
        </div>
      </Page>
    </div>
  );
}

export function ExamListPage() {
  const { slug } = useParams();
  const preview = usePreview();
  const listing = useCol('examListings').find((l) => l.slug === slug);
  const exams = useCol('exams');
  if (!listing || !visible(listing.status, preview)) return <NotFound />;
  const rows = listing.examIds.map((id) => exams.find((e) => e.id === id)).filter((e): e is Exam => !!e && visible(e.status, preview));
  return (
    <Page>
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Exams', to: '/exams' }, { label: listing.title }]} />
      <h1 className="text-2xl font-bold md:text-3xl">{listing.title} 2027</h1>
      <Html html={listing.intro} className="mt-2 max-w-3xl" />
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Exam</th><th className="p-3">Conducted by</th><th className="p-3">Level</th><th className="p-3">Next date</th><th className="p-3">Fee</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => {
              const nd = nextDate(e);
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Logo text={e.logo} color={examColor(e.id)} size={32} />
                      <div><Link to={`/exams/${e.slug}`} className="font-medium hover:text-brand">{e.name}</Link><div className="text-xs text-slate-500">{e.fullName}</div></div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600">{e.conductingBody}</td>
                  <td className="p-3 capitalize">{e.level}</td>
                  <td className="p-3 text-slate-600">{nd ? <>{nd.event}<div className="text-xs">{fmtDay(nd.start)}</div></> : '—'}</td>
                  <td className="p-3">{inr(e.applicationFee)}</td>
                  <td className="p-3"><Link to={`/exams/${e.slug}`} className={cx('inline-flex items-center gap-1 text-xs font-medium text-brand')}>View <ArrowRight className="h-3 w-3" /></Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <Empty text="No exams in this list yet" />}
      </Card>
    </Page>
  );
}

export { examColor };
