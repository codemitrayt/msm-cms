import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, RotateCcw, Target, Trash2, TrendingUp, Trophy } from 'lucide-react';
import { useCol, useStore, nowIso } from '../../store';
import { Badge, Button, Card, Empty, Field, Input, Logo, Select, Tabs, cx } from '../../ui';
import { num } from '../../lib/format';
import type { Exam, Institute } from '../../data/types';
import { LeadForm, Page, useCreateLead, usePreview, visible } from './shared';
import { ExamHero, useExam } from './ExamDetail';
import { NotFound } from '../core/NotFound';

// ---- maths -----------------------------------------------------------------
const YEAR_SHAPE: Record<number, number> = { 2025: 3.2, 2024: 3.05, 2023: 3.35 };
/** Smooth marks → percentile curve. Higher shape = easier paper. */
export function marksToPercentile(marks: number, max: number, shape = 3.2) {
  const f = Math.min(1, Math.max(0, marks / max));
  return Math.min(99.9999, Math.max(0, 100 * (1 - Math.pow(1 - f, shape))));
}
export const percentileToRank = (pct: number, total: number) => Math.max(1, Math.round(((100 - pct) / 100) * total));
const fmtPct = (p: number) => p.toFixed(p > 99 ? 4 : 2);

// ---- saved results (per browser) -------------------------------------------
const SAVED_KEY = 'msm-proto-predictor-saved';
interface Saved { id: number; examId: number; kind: 'percentile' | 'rank'; input: string; result: string; at: string }
const loadSaved = (): Saved[] => { try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'); } catch { return []; } };
const storeSaved = (list: Saved[]) => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* ignore */ } };

/** Shared: capture lead (predictorLeads + leads). Skips the form if a student is signed in. */
function useCapture(exam: Exam, kind: 'college' | 'percentile' | 'rank') {
  const add = useStore((s) => s.add);
  const student = useStore((s) => s.student);
  const createLead = useCreateLead();
  const [who, setWho] = useState<{ name: string; phone: string; email: string } | null>(student ? { name: student.name, phone: student.phone, email: student.email } : null);
  const record = (input: string, result: string) => {
    if (!who) return;
    add('predictorLeads', { name: who.name, phone: who.phone, examId: exam.id, predictor: kind, input, result, createdAt: nowIso() });
    createLead({ ...who, source: 'predictor', courseInterest: exam.name, notes: `${exam.name} ${kind} predictor: ${input} → ${result}` });
  };
  return { who, setWho, record };
}

function Gate({ exam, title, onDone }: { exam: Exam; title: string; onDone: (v: { name: string; phone: string; email: string }) => void }) {
  return (
    <Card className="mx-auto max-w-lg p-6">
      <div className="mb-1 text-lg font-semibold">{title}</div>
      <p className="mb-4 text-sm text-slate-500">Enter your details to see personalised {exam.name} results. It's free — we'll also send you counselling updates.</p>
      <LeadForm cta="Continue" withEmail onSubmit={onDone} />
    </Card>
  );
}

function Unavailable({ exam, what }: { exam: Exam; what: string }) {
  return (
    <Card className="p-10 text-center">
      <div className="text-lg font-semibold">{exam.name} {what} is not available yet</div>
      <p className="mt-1 text-sm text-slate-500">We'll add it once enough cut-off data is published.</p>
      <Link to={`/exams/${exam.slug}`}><Button variant="outline" className="mt-4">Back to {exam.name}</Button></Link>
    </Card>
  );
}

// ---- College predictor -----------------------------------------------------
type Bucket = 'Safe' | 'Moderate' | 'Reach';
interface Match { inst: Institute; rows: { course: string; closing: number; bucket: Bucket }[]; best: Bucket }
const order: Record<Bucket, number> = { Safe: 0, Moderate: 1, Reach: 2 };

export function CollegePredictorPage() {
  const { exam } = useExam();
  if (!exam) return <NotFound />;
  return (
    <div className="bg-slate-50">
      <ExamHero exam={exam} active="college-predictor" />
      <Page>{exam.hasCollegePredictor ? <CollegePredictor exam={exam} /> : <Unavailable exam={exam} what="college predictor" />}</Page>
    </div>
  );
}

