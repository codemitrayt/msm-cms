import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Download, Eye, EyeOff, Trash2, Pencil, Upload, CheckCircle2, Circle, Save } from 'lucide-react';
import { useStore, useCol, nowIso } from '../../store';
import type { Exam, ExamDate, ExamPageSegment, Id, Institute } from '../../data/types';
import {
  Badge, Button, Card, ChipSelect, DataTable, Field, Html, Input, Logo, Modal, PageHeader, RichText, SearchInput, Select, Textarea, Toggle, cx, useConfirm, Empty,
} from '../../ui';
import { ago, date, downloadCsv, fileToDataUrl, num, slugify } from '../../lib/format';
import { useCan } from '../Layout';
import { PreviewLink, STATUS_OPTIONS, StatusControl } from './shared';
import { csvObjects } from './csv';

export const SEGMENTS = ['overview', 'registration', 'syllabus', 'exam-pattern', 'dates', 'results', 'cut-offs', 'admit-card', 'answer-key', 'question-papers', 'fees', 'books'];
export const segLabel = (k: string) => k.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const LEVELS = [{ value: 'national', label: 'National' }, { value: 'state', label: 'State' }, { value: 'university', label: 'University' }];
const MODES = [{ value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }, { value: 'hybrid', label: 'Hybrid' }];

/* ------------------------------------------------------------------ list */

export function ExamsList() {
  const exams = useCol('exams');
  const streams = useCol('streams');
  const { update, remove, toast, log } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [stream, setStream] = useState('');
  const [sel, setSel] = useState<number[]>([]);

  const rows = exams.filter((e) =>
    (!q || `${e.name} ${e.fullName} ${e.conductingBody}`.toLowerCase().includes(q.toLowerCase())) &&
    (!level || e.level === level) && (!status || e.status === status) && (!stream || e.streamIds.includes(Number(stream))));

  const bulk = async (s: Exam['status'] | 'delete') => {
    if (s === 'delete') {
      if (!(await confirm(`Delete ${sel.length} exam(s)? This cannot be undone.`))) return;
      remove('exams', sel); log('deleted', `${sel.length} exams`); toast(`${sel.length} exam(s) deleted`);
    } else {
      sel.forEach((id) => update('exams', id, { status: s, updatedAt: nowIso() }));
      log(`set ${s}`, `${sel.length} exams`); toast(`${sel.length} exam(s) → ${s.replace('_', ' ')}`);
    }
    setSel([]);
  };

  return (
    <div>
      <PageHeader title="Exams" subtitle={`${exams.length} exams · ${exams.filter((e) => e.status === 'published').length} published`}
        actions={<>
          <Button variant="outline" onClick={() => downloadCsv('exams.csv', rows.map((e) => ({ id: e.id, name: e.name, full_name: e.fullName, slug: e.slug, conducting_body: e.conductingBody, level: e.level, mode: e.mode, application_fee: e.applicationFee, status: e.status })))}><Download className="h-4 w-4" />CSV</Button>
          {can('exams.create') && <Button onClick={() => nav('/admin/exams/new')}><Plus className="h-4 w-4" />New exam</Button>}
        </>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search exams…" />
        <Select value={level} onChange={(e) => setLevel(e.target.value)} placeholder="All levels" options={LEVELS} />
        <Select value={stream} onChange={(e) => setStream(e.target.value)} placeholder="All streams" options={streams.map((s) => ({ value: s.id, label: s.name }))} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUS_OPTIONS} />
      </div>
      {sel.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
          <span>{sel.length} selected</span>
          {can('exams.publish') && <><Button size="sm" variant="secondary" onClick={() => bulk('published')}>Publish</Button><Button size="sm" variant="secondary" onClick={() => bulk('draft')}>Unpublish</Button><Button size="sm" variant="secondary" onClick={() => bulk('archived')}>Archive</Button></>}
          {can('exams.delete') && <Button size="sm" variant="danger" onClick={() => bulk('delete')}>Delete</Button>}
          <button className="ml-auto text-xs underline cursor-pointer" onClick={() => setSel([])}>Clear</button>
        </div>
      )}
      <DataTable rows={rows} selectable selected={sel} onSelect={setSel} onRowClick={(e) => nav(`/admin/exams/${e.id}`)}
        columns={[
          { key: 'name', header: 'Exam', sort: (e) => e.name, render: (e) => <div className="flex items-center gap-3"><Logo text={e.logo} size={34} color="#16181d" /><div><div className="font-medium">{e.name}</div><div className="text-xs text-slate-500">{e.fullName}</div></div></div> },
          { key: 'body', header: 'Conducting body', className: 'hidden md:table-cell', render: (e) => <span className="text-slate-600">{e.conductingBody}</span> },
          { key: 'level', header: 'Level', sort: (e) => e.level, render: (e) => <span className="capitalize">{e.level}</span> },
          { key: 'stream', header: 'Streams', className: 'hidden lg:table-cell', render: (e) => <span className="text-xs text-slate-600">{e.streamIds.map((id) => streams.find((s) => s.id === id)?.name).join(', ')}</span> },
          { key: 'pages', header: 'Pages', render: (e) => <span className="text-xs">{e.pages.filter((p) => p.status === 'published').length}/{e.pages.length} live</span> },
          { key: 'status', header: 'Status', sort: (e) => e.status, render: (e) => <Badge>{e.status}</Badge> },
          { key: 'updated', header: 'Updated', sort: (e) => e.updatedAt, className: 'hidden md:table-cell', render: (e) => <span className="text-xs text-slate-500">{ago(e.updatedAt)}</span> },
        ]} />
      {node}
    </div>
  );
}

