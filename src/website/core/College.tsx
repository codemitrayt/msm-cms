import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Building, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, Globe, GraduationCap, Mail, MapPin, Phone, Star, Users, X } from 'lucide-react';
import type { Course, Institute } from '../../data/types';
import { useStore, nowIso } from '../../store';
import { Badge, Button, DynIcon, Field, Html, Img, Input, Logo, Modal, Select, Stars, Textarea, cx } from '../../ui';
import { date, inr, num } from '../../lib/format';
import { BookmarkButton, CompareButton } from './CollegeCard';
import { FaqList } from './Listing';
import { NotFound } from './NotFound';
import { PLink, ownershipLabel, useCity, usePreview, useWebUi } from './common';

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Overview' }, { key: 'college-info', label: 'College Info' }, { key: 'courses', label: 'Courses' }, { key: 'course-fees', label: 'Course Fees' },
  { key: 'fees', label: 'Fees' }, { key: 'admission', label: 'Admission' }, { key: 'placements', label: 'Placements' }, { key: 'cut-offs', label: 'Cut-offs' },
  { key: 'ranking', label: 'Ranking' }, { key: 'reviews', label: 'Reviews' }, { key: 'gallery', label: 'Gallery' }, { key: 'scholarships', label: 'Scholarships' }, { key: 'how-to-reach', label: 'How to reach' },
];
const SECTION_FOR: Record<string, string> = { admission: 'admission', scholarships: 'scholarship', 'how-to-reach': 'how-to-reach', placements: 'placement', 'cut-offs': 'cut-off', ranking: 'ranking', fees: 'fees' };

function useCollegeData(inst: Institute) {
  const db = useStore((s) => s.db);
  const preview = usePreview();
  return useMemo(() => {
    const courses = db.courses.filter((c) => c.instituteId === inst.id && (preview || c.status === 'published'));
    return {
      courses,
      faqs: db.faqs.filter((f) => f.entityType === 'institute' && f.entityId === inst.id && (preview || f.status === 'published')).sort((a, b) => a.order - b.order),
      reviews: db.reviews.filter((r) => r.instituteId === inst.id && r.status === 'approved'),
      updates: db.updates.filter((u) => u.instituteId === inst.id && (preview || u.status === 'published')),
      events: db.events.filter((e) => e.instituteId === inst.id && (preview || e.status === 'published')),
      articles: db.articles.filter((a) => a.instituteId === inst.id && (preview || a.status === 'published')),
    };
  }, [db, inst.id, preview]);
}

