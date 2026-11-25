import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, Filter, LayoutGrid, List, Table2, X } from 'lucide-react';
import type { Institute, LandingPage } from '../../data/types';
import { useStore } from '../../store';
import { Badge, Button, Html, Logo, Select, Stars, cx } from '../../ui';
import { inr } from '../../lib/format';
import { CollegeCard, CollegeRow, CompareButton } from './CollegeCard';
import { NotFound } from './NotFound';
import { PLink, ownershipLabel, useInstitutes, usePreview, useWebUi } from './common';

const FEE_BUCKETS = [
  { key: 'lt1', label: 'Below ₹1 L', test: (n: Institute) => n.minFee < 100000 },
  { key: '1-3', label: '₹1 L – 3 L', test: (n: Institute) => n.minFee >= 100000 && n.minFee < 300000 },
  { key: '3-5', label: '₹3 L – 5 L', test: (n: Institute) => n.minFee >= 300000 && n.minFee < 500000 },
  { key: 'gt5', label: 'Above ₹5 L', test: (n: Institute) => n.minFee >= 500000 },
];
type FacetKey = 'stream' | 'course' | 'state' | 'city' | 'ownership' | 'fee' | 'exam';
const FACETS: { key: FacetKey; label: string }[] = [
  { key: 'stream', label: 'Stream' }, { key: 'course', label: 'Course' }, { key: 'state', label: 'State' }, { key: 'city', label: 'City' },
  { key: 'ownership', label: 'Ownership' }, { key: 'fee', label: 'Fees' }, { key: 'exam', label: 'Exam accepted' },
];