/* ------------------------------------------------------------------ form */

type ExamDraft = Omit<Exam, 'id'>;
const emptyExam = (): ExamDraft => ({
  name: '', shortName: '', slug: '', fullName: '', conductingBody: '', level: 'national', mode: 'online', streamIds: [], frequency: 'Once a year',
  applicationFee: 0, participatingColleges: 0, registrations: 0, status: 'draft', logo: '', summary: '',
  pages: SEGMENTS.map((key) => ({ key, title: '', content: '', status: 'draft' as const })), dates: [], questionPapers: [],
  hasCollegePredictor: false, hasPercentilePredictor: false, hasRankPredictor: false, maxScore: 100, totalCandidates: 0, updatedAt: nowIso(),
});

function ExamForm({ value, onChange, isNew }: { value: ExamDraft; onChange: (v: ExamDraft) => void; isNew?: boolean }) {
  const streams = useCol('streams');
  const set = <K extends keyof ExamDraft>(k: K, v: ExamDraft[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Exam name (short) *"><Input value={value.name} onChange={(e) => {
          const name = e.target.value;
          onChange({ ...value, name, shortName: name, ...(isNew ? { slug: slugify(name), logo: name.replace(/\s/g, '').slice(0, 4).toUpperCase() } : {}) });
        }} placeholder="e.g. JEE Main" /></Field>
        <Field label="Full name *"><Input value={value.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Joint Entrance Examination Main" /></Field>
        <Field label="Slug" hint={`/exams/${value.slug || '…'}`}><Input value={value.slug} onChange={(e) => set('slug', slugify(e.target.value))} /></Field>
        <Field label="Logo text"><Input value={value.logo} maxLength={5} onChange={(e) => set('logo', e.target.value.toUpperCase())} /></Field>
        <Field label="Conducting body *"><Input value={value.conductingBody} onChange={(e) => set('conductingBody', e.target.value)} /></Field>
        <Field label="Frequency"><Select value={value.frequency} onChange={(e) => set('frequency', e.target.value)} options={['Once a year', 'Twice a year', 'Thrice a year', 'Multiple sessions'].map((x) => ({ value: x, label: x }))} /></Field>
        <Field label="Level"><Select value={value.level} onChange={(e) => set('level', e.target.value as Exam['level'])} options={LEVELS} /></Field>
        <Field label="Mode"><Select value={value.mode} onChange={(e) => set('mode', e.target.value as Exam['mode'])} options={MODES} /></Field>
        <Field label="Application fee (₹)"><Input type="number" value={value.applicationFee} onChange={(e) => set('applicationFee', Number(e.target.value))} /></Field>
        <Field label="Participating colleges"><Input type="number" value={value.participatingColleges} onChange={(e) => set('participatingColleges', Number(e.target.value))} /></Field>
        <Field label="Registrations (last cycle)"><Input type="number" value={value.registrations} onChange={(e) => set('registrations', Number(e.target.value))} /></Field>
        <Field label="Maximum score"><Input type="number" value={value.maxScore} onChange={(e) => set('maxScore', Number(e.target.value))} /></Field>
      </div>
      <Field label="Streams"><ChipSelect options={streams.map((s) => ({ value: s.id, label: s.name }))} value={value.streamIds} onChange={(v) => set('streamIds', v)} /></Field>
      <Field label="Summary" hint="Shown on exam cards and the exam hero."><Textarea value={value.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
      <div>
        <div className="mb-2 text-xs font-medium text-slate-600">Predictors on website</div>
        <div className="flex flex-wrap gap-5">
          <Toggle checked={value.hasCollegePredictor} onChange={(v) => set('hasCollegePredictor', v)} label="College predictor" />
          <Toggle checked={value.hasPercentilePredictor} onChange={(v) => set('hasPercentilePredictor', v)} label="Percentile predictor" />
          <Toggle checked={value.hasRankPredictor} onChange={(v) => set('hasRankPredictor', v)} label="Rank predictor" />
        </div>
      </div>
    </div>
  );
}

const validExam = (v: ExamDraft, exams: Exam[], selfId?: Id) => {
  if (!v.name.trim() || !v.fullName.trim() || !v.conductingBody.trim()) return 'Name, full name and conducting body are required';
  if (!v.slug) return 'Slug is required';
  if (exams.some((e) => e.slug === v.slug && e.id !== selfId)) return `Slug "${v.slug}" is already used`;
  return null;
};

export function ExamNew() {
  const exams = useCol('exams');
  const { add, toast, log } = useStore();
  const nav = useNavigate();
  const [v, setV] = useState<ExamDraft>(emptyExam);
  const save = () => {
    const err = validExam(v, exams); if (err) return toast(err, 'error');
    const created = add('exams', { ...v, pages: SEGMENTS.map((key) => ({ key, title: `${v.shortName} ${segLabel(key)} 2027`, content: '', status: 'draft' })), updatedAt: nowIso() });
    log('created', created.name, created.id); toast('Exam created'); nav(`/admin/exams/${created.id}/overview`);
  };
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New exam" subtitle="All 12 exam pages are created as drafts — fill them in next." actions={<><Button variant="outline" onClick={() => nav('/admin/exams')}>Cancel</Button><Button onClick={save}>Create exam</Button></>} />
      <Card className="p-5"><ExamForm value={v} onChange={setV} isNew /></Card>
    </div>
  );
}

