import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store';
import { Img, Logo } from '../../ui';
import { date, inr } from '../../lib/format';
import { SearchBox } from './Layout';
import { CollegeCard } from './CollegeCard';
import { useInstitutes } from './common';

export function SearchPage() {
  const [sp] = useSearchParams();
  const q = (sp.get('q') ?? '').trim();
  const t = q.toLowerCase();
  const db = useStore((s) => s.db);
  const insts = useInstitutes();
  const res = useMemo(() => {
    if (!t) return null;
    const bcMatch = db.baseCourses.filter((b) => `${b.name} ${b.shortName}`.toLowerCase().includes(t)).map((b) => b.id);
    const colleges = insts.filter((n) => `${n.name} ${n.shortName} ${db.cities.find((c) => c.id === n.cityId)?.name}`.toLowerCase().includes(t)
      || db.courses.some((c) => c.instituteId === n.id && c.status === 'published' && bcMatch.includes(c.baseCourseId)));
    const courses = db.courses.filter((c) => c.status === 'published' && c.name.toLowerCase().includes(t) && insts.some((n) => n.id === c.instituteId)).slice(0, 12);
    const exams = db.exams.filter((e) => e.status === 'published' && `${e.name} ${e.fullName} ${e.conductingBody}`.toLowerCase().includes(t));
    const articles = db.articles.filter((a) => a.status === 'published' && `${a.title} ${a.excerpt}`.toLowerCase().includes(t));
    const pages = db.landingPages.filter((p) => p.status === 'published' && p.title.toLowerCase().includes(t));
    return { colleges, courses, exams, articles, pages };
  }, [t, db, insts]);
  const total = res ? res.colleges.length + res.courses.length + res.exams.length + res.articles.length + res.pages.length : 0;
  const block = (title: string, n: number, children: React.ReactNode) => n > 0 && (
    <section className="mt-8"><h2 className="mb-3 text-lg font-bold">{title} <span className="text-sm font-normal text-slate-400">({n})</span></h2>{children}</section>
  );
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24">
      <div className="max-w-2xl"><SearchBox /></div>
      <h1 className="mt-6 text-2xl font-bold">{q ? <>Results for “{q}”</> : 'Search'}</h1>
      {res && <p className="text-sm text-slate-500">{total} results</p>}
      {res && total === 0 && <p className="mt-10 text-center text-slate-500">No results. Try a college name, course (e.g. MBA) or exam.</p>}
      {res && <>
        {block('Rankings & lists', res.pages.length, <div className="flex flex-wrap gap-2">{res.pages.map((p) => <Link key={p.id} to={`/${p.kind === 'ranking' ? 'rankings' : 'colleges'}/${p.slug}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-brand hover:text-brand">{p.title}</Link>)}</div>)}
        {block('Colleges', res.colleges.length, <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{res.colleges.slice(0, 12).map((n) => <CollegeCard key={n.id} inst={n} />)}</div>)}
        {block('Courses', res.courses.length, <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{res.courses.map((c) => { const n = db.institutes.find((x) => x.id === c.instituteId)!; return (
          <Link key={c.id} to={`/college/${n.slug}/courses/${c.slug}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-brand"><Logo text={n.logo} color={n.brandColor} size={36} /><div className="min-w-0"><div className="truncate font-medium">{c.name}</div><div className="text-xs text-slate-500">{n.shortName} · {inr(c.fees)}</div></div></Link>
        ); })}</div>)}
        {block('Exams', res.exams.length, <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{res.exams.map((e) => <Link key={e.id} to={`/exams/${e.slug}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-brand"><Logo text={e.logo} color="#16181d" size={36} /><div><div className="font-medium">{e.name}</div><div className="text-xs text-slate-500">{e.fullName}</div></div></Link>)}</div>)}
        {block('Articles', res.articles.length, <div className="grid gap-3 md:grid-cols-2">{res.articles.map((a) => <Link key={a.id} to={`/blog/${a.slug}`} className="flex gap-3 rounded-xl border border-slate-200 p-3 hover:border-brand"><Img src={a.cover} className="h-16 w-24 shrink-0 rounded-lg" /><div className="min-w-0"><div className="line-clamp-2 text-sm font-medium">{a.title}</div><div className="mt-1 text-xs text-slate-500">{date(a.publishedAt)}</div></div></Link>)}</div>)}
      </>}
    </div>
  );
}