function Box({ title, children, className, action }: { title?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cx('rounded-2xl border border-slate-200 bg-white p-5', className)}>
      {title && <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-lg font-bold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

function SectionHtml({ inst, sectionKey }: { inst: Institute; sectionKey: string }) {
  const sec = inst.sections.find((s) => s.key === sectionKey);
  if (!sec || !sec.content.trim()) return null;
  return <Box title={sec.title}><Html html={sec.content} className="text-sm" /></Box>;
}

function feeRow(c: Course) {
  return { tuition: c.tuitionFees, hostel: c.hostelFees, oneTime: c.oneTimeFees };
}

function CourseCard({ inst, c }: { inst: Institute; c: Course }) {
  const db = useStore((s) => s.db);
  const openLead = useWebUi((s) => s.openLead);
  const mode = db.modes.find((m) => m.id === c.modeId)?.name;
  const exams = c.examIds.map((id) => db.exams.find((e) => e.id === id)?.name).filter(Boolean);
  const bc = db.baseCourses.find((b) => b.id === c.baseCourseId);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <PLink to={`/college/${inst.slug}/courses/${c.slug}`} className="font-semibold hover:text-brand">{c.name}</PLink>
        {c.status !== 'published' && <Badge>{c.status}</Badge>}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.durationValue} {c.durationUnit}</span>
        <span>{mode}</span><span>{c.totalSeats} seats</span>{bc && <span>{db.courseLevels.find((l) => l.id === bc.levelId)?.name}</span>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
        <div><div className="text-slate-500">Total fees</div><div className="font-semibold">{inr(c.fees)}</div></div>
        <div><div className="text-slate-500">Avg salary</div><div className="font-semibold">{c.averageSalaryLpa ? `₹${c.averageSalaryLpa} LPA` : '—'}</div></div>
        <div><div className="text-slate-500">Exams</div><div className="truncate font-semibold">{exams.join(', ') || 'Merit'}</div></div>
      </div>
      {c.feeDiscountPercent > 0 && <div className="mt-2 text-xs font-medium text-emerald-700">{c.feeDiscountPercent}% fee discount available</div>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="blue" onClick={() => openLead({ source: 'apply-now', instituteId: inst.id, courseInterest: bc?.shortName })}>Apply Now</Button>
        <PLink to={`/college/${inst.slug}/courses/${c.slug}`}><Button size="sm" variant="outline">View details</Button></PLink>
      </div>
    </div>
  );
}

function Overview({ inst, full }: { inst: Institute; full?: boolean }) {
  const db = useStore((s) => s.db);
  const d = useCollegeData(inst);
  const place = useCity(inst);
  const recruiters = inst.topRecruiterIds.map((id) => db.companies.find((c) => c.id === id)?.name).filter(Boolean);
  const auth = inst.authorityIds.map((id) => db.authorities.find((a) => a.id === id)?.shortName).filter(Boolean).join(', ');
  const highlights: [string, React.ReactNode][] = [
    ['Established', inst.establishedYear], ['Ownership', ownershipLabel(inst.ownership)], ['Type', inst.type], ['Approvals', auth], ['Accreditation', inst.accreditation],
    ['Autonomous', inst.isAutonomous ? 'Yes' : 'No'], ['Campus size', inst.campusSize], ['Location', place], ['Courses offered', d.courses.length],
    ['Fees range', `${inr(inst.minFee)} – ${inr(inst.maxFee)}`], ['Average package', `₹${inst.avgPackageLpa} LPA`], ['Highest package', `₹${inst.highestPackageLpa} LPA`],
  ];
  const byBase = useMemo(() => {
    const m = new Map<number, Course[]>();
    d.courses.forEach((c) => m.set(c.baseCourseId, [...(m.get(c.baseCourseId) ?? []), c]));
    return [...m.entries()];
  }, [d.courses]);
  return (
    <div className="space-y-5">
      <Box title={`About ${inst.shortName}`}><Html html={inst.about} className="text-sm" /></Box>
      <Box title={`${inst.shortName} highlights 2026`}>
        <table className="w-full text-sm"><tbody className="divide-y divide-slate-100">{highlights.map(([k, v]) => <tr key={k}><td className="w-1/2 py-2 text-slate-500">{k}</td><td className="py-2 font-medium capitalize">{v}</td></tr>)}</tbody></table>
      </Box>
      <Box title="Courses & fees" action={<PLink to={`/college/${inst.slug}/courses`} className="text-sm font-medium text-brand">All courses →</PLink>}>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-2">Course</th><th className="p-2">Specialisations</th><th className="p-2">Fees (total)</th><th className="p-2">Exams</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{byBase.map(([bid, cs]) => { const b = db.baseCourses.find((x) => x.id === bid); const fees = cs.map((c) => c.fees); const ex = [...new Set(cs.flatMap((c) => c.examIds))].map((id) => db.exams.find((e) => e.id === id)?.name); return (
            <tr key={bid}><td className="p-2 font-medium">{b?.shortName}</td><td className="p-2 text-slate-600">{cs.length}</td><td className="p-2">{inr(Math.min(...fees))}{fees.length > 1 && ` – ${inr(Math.max(...fees))}`}</td><td className="p-2 text-slate-600">{ex.join(', ') || '—'}</td></tr>
          ); })}</tbody>
        </table></div>
      </Box>
      <div className="grid gap-5 md:grid-cols-2">
        <Box title="Placements" action={<PLink to={`/college/${inst.slug}/placements`} className="text-sm font-medium text-brand">Details →</PLink>}>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-bold text-brand">{inst.placementPercent}%</div><div className="text-xs text-slate-500">Placed</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-bold">₹{inst.avgPackageLpa}L</div><div className="text-xs text-slate-500">Average</div></div>
            <div className="rounded-xl bg-slate-50 p-3"><div className="text-xl font-bold">₹{inst.highestPackageLpa}L</div><div className="text-xs text-slate-500">Highest</div></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">{recruiters.map((r) => <span key={r} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{r}</span>)}</div>
        </Box>
        <Box title="Rankings" action={<PLink to={`/college/${inst.slug}/ranking`} className="text-sm font-medium text-brand">Details →</PLink>}>
          <div className="space-y-2">{inst.rankings.map((r, i) => <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{db.rankingBodies.find((b) => b.id === r.bodyId)?.shortName} {r.year} · {r.category}</span><b className="text-brand">#{r.rank}</b></div>)}</div>
        </Box>
      </div>
      <Box title="Campus facilities">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{inst.amenityIds.map((id) => { const a = db.amenities.find((x) => x.id === id); return a && <div key={id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"><DynIcon name={a.icon} className="h-4 w-4 text-brand" />{a.name}</div>; })}</div>
      </Box>
      <Box title="Gallery" action={<PLink to={`/college/${inst.slug}/gallery`} className="text-sm font-medium text-brand">View all →</PLink>}>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">{inst.gallery.slice(0, 6).map((g) => <Img key={g.id} src={g.url} alt={g.caption} className="h-28 w-40 shrink-0 rounded-xl" />)}</div>
      </Box>
      {full && <><SectionHtml inst={inst} sectionKey="admission" /><SectionHtml inst={inst} sectionKey="fees" /></>}
      {(d.updates.length > 0 || d.events.length > 0) && (
        <Box title="Latest updates & events">
          <div className="divide-y divide-slate-100">
            {d.events.map((e) => <div key={`e${e.id}`} className="flex items-center gap-3 py-2 text-sm"><CalendarDays className="h-4 w-4 text-brand" /><span className="flex-1">{e.title}</span><span className="text-xs text-slate-500">{date(e.date)}</span></div>)}
            {d.updates.map((u) => <div key={`u${u.id}`} className="py-2 text-sm"><div className="font-medium">{u.title}</div><div className="text-xs text-slate-500">{date(u.createdAt)} · {u.body}</div></div>)}
          </div>
        </Box>
      )}
      {d.faqs.length > 0 && <div><h2 className="mb-3 text-lg font-bold">FAQs about {inst.shortName}</h2><FaqList items={d.faqs} /></div>}
      {d.articles.length > 0 && (
        <Box title="News & articles">
          <div className="grid gap-3 sm:grid-cols-2">{d.articles.map((a) => <Link key={a.id} to={`/blog/${a.slug}`} className="flex gap-3 rounded-xl border border-slate-100 p-2 hover:border-brand"><Img src={a.cover} className="h-14 w-20 shrink-0 rounded-lg" /><span className="line-clamp-2 text-sm font-medium">{a.title}</span></Link>)}</div>
        </Box>
      )}
    </div>
  );
}

function CoursesTab({ inst }: { inst: Institute }) {
  const db = useStore((s) => s.db);
  const { courses } = useCollegeData(inst);
  const [stream, setStream] = useState('');
  const [level, setLevel] = useState('');
  const [mode, setMode] = useState('');
  const [q, setQ] = useState('');
  const list = courses.filter((c) => {
    const bc = db.baseCourses.find((b) => b.id === c.baseCourseId);
    return (!stream || c.streamId === Number(stream)) && (!level || bc?.levelId === Number(level)) && (!mode || c.modeId === Number(mode)) && (!q || c.name.toLowerCase().includes(q.toLowerCase()));
  });
  return (
    <div className="space-y-4">
      <Box>
        <div className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Search course…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={stream} onChange={(e) => setStream(e.target.value)} placeholder="All streams" options={db.streams.filter((s) => inst.streamIds.includes(s.id)).map((s) => ({ value: s.id, label: s.name }))} />
          <Select value={level} onChange={(e) => setLevel(e.target.value)} placeholder="All levels" options={db.courseLevels.map((s) => ({ value: s.id, label: s.name }))} />
          <Select value={mode} onChange={(e) => setMode(e.target.value)} placeholder="All modes" options={db.modes.map((s) => ({ value: s.id, label: s.name }))} />
        </div>
      </Box>
      <div className="text-sm text-slate-500">{list.length} courses</div>
      <div className="grid gap-3 md:grid-cols-2">{list.map((c) => <CourseCard key={c.id} inst={inst} c={c} />)}</div>
      {!list.length && <p className="py-10 text-center text-sm text-slate-500">No courses match.</p>}
    </div>
  );
}

function FeesTab({ inst, detailed }: { inst: Institute; detailed?: boolean }) {
  const { courses } = useCollegeData(inst);
  return (
    <div className="space-y-5">
      <Box title={`${inst.shortName} fee structure 2026`}>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-2">Course</th><th className="p-2">Duration</th><th className="p-2">Tuition</th><th className="p-2">Hostel / yr</th><th className="p-2">One-time</th><th className="p-2">Total</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{courses.map((c) => { const f = feeRow(c); return (
            <tr key={c.id}><td className="p-2"><PLink to={`/college/${inst.slug}/courses/${c.slug}`} className="font-medium hover:text-brand">{c.name}</PLink>{c.feeDiscountPercent > 0 && <span className="ml-2 rounded bg-emerald-50 px-1.5 text-[10px] font-semibold text-emerald-700">{c.feeDiscountPercent}% OFF</span>}</td><td className="p-2">{c.durationValue} {c.durationUnit}</td><td className="p-2">{inr(f.tuition)}</td><td className="p-2">{inr(f.hostel)}</td><td className="p-2">{inr(f.oneTime)}</td><td className="p-2 font-semibold">{inr(c.fees)}</td></tr>
          ); })}</tbody>
        </table></div>
      </Box>
      {detailed && courses.slice(0, 12).map((c) => (
        <Box key={c.id} title={`${c.name} — year-wise fees`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{c.feeSchedule.map((s) => <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center"><div className="text-xs text-slate-500">{s.label}</div><div className="font-semibold">{inr(s.amount)}</div></div>)}</div>
          {c.feeDiscountPercent > 0 && <p className="mt-2 text-xs text-emerald-700">Discount {c.feeDiscountPercent}% → effective total {inr(Math.round(c.fees * (1 - c.feeDiscountPercent / 100)))}</p>}
        </Box>
      ))}
      {!detailed && <SectionHtml inst={inst} sectionKey="fees" />}
      {!courses.length && <p className="text-sm text-slate-500">Fee details coming soon.</p>}
      <div className="text-xs text-slate-400">Fees are indicative; confirm with the college.</div>
    </div>
  );
}

function PlacementsTab({ inst }: { inst: Institute }) {
  const db = useStore((s) => s.db);
  const max = Math.max(...inst.placementData.map((p) => p.highest), 1);
  return (
    <div className="space-y-5">
      <Box title={`${inst.shortName} placements 2026`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Placement rate', `${inst.placementPercent}%`], ['Average package', `₹${inst.avgPackageLpa} LPA`], ['Highest package', `₹${inst.highestPackageLpa} LPA`], ['Recruiters', `${inst.topRecruiterIds.length}+`]].map(([k, v]) => <div key={k} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">{k}</div><div className="text-lg font-bold">{v}</div></div>)}
        </div>
      </Box>
      <Box title="Year-wise placement trend (LPA)">
        <div className="flex h-56 items-end gap-6 border-b border-slate-200 px-2">
          {inst.placementData.map((p) => (
            <div key={p.year} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-44 w-full items-end justify-center gap-1.5">
                <div className="w-1/3 rounded-t bg-slate-300" style={{ height: `${(p.median / max) * 100}%` }} title={`Median ₹${p.median} LPA`} />
                <div className="w-1/3 rounded-t bg-brand" style={{ height: `${(p.highest / max) * 100}%` }} title={`Highest ₹${p.highest} LPA`} />
              </div>
              <div className="text-xs text-slate-500">{p.year}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-300" />Median</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-brand" />Highest</span></div>
        <table className="mt-4 w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-2">Year</th><th className="p-2">Students</th><th className="p-2">Placed</th><th className="p-2">Median</th><th className="p-2">Highest</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{inst.placementData.map((p) => <tr key={p.year}><td className="p-2">{p.year}</td><td className="p-2">{num(p.total)}</td><td className="p-2">{num(p.placed)} ({Math.round((p.placed / p.total) * 100)}%)</td><td className="p-2">₹{p.median} LPA</td><td className="p-2">₹{p.highest} LPA</td></tr>)}</tbody>
        </table>
      </Box>
      <Box title="Top recruiters">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{inst.topRecruiterIds.map((id) => <div key={id} className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700">{db.companies.find((c) => c.id === id)?.name}</div>)}</div>
      </Box>
      <SectionHtml inst={inst} sectionKey="placement" />
    </div>
  );
}

function CutoffTab({ inst }: { inst: Institute }) {
  const db = useStore((s) => s.db);
  const examIds = [...new Set(inst.cutoffData.map((c) => c.examId))];
  const years = [...new Set(inst.cutoffData.map((c) => c.year))].sort((a, b) => b - a);
  const cats = [...new Set(inst.cutoffData.map((c) => c.category))];
  const [exam, setExam] = useState(String(examIds[0] ?? ''));
  const [year, setYear] = useState(String(years[0] ?? ''));
  const [cat, setCat] = useState(cats[0] ?? '');
  const rows = inst.cutoffData.filter((c) => (!exam || c.examId === Number(exam)) && (!year || c.year === Number(year)) && (!cat || c.category === cat));
  const ex = db.exams.find((e) => e.id === Number(exam));
  return (
    <div className="space-y-5">
      <Box title={`${inst.shortName} cut-off`}>
        {!inst.cutoffData.length ? <p className="text-sm text-slate-500">Cut-off data will be published after counselling.</p> : <>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <Select value={exam} onChange={(e) => setExam(e.target.value)} options={examIds.map((id) => ({ value: id, label: db.exams.find((e) => e.id === id)?.name ?? '' }))} />
            <Select value={year} onChange={(e) => setYear(e.target.value)} options={years.map((y) => ({ value: y, label: String(y) }))} />
            <Select value={cat} onChange={(e) => setCat(e.target.value)} options={cats.map((c) => ({ value: c, label: c }))} />
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-2">Course</th><th className="p-2">Round</th><th className="p-2">Opening rank</th><th className="p-2">Closing rank</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{rows.map((r, i) => <tr key={i}><td className="p-2 font-medium">{r.course}</td><td className="p-2">{r.round}</td><td className="p-2">{num(r.opening)}</td><td className="p-2 font-semibold">{num(r.closing)}</td></tr>)}</tbody>
          </table></div>
          {ex?.hasCollegePredictor && <PLink to={`/exams/${ex.slug}/college-predictor`} className="mt-3 inline-block text-sm font-medium text-brand">Check your chances with the {ex.name} College Predictor →</PLink>}
        </>}
      </Box>
      <SectionHtml inst={inst} sectionKey="cut-off" />
    </div>
  );
}

function RankingTab({ inst }: { inst: Institute }) {
  const db = useStore((s) => s.db);
  return (
    <div className="space-y-5">
      <Box title={`${inst.shortName} rankings`}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-2">Ranking body</th><th className="p-2">Category</th><th className="p-2">Year</th><th className="p-2">Rank</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{inst.rankings.map((r, i) => <tr key={i}><td className="p-2 font-medium">{db.rankingBodies.find((b) => b.id === r.bodyId)?.name}</td><td className="p-2">{r.category}</td><td className="p-2">{r.year}</td><td className="p-2 text-lg font-bold text-brand">#{r.rank}</td></tr>)}</tbody>
        </table>
      </Box>
      <Box title="MSM Unify college score">
        <div className="flex items-center gap-4"><div className="text-4xl font-extrabold text-brand">{inst.score}</div><div className="flex-1"><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-brand" style={{ width: `${inst.score}%` }} /></div><p className="mt-1 text-xs text-slate-500">Based on rankings, placements, reviews and student interest.</p></div></div>
      </Box>
      <SectionHtml inst={inst} sectionKey="ranking" />
    </div>
  );
}

function ReviewsTab({ inst }: { inst: Institute }) {
  const { reviews, courses } = useCollegeData(inst);
  const add = useStore((s) => s.add);
  const toast = useStore((s) => s.toast);
  const student = useStore((s) => s.student);
  const openAuth = useWebUi((s) => s.openAuth);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ rating: 5, title: '', body: '', course: '', year: '2025' });
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : inst.rating;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || f.body.trim().length < 20) return toast('Add a title and at least 20 characters', 'error');
    add('reviews', { instituteId: inst.id, author: student?.name ?? 'Anonymous', course: f.course || courses[0]?.name || '', year: Number(f.year), rating: f.rating, title: f.title.trim(), body: f.body.trim(), status: 'pending', createdAt: nowIso() });
    toast('Review submitted for moderation');
    setOpen(false);
    setF({ rating: 5, title: '', body: '', course: '', year: '2025' });
  };
  return (
    <div className="space-y-5">
      <Box title={`${inst.shortName} reviews`} action={<Button size="sm" onClick={() => (student ? setOpen(true) : openAuth(() => setOpen(true)))}>Write a review</Button>}>
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="text-center"><div className="text-5xl font-extrabold">{avg.toFixed(1)}</div><Stars value={avg} /><div className="text-xs text-slate-500">{reviews.length} verified reviews</div></div>
          <div className="flex-1 space-y-1.5">{dist.map((d) => <div key={d.s} className="flex items-center gap-2 text-xs"><span className="w-6">{d.s}★</span><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-amber-400" style={{ width: `${reviews.length ? (d.n / reviews.length) * 100 : 0}%` }} /></div><span className="w-6 text-right text-slate-500">{d.n}</span></div>)}</div>
        </div>
      </Box>
      {reviews.map((r) => (
        <Box key={r.id}>
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">{r.author[0]}</div><div><div className="text-sm font-semibold">{r.author}</div><div className="text-xs text-slate-500">{r.course} · Batch {r.year}</div></div><div className="ml-auto"><Stars value={r.rating} /></div></div>
          <div className="mt-3 font-medium">{r.title}</div>
          <p className="mt-1 text-sm text-slate-600">{r.body}</p>
          <div className="mt-2 text-xs text-slate-400">{date(r.createdAt)}</div>
        </Box>
      ))}
      {!reviews.length && <p className="text-center text-sm text-slate-500">No reviews yet — be the first!</p>}
      <Modal open={open} onClose={() => setOpen(false)} title={`Review ${inst.shortName}`} footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit}>Submit review</Button></>}>
        <form className="space-y-3" onSubmit={submit}>
          <Field label="Your rating"><div className="flex gap-1">{[1, 2, 3, 4, 5].map((s) => <button type="button" key={s} onClick={() => setF({ ...f, rating: s })} className="cursor-pointer"><Star className={cx('h-7 w-7', s <= f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} /></button>)}</div></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course"><Select value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })} placeholder="Select" options={courses.map((c) => ({ value: c.name, label: c.name }))} /></Field>
            <Field label="Batch year"><Select value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} options={[2026, 2025, 2024, 2023, 2022].map((y) => ({ value: y, label: String(y) }))} /></Field>
          </div>
          <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Your experience" hint="Min 20 characters. Reviews are published after moderation."><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}

function GalleryTab({ inst }: { inst: Institute }) {
  const albums = ['All', ...new Set(inst.gallery.map((g) => g.album))];
  const [album, setAlbum] = useState('All');
  const [idx, setIdx] = useState<number | null>(null);
  const items = inst.gallery.filter((g) => album === 'All' || g.album === album);
  useEffect(() => {
    if (idx == null) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setIdx(null); if (e.key === 'ArrowRight') setIdx((i) => (i! + 1) % items.length); if (e.key === 'ArrowLeft') setIdx((i) => (i! - 1 + items.length) % items.length); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [idx, items.length]);
  return (
    <Box title={`${inst.shortName} gallery`}>
      <div className="mb-4 flex flex-wrap gap-2">{albums.map((a) => <button key={a} onClick={() => setAlbum(a)} className={cx('rounded-full px-3 py-1 text-sm cursor-pointer', album === a ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600')}>{a} {a !== 'All' && `(${inst.gallery.filter((g) => g.album === a).length})`}</button>)}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g, i) => <button key={g.id} onClick={() => setIdx(i)} className="group relative overflow-hidden rounded-xl cursor-pointer"><Img src={g.url} alt={g.caption} className="aspect-[4/3] w-full transition group-hover:scale-105" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-2 text-left text-xs text-white">{g.caption}</span></button>)}
      </div>
      {!items.length && <p className="text-sm text-slate-500">No photos yet.</p>}
      {idx != null && items[idx] && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4" onClick={() => setIdx(null)}>
          <button className="absolute right-4 top-4 text-white cursor-pointer"><X className="h-7 w-7" /></button>
          <button className="absolute left-4 rounded-full bg-white/10 p-2 text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + items.length) % items.length); }}><ChevronLeft className="h-6 w-6" /></button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl text-center"><Img src={items[idx].url.replace('/800/600', '/1600/1200')} className="max-h-[80vh] w-full rounded-xl" /><div className="mt-2 text-sm text-white">{items[idx].caption} · {idx + 1}/{items.length}</div></div>
          <button className="absolute right-4 rounded-full bg-white/10 p-2 text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % items.length); }}><ChevronRight className="h-6 w-6" /></button>
        </div>
      )}
    </Box>
  );
}

function HowToReachTab({ inst }: { inst: Institute }) {
  const place = useCity(inst);
  return (
    <div className="space-y-5">
      <Box title="Address & contact">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-brand" />{inst.campusAddress}, {place} – {inst.pincode}</div>
            <div className="flex gap-2"><Phone className="h-4 w-4 text-brand" />{inst.phone}</div>
            <div className="flex gap-2"><Mail className="h-4 w-4 text-brand" />{inst.email}</div>
            <div className="flex gap-2"><Globe className="h-4 w-4 text-brand" /><a href={inst.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">{inst.website}</a></div>
            <a href={`https://www.google.com/maps?q=${inst.latitude},${inst.longitude}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="mt-2"><MapPin className="h-4 w-4" />Get directions</Button></a>
          </div>
          <iframe title="map" className="h-64 w-full rounded-xl border border-slate-200" loading="lazy" src={`https://maps.google.com/maps?q=${inst.latitude},${inst.longitude}&z=14&output=embed`} />
        </div>
      </Box>
      <SectionHtml inst={inst} sectionKey="how-to-reach" />
    </div>
  );
}

function CourseDetail({ inst, courseSlug }: { inst: Institute; courseSlug: string }) {
  const db = useStore((s) => s.db);
  const { courses } = useCollegeData(inst);
  const openLead = useWebUi((s) => s.openLead);
  const c = courses.find((x) => x.slug === courseSlug);
  if (!c) return <Box><p className="text-sm text-slate-500">Course not found. <PLink to={`/college/${inst.slug}/courses`} className="text-brand">See all courses</PLink></p></Box>;
  const bc = db.baseCourses.find((b) => b.id === c.baseCourseId);
  const spec = db.specializations.find((s) => s.id === c.specializationId);
  const exams = c.examIds.map((id) => db.exams.find((e) => e.id === id)).filter((e) => !!e);
  const others = courses.filter((x) => x.baseCourseId === c.baseCourseId && x.id !== c.id);
  return (
    <div className="space-y-5">
      <Box>
        <div className="text-xs text-slate-500"><PLink to={`/college/${inst.slug}/courses`} className="hover:text-brand">← All courses</PLink></div>
        <h2 className="mt-1 text-2xl font-bold">{c.name} at {inst.shortName}</h2>
        <p className="mt-2 text-sm text-slate-600">{c.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Duration', `${c.durationValue} ${c.durationUnit}`], ['Mode', db.modes.find((m) => m.id === c.modeId)?.name], ['Seats', c.totalSeats], ['Total fees', inr(c.fees)], ['Level', db.courseLevels.find((l) => l.id === bc?.levelId)?.name], ['Specialisation', spec?.name ?? '—'], ['Average salary', c.averageSalaryLpa ? `₹${c.averageSalaryLpa} LPA` : '—'], ['Highest salary', c.highestSalaryLpa ? `₹${c.highestSalaryLpa} LPA` : '—']].map(([k, v]) => <div key={String(k)} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">{k}</div><div className="font-semibold">{v}</div></div>)}
        </div>
        <div className="mt-4 flex gap-2"><Button variant="blue" onClick={() => openLead({ source: 'apply-now', instituteId: inst.id, courseInterest: bc?.shortName })}>Apply Now</Button><Button onClick={() => openLead({ source: 'brochure', instituteId: inst.id, courseInterest: bc?.shortName })}><Download className="h-4 w-4" />Brochure</Button></div>
      </Box>
      <Box title="Fee structure">
        <table className="w-full text-sm"><tbody className="divide-y divide-slate-100">
          {c.feeSchedule.map((s) => <tr key={s.label}><td className="py-2 text-slate-500">{s.label}</td><td className="py-2 font-medium">{inr(s.amount)}</td></tr>)}
          <tr><td className="py-2 text-slate-500">Tuition (total)</td><td className="py-2 font-medium">{inr(c.tuitionFees)}</td></tr>
          <tr><td className="py-2 text-slate-500">Hostel (per year)</td><td className="py-2 font-medium">{inr(c.hostelFees)}</td></tr>
          <tr><td className="py-2 text-slate-500">One-time fees</td><td className="py-2 font-medium">{inr(c.oneTimeFees)}</td></tr>
          <tr><td className="py-2 font-semibold">Total</td><td className="py-2 font-bold">{inr(c.fees)}{c.feeDiscountPercent > 0 && <span className="ml-2 text-xs font-medium text-emerald-700">({c.feeDiscountPercent}% discount → {inr(Math.round(c.fees * (1 - c.feeDiscountPercent / 100)))})</span>}</td></tr>
        </tbody></table>
      </Box>
      <Box title="Eligibility">
        <ul className="space-y-2 text-sm">
          {c.tenthPercentage != null && <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Minimum {c.tenthPercentage}% in Class 10</li>}
          {c.twelfthPercentage != null && <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Minimum {c.twelfthPercentage}% in Class 12</li>}
          {c.ugPercentage != null && <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Graduation with minimum {c.ugPercentage}%</li>}
          {c.tenthPercentage == null && c.twelfthPercentage == null && c.ugPercentage == null && <li className="text-slate-500">As per university norms.</li>}
        </ul>
      </Box>
      <Box title="Exams accepted">
        <div className="flex flex-wrap gap-2">{exams.map((e) => <Link key={e.id} to={`/exams/${e.slug}`} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-brand"><Logo text={e.logo} color="#16181d" size={26} />{e.name}</Link>)}{!exams.length && <span className="text-sm text-slate-500">Merit-based admission</span>}</div>
      </Box>
      {others.length > 0 && <Box title={`Other ${bc?.shortName} specialisations`}><div className="grid gap-3 md:grid-cols-2">{others.map((o) => <CourseCard key={o.id} inst={inst} c={o} />)}</div></Box>}
    </div>
  );
}

export function CollegePage() {
  const { slug, tab = '', courseSlug } = useParams();
  const db = useStore((s) => s.db);
  const preview = usePreview();
  const update = useStore((s) => s.update);
  const student = useStore((s) => s.student);
  const updateStudent = useStore((s) => s.updateStudent);
  const openLead = useWebUi((s) => s.openLead);
  const inst = db.institutes.find((n) => n.slug === slug && (preview || n.status === 'published'));
  const tracked = useRef<number | null>(null);
  useEffect(() => {
    if (!inst || tracked.current === inst.id) return;
    tracked.current = inst.id;
    update('institutes', inst.id, { views: inst.views + 1 });
    if (student) updateStudent({ activity: [{ at: nowIso(), action: 'Viewed college', target: inst.shortName }, ...student.activity].slice(0, 100) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inst?.id]);
  const place = inst ? [db.cities.find((c) => c.id === inst.cityId)?.name, db.states.find((s) => s.id === inst.stateId)?.name].filter(Boolean).join(', ') : '';
  useEffect(() => { if (inst) document.title = inst.seo.title || inst.name; return () => { document.title = 'MSM Unify CMS — Prototype'; }; }, [inst]);
  if (!inst) return <NotFound />;
  const activeTab = courseSlug ? 'courses' : tab;
  if (!TABS.some((t) => t.key === activeTab)) return <NotFound />;
  const r = inst.rankings[0];

  let content: React.ReactNode;
  if (courseSlug) content = <CourseDetail inst={inst} courseSlug={courseSlug} />;
  else switch (activeTab) {
    case '': content = <Overview inst={inst} />; break;
    case 'college-info': content = <Overview inst={inst} full />; break;
    case 'courses': content = <CoursesTab inst={inst} />; break;
    case 'course-fees': content = <FeesTab inst={inst} detailed />; break;
    case 'fees': content = <FeesTab inst={inst} />; break;
    case 'placements': content = <PlacementsTab inst={inst} />; break;
    case 'cut-offs': content = <CutoffTab inst={inst} />; break;
    case 'ranking': content = <RankingTab inst={inst} />; break;
    case 'reviews': content = <ReviewsTab inst={inst} />; break;
    case 'gallery': content = <GalleryTab inst={inst} />; break;
    case 'how-to-reach': content = <HowToReachTab inst={inst} />; break;
    default: content = <div className="space-y-5"><SectionHtml inst={inst} sectionKey={SECTION_FOR[activeTab]} /><Box title="Need help?"><p className="text-sm text-slate-600">Talk to our counsellor for the latest {activeTab} details at {inst.shortName}.</p><Button className="mt-3" onClick={() => openLead({ source: 'talk-to-counsellor', instituteId: inst.id })}>Talk to counsellor</Button></Box></div>;
  }

  return (
    <div className="bg-slate-50 pb-24" style={{ ['--color-brand' as string]: inst.brandColor }}>
      <div className="relative">
        <Img src={inst.cover} alt={inst.name} className="h-48 w-full md:h-64" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-7xl items-end gap-4 px-4 pb-5 text-white">
            <Logo text={inst.logo} color={inst.brandColor} size={76} className="ring-4 ring-white" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold md:text-3xl">{inst.name}{inst.status !== 'published' && <Badge className="ml-2 align-middle">{inst.status}</Badge>}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/85 md:text-sm">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{place}</span>
                <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{ownershipLabel(inst.ownership)}</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Estd. {inst.establishedYear}</span>
                <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{inst.accreditation}</span>
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{inst.rating} ({inst.reviewCount} reviews)</span>
                {r && <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />#{r.rank} {db.rankingBodies.find((b) => b.id === r.bodyId)?.shortName}</span>}
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{num(inst.views)} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
          <Button variant="blue" onClick={() => openLead({ source: 'apply-now', instituteId: inst.id })}>Apply Now</Button>
          <Button onClick={() => openLead({ source: 'brochure', instituteId: inst.id })}><Download className="h-4 w-4" />Download Brochure</Button>
          <CompareButton inst={inst} size="md" />
          <BookmarkButton inst={inst} className="border border-slate-200" />
        </div>
        <nav className="sticky top-16 z-30 mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 scrollbar-none">
          {TABS.map((t) => (
            <PLink key={t.key} to={`/college/${inst.slug}${t.key ? `/${t.key}` : ''}`}
              className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium', activeTab === t.key ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800')}>{t.label}</PLink>
          ))}
        </nav>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">{content}</div>
        <aside className="space-y-4">
          <div className="sticky top-32 space-y-4">
            <div className="rounded-2xl bg-brand p-5 text-white">
              <div className="font-semibold">Interested in {inst.shortName}?</div>
              <p className="mt-1 text-sm text-white/85">Get admission guidance, fee details and scholarship info from our experts.</p>
              <Button className="mt-3 w-full bg-white !text-brand hover:bg-white/90" onClick={() => openLead({ source: 'talk-to-counsellor', instituteId: inst.id })}>Talk to counsellor</Button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <div className="mb-2 font-semibold">Quick facts</div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between"><span>Fees</span><b className="text-slate-900">{inr(inst.minFee)} – {inr(inst.maxFee)}</b></div>
                <div className="flex justify-between"><span>Avg package</span><b className="text-slate-900">₹{inst.avgPackageLpa} LPA</b></div>
                <div className="flex justify-between"><span>Placement</span><b className="text-slate-900">{inst.placementPercent}%</b></div>
                <div className="flex justify-between"><span>Campus</span><b className="text-slate-900">{inst.campusSize}</b></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