/* ------------------------------------------------------------- workspace */

const EXTRA = [
  { key: 'college-predictor', label: 'College predictor setup' },
  { key: 'percentile-predictor', label: 'Percentile predictor setup' },
  { key: 'rank-predictor', label: 'Rank predictor setup' },
];

export function ExamWorkspace() {
  const { id, segment = 'basic' } = useParams();
  const exam = useStore((s) => s.db.exams.find((e) => e.id === Number(id)));
  const { remove, toast, log } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  if (!exam) return <Empty text="Exam not found" action={<Link className="text-brand" to="/admin/exams">Back to exams</Link>} />;
  const page = exam.pages.find((p) => p.key === segment);

  const navItem = (key: string, label: string, done?: boolean) => (
    <Link key={key} to={`/admin/exams/${exam.id}/${key === 'basic' ? '' : key}`}
      className={cx('flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm', segment === key ? 'bg-brand-soft font-medium text-brand' : 'text-slate-600 hover:bg-slate-100')}>
      {done === undefined ? null : done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5 text-slate-300" />}
      {label}
    </Link>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo text={exam.logo} color="#16181d" size={44} />
          <div>
            <div className="text-xs text-slate-500"><Link to="/admin/exams" className="hover:underline">Exams</Link> / {exam.name}</div>
            <h1 className="text-xl font-semibold">{exam.fullName} <Badge className="ml-1 align-middle">{exam.status}</Badge></h1>
          </div>
        </div>
        <div className="flex gap-2">
          <PreviewLink href={`/exams/${exam.slug}${page && page.key !== 'overview' ? `/${page.key}` : ''}`} />
          {can('exams.delete') && <Button variant="ghost" onClick={async () => { if (await confirm(`Delete ${exam.name} and all its pages?`)) { remove('exams', exam.id); log('deleted', exam.name, exam.id); toast('Exam deleted'); nav('/admin/exams'); } }}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
        </div>
      </div>
      <div className="flex flex-col gap-5 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <Card className="flex gap-0.5 overflow-x-auto p-2 lg:sticky lg:top-20 lg:flex-col">
            {navItem('basic', 'Basic details')}
            <div className="hidden px-2.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">Pages</div>
            {exam.pages.map((p) => navItem(p.key, segLabel(p.key), p.status === 'published'))}
            <div className="hidden px-2.5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">Predictors</div>
            {EXTRA.map((x) => navItem(x.key, x.label))}
          </Card>
        </aside>
        <div className="min-w-0 flex-1">
          {segment === 'basic' && <BasicDetails key={exam.id} exam={exam} />}
          {page && <SegmentEditor key={`${exam.id}-${page.key}`} exam={exam} page={page} />}
          {segment === 'college-predictor' && <CollegePredictorSetup exam={exam} />}
          {(segment === 'percentile-predictor' || segment === 'rank-predictor') && <ScorePredictorSetup key={segment} exam={exam} kind={segment === 'rank-predictor' ? 'rank' : 'percentile'} />}
        </div>
      </div>
      {node}
    </div>
  );
}

function BasicDetails({ exam }: { exam: Exam }) {
  const exams = useCol('exams');
  const { update, toast, log } = useStore();
  const can = useCan();
  const [v, setV] = useState<ExamDraft>(() => { const { id: _id, ...rest } = exam; return rest; });
  const dirty = JSON.stringify(v) !== JSON.stringify((({ id: _i, ...r }) => r)(exam));
  const save = () => {
    const err = validExam(v, exams, exam.id); if (err) return toast(err, 'error');
    update('exams', exam.id, { ...v, updatedAt: nowIso() }); log('updated', v.name, exam.id); toast('Exam saved');
  };
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Basic details</h2>
        <div className="flex items-center gap-2">
          <StatusControl mod="exams" value={v.status} onChange={(s) => setV({ ...v, status: s })} />
          <Button onClick={save} disabled={!dirty || !can('exams.edit')}><Save className="h-4 w-4" />{dirty ? 'Save' : 'Saved'}</Button>
        </div>
      </div>
      <ExamForm value={v} onChange={setV} />
    </Card>
  );
}

function SegmentEditor({ exam, page }: { exam: Exam; page: ExamPageSegment }) {
  const { update, toast, log } = useStore();
  const can = useCan();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [status, setStatus] = useState(page.status);
  const [preview, setPreview] = useState(true);
  const dirty = title !== page.title || content !== page.content || status !== page.status;
  const save = () => {
    if (!title.trim()) return toast('Title is required', 'error');
    update('exams', exam.id, { pages: exam.pages.map((p) => (p.key === page.key ? { ...p, title, content, status } : p)), updatedAt: nowIso() });
    log(`updated ${segLabel(page.key)} page of`, exam.name, exam.id); toast(`${segLabel(page.key)} saved`);
  };
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{segLabel(page.key)} page</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusControl mod="exams" value={status} onChange={setStatus} />
            <Button variant="outline" onClick={() => setPreview(!preview)}>{preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}Preview</Button>
            <Button onClick={save} disabled={!dirty || !can('exams.edit')}><Save className="h-4 w-4" />{dirty ? 'Save' : 'Saved'}</Button>
          </div>
        </div>
        <Field label="Page title (H1)" className="mb-4"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className={cx('grid gap-4', preview && 'xl:grid-cols-2')}>
          <div><div className="mb-1 text-xs font-medium text-slate-600">Content</div><RichText value={content} onChange={setContent} minHeight={360} /></div>
          {preview && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Live preview</div>
              <h1 className="text-2xl font-bold">{title || 'Untitled'}</h1>
              {content ? <Html html={content} /> : <p className="mt-3 text-sm text-slate-400">No content yet.</p>}
            </div>
          )}
        </div>
      </Card>
      {page.key === 'dates' && <DatesEditor exam={exam} />}
      {page.key === 'question-papers' && <PapersEditor exam={exam} />}
    </div>
  );
}