function FaqList({ items }: { items: { id: number; question: string; answer: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {items.map((f) => (
        <details key={f.id} className="group p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">{f.question}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" /></summary>
          <p className="mt-2 text-sm leading-6 text-slate-600">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
export { FaqList };

/** Shared listing used by category, ranking and all-colleges pages. */
function CollegeListing({ page, kind }: { page: LandingPage | null; kind: 'category' | 'ranking' | 'all' }) {
  const db = useStore((s) => s.db);
  const all = useInstitutes();
  const [sp, setSp] = useSearchParams();
  const openLead = useWebUi((s) => s.openLead);
  const [shown, setShown] = useState(12);
  const [view, setView] = useState<'grid' | 'list' | 'table'>(kind === 'ranking' ? 'table' : 'list');
  const [mobileFilters, setMobileFilters] = useState(false);
  const pubCourses = useMemo(() => db.courses.filter((c) => c.status === 'published'), [db.courses]);

  const sel = (k: FacetKey) => sp.getAll(k);
  const sort = sp.get('sort') ?? (kind === 'ranking' ? 'rank' : 'popularity');
  const rankBody = page?.rankingBodyId ?? null;
  const rankOf = (n: Institute) => n.rankings.find((r) => r.bodyId === (rankBody ?? 1))?.rank ?? 9999;

  // Fixed base filters from the landing page.
  const base = useMemo(() => all.filter((n) => {
    if (!page) return true;
    if (page.streamId && !n.streamIds.includes(page.streamId)) return false;
    if (page.stateId && n.stateId !== page.stateId) return false;
    if (page.cityId && n.cityId !== page.cityId) return false;
    if (page.ownership && n.ownership !== page.ownership) return false;
    if (page.baseCourseId && !pubCourses.some((c) => c.instituteId === n.id && c.baseCourseId === page.baseCourseId)) return false;
    return true;
  }), [all, page, pubCourses]);

  const match = (n: Institute, k: FacetKey, vals: string[]) => {
    if (!vals.length) return true;
    switch (k) {
      case 'stream': return vals.some((v) => n.streamIds.includes(Number(v)));
      case 'course': return vals.some((v) => pubCourses.some((c) => c.instituteId === n.id && c.baseCourseId === Number(v)));
      case 'state': return vals.includes(String(n.stateId));
      case 'city': return vals.includes(String(n.cityId));
      case 'ownership': return vals.includes(n.ownership);
      case 'fee': return vals.some((v) => FEE_BUCKETS.find((b) => b.key === v)?.test(n));
      case 'exam': return vals.some((v) => pubCourses.some((c) => c.instituteId === n.id && c.examIds.includes(Number(v))));
    }
  };
  const filtered = (except?: FacetKey) => base.filter((n) => FACETS.every((f) => f.key === except || match(n, f.key, sel(f.key))));
  const results = useMemo(() => {
    const r = filtered();
    const pinned = page?.pinnedInstituteIds ?? [];
    const cmp: Record<string, (a: Institute, b: Institute) => number> = {
      popularity: (a, b) => b.views - a.views, rating: (a, b) => b.rating - a.rating, 'fees-low': (a, b) => a.minFee - b.minFee,
      'fees-high': (a, b) => b.minFee - a.minFee, rank: (a, b) => rankOf(a) - rankOf(b), score: (a, b) => b.score - a.score,
    };
    return [...r].sort((a, b) => {
      const pa = pinned.indexOf(a.id); const pb = pinned.indexOf(b.id);
      if (pa !== pb && (pa >= 0 || pb >= 0)) return (pa < 0 ? 999 : pa) - (pb < 0 ? 999 : pb);
      return (cmp[sort] ?? cmp.popularity)(a, b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, sp.toString(), page]);

  const options = (k: FacetKey): { value: string; label: string }[] => {
    switch (k) {
      case 'stream': return db.streams.map((x) => ({ value: String(x.id), label: x.name }));
      case 'course': return db.baseCourses.map((x) => ({ value: String(x.id), label: x.shortName }));
      case 'state': return db.states.map((x) => ({ value: String(x.id), label: x.name }));
      case 'city': return db.cities.map((x) => ({ value: String(x.id), label: x.name }));
      case 'ownership': return (['government', 'private', 'deemed', 'public_private'] as const).map((o) => ({ value: o, label: ownershipLabel(o) }));
      case 'fee': return FEE_BUCKETS.map((b) => ({ value: b.key, label: b.label }));
      case 'exam': return db.exams.filter((e) => e.status === 'published').map((e) => ({ value: String(e.id), label: e.name }));
    }
  };
  const toggle = (k: FacetKey, v: string) => {
    const next = new URLSearchParams(sp);
    const cur = next.getAll(k);
    next.delete(k);
    (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).forEach((x) => next.append(k, x));
    setSp(next, { replace: true });
    setShown(12);
  };
  const clearAll = () => { const next = new URLSearchParams(); if (sp.get('preview')) next.set('preview', '1'); setSp(next, { replace: true }); };
  const active = FACETS.flatMap((f) => sel(f.key).map((v) => ({ k: f.key, v, label: options(f.key).find((o) => o.value === v)?.label ?? v })));

  const rail = (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-semibold">Filters</h3>{active.length > 0 && <button onClick={clearAll} className="text-xs text-brand cursor-pointer">Clear all</button>}</div>
      {FACETS.map((f) => {
        const pool = filtered(f.key);
        const opts = options(f.key).map((o) => ({ ...o, count: pool.filter((n) => match(n, f.key, [o.value])).length })).filter((o) => o.count > 0 || sel(f.key).includes(o.value));
        if (!opts.length) return null;
        return (
          <details key={f.key} open={['stream', 'state', 'ownership', 'fee'].includes(f.key) || sel(f.key).length > 0} className="rounded-xl border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium">{f.label}<ChevronDown className="h-4 w-4 text-slate-400" /></summary>
            <div className="max-h-56 space-y-1 overflow-y-auto px-3 pb-3">
              {opts.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="accent-[#fa0000]" checked={sel(f.key).includes(o.value)} onChange={() => toggle(f.key, o.value)} />
                  <span className="flex-1">{o.label}</span><span className="text-xs text-slate-400">{o.count}</span>
                </label>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );

  const title = page?.title ?? 'All colleges in India';
  const body = db.rankingBodies.find((b) => b.id === rankBody);
  const faqs = page ? db.faqs.filter((f) => f.entityType === 'landing' && f.entityId === page.id && f.status === 'published').sort((a, b) => a.order - b.order) : [];
  const visible = results.slice(0, shown);

  return (
    <div className="pb-16">
      <div className="border-b border-slate-200 bg-gradient-to-b from-brand-soft/60 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-xs text-slate-500"><Link to="/" className="hover:text-brand">Home</Link> / {kind === 'ranking' ? 'Rankings' : 'Colleges'} / <span className="text-slate-700">{title}</span></div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-4xl">{title}{page?.status && page.status !== 'published' && <Badge className="ml-2 align-middle">{page.status}</Badge>}</h1>
          <p className="mt-1 text-sm text-slate-500">{results.length} colleges{kind === 'ranking' && body ? ` · ranked by ${body.name}` : ''}</p>
          {page?.intro && <Html html={page.intro} className="mt-3 max-w-4xl text-sm" />}
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{rail}</aside>
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileFilters(true)}><Filter className="h-4 w-4" /> Filters {active.length > 0 && `(${active.length})`}</Button>
            {active.map((a) => <button key={a.k + a.v} onClick={() => toggle(a.k, a.v)} className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand cursor-pointer">{a.label}<X className="h-3 w-3" /></button>)}
            <div className="ml-auto flex items-center gap-2">
              <Select className="h-8 w-44 text-xs" value={sort} onChange={(e) => { const n = new URLSearchParams(sp); n.set('sort', e.target.value); setSp(n, { replace: true }); }}
                options={[{ value: 'popularity', label: 'Most popular' }, { value: 'rank', label: 'Ranking' }, { value: 'score', label: 'MSM college score' }, { value: 'rating', label: 'Highest rated' }, { value: 'fees-low', label: 'Fees: low to high' }, { value: 'fees-high', label: 'Fees: high to low' }]} />
              <div className="flex rounded-lg border border-slate-200">
                {([['list', List], ['grid', LayoutGrid], ['table', Table2]] as const).map(([v, I]) => <button key={v} title={v} onClick={() => setView(v)} className={cx('p-1.5 cursor-pointer', view === v ? 'bg-slate-100 text-brand' : 'text-slate-400')}><I className="h-4 w-4" /></button>)}
              </div>
            </div>
          </div>

          {view === 'table' ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Rank</th><th className="p-3">College</th><th className="p-3">Fees</th><th className="p-3">Avg package</th><th className="p-3">Rating</th><th className="p-3"></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((n, i) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="p-3 text-lg font-bold text-brand">#{kind === 'ranking' ? rankOf(n) : i + 1}</td>
                      <td className="p-3"><PLink to={`/college/${n.slug}`} className="flex items-center gap-3"><Logo text={n.logo} color={n.brandColor} size={36} /><span><span className="block font-medium hover:text-brand">{n.name}</span><span className="text-xs text-slate-500">{db.cities.find((c) => c.id === n.cityId)?.name} · {ownershipLabel(n.ownership)}</span></span></PLink></td>
                      <td className="p-3 whitespace-nowrap">{inr(n.minFee)} – {inr(n.maxFee)}</td>
                      <td className="p-3 whitespace-nowrap">₹{n.avgPackageLpa} LPA</td>
                      <td className="p-3 whitespace-nowrap"><Stars value={n.rating} /> {n.rating}</td>
                      <td className="p-3"><div className="flex gap-1.5"><Button size="sm" variant="blue" onClick={() => openLead({ source: 'apply-now', instituteId: n.id })}>Apply</Button><CompareButton inst={n} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((n) => <CollegeCard key={n.id} inst={n} rank={kind === 'ranking' ? rankOf(n) : undefined} rankLabel={kind === 'ranking' ? body?.shortName : undefined} />)}</div>
          ) : (
            <div className="space-y-3">{visible.map((n) => <CollegeRow key={n.id} inst={n} rank={kind === 'ranking' ? rankOf(n) : undefined} />)}</div>
          )}
          {!results.length && <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">No colleges match these filters. <button onClick={clearAll} className="text-brand cursor-pointer">Clear filters</button></div>}
          {results.length > shown && <div className="mt-6 text-center"><Button variant="outline" onClick={() => setShown(shown + 12)}>Load more ({results.length - shown} more)</Button></div>}

          {faqs.length > 0 && <div className="mt-10"><h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2><FaqList items={faqs} /></div>}
        </div>
      </div>
      {mobileFilters && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={() => setMobileFilters(false)}>
          <div className="absolute inset-y-0 left-0 w-80 overflow-y-auto bg-slate-50 p-4" onClick={(e) => e.stopPropagation()}>
            {rail}
            <Button className="mt-4 w-full" onClick={() => setMobileFilters(false)}>Show {results.length} colleges</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoryPage({ kind }: { kind: 'category' | 'ranking' }) {
  const { slug } = useParams();
  const pages = useStore((s) => s.db.landingPages);
  const preview = usePreview();
  if (kind === 'category' && slug === 'all') return <CollegeListing page={null} kind="all" />;
  const page = pages.find((p) => p.slug === slug && (preview || p.status === 'published'));
  if (!page) return <NotFound />;
  return <CollegeListing key={page.id} page={page} kind={page.kind === 'ranking' ? 'ranking' : 'category'} />;
}
