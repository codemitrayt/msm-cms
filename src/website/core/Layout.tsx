import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, ChevronDown, Eye, GitCompareArrows, LogOut, Mail, Menu, Phone, Search, User, X } from 'lucide-react';
import { useStore } from '../../store';
import { Button, DynIcon, Logo, cx } from '../../ui';
import { useInstitutes, usePreview, useWebUi } from './common';
import { AuthModal, LeadModal } from './Modals';

function useSuggestions(q: string) {
  const db = useStore((s) => s.db);
  const insts = useInstitutes();
  return useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const out: { type: string; label: string; sub: string; to: string }[] = [];
    insts.filter((n) => `${n.name} ${n.shortName}`.toLowerCase().includes(t)).slice(0, 5).forEach((n) => out.push({ type: 'College', label: n.name, sub: db.cities.find((c) => c.id === n.cityId)?.name ?? '', to: `/college/${n.slug}` }));
    db.exams.filter((e) => e.status === 'published' && `${e.name} ${e.fullName}`.toLowerCase().includes(t)).slice(0, 3).forEach((e) => out.push({ type: 'Exam', label: e.name, sub: e.fullName, to: `/exams/${e.slug}` }));
    db.baseCourses.filter((b) => `${b.name} ${b.shortName}`.toLowerCase().includes(t)).slice(0, 3).forEach((b) => out.push({ type: 'Course', label: b.shortName, sub: b.name, to: `/search?q=${encodeURIComponent(b.shortName)}` }));
    db.articles.filter((a) => a.status === 'published' && a.title.toLowerCase().includes(t)).slice(0, 3).forEach((a) => out.push({ type: 'Article', label: a.title, sub: 'Blog', to: `/blog/${a.slug}` }));
    return out;
  }, [q, db, insts]);
}