function DatesEditor({ exam }: { exam: Exam }) {
  const { update, toast } = useStore();
  const [rows, setRows] = useState<ExamDate[]>(exam.dates);
  const set = (i: number, patch: Partial<ExamDate>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const dirty = JSON.stringify(rows) !== JSON.stringify(exam.dates);
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div><h2 className="font-semibold">Important dates</h2><p className="text-xs text-slate-500">Shown in the dates table and the events calendar on the website.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRows([...rows, { id: rows.reduce((m, r) => Math.max(m, r.id), 0) + 1, event: '', start: new Date().toISOString().slice(0, 10), end: null, tentative: true }])}><Plus className="h-4 w-4" />Add date</Button>
          <Button disabled={!dirty} onClick={() => { if (rows.some((r) => !r.event.trim())) return toast('Every row needs an event name', 'error'); update('exams', exam.id, { dates: [...rows].sort((a, b) => a.start.localeCompare(b.start)), updatedAt: nowIso() }); toast('Dates saved'); }}>Save dates</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500"><tr><th className="py-1.5 pr-2">Event</th><th className="pr-2">Start</th><th className="pr-2">End</th><th className="pr-2">Tentative</th><th /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="py-1 pr-2"><Input value={r.event} onChange={(e) => set(i, { event: e.target.value })} /></td>
                <td className="pr-2"><Input type="date" value={r.start} onChange={(e) => set(i, { start: e.target.value })} /></td>
                <td className="pr-2"><Input type="date" value={r.end ?? ''} onChange={(e) => set(i, { end: e.target.value || null })} /></td>
                <td className="pr-2"><input type="checkbox" checked={r.tentative} onChange={(e) => set(i, { tentative: e.target.checked })} /></td>
                <td><button className="rounded p-1.5 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="py-4 text-center text-sm text-slate-400">No dates yet</p>}
      </div>
    </Card>
  );
}