function CollegePredictor({ exam }: { exam: Exam }) {
  const preview = usePreview();
  const institutes = useCol('institutes');
  const states = useCol('states');
  const toast = useStore((s) => s.toast);
  const { who, setWho, record } = useCapture(exam, 'college');
  const [by, setBy] = useState<'rank' | 'score'>('rank');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('General');
  const [stateId, setStateId] = useState('');
  const [result, setResult] = useState<{ rank: number; matches: Match[] } | null>(null);
  const [filter, setFilter] = useState<'all' | Bucket>('all');

  if (!who) return <Gate exam={exam} title={`${exam.name} College Predictor 2027`} onDone={setWho} />;

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    if (!v || v <= 0) return toast(`Enter a valid ${by}`, 'error');
    if (by === 'score' && v > exam.maxScore) return toast(`Score cannot exceed ${exam.maxScore}`, 'error');
    const rank = by === 'rank' ? Math.round(v) : percentileToRank(marksToPercentile(v, exam.maxScore), exam.totalCandidates);
    const latest = Math.max(...institutes.flatMap((n) => n.cutoffData.filter((c) => c.examId === exam.id).map((c) => c.year)), 0);
    const matches: Match[] = [];
    for (const inst of institutes) {
      if (!visible(inst.status, preview) || (stateId && inst.stateId !== Number(stateId))) continue;
      const rows = inst.cutoffData
        .filter((c) => c.examId === exam.id && c.category === category && c.year === latest && c.closing >= rank * 0.8)
        .map((c) => ({ course: c.course, closing: c.closing, bucket: (c.closing >= rank * 1.3 ? 'Safe' : c.closing >= rank ? 'Moderate' : 'Reach') as Bucket }))
        .sort((a, b) => order[a.bucket] - order[b.bucket]);
      if (rows.length) matches.push({ inst, rows, best: rows[0].bucket });
    }
    matches.sort((a, b) => order[a.best] - order[b.best] || b.inst.score - a.inst.score);
    setResult({ rank, matches });
    setFilter('all');
    record(`${by === 'rank' ? 'Rank' : 'Score'} ${v}, ${category}${stateId ? `, ${states.find((s) => s.id === Number(stateId))?.name}` : ''}`, `${matches.length} colleges`);
  };

  const counts = { Safe: 0, Moderate: 0, Reach: 0 } as Record<Bucket, number>;
  result?.matches.forEach((m) => counts[m.best]++);
  const shown = result?.matches.filter((m) => filter === 'all' || m.best === filter) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit p-5 lg:sticky lg:top-20">
        <div className="mb-3 flex items-center gap-2 font-semibold"><Target className="h-4 w-4 text-brand" />Your details</div>
        <form onSubmit={run} className="space-y-3">
          <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
            {(['rank', 'score'] as const).map((k) => (
              <button type="button" key={k} onClick={() => setBy(k)} className={cx('flex-1 rounded-md py-1.5 font-medium capitalize cursor-pointer', by === k ? 'bg-white shadow-sm' : 'text-slate-500')}>{k}</button>
            ))}
          </div>
          <Field label={by === 'rank' ? `${exam.name} rank (CRL)` : `${exam.name} score (out of ${exam.maxScore})`}>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={by === 'rank' ? 'e.g. 12000' : 'e.g. 180'} />
          </Field>
          <Field label="Category"><Select value={category} onChange={(e) => setCategory(e.target.value)} options={['General', 'OBC', 'SC'].map((c) => ({ value: c, label: c }))} /></Field>
          <Field label="Preferred state (optional)"><Select value={stateId} onChange={(e) => setStateId(e.target.value)} placeholder="Any state" options={states.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Button type="submit" className="w-full">Predict colleges</Button>
          <p className="text-[11px] text-slate-400">Based on last year's closing ranks. Indicative only.</p>
        </form>
      </Card>
      <div className="min-w-0">
        {!result ? (
          <Card className="p-10 text-center text-sm text-slate-500">Hi {who.name.split(' ')[0]}, enter your {by} to see colleges you can get.</Card>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{result.matches.length} colleges for rank {num(result.rank)}</div>
                <div className="text-xs text-slate-500">{category} category{by === 'score' && ` · estimated from score ${value}`}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'Safe', 'Moderate', 'Reach'] as const).map((b) => (
                  <button key={b} onClick={() => setFilter(b)} className={cx('rounded-full border px-3 py-1 text-xs font-medium cursor-pointer', filter === b ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-600')}>
                    {b === 'all' ? `All (${result.matches.length})` : `${b} (${counts[b]})`}
                  </button>
                ))}
              </div>
            </div>
            {shown.length ? (
              <div className="space-y-3">
                {shown.map((m) => (
                  <Card key={m.inst.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/college/${m.inst.slug}`} className="flex items-center gap-3 group">
                        <Logo text={m.inst.logo} color={m.inst.brandColor} size={44} />
                        <div><div className="font-semibold group-hover:text-brand">{m.inst.name}</div><div className="text-xs text-slate-500">{m.inst.ownership.replace('_', '-')} · {m.inst.accreditation}</div></div>
                      </Link>
                      <BucketBadge b={m.best} />
                    </div>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs text-slate-500"><tr><th className="py-1.5">Course</th><th className="py-1.5">Closing rank</th><th className="py-1.5">Chance</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {m.rows.map((r, i) => (
                            <tr key={i}><td className="py-1.5">{r.course}</td><td className="py-1.5 tabular-nums">{num(r.closing)}</td><td className="py-1.5"><BucketBadge b={r.bucket} /></td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><Empty text="No colleges found for this rank. Try another category or state." /></Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BucketBadge({ b }: { b: Bucket }) {
  return <Badge className={cx(b === 'Safe' && 'bg-emerald-50 text-emerald-700 ring-emerald-200', b === 'Moderate' && 'bg-amber-50 text-amber-700 ring-amber-200', b === 'Reach' && 'bg-red-50 text-red-700 ring-red-200')}>{b}</Badge>;
}

// ---- Percentile & rank predictors --------------------------------------------
export function PercentilePredictorPage() { return <ScorePredictorPage kind="percentile" />; }
export function RankPredictorPage() { return <ScorePredictorPage kind="rank" />; }

function ScorePredictorPage({ kind }: { kind: 'percentile' | 'rank' }) {
  const { exam } = useExam();
  if (!exam) return <NotFound />;
  const enabled = kind === 'percentile' ? exam.hasPercentilePredictor : exam.hasRankPredictor;
  return (
    <div className="bg-slate-50">
      <ExamHero exam={exam} active={`${kind}-predictor`} />
      <Page>{enabled ? <ScorePredictor key={kind} exam={exam} kind={kind} /> : <Unavailable exam={exam} what={`${kind} predictor`} />}</Page>
    </div>
  );
}

function ScorePredictor({ exam, kind }: { exam: Exam; kind: 'percentile' | 'rank' }) {
  const toast = useStore((s) => s.toast);
  const { who, setWho, record } = useCapture(exam, kind);
  const [tab, setTab] = useState<'predict' | 'trends' | 'saved'>('predict');
  const [input, setInput] = useState<'marks' | 'percentile'>('marks');
  const [value, setValue] = useState('');
  const [out, setOut] = useState<{ pct: number; rank: number; low: number; high: number; marks: number | null } | null>(null);
  const [saved, setSaved] = useState<Saved[]>(() => loadSaved().filter((x) => x.examId === exam.id && x.kind === kind));

  const trend = useMemo(() => {
    const steps = [0.9, 0.75, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map((f) => Math.round(exam.maxScore * f));
    return steps.map((m) => ({ marks: m, byYear: Object.entries(YEAR_SHAPE).map(([y, sh]) => ({ year: Number(y), pct: marksToPercentile(m, exam.maxScore, sh) })) }));
  }, [exam.maxScore]);

  if (!who) return <Gate exam={exam} title={`${exam.name} ${kind === 'percentile' ? 'Percentile' : 'Rank'} Predictor 2027`} onDone={setWho} />;

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const v = Number(value);
    if (Number.isNaN(v) || value === '') return toast('Enter a value', 'error');
    let pct: number; let marks: number | null = null;
    if (input === 'marks') {
      if (v < 0 || v > exam.maxScore) return toast(`Marks must be between 0 and ${exam.maxScore}`, 'error');
      marks = v; pct = marksToPercentile(v, exam.maxScore);
    } else {
      if (v < 0 || v > 100) return toast('Percentile must be between 0 and 100', 'error');
      pct = v;
    }
    // Rank range: spread of year-to-year paper difficulty.
    const pcts = marks != null ? Object.values(YEAR_SHAPE).map((sh) => marksToPercentile(marks!, exam.maxScore, sh)) : [pct - 0.15, pct, pct + 0.1].map((p) => Math.min(99.9999, Math.max(0, p)));
    const ranks = pcts.map((p) => percentileToRank(p, exam.totalCandidates));
    const res = { pct, rank: percentileToRank(pct, exam.totalCandidates), low: Math.min(...ranks), high: Math.max(...ranks), marks };
    setOut(res);
    const inTxt = input === 'marks' ? `Marks ${v}` : `Percentile ${v}`;
    const resTxt = kind === 'percentile' ? `${fmtPct(pct)} percentile` : `Rank ${num(res.low)}–${num(res.high)}`;
    record(inTxt, resTxt);
  };

  const save = () => {
    if (!out) return;
    const item: Saved = { id: Date.now(), examId: exam.id, kind, input: input === 'marks' ? `Marks ${value}` : `Percentile ${value}`, result: kind === 'percentile' ? `${fmtPct(out.pct)} percentile · AIR ~${num(out.rank)}` : `Rank ${num(out.low)} – ${num(out.high)}`, at: nowIso() };
    const all = [item, ...loadSaved()];
    storeSaved(all);
    setSaved(all.filter((x) => x.examId === exam.id && x.kind === kind));
    toast('Result saved');
  };
  const del = (id: number) => { const all = loadSaved().filter((x) => x.id !== id); storeSaved(all); setSaved(all.filter((x) => x.examId === exam.id && x.kind === kind)); };

  const Icon = kind === 'percentile' ? TrendingUp : Trophy;
  return (
    <div className="mx-auto max-w-4xl">
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'predict', label: 'Predict' }, { value: 'trends', label: 'Previous year trends' }, { value: 'saved', label: `Saved (${saved.length})` }]} className="mb-5" />
      {tab === 'predict' && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-brand" />{exam.name} {kind} predictor</div>
            <form onSubmit={run} className="space-y-3">
              {kind === 'rank' && (
                <div className="flex rounded-lg bg-slate-100 p-1 text-sm">
                  {(['marks', 'percentile'] as const).map((k) => (
                    <button type="button" key={k} onClick={() => { setInput(k); setOut(null); }} className={cx('flex-1 rounded-md py-1.5 font-medium capitalize cursor-pointer', input === k ? 'bg-white shadow-sm' : 'text-slate-500')}>{k}</button>
                  ))}
                </div>
              )}
              <Field label={input === 'marks' ? `Expected marks (out of ${exam.maxScore})` : 'Expected percentile'}>
                <Input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder={input === 'marks' ? `e.g. ${Math.round(exam.maxScore * 0.5)}` : 'e.g. 97.5'} />
              </Field>
              <Button type="submit" className="w-full">Predict {kind}</Button>
            </form>
          </Card>
          <Card className="p-5">
            {out ? (
              <div className="space-y-3">
                <div className="text-sm text-slate-500">Your predicted result</div>
                {kind === 'percentile' ? (
                  <>
                    <div className="text-4xl font-bold text-brand tabular-nums">{fmtPct(out.pct)}</div>
                    <div className="text-sm text-slate-600">percentile · expected AIR around <b>{num(out.rank)}</b></div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-brand tabular-nums">{num(out.low)} – {num(out.high)}</div>
                    <div className="text-sm text-slate-600">expected rank range{out.marks == null ? '' : ` · ~${fmtPct(out.pct)} percentile`}</div>
                  </>
                )}
                <div className="text-xs text-slate-400">Out of ~{num(exam.totalCandidates)} candidates.</div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={save}><Bookmark className="h-3.5 w-3.5" />Save result</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setOut(null); setValue(''); }}><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
                  {exam.hasCollegePredictor && <Link to={`/exams/${exam.slug}/college-predictor`}><Button size="sm">See colleges for this rank</Button></Link>}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">Enter your {input} to see your predicted {kind}.</div>
            )}
          </Card>
        </div>
      )}
      {tab === 'trends' && (
        <Card className="overflow-x-auto p-5">
          <div className="mb-3 font-semibold">{exam.name} marks vs percentile — last 3 years</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="p-2.5">Marks</th>{Object.keys(YEAR_SHAPE).map((y) => <th key={y} className="p-2.5">{y} percentile</th>)}<th className="p-2.5">Approx. rank (2025)</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trend.map((r) => (
                <tr key={r.marks}>
                  <td className="p-2.5 font-medium">{r.marks}</td>
                  {r.byYear.map((y) => <td key={y.year} className="p-2.5 tabular-nums">{fmtPct(y.pct)}</td>)}
                  <td className="p-2.5 tabular-nums">{num(percentileToRank(r.byYear[0].pct, exam.totalCandidates))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {tab === 'saved' && (
        <Card className="p-2">
          {saved.length ? (
            <ul className="divide-y divide-slate-100">
              {saved.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div><div className="font-medium">{s.result}</div><div className="text-xs text-slate-500">{s.input} · {new Date(s.at).toLocaleString('en-IN')}</div></div>
                  <Button variant="ghost" size="sm" onClick={() => del(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          ) : <Empty text="No saved results yet" />}
        </Card>
      )}
    </div>
  );
}