export function SearchBox({ big, onDone, autoFocus }: { big?: boolean; onDone?: () => void; autoFocus?: boolean }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const sugg = useSuggestions(q);
  const go = (to: string) => { nav(to); setQ(''); setOpen(false); onDone?.(); };
  return (
    <div className="relative w-full">
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`); }} className={cx('flex items-center gap-2 rounded-full border border-slate-300 bg-white', big ? 'h-14 pl-5 pr-1.5 shadow-lg' : 'h-10 px-3')}>
        <Search className={cx('shrink-0 text-slate-400', big ? 'h-5 w-5' : 'h-4 w-4')} />
        <input autoFocus={autoFocus} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search colleges, exams, courses, articles…" className={cx('min-w-0 flex-1 bg-transparent outline-none', big ? 'text-base' : 'text-sm')} />
        {big && <Button type="submit" className="h-11 rounded-full px-6">Search</Button>}
      </form>
      {open && sugg.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
          {sugg.map((s, i) => (
            <button key={i} onMouseDown={() => go(s.to)} className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer">
              <span className="w-14 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-semibold uppercase text-slate-500">{s.type}</span>
              <span className="min-w-0 flex-1 truncate text-left"><span className="font-medium">{s.label}</span> <span className="text-slate-400">{s.sub}</span></span>
            </button>
          ))}
          <button onMouseDown={() => go(`/search?q=${encodeURIComponent(q)}`)} className="w-full border-t border-slate-100 px-4 py-2 text-left text-sm font-medium text-brand hover:bg-slate-50 cursor-pointer">See all results for “{q}”</button>
        </div>
      )}
    </div>
  );
}

function MegaMenu({ onNavigate }: { onNavigate?: () => void }) {
  const db = useStore((s) => s.db);
  const insts = useInstitutes();
  const [active, setActive] = useState(db.streams[0]?.id ?? 1);
  const stream = db.streams.find((s) => s.id === active);
  const cat = db.landingPages.filter((p) => p.status === 'published' && p.streamId === active);
  const top = insts.filter((n) => n.streamIds.includes(active)).sort((a, b) => b.score - a.score).slice(0, 6);
  const courses = db.baseCourses.filter((b) => b.streamId === active);
  const pred = db.exams.filter((e) => e.status === 'published' && e.streamIds.includes(active));
  return (
    <div className="grid w-[min(900px,92vw)] grid-cols-[200px_1fr] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="bg-slate-50 py-2">
        {db.streams.map((s) => (
          <button key={s.id} onMouseEnter={() => setActive(s.id)} onClick={() => setActive(s.id)} className={cx('flex w-full items-center gap-2 px-4 py-2 text-left text-sm cursor-pointer', s.id === active ? 'bg-white font-semibold text-brand' : 'text-slate-600')}>
            <DynIcon name={s.icon} className="h-4 w-4" />{s.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6 p-5 text-sm" onClick={onNavigate}>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Colleges & rankings</div>
          {cat.map((p) => <Link key={p.id} to={`/${p.kind === 'ranking' ? 'rankings' : 'colleges'}/${p.slug}`} className="block py-1 text-slate-700 hover:text-brand">{p.title}</Link>)}
          <Link to={`/colleges/all?stream=${active}`} className="block py-1 text-slate-700 hover:text-brand">All {stream?.name} colleges</Link>
          {courses.slice(0, 4).map((b) => <Link key={b.id} to={`/colleges/all?course=${b.id}`} className="block py-1 text-slate-700 hover:text-brand">{b.shortName} colleges</Link>)}
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Top colleges</div>
          {top.map((n) => <Link key={n.id} to={`/college/${n.slug}`} className="block truncate py-1 text-slate-700 hover:text-brand">{n.shortName}</Link>)}
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Exams</div>
          {pred.map((e) => <Link key={e.id} to={`/exams/${e.slug}`} className="block py-1 text-slate-700 hover:text-brand">{e.name}</Link>)}
          {!pred.length && <span className="text-slate-400">No exams yet</span>}
        </div>
      </div>
    </div>
  );
}

function Dropdown({ label, children, align = 'left' }: { label: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand cursor-pointer">{label}<ChevronDown className="h-3.5 w-3.5" /></button>
      {open && <div className={cx('absolute top-full z-50 pt-1', align === 'right' ? 'right-0' : 'left-0')}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

function Header() {
  const db = useStore((s) => s.db);
  const student = useStore((s) => s.student);
  const logout = useStore((s) => s.logoutStudent);
  const toast = useStore((s) => s.toast);
  const openAuth = useWebUi((s) => s.openAuth);
  const openLead = useWebUi((s) => s.openLead);
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setMobile(false); setSearchOpen(false); }, [loc.pathname]);
  const predExams = db.exams.filter((e) => e.status === 'published' && (e.hasCollegePredictor || e.hasPercentilePredictor || e.hasRankPredictor));
  const topExams = db.exams.filter((e) => e.status === 'published').slice(0, 10);
  const listing = db.examListings.filter((l) => l.status === 'published');
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <button className="rounded-md p-1.5 hover:bg-slate-100 lg:hidden cursor-pointer" onClick={() => setMobile(!mobile)}>{mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-white">M</div>
          <div className="leading-none"><div className="text-lg font-extrabold tracking-tight">MSM <span className="text-brand">Unify</span></div><div className="text-[10px] text-slate-400">India</div></div>
        </Link>
        <nav className="ml-4 hidden items-center lg:flex">
          <Dropdown label="Colleges">{(close) => <MegaMenu onNavigate={close} />}</Dropdown>
          <Dropdown label="Exams">{() => (
            <div className="w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {topExams.map((e) => <Link key={e.id} to={`/exams/${e.slug}`} className="block rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50">{e.name} <span className="text-xs text-slate-400">{e.conductingBody}</span></Link>)}
              {listing.map((l) => <Link key={l.id} to={`/exam-list/${l.slug}`} className="block rounded-lg px-3 py-1.5 text-sm text-brand hover:bg-slate-50">{l.title}</Link>)}
              <Link to="/exams" className="mt-1 block border-t border-slate-100 px-3 pt-2 text-sm font-medium text-brand">All exams →</Link>
            </div>
          )}</Dropdown>
          <Dropdown label="Predictors">{() => (
            <div className="w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {predExams.flatMap((e) => [
                e.hasCollegePredictor && { to: `/exams/${e.slug}/college-predictor`, label: `${e.name} College Predictor` },
                e.hasPercentilePredictor && { to: `/exams/${e.slug}/percentile-predictor`, label: `${e.name} Percentile Predictor` },
                e.hasRankPredictor && { to: `/exams/${e.slug}/rank-predictor`, label: `${e.name} Rank Predictor` },
              ]).filter((x): x is { to: string; label: string } => !!x).map((p) => <Link key={p.to} to={p.to} className="block rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50">{p.label}</Link>)}
            </div>
          )}</Dropdown>
          <Link to="/blog" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand">Blog</Link>
          <Link to="/compare" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand">Compare</Link>
        </nav>
        <div className="ml-auto hidden w-72 xl:block"><SearchBox /></div>
        <button className="ml-auto rounded-full p-2 hover:bg-slate-100 xl:hidden cursor-pointer" onClick={() => setSearchOpen(!searchOpen)}><Search className="h-5 w-5" /></button>
        <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => openLead({ source: 'talk-to-counsellor' })}><Phone className="h-3.5 w-3.5" /> Talk to counsellor</Button>
        {student ? (
          <Dropdown align="right" label={<span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{student.name[0]}</span>}>{() => (
            <div className="w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="px-3 py-2"><div className="font-semibold">{student.name}</div><div className="text-xs text-slate-500">{student.phone}</div></div>
              <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"><User className="h-4 w-4" />My profile</Link>
              <Link to="/bookmarks" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"><Bookmark className="h-4 w-4" />Bookmarks ({student.bookmarks.length})</Link>
              <button onClick={() => { logout(); toast('Logged out', 'info'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-slate-50 cursor-pointer"><LogOut className="h-4 w-4" />Logout</button>
            </div>
          )}</Dropdown>
        ) : (
          <Button size="sm" onClick={() => openAuth()}>Login / Sign up</Button>
        )}
      </div>
      {searchOpen && <div className="border-t border-slate-100 px-4 py-3 xl:hidden"><SearchBox autoFocus onDone={() => setSearchOpen(false)} /></div>}
      {mobile && (
        <div className="max-h-[75vh] overflow-y-auto border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {db.streams.map((s) => (
            <details key={s.id} className="border-b border-slate-100 py-2">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium"><DynIcon name={s.icon} className="h-4 w-4 text-brand" />{s.name}</summary>
              <div className="pl-6 pt-1 text-sm">
                {db.landingPages.filter((p) => p.status === 'published' && p.streamId === s.id).map((p) => <Link key={p.id} to={`/${p.kind === 'ranking' ? 'rankings' : 'colleges'}/${p.slug}`} className="block py-1 text-slate-600">{p.title}</Link>)}
                <Link to={`/colleges/all?stream=${s.id}`} className="block py-1 text-slate-600">All {s.name} colleges</Link>
              </div>
            </details>
          ))}
          {[['/exams', 'Exams'], ['/blog', 'Blog'], ['/compare', 'Compare'], ['/bookmarks', 'Bookmarks'], ['/talk-to-counsellor', 'Talk to counsellor']].map(([to, l]) => <Link key={to} to={to} className="block border-b border-slate-100 py-2.5 text-sm font-medium">{l}</Link>)}
        </div>
      )}
    </header>
  );
}

function CompareTray() {
  const ids = useStore((s) => s.compare);
  const insts = useStore((s) => s.db.institutes);
  const toggle = useStore((s) => s.toggleCompare);
  const clear = useStore((s) => s.clearCompare);
  const loc = useLocation();
  if (!ids.length || loc.pathname === '/compare') return null;
  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex w-[min(720px,94vw)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
      <GitCompareArrows className="hidden h-5 w-5 shrink-0 text-brand sm:block" />
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-none">
        {ids.map((id) => { const n = insts.find((x) => x.id === id); return n && (
          <span key={id} className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-2 text-xs font-medium">
            <Logo text={n.logo} color={n.brandColor} size={22} className="rounded-full" />{n.shortName}
            <button onClick={() => toggle(id)} className="text-slate-400 hover:text-red-600 cursor-pointer"><X className="h-3 w-3" /></button>
          </span>
        ); })}
      </div>
      <button onClick={clear} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer">Clear</button>
      <Link to="/compare"><Button size="sm" disabled={ids.length < 2}>Compare ({ids.length})</Button></Link>
    </div>
  );
}

function Footer() {
  const cfg = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const cols: [string, [string, string][]][] = [
    ['Top colleges', db.landingPages.filter((p) => p.status === 'published').slice(0, 6).map((p) => [`/${p.kind === 'ranking' ? 'rankings' : 'colleges'}/${p.slug}`, p.title])],
    ['Exams', db.exams.filter((e) => e.status === 'published').slice(0, 6).map((e) => [`/exams/${e.slug}`, e.name])],
    ['MSM Unify', [['/about', 'About us'], ['/contact', 'Contact'], ['/careers', 'Careers'], ['/press', 'Press'], ['/blog', 'Blog'], ['/talk-to-counsellor', 'Talk to counsellor']]],
    ['Legal', [['/privacy-policy', 'Privacy policy'], ['/terms-and-conditions', 'Terms & conditions']]],
  ];
  return (
    <footer className="bg-brand-dark pb-28 pt-12 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-white">M</div><span className="text-lg font-extrabold text-white">{cfg.siteName}</span></div>
          <p className="mt-3 text-sm text-slate-400">India’s student-first platform to discover colleges, exams and careers — with free expert counselling.</p>
          <div className="mt-4 space-y-1.5 text-sm">
            <a href={`tel:${cfg.supportPhone}`} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" />{cfg.supportPhone}</a>
            <a href={`mailto:${cfg.supportEmail}`} className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" />{cfg.supportEmail}</a>
          </div>
          <div className="mt-4 flex gap-2">
            {[['Facebook', 'f'], ['Instagram', 'ig'], ['LinkedIn', 'in'], ['YouTube', 'yt'], ['X', 'x']].map(([n, t]) => <a key={n} title={n} href="#" onClick={(e) => e.preventDefault()} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold hover:bg-brand">{t}</a>)}
          </div>
        </div>
        {cols.map(([h, links]) => (
          <div key={h}>
            <div className="mb-3 text-sm font-semibold text-white">{h}</div>
            {links.map(([to, l]) => <Link key={to} to={to} className="block py-1 text-sm text-slate-400 hover:text-white">{l}</Link>)}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-5 text-xs text-slate-500">© 2026 {cfg.siteName}. Prototype with dummy data.</div>
    </footer>
  );
}

export function WebsiteLayout() {
  const cfg = useStore((s) => s.config);
  const preview = usePreview();
  const loc = useLocation();
  const nav = useNavigate();
  const [promoClosed, setPromoClosed] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {preview && (
        <div className="sticky top-0 z-[45] flex items-center justify-center gap-3 bg-amber-300 px-4 py-1.5 text-sm font-medium text-amber-950">
          <Eye className="h-4 w-4" /> Preview mode — drafts are visible
          <button onClick={() => nav(loc.pathname)} className="rounded bg-amber-950/10 px-2 py-0.5 text-xs hover:bg-amber-950/20 cursor-pointer">Exit preview</button>
        </div>
      )}
      {cfg.maintenanceMode && <div className="bg-slate-900 px-4 py-1.5 text-center text-xs text-white">Site is in maintenance mode — some features may be unavailable.</div>}
      {cfg.promoBanner.enabled && !promoClosed && (
        <div className="relative bg-brand px-10 py-2 text-center text-sm text-white">
          <a href={cfg.promoBanner.link} className="font-medium hover:underline">{cfg.promoBanner.text} →</a>
          <button onClick={() => setPromoClosed(true)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
      )}
      <Header />
      <div className="flex-1"><Outlet /></div>
      <Footer />
      <CompareTray />
      <AuthModal />
      <LeadModal />
    </div>
  );
}