function PapersEditor({ exam }: { exam: Exam }) {
  const { update, toast } = useStore();
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const save = (papers: Exam['questionPapers']) => update('exams', exam.id, { questionPapers: papers, updatedAt: nowIso() });
  const addPaper = async () => {
    if (!title.trim()) return toast('Enter a title', 'error');
    const url = file ? await fileToDataUrl(file) : '#';
    save([{ id: exam.questionPapers.reduce((m, p) => Math.max(m, p.id), 0) + 1, year, title, url }, ...exam.questionPapers].sort((a, b) => b.year - a.year));
    setTitle(''); setFile(null); toast('Question paper added');
  };
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">Question papers</h2>
      <div className="mb-4 grid gap-2 sm:grid-cols-[100px_1fr_auto_auto]">
        <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <Input value={title} placeholder={`${exam.shortName} ${year} Question Paper with Solutions`} onChange={(e) => setTitle(e.target.value)} />
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50">
          <Upload className="h-4 w-4" />{file ? file.name.slice(0, 18) : 'PDF'}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <Button onClick={addPaper}><Plus className="h-4 w-4" />Add</Button>
      </div>
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {exam.questionPapers.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <Badge tone="new">{String(p.year)}</Badge>
            <Input className="flex-1" value={p.title} onChange={(e) => save(exam.questionPapers.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))} />
            {p.url !== '#' && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-brand underline">View PDF</a>}
            <button className="rounded p-1.5 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => { save(exam.questionPapers.filter((x) => x.id !== p.id)); toast('Removed'); }}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {!exam.questionPapers.length && <p className="py-4 text-center text-sm text-slate-400">No papers yet</p>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------ predictor setups */

type CutRow = Institute['cutoffData'][number];
interface FlatCut extends CutRow { instId: Id; idx: number; key: string }

function CollegePredictorSetup({ exam }: { exam: Exam }) {
  const institutes = useCol('institutes');
  const courses = useCol('courses');
  const { update, toast, log } = useStore();
  const { confirm, node } = useConfirm();
  const [fInst, setFInst] = useState('');
  const [fYear, setFYear] = useState('');
  const [fCat, setFCat] = useState('');
  const [edit, setEdit] = useState<{ instId: Id; idx: number | null; row: CutRow } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState('');

  const rows: FlatCut[] = useMemo(() => institutes.flatMap((n) => n.cutoffData.map((c, idx) => ({ ...c, instId: n.id, idx, key: `${n.id}-${idx}` })).filter((c) => c.examId === exam.id)), [institutes, exam.id]);
  const view = rows.filter((r) => (!fInst || r.instId === Number(fInst)) && (!fYear || r.year === Number(fYear)) && (!fCat || r.category === fCat));
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
  const cats = [...new Set(rows.map((r) => r.category))];
  const instName = (id: Id) => institutes.find((n) => n.id === id)?.shortName ?? '?';

  const saveRow = () => {
    if (!edit) return;
    const { instId, idx, row } = edit;
    if (!row.course.trim() || row.closing <= 0) return toast('Course and closing rank are required', 'error');
    const inst = institutes.find((n) => n.id === instId)!;
    const next = idx === null ? [...inst.cutoffData, row] : inst.cutoffData.map((c, i) => (i === idx ? row : c));
    update('institutes', instId, { cutoffData: next });
    log('updated cut-offs of', inst.shortName, instId); toast(idx === null ? 'Cut-off row added' : 'Cut-off row saved'); setEdit(null);
  };
  const del = async (r: FlatCut) => {
    if (!(await confirm('Delete this cut-off row?'))) return;
    const inst = institutes.find((n) => n.id === r.instId)!;
    update('institutes', r.instId, { cutoffData: inst.cutoffData.filter((_, i) => i !== r.idx) }); toast('Deleted');
  };
  const doImport = () => {
    const { rows: objs, headers } = csvObjects(csv);
    const need = ['institute', 'course', 'category', 'year', 'closing'];
    const miss = need.filter((h) => !headers.includes(h));
    if (miss.length) return toast(`Missing columns: ${miss.join(', ')}`, 'error');
    const add = new Map<Id, CutRow[]>(); let bad = 0;
    for (const o of objs) {
      const inst = institutes.find((n) => n.slug === o.institute.toLowerCase() || n.shortName.toLowerCase() === o.institute.toLowerCase() || n.name.toLowerCase() === o.institute.toLowerCase());
      const closing = Number(o.closing); const yr = Number(o.year);
      if (!inst || !closing || !yr || !o.course) { bad++; continue; }
      const list = add.get(inst.id) ?? [];
      list.push({ examId: exam.id, year: yr, course: o.course, category: o.category || 'General', round: Number(o.round) || 1, opening: Number(o.opening) || Math.round(closing * 0.4), closing });
      add.set(inst.id, list);
    }
    add.forEach((list, id) => { const inst = institutes.find((n) => n.id === id)!; update('institutes', id, { cutoffData: [...inst.cutoffData, ...list] }); });
    const ok = [...add.values()].reduce((s, l) => s + l.length, 0);
    toast(`Imported ${ok} row(s)${bad ? `, ${bad} skipped` : ''}`, bad ? 'info' : 'success'); setImportOpen(false); setCsv('');
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="font-semibold">College predictor — cut-off data</h2><p className="text-xs text-slate-500">{rows.length} rows across {new Set(rows.map((r) => r.instId)).size} institutes. The website predictor matches a student's rank against these closing ranks.</p></div>
        <div className="flex flex-wrap gap-2">
          <Toggle checked={exam.hasCollegePredictor} onChange={(v) => { update('exams', exam.id, { hasCollegePredictor: v }); toast(v ? 'Predictor enabled on website' : 'Predictor hidden'); }} label="Live on website" />
          <PreviewLink size="sm" href={`/exams/${exam.slug}/college-predictor`} label="Open predictor" />
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`${exam.slug}-cutoffs.csv`, rows.map((r) => ({ institute: instName(r.instId), course: r.course, category: r.category, year: r.year, round: r.round, opening: r.opening, closing: r.closing })))}><Download className="h-4 w-4" />CSV</Button>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" />Import</Button>
          <Button size="sm" onClick={() => setEdit({ instId: institutes[0].id, idx: null, row: { examId: exam.id, year: new Date().getFullYear() - 1, course: '', category: 'General', round: 1, opening: 0, closing: 0 } })}><Plus className="h-4 w-4" />Add row</Button>
        </div>
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <Select value={fInst} onChange={(e) => setFInst(e.target.value)} placeholder="All institutes" options={[...new Set(rows.map((r) => r.instId))].map((id) => ({ value: id, label: instName(id) }))} />
        <Select value={fYear} onChange={(e) => setFYear(e.target.value)} placeholder="All years" options={years.map((y) => ({ value: y, label: String(y) }))} />
        <Select value={fCat} onChange={(e) => setFCat(e.target.value)} placeholder="All categories" options={cats.map((c) => ({ value: c, label: c }))} />
      </div>
      <DataTable rows={view.map((r, i) => ({ ...r, id: i + 1 }))} pageSize={12} empty="No cut-off rows for this exam yet"
        columns={[
          { key: 'i', header: 'Institute', sort: (r) => instName(r.instId), render: (r) => <span className="font-medium">{instName(r.instId)}</span> },
          { key: 'c', header: 'Course', render: (r) => r.course },
          { key: 'cat', header: 'Category', render: (r) => r.category },
          { key: 'y', header: 'Year', sort: (r) => r.year, render: (r) => r.year },
          { key: 'rd', header: 'Round', render: (r) => r.round },
          { key: 'o', header: 'Opening', sort: (r) => r.opening, render: (r) => num(r.opening) },
          { key: 'cl', header: 'Closing', sort: (r) => r.closing, render: (r) => num(r.closing) },
          { key: 'a', header: '', render: (r) => <div className="flex justify-end gap-1"><button className="rounded p-1 hover:bg-slate-100 cursor-pointer" onClick={() => setEdit({ instId: r.instId, idx: r.idx, row: { examId: r.examId, year: r.year, course: r.course, category: r.category, round: r.round, opening: r.opening, closing: r.closing } })}><Pencil className="h-3.5 w-3.5" /></button><button className="rounded p-1 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => del(r)}><Trash2 className="h-3.5 w-3.5" /></button></div> },
        ]} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.idx === null ? 'Add cut-off row' : 'Edit cut-off row'}
        footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={saveRow}>Save</Button></>}>
        {edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Institute" className="sm:col-span-2"><Select disabled={edit.idx !== null} value={edit.instId} onChange={(e) => setEdit({ ...edit, instId: Number(e.target.value) })} options={institutes.map((n) => ({ value: n.id, label: n.name }))} /></Field>
            <Field label="Course" className="sm:col-span-2">
              <Input list="cut-courses" value={edit.row.course} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, course: e.target.value } })} />
              <datalist id="cut-courses">{courses.filter((c) => c.instituteId === edit.instId).map((c) => <option key={c.id} value={c.name} />)}</datalist>
            </Field>
            <Field label="Category"><Select value={edit.row.category} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, category: e.target.value } })} options={['General', 'OBC', 'SC', 'ST', 'EWS'].map((x) => ({ value: x, label: x }))} /></Field>
            <Field label="Year"><Input type="number" value={edit.row.year} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, year: Number(e.target.value) } })} /></Field>
            <Field label="Round"><Input type="number" value={edit.row.round} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, round: Number(e.target.value) } })} /></Field>
            <Field label="Opening rank"><Input type="number" value={edit.row.opening} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, opening: Number(e.target.value) } })} /></Field>
            <Field label="Closing rank"><Input type="number" value={edit.row.closing} onChange={(e) => setEdit({ ...edit, row: { ...edit.row, closing: Number(e.target.value) } })} /></Field>
          </div>
        )}
      </Modal>
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import cut-offs from CSV" size="lg"
        footer={<><Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button><Button onClick={doImport} disabled={!csv.trim()}>Import</Button></>}>
        <p className="mb-2 text-sm text-slate-600">Paste CSV with headers <code className="rounded bg-slate-100 px-1">institute,course,category,year,round,opening,closing</code>. Institute can be its slug, short name or full name.</p>
        <Textarea className="min-h-48 font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={`institute,course,category,year,round,opening,closing\niit-bombay,B.Tech in Computer Science,General,2025,1,1,66`} />
      </Modal>
      {node}
    </Card>
  );
}

