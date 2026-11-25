import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Calculator, GraduationCap, Megaphone, Quote, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useStore } from '../../store';
import { Button, DynIcon, Img, Logo, Tabs, cx } from '../../ui';
import { compact, date } from '../../lib/format';
import { SearchBox } from './Layout';
import { CollegeCard } from './CollegeCard';
import { SectionTitle, useInstitutes, useWebUi } from './common';

function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0; let started = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      const t0 = performance.now();
      const tick = (t: number) => { const p = Math.min(1, (t - t0) / 1200); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{compact(v)}{suffix}</span>;
}

export function Home() {
  const db = useStore((s) => s.db);
  const cfg = useStore((s) => s.config);
  const insts = useInstitutes();
  const openLead = useWebUi((s) => s.openLead);
  const [mode, setMode] = useState<'stream' | 'city'>('stream');
  const [streamId, setStreamId] = useState(db.streams[0]?.id ?? 1);
  const topCities = db.cities.filter((c) => insts.some((n) => n.cityId === c.id)).slice(0, 8);
  const [cityId, setCityId] = useState(topCities[0]?.id ?? 1);
  const explore = insts.filter((n) => (mode === 'stream' ? n.streamIds.includes(streamId) : n.cityId === cityId)).sort((a, b) => b.score - a.score).slice(0, 8);
  const exams = db.exams.filter((e) => e.status === 'published');
  const preds = exams.flatMap((e) => [
    e.hasCollegePredictor && { to: `/exams/${e.slug}/college-predictor`, title: `${e.name} College Predictor`, icon: GraduationCap },
    e.hasPercentilePredictor && { to: `/exams/${e.slug}/percentile-predictor`, title: `${e.name} Percentile Predictor`, icon: TrendingUp },
    e.hasRankPredictor && { to: `/exams/${e.slug}/rank-predictor`, title: `${e.name} Rank Predictor`, icon: Target },
  ]).filter((x): x is { to: string; title: string; icon: typeof Target } => !!x).slice(0, 8);
  const articles = db.articles.filter((a) => a.status === 'published').sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')).slice(0, 6);
  const today = new Date().toISOString().slice(0, 10);
  const events = db.events.filter((e) => e.status === 'published' && e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const updates = db.updates.filter((u) => u.status === 'published').sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const press = db.pressReleases.filter((p) => p.status === 'published');
  const author = (id: number) => db.authors.find((a) => a.id === id);

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-white to-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center md:py-24">
          <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand shadow-sm"><Sparkles className="h-3.5 w-3.5" /> Admissions 2026 · Free counselling</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">{cfg.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{cfg.heroSubtitle}</p>
          <div className="mx-auto mt-8 max-w-2xl"><SearchBox big /></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            {['IIT Bombay', 'MBA', 'JEE Main', 'NEET UG', 'B.Tech'].map((t) => <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:border-brand hover:text-brand">{t}</Link>)}
          </div>
        </div>
      </section>

      {/* Streams */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title="Explore by stream" subtitle="Pick a field to see top colleges, courses and exams" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {db.streams.map((s) => {
            const count = insts.filter((n) => n.streamIds.includes(s.id)).length;
            const lp = db.landingPages.find((p) => p.kind === 'category' && p.status === 'published' && p.streamId === s.id && !p.baseCourseId);
            return (
              <Link key={s.id} to={lp ? `/colleges/${lp.slug}` : `/colleges/all?stream=${s.id}`} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white"><DynIcon name={s.icon} className="h-5 w-5" /></div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-slate-500">{count} colleges</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Explore colleges */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title="Top colleges for you" subtitle="Ranked by MSM Unify college score" action={
            <div className="flex rounded-full border border-slate-200 bg-white p-1 text-sm">
              {(['stream', 'city'] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={cx('rounded-full px-4 py-1 capitalize cursor-pointer', mode === m ? 'bg-brand text-white' : 'text-slate-600')}>By {m}</button>)}
            </div>
          } />
          {mode === 'stream'
            ? <Tabs tabs={db.streams.map((s) => ({ value: String(s.id), label: s.name }))} value={String(streamId)} onChange={(v) => setStreamId(Number(v))} className="mb-5" />
            : <Tabs tabs={topCities.map((c) => ({ value: String(c.id), label: c.name }))} value={String(cityId)} onChange={(v) => setCityId(Number(v))} className="mb-5" />}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{explore.map((n) => <CollegeCard key={n.id} inst={n} />)}</div>
          {!explore.length && <p className="py-10 text-center text-sm text-slate-500">No colleges yet.</p>}
          <div className="mt-6 text-center">
            <Link to={mode === 'stream' ? `/colleges/all?stream=${streamId}` : `/colleges/all?city=${cityId}`}><Button variant="outline">View all colleges <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* Exams */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title="Top entrance exams" subtitle="Dates, syllabus, pattern and results" action={<Link to="/exams" className="text-sm font-medium text-brand">All exams →</Link>} />
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {exams.map((e) => (
            <Link key={e.id} to={`/exams/${e.slug}`} className="w-60 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-md">
              <div className="flex items-center gap-3"><Logo text={e.logo} color="#16181d" size={40} /><div><div className="font-semibold">{e.name}</div><div className="text-[11px] capitalize text-slate-500">{e.level} · {e.mode}</div></div></div>
              <div className="mt-3 text-xs text-slate-500">Exam date</div>
              <div className="text-sm font-medium">{date(e.dates.find((d) => d.event === 'Exam date')?.start)}</div>
              <div className="mt-2 text-xs text-slate-500">{compact(e.registrations)} registrations</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Predictors */}
      {preds.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <div className="rounded-3xl bg-brand-dark p-6 text-white md:p-10">
            <div className="flex items-center gap-2 text-sm text-red-300"><Calculator className="h-4 w-4" /> Predictors</div>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">Know your chances before counselling</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {preds.map((p) => (
                <Link key={p.to} to={p.to} className="flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                  <p.icon className="h-5 w-5 text-red-400" /><span className="text-sm font-medium">{p.title}</span><ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="border-y border-slate-100 bg-white py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 text-center md:grid-cols-4">
          {cfg.stats.map((s) => <div key={s.label}><div className="text-3xl font-extrabold text-brand md:text-4xl"><CountUp to={s.value} suffix={s.suffix} /></div><div className="mt-1 text-sm text-slate-500">{s.label}</div></div>)}
        </div>
      </section>

      {/* Articles */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionTitle title="Latest news & articles" action={<Link to="/blog" className="text-sm font-medium text-brand">View all →</Link>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} to={`/blog/${a.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-md">
              <Img src={a.cover} className="h-40 w-full" />
              <div className="p-4">
                <div className="text-[11px] font-semibold uppercase text-brand">{a.category.replace('-', ' ')}</div>
                <div className="mt-1 line-clamp-2 font-semibold group-hover:text-brand">{a.title}</div>
                <div className="mt-2 text-xs text-slate-500">{author(a.authorId)?.name} · {date(a.publishedAt)} · {a.readMinutes} min read</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Events & updates */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><CalendarDays className="h-5 w-5 text-brand" /> Upcoming events & deadlines</h3>
          <div className="divide-y divide-slate-100">
            {events.map((e) => (
              <a key={e.id} href={e.link} className="flex items-center gap-3 py-2.5 hover:text-brand">
                <div className="w-14 shrink-0 rounded-lg bg-brand-soft py-1 text-center text-brand"><div className="text-lg font-bold leading-none">{new Date(e.date).getDate()}</div><div className="text-[10px] uppercase">{new Date(e.date).toLocaleString('en', { month: 'short' })}</div></div>
                <div className="min-w-0"><div className="truncate text-sm font-medium">{e.title}</div><div className="text-xs capitalize text-slate-500">{e.type}</div></div>
              </a>
            ))}
            {!events.length && <p className="py-4 text-sm text-slate-500">No upcoming events.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><Megaphone className="h-5 w-5 text-brand" /> Latest updates</h3>
          <div className="divide-y divide-slate-100">
            {updates.map((u) => {
              const inst = db.institutes.find((n) => n.id === u.instituteId); const ex = db.exams.find((x) => x.id === u.examId);
              const to = inst ? `/college/${inst.slug}` : ex ? `/exams/${ex.slug}` : '/';
              return (
                <Link key={u.id} to={to} className="block py-2.5 hover:text-brand">
                  <div className="flex items-center gap-2 text-sm font-medium">{u.pinned && <span className="rounded bg-brand px-1.5 text-[10px] text-white">PINNED</span>}{u.title}</div>
                  <div className="text-xs text-slate-500">{date(u.createdAt)} · {u.body}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title="What students say" />
          <div className="grid gap-4 md:grid-cols-3">
            {cfg.testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white p-5 shadow-sm">
                <Quote className="h-6 w-6 text-brand" />
                <p className="mt-2 text-sm leading-6 text-slate-700">{t.quote}</p>
                <div className="mt-4 text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-slate-500">{t.course}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press */}
      {press.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">As featured in</div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {press.map((p) => <a key={p.id} href={p.url} title={p.title} className="text-lg font-bold text-slate-400 transition hover:text-slate-800">{p.publication}</a>)}
          </div>
        </section>
      )}

      {/* Counsellor CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-brand p-8 text-white md:flex-row md:p-10">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Confused about which college to pick?</h2>
            <p className="mt-1 text-red-100">Talk to an expert counsellor — free, unbiased, personalised.</p>
          </div>
          <div className="flex gap-2">
            <Button size="lg" className="bg-white !text-brand hover:bg-red-50" onClick={() => openLead({ source: 'talk-to-counsellor' })}>Get free counselling</Button>
            <Link to="/talk-to-counsellor"><Button size="lg" variant="outline" className="border-white/40 bg-transparent !text-white hover:bg-white/10">Learn more</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
