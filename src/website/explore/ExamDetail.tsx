import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Bell, Building2, CalendarDays, ChevronDown, Download, FileText, IndianRupee, Target, TrendingUp, Trophy, Users } from 'lucide-react';
import { useCol, useStore } from '../../store';
import { Badge, Button, Card, Html, Img, Logo, Stars, cx } from '../../ui';
import { compact, date, inr } from '../../lib/format';
import type { Exam } from '../../data/types';
import { Crumbs, LeadForm, Page, SectionTitle, downloadText, fmtDay, useCreateLead, usePreview, visible } from './shared';
import { examColor, nextDate } from './Exams';
import { NotFound } from '../core/NotFound';

export function useExam() {
  const { slug } = useParams();
  const preview = usePreview();
  const exam = useCol('exams').find((e) => e.slug === slug);
  return { exam: exam && visible(exam.status, preview) ? exam : undefined, preview };
}

export function ExamHero({ exam, active }: { exam: Exam; active: string }) {
  const preview = usePreview();
  const [sp] = useSearchParams();
  const qs = sp.toString() ? `?${sp}` : '';
  const segs = exam.pages.filter((p) => visible(p.status, preview));
  const nd = nextDate(exam);
  const tabs = [
    ...segs.map((p) => ({ key: p.key, label: p.key === 'overview' ? 'Overview' : p.key.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '), to: p.key === 'overview' ? `/exams/${exam.slug}` : `/exams/${exam.slug}/${p.key}` })),
    ...(exam.hasCollegePredictor ? [{ key: 'college-predictor', label: 'College Predictor', to: `/exams/${exam.slug}/college-predictor` }] : []),
    ...(exam.hasPercentilePredictor ? [{ key: 'percentile-predictor', label: 'Percentile Predictor', to: `/exams/${exam.slug}/percentile-predictor` }] : []),
    ...(exam.hasRankPredictor ? [{ key: 'rank-predictor', label: 'Rank Predictor', to: `/exams/${exam.slug}/rank-predictor` }] : []),
  ];
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Exams', to: '/exams' }, { label: exam.name }]} />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Logo text={exam.logo} color={examColor(exam.id)} size={64} />
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{exam.name} 2027</h1>
              <div className="text-sm text-slate-600">{exam.fullName}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="new">{exam.level} level</Badge>
                <Badge>{exam.mode}</Badge>
                <Badge>{exam.frequency}</Badge>
                {exam.status !== 'published' && <Badge>{exam.status}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="#alerts"><Button variant="outline"><Bell className="h-4 w-4" />Get alerts</Button></a>
            {exam.hasCollegePredictor && <Link to={`/exams/${exam.slug}/college-predictor${qs}`}><Button><Target className="h-4 w-4" />Predict colleges</Button></Link>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: Building2, label: 'Conducting body', value: exam.conductingBody },
            { icon: CalendarDays, label: nd?.event ?? 'Next date', value: nd ? fmtDay(nd.start) : 'To be announced' },
            { icon: IndianRupee, label: 'Application fee', value: inr(exam.applicationFee) },
            { icon: Users, label: 'Registrations', value: compact(exam.registrations) },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><s.icon className="h-3.5 w-3.5" />{s.label}</div>
              <div className="mt-0.5 truncate text-sm font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <Link key={t.key} to={t.to + qs}
              className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium', active === t.key ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800')}>
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertsCard({ exam }: { exam: Exam }) {
  const createLead = useCreateLead();
  const toast = useStore((s) => s.toast);
  const [done, setDone] = useState(false);
  return (
    <Card id="alerts" className="scroll-mt-24 p-4">
      <div className="mb-1 flex items-center gap-2 font-semibold"><Bell className="h-4 w-4 text-brand" />Get {exam.name} alerts</div>
      <p className="mb-3 text-xs text-slate-500">Dates, admit card, result and counselling updates on WhatsApp & SMS.</p>
      {done ? (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">You're subscribed! We'll notify you about {exam.name} updates.</div>
      ) : (
        <LeadForm cta="Subscribe" withEmail onSubmit={(v) => {
          createLead({ ...v, source: 'contact', courseInterest: exam.name, notes: `Subscribed to ${exam.name} alerts` });
          toast(`Subscribed to ${exam.name} alerts`);
          setDone(true);
        }} />
      )}
    </Card>
  );
}

function PredictorCtas({ exam, qs }: { exam: Exam; qs: string }) {
  const items = [
    exam.hasCollegePredictor && { to: 'college-predictor', title: 'College Predictor', text: `Find colleges you can get with your ${exam.name} rank`, icon: Target },
    exam.hasPercentilePredictor && { to: 'percentile-predictor', title: 'Percentile Predictor', text: 'Convert your expected marks to percentile', icon: TrendingUp },
    exam.hasRankPredictor && { to: 'rank-predictor', title: 'Rank Predictor', text: 'Estimate your all-India rank', icon: Trophy },
  ].filter(Boolean) as { to: string; title: string; text: string; icon: typeof Target }[];
  if (!items.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((i) => (
        <Link key={i.to} to={`/exams/${exam.slug}/${i.to}${qs}`} className="group rounded-xl border border-brand/20 bg-brand-soft/60 p-4 transition hover:border-brand">
          <i.icon className="h-5 w-5 text-brand" />
          <div className="mt-2 font-semibold group-hover:text-brand">{exam.name} {i.title}</div>
          <div className="text-xs text-slate-600">{i.text}</div>
        </Link>
      ))}
    </div>
  );
}

function DatesTable({ exam }: { exam: Exam }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-2.5">Event</th><th className="p-2.5">Date</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {exam.dates.map((d) => (
            <tr key={d.id}>
              <td className="p-2.5">{d.event}</td>
              <td className="p-2.5">{fmtDay(d.start)}{d.end && ` – ${fmtDay(d.end)}`} {d.tentative && <Badge tone="pending" className="ml-1">tentative</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DatesTimeline({ exam }: { exam: Exam }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <ol className="relative ml-3 border-l-2 border-slate-200">
      {exam.dates.map((d) => {
        const past = (d.end ?? d.start) < today;
        return (
          <li key={d.id} className="mb-5 ml-5">
            <span className={cx('absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white', past ? 'bg-slate-300' : 'bg-brand')} />
            <div className={cx('font-medium', past && 'text-slate-400')}>{d.event}</div>
            <div className="text-sm text-slate-600">{fmtDay(d.start)}{d.end && ` – ${fmtDay(d.end)}`} {d.tentative && <Badge tone="pending" className="ml-1">tentative</Badge>} {past && <Badge className="ml-1">done</Badge>}</div>
          </li>
        );
      })}
    </ol>
  );
}

function Faqs({ examId }: { examId: number }) {
  const faqs = useCol('faqs').filter((f) => f.entityType === 'exam' && f.entityId === examId && f.status === 'published').sort((a, b) => a.order - b.order);
  const [open, setOpen] = useState<number | null>(faqs[0]?.id ?? null);
  if (!faqs.length) return null;
  return (
    <Card className="p-5">
      <SectionTitle>Frequently asked questions</SectionTitle>
      <div className="divide-y divide-slate-100">
        {faqs.map((f) => (
          <div key={f.id}>
            <button onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-medium cursor-pointer">
              {f.question}<ChevronDown className={cx('h-4 w-4 shrink-0 transition', open === f.id && 'rotate-180')} />
            </button>
            {open === f.id && <p className="pb-3 text-sm text-slate-600">{f.answer}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function ParticipatingColleges({ exam }: { exam: Exam }) {
  const preview = usePreview();
  const courses = useCol('courses');
  const institutes = useCol('institutes');
  const cities = useCol('cities');
  const list = useMemo(() => {
    const ids = new Set(courses.filter((c) => c.examIds.includes(exam.id)).map((c) => c.instituteId));
    return institutes.filter((n) => ids.has(n.id) && visible(n.status, preview)).sort((a, b) => b.score - a.score);
  }, [courses, institutes, exam.id, preview]);
  const [all, setAll] = useState(false);
  if (!list.length) return null;
  return (
    <Card className="p-5">
      <SectionTitle>Colleges accepting {exam.name} ({list.length})</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {(all ? list : list.slice(0, 6)).map((n) => (
          <Link key={n.id} to={`/college/${n.slug}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand">
            <Logo text={n.logo} color={n.brandColor} size={40} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{n.shortName}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">{cities.find((c) => c.id === n.cityId)?.name} · <Stars value={n.rating} /> {n.rating}</div>
            </div>
          </Link>
        ))}
      </div>
      {list.length > 6 && <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAll(!all)}>{all ? 'Show less' : `Show all ${list.length}`}</Button>}
    </Card>
  );
}

function RelatedArticles({ examId }: { examId: number }) {
  const arts = useCol('articles').filter((a) => a.examId === examId && a.status === 'published');
  if (!arts.length) return null;
  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold">Latest news</div>
      <div className="space-y-3">
        {arts.slice(0, 4).map((a) => (
          <Link key={a.id} to={`/blog/${a.slug}`} className="flex gap-3 group">
            <Img src={a.cover} className="h-14 w-20 shrink-0 rounded-md" />
            <div className="min-w-0"><div className="line-clamp-2 text-sm font-medium group-hover:text-brand">{a.title}</div><div className="text-xs text-slate-500">{date(a.publishedAt)}</div></div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function UpdatesBox({ examId }: { examId: number }) {
  const updates = useCol('updates').filter((u) => u.examId === examId && u.status === 'published').sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  const events = useCol('events').filter((e) => e.examId === examId && e.status === 'published');
  if (!updates.length && !events.length) return null;
  return (
    <Card className="p-4">
      <div className="mb-2 text-sm font-semibold">Latest updates</div>
      <ul className="space-y-2.5 text-sm">
        {updates.map((u) => (
          <li key={u.id} className="border-l-2 border-brand pl-2.5">
            <div className="font-medium">{u.pinned && '📌 '}{u.title}</div>
            <div className="text-xs text-slate-500">{u.body} · {date(u.createdAt)}</div>
          </li>
        ))}
        {events.map((e) => (
          <li key={`e${e.id}`} className="border-l-2 border-amber-400 pl-2.5">
            <div className="font-medium">{e.title}</div>
            <div className="text-xs text-slate-500">{fmtDay(e.date)} · {e.type}</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function QuestionPapers({ exam }: { exam: Exam }) {
  const toast = useStore((s) => s.toast);
  return (
    <div className="mt-4 space-y-2">
      {exam.questionPapers.map((q) => (
        <div key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center gap-2.5"><FileText className="h-5 w-5 text-brand" /><div><div className="text-sm font-medium">{q.title}</div><div className="text-xs text-slate-500">PDF · {q.year}</div></div></div>
          <Button size="sm" variant="outline" onClick={() => { downloadText(`${exam.slug}-${q.year}-question-paper.pdf`, `${q.title}\n\n(Dummy file generated by the MSM Unify prototype.)`); toast('Download started'); }}>
            <Download className="h-3.5 w-3.5" />Download
          </Button>
        </div>
      ))}
      {!exam.questionPapers.length && <p className="text-sm text-slate-500">Question papers will be added soon.</p>}
    </div>
  );
}

export function ExamDetailPage() {
  const { page = 'overview' } = useParams();
  const { exam, preview } = useExam();
  const [sp] = useSearchParams();
  const qs = sp.toString() ? `?${sp}` : '';
  if (!exam) return <NotFound />;
  const seg = exam.pages.find((p) => p.key === page);
  if (!seg || !visible(seg.status, preview)) return <NotFound />;
  return (
    <div className="bg-slate-50">
      <ExamHero exam={exam} active={page} />
      <Page>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-5">
            <Card className="p-5 md:p-6">
              <h2 className="text-xl font-semibold">{seg.title}</h2>
              <div className="mt-1 text-xs text-slate-500">Updated {date(exam.updatedAt)} {seg.status !== 'published' && <Badge className="ml-1">{seg.status}</Badge>}</div>
              {page === 'overview' && <p className="mt-3 rounded-lg bg-brand-soft/50 p-3 text-sm text-slate-700">{exam.summary}</p>}
              <Html html={seg.content} className="mt-2" />
              {page === 'dates' && <div className="mt-4"><DatesTimeline exam={exam} /></div>}
              {page === 'question-papers' && <QuestionPapers exam={exam} />}
            </Card>
            {page === 'overview' && (
              <Card className="p-5">
                <SectionTitle action={<Link to={`/exams/${exam.slug}/dates${qs}`} className="text-xs font-medium text-brand">Full schedule</Link>}>Important dates</SectionTitle>
                <DatesTable exam={exam} />
              </Card>
            )}
            <PredictorCtas exam={exam} qs={qs} />
            {page === 'overview' && <ParticipatingColleges exam={exam} />}
            <Faqs examId={exam.id} />
            <div className="flex items-center justify-between rounded-xl bg-slate-900 p-5 text-white">
              <div><div className="font-semibold">Confused about {exam.name}?</div><div className="text-sm text-slate-300">Talk to our experts for free guidance.</div></div>
              <Link to="/talk-to-counsellor"><Button>Talk to counsellor</Button></Link>
            </div>
          </div>
          <aside className="space-y-4">
            <AlertsCard exam={exam} />
            <UpdatesBox examId={exam.id} />
            <RelatedArticles examId={exam.id} />
            <Card className="p-4">
              <div className="mb-2 text-sm font-semibold">Quick facts</div>
              <dl className="space-y-1.5 text-sm">
                {[['Full form', exam.fullName], ['Max score', String(exam.maxScore)], ['Candidates', compact(exam.totalCandidates)], ['Participating colleges', String(exam.participatingColleges)]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
                ))}
              </dl>
            </Card>
          </aside>
        </div>
      </Page>
    </div>
  );
}