/** Marks → percentile model used by the website predictors. */
export function percentileFor(marks: number, max: number) {
  const x = Math.min(1, Math.max(0, marks / Math.max(1, max)));
  return Math.round(Math.min(99.9999, 100 * (1 - Math.pow(1 - x, 2.6))) * 10000) / 10000;
}

function ScorePredictorSetup({ exam, kind }: { exam: Exam; kind: 'percentile' | 'rank' }) {
  const { update, toast } = useStore();
  const [max, setMax] = useState(exam.maxScore);
  const [total, setTotal] = useState(exam.totalCandidates);
  const enabled = kind === 'rank' ? exam.hasRankPredictor : exam.hasPercentilePredictor;
  const steps = Array.from({ length: 11 }, (_, i) => Math.round((max * (10 - i)) / 10));
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="font-semibold">{kind === 'rank' ? 'Rank' : 'Percentile'} predictor</h2><p className="text-xs text-slate-500">Students enter marks; the website converts them using the curve below.</p></div>
        <div className="flex items-center gap-2">
          <Toggle checked={enabled} onChange={(v) => { update('exams', exam.id, kind === 'rank' ? { hasRankPredictor: v } : { hasPercentilePredictor: v }); toast(v ? 'Enabled on website' : 'Hidden on website'); }} label="Live on website" />
          <PreviewLink size="sm" href={`/exams/${exam.slug}/${kind}-predictor`} label="Open predictor" />
        </div>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Maximum marks"><Input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} /></Field>
        <Field label="Total candidates (latest session)"><Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} /></Field>
        <Button disabled={max === exam.maxScore && total === exam.totalCandidates} onClick={() => { if (max <= 0) return toast('Max marks must be > 0', 'error'); update('exams', exam.id, { maxScore: max, totalCandidates: total, updatedAt: nowIso() }); toast('Predictor settings saved'); }}>Save</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-3 py-2">Marks</th><th className="px-3 py-2">Percentile</th><th className="px-3 py-2">Expected rank</th><th className="hidden px-3 py-2 sm:table-cell" /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {steps.map((m) => {
              const p = percentileFor(m, max);
              const rank = Math.max(1, Math.round(((100 - p) / 100) * total));
              return (
                <tr key={m}>
                  <td className="px-3 py-1.5 tabular-nums">{m}</td>
                  <td className="px-3 py-1.5 tabular-nums">{p.toFixed(4)}</td>
                  <td className="px-3 py-1.5 tabular-nums">{num(rank)}</td>
                  <td className="hidden px-3 py-1.5 sm:table-cell"><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${p}%` }} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">Updated {date(exam.updatedAt)}</p>
    </Card>
  );
}
