import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CloudUpload, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useStore, useCol, nowIso } from '../../store';
import type { Course, DB, Exam, Institute, UploadJob } from '../../data/types';
import { Badge, Button, Card, DataTable, Empty, PageHeader, Select, Stat, cx } from '../../ui';
import { ago, dateTime, slugify } from '../../lib/format';
import { useCan } from '../Layout';
import { csvObjects, downloadText } from './csv';
import { SEGMENTS, segLabel } from './exams';

type Kind = UploadJob['kind'];
const KINDS: { value: Kind; label: string; help: string; headers: string[]; required: string[]; sample: string[] }[] = [
  { value: 'institutes', label: 'Institutes', help: 'Creates new institutes as drafts. City must exist in configuration.', headers: ['name', 'short_name', 'type', 'ownership', 'city', 'established_year', 'email', 'phone', 'website', 'streams'], required: ['name', 'short_name', 'city'], sample: ['Demo Institute of Technology', 'DIT Pune', 'college', 'private', 'Pune', '2005', 'admissions@dit.edu.in', '+91 90000 00000', 'https://dit.edu.in', 'Engineering;Management'] },
  { value: 'courses', label: 'Courses', help: 'Adds courses to existing institutes (matched by slug or short name).', headers: ['institute', 'base_course', 'name', 'fees', 'duration_years', 'seats', 'mode'], required: ['institute', 'base_course', 'name', 'fees'], sample: ['iit-bombay', 'B.Tech', 'B.Tech in Robotics', '900000', '4', '60', 'Full Time'] },
  { value: 'courses_fees', label: 'Course fees', help: 'Updates fees of existing courses — match by course_id, or institute + course name.', headers: ['course_id', 'institute', 'course', 'fees', 'tuition_fees', 'hostel_fees', 'one_time_fees', 'fee_for_commission', 'discount_percent'], required: ['fees'], sample: ['1', '', '', '950000', '760000', '120000', '30000', '237500', '5'] },
  { value: 'exams', label: 'Exams', help: 'Creates exams as drafts with all 12 page segments.', headers: ['name', 'full_name', 'conducting_body', 'level', 'mode', 'application_fee', 'streams'], required: ['name', 'full_name', 'conducting_body'], sample: ['SNAP', 'Symbiosis National Aptitude Test', 'Symbiosis International University', 'national', 'online', '2250', 'Management'] },
  { value: 'faqs', label: 'FAQs', help: 'entity_type = global | institute | exam; entity = slug of the institute/exam.', headers: ['question', 'answer', 'entity_type', 'entity'], required: ['question', 'answer'], sample: ['Is hostel compulsory at IIT Bombay?', 'No, but most first-year students stay on campus.', 'institute', 'iit-bombay'] },
  { value: 'articles', label: 'Articles', help: 'Creates blog articles. tags are separated by ";" and created if missing.', headers: ['title', 'excerpt', 'body', 'category', 'author', 'tags', 'status'], required: ['title'], sample: ['How to prepare for SNAP 2027', 'A quick guide', '<p>Start early.</p>', 'guide', 'Ananya Sharma', 'MBA;Study Tips', 'draft'] },
];

const num = (v: string) => (v === '' ? NaN : Number(v.replace(/[,₹\s]/g, '')));
const findInst = (db: DB, key: string) => { const k = key.toLowerCase(); return db.institutes.find((n) => n.slug === k || n.shortName.toLowerCase() === k || n.name.toLowerCase() === k); };
const streamIds = (db: DB, v: string) => {
  const names = v.split(';').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const ids = names.map((n) => db.streams.find((s) => s.name.toLowerCase() === n || s.slug === n)?.id);
  return { ids: ids.filter(Boolean) as number[], bad: names.filter((_, i) => !ids[i]) };
};

/** Validate + apply every row. Returns per-row errors. Mutates via store actions. */
function processRows(kind: Kind, rows: Record<string, string>[]): UploadJob['errors'] {
  const st = useStore.getState();
  const errors: UploadJob['errors'] = [];
  rows.forEach((r, i) => {
    const row = i + 2; // header is row 1
    const db = useStore.getState().db;
    const fail = (message: string) => errors.push({ row, message });
    const spec = KINDS.find((k) => k.value === kind)!;
    const missing = spec.required.filter((h) => !r[h]);
    if (missing.length) return fail(`Missing ${missing.join(', ')}`);

    if (kind === 'institutes') {
      const city = db.cities.find((c) => c.name.toLowerCase() === r.city.toLowerCase());
      if (!city) return fail(`City "${r.city}" not found`);
      const slug = slugify(r.short_name);
      if (db.institutes.some((n) => n.slug === slug)) return fail(`Duplicate slug "${slug}"`);
      const { ids, bad } = streamIds(db, r.streams ?? '');
      if (bad.length) return fail(`Unknown stream(s): ${bad.join(', ')}`);
      const yr = r.established_year ? num(r.established_year) : 2000;
      if (Number.isNaN(yr)) return fail('established_year must be a number');
      const { id: _baseId, ...base } = structuredClone(db.institutes[0]);
      const inst: Omit<Institute, 'id'> = {
        ...base, name: r.name, shortName: r.short_name, slug, type: (['university', 'college', 'institute'].includes(r.type) ? r.type : 'college') as Institute['type'],
        ownership: (['government', 'private', 'deemed', 'public_private'].includes(r.ownership) ? r.ownership : 'private') as Institute['ownership'], status: 'draft', establishedYear: yr,
        email: r.email ?? '', phone: r.phone ?? '', website: r.website ?? '', stateId: city.stateId, cityId: city.id, campusAddress: city.name, streamIds: ids,
        logo: r.short_name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), rankings: [], cutoffData: [], placementData: [], gallery: [], views: 0, reviewCount: 0, rating: 0,
        about: `<p>${r.name} is located in ${city.name}.</p>`, sections: base.sections.map((s) => ({ ...s, title: s.title.replace(base.shortName, r.short_name), content: '' })),
        seo: { title: `${r.short_name}: Courses, Fees, Admission`, description: '', keywords: '' }, updatedAt: nowIso(), publishedAt: null, isPartner: false,
      };
      st.add('institutes', inst);
    } else if (kind === 'courses') {
      const inst = findInst(db, r.institute); if (!inst) return fail(`Institute "${r.institute}" not found`);
      const bc = db.baseCourses.find((b) => b.shortName.toLowerCase() === r.base_course.toLowerCase() || b.slug === r.base_course.toLowerCase());
      if (!bc) return fail(`Base course "${r.base_course}" not found`);
      const fees = num(r.fees); if (Number.isNaN(fees) || fees <= 0) return fail('fees must be a positive number');
      const years = r.duration_years ? num(r.duration_years) : bc.durationYears; if (Number.isNaN(years)) return fail('duration_years must be a number');
      if (db.courses.some((c) => c.instituteId === inst.id && c.slug === slugify(r.name))) return fail(`Course "${r.name}" already exists at ${inst.shortName}`);
      const mode = db.modes.find((m) => m.name.toLowerCase() === (r.mode || 'full time').toLowerCase());
      const yearly = Math.round(fees / years);
      const c: Omit<Course, 'id'> = {
        instituteId: inst.id, baseCourseId: bc.id, specializationId: null, name: r.name, slug: slugify(r.name), description: '', streamId: bc.streamId, modeId: mode?.id ?? 1, courseTypeId: 1,
        durationValue: years, durationUnit: 'years', totalSeats: num(r.seats) || 60, fees, tuitionFees: fees, hostelFees: 0, oneTimeFees: 0, feeForCommission: yearly,
        feeSchedule: Array.from({ length: years }, (_, y) => ({ label: `Year ${y + 1}`, amount: yearly })), feeDiscountPercent: 0, tenthPercentage: null, twelfthPercentage: null, ugPercentage: null,
        examIds: [], averageSalaryLpa: null, highestSalaryLpa: null, status: 'draft', updatedAt: nowIso(),
      };
      st.add('courses', c);
    } else if (kind === 'courses_fees') {
      let course: Course | undefined;
      if (r.course_id) course = db.courses.find((c) => c.id === num(r.course_id));
      else if (r.institute && r.course) { const inst = findInst(db, r.institute); course = inst && db.courses.find((c) => c.instituteId === inst.id && (c.name.toLowerCase() === r.course.toLowerCase() || c.slug === r.course.toLowerCase())); }
      else return fail('Give course_id, or institute + course');
      if (!course) return fail('Course not found');
      const patch: Partial<Course> = {};
      const map: [string, keyof Course][] = [['fees', 'fees'], ['tuition_fees', 'tuitionFees'], ['hostel_fees', 'hostelFees'], ['one_time_fees', 'oneTimeFees'], ['fee_for_commission', 'feeForCommission'], ['discount_percent', 'feeDiscountPercent']];
      for (const [h, k] of map) {
        if (!r[h]) continue;
        const v = num(r[h]); if (Number.isNaN(v) || v < 0) return fail(`${h} must be a number`);
        if (h === 'discount_percent' && v > 100) return fail('discount_percent must be ≤ 100');
        (patch as Record<string, number>)[k] = v;
      }
      if (patch.fees) { const yearly = Math.round(patch.fees / course.durationValue); patch.feeSchedule = course.feeSchedule.map((s) => ({ ...s, amount: yearly })); }
      st.update('courses', course.id, { ...patch, updatedAt: nowIso() });
    } else if (kind === 'exams') {
      const slug = slugify(r.name);
      if (db.exams.some((e) => e.slug === slug)) return fail(`Exam "${r.name}" already exists`);
      const { ids, bad } = streamIds(db, r.streams ?? ''); if (bad.length) return fail(`Unknown stream(s): ${bad.join(', ')}`);
      const fee = r.application_fee ? num(r.application_fee) : 0; if (Number.isNaN(fee)) return fail('application_fee must be a number');
      const e: Omit<Exam, 'id'> = {
        name: r.name, shortName: r.name, slug, fullName: r.full_name, conductingBody: r.conducting_body, level: (['national', 'state', 'university'].includes(r.level) ? r.level : 'national') as Exam['level'],
        mode: (['online', 'offline', 'hybrid'].includes(r.mode) ? r.mode : 'online') as Exam['mode'], streamIds: ids, frequency: 'Once a year', applicationFee: fee, participatingColleges: 0, registrations: 0,
        status: 'draft', logo: r.name.replace(/\s/g, '').slice(0, 4).toUpperCase(), summary: `${r.name} (${r.full_name}) is conducted by ${r.conducting_body}.`,
        pages: SEGMENTS.map((key) => ({ key, title: `${r.name} ${segLabel(key)} 2027`, content: '', status: 'draft' })), dates: [], questionPapers: [],
        hasCollegePredictor: false, hasPercentilePredictor: false, hasRankPredictor: false, maxScore: 100, totalCandidates: 0, updatedAt: nowIso(),
      };
      st.add('exams', e);
    } else if (kind === 'faqs') {
      const type = (r.entity_type || 'global').toLowerCase();
      if (!['global', 'institute', 'exam'].includes(type)) return fail('entity_type must be global, institute or exam');
      let entityId: number | null = null;
      if (type === 'institute') { const n = findInst(db, r.entity ?? ''); if (!n) return fail(`Institute "${r.entity}" not found`); entityId = n.id; }
      if (type === 'exam') { const x = db.exams.find((e) => e.slug === (r.entity ?? '').toLowerCase() || e.name.toLowerCase() === (r.entity ?? '').toLowerCase()); if (!x) return fail(`Exam "${r.entity}" not found`); entityId = x.id; }
      st.add('faqs', { question: r.question, answer: r.answer, entityType: type as 'global', entityId, order: 99, status: 'published' });
    } else if (kind === 'articles') {
      const slug = slugify(r.title);
      if (db.articles.some((a) => a.slug === slug)) return fail('Article with this title already exists');
      const author = r.author ? db.authors.find((a) => a.name.toLowerCase() === r.author.toLowerCase()) : db.authors[0];
      if (!author) return fail(`Author "${r.author}" not found`);
      const cats = ['news', 'blog', 'guide', 'exam-news', 'college-news'];
      if (r.category && !cats.includes(r.category)) return fail(`category must be one of ${cats.join(', ')}`);
      const tagIds = (r.tags ?? '').split(';').map((t) => t.trim()).filter(Boolean).map((name) => {
        const ex = useStore.getState().db.tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
        return (ex ?? st.add('tags', { name, slug: slugify(name), color: '#64748b' })).id;
      });
      const status = r.status === 'published' ? 'published' : 'draft';
      st.add('articles', {
        title: r.title, slug, excerpt: r.excerpt ?? '', body: r.body || `<p>${r.excerpt ?? ''}</p>`, cover: '', authorId: author.id, tagIds, category: (r.category || 'blog') as 'blog',
        instituteId: null, examId: null, status, featured: false, views: 0, readMinutes: 3, publishedAt: status === 'published' ? nowIso() : null, updatedAt: nowIso(), seo: { title: r.title, description: r.excerpt ?? '' },
      });
    }
  });
  return errors;
}

export function UploadsPage() {
  const jobs = useCol('uploads');
  const admin = useStore((s) => s.admin);
  const { add, update, toast, log } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const [kind, setKind] = useState<Kind>('institutes');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const spec = KINDS.find((k) => k.value === kind)!;
  const sorted = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const template = () => downloadText(`${kind}-template.csv`, `${spec.headers.join(',')}\n${spec.sample.map((v) => (/[,"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',')}\n`);

  const run = async () => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return toast('Please upload a .csv file (save Excel sheets as CSV)', 'error');
    setBusy(true);
    const text = await file.text();
    const { headers, rows } = csvObjects(text);
    const job = add('uploads', { kind, fileName: file.name, rows: rows.length, success: 0, failed: 0, status: 'processing', errors: [], createdAt: nowIso(), by: admin?.name ?? 'Admin' });
    // Simulate the background queue worker.
    setTimeout(() => {
      const missingCols = spec.required.filter((h) => !headers.includes(h));
      if (missingCols.length || !rows.length) {
        update('uploads', job.id, { status: 'failed', failed: rows.length, errors: [{ row: 1, message: rows.length ? `Missing column(s): ${missingCols.join(', ')}` : 'File has no data rows' }] });
        toast('Upload failed — see details', 'error');
      } else {
        const errors = processRows(kind, rows);
        const failedRows = new Set(errors.map((e) => e.row)).size;
        update('uploads', job.id, { status: 'done', success: rows.length - failedRows, failed: failedRows, errors });
        log(`bulk uploaded ${spec.label.toLowerCase()} (${rows.length - failedRows} rows)`, file.name, job.id);
        toast(`${rows.length - failedRows} row(s) imported${failedRows ? `, ${failedRows} failed` : ''}`, failedRows ? 'info' : 'success');
      }
      setBusy(false); setFile(null); if (input.current) input.current.value = '';
    }, 900);
  };

  return (
    <div>
      <PageHeader title="Uploads" subtitle="Bulk import content from CSV. Rows are validated; failures come back in an error sheet." />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Uploads" value={jobs.length} />
        <Stat label="Rows imported" value={jobs.reduce((s, j) => s + j.success, 0)} />
        <Stat label="Rows failed" value={jobs.reduce((s, j) => s + j.failed, 0)} />
        <Stat label="Last upload" value={<span className="text-base">{ago(sorted[0]?.createdAt)}</span>} />
      </div>
      {can('uploads.create') && (
        <Card className="mb-6 p-5">
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="space-y-3">
              <div className="text-xs font-medium text-slate-600">What are you uploading?</div>
              <Select value={kind} onChange={(e) => setKind(e.target.value as Kind)} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} />
              <p className="text-xs text-slate-500">{spec.help}</p>
              <div className="text-xs text-slate-500">Columns: {spec.headers.map((h) => <code key={h} className={cx('mr-1 rounded px-1', spec.required.includes(h) ? 'bg-brand-soft text-brand' : 'bg-slate-100')}>{h}</code>)}</div>
              <Button variant="outline" size="sm" onClick={template}><Download className="h-4 w-4" />Download template</Button>
            </div>
            <div>
              <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onClick={() => input.current?.click()}
                className={cx('flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-slate-500 transition', drag ? 'border-brand bg-brand-soft/50' : 'border-slate-300 hover:border-slate-400')}>
                {file ? <><FileSpreadsheet className="h-8 w-8 text-emerald-600" /><span className="font-medium text-slate-800">{file.name}</span><span className="text-xs">{(file.size / 1024).toFixed(1)} KB · click to change</span></>
                  : <><CloudUpload className="h-8 w-8 text-slate-400" /><span>Drop a CSV here or <span className="font-medium text-brand">browse</span></span></>}
                <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="mt-3 flex justify-end"><Button disabled={!file || busy} onClick={run}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}{busy ? 'Processing…' : 'Upload & import'}</Button></div>
            </div>
          </div>
        </Card>
      )}
      <h2 className="mb-2 text-sm font-semibold">History</h2>
      <DataTable rows={sorted} onRowClick={(j) => nav(`/admin/uploads/${j.id}`)}
        columns={[
          { key: 'f', header: 'File', render: (j) => <div><div className="font-medium">{j.fileName}</div><div className="text-xs capitalize text-slate-500">{j.kind.replace('_', ' ')}</div></div> },
          { key: 'r', header: 'Rows', render: (j) => j.rows },
          { key: 'ok', header: 'Imported', render: (j) => <span className="text-emerald-700">{j.success}</span> },
          { key: 'x', header: 'Failed', render: (j) => <span className={j.failed ? 'text-red-600' : 'text-slate-400'}>{j.failed}</span> },
          { key: 's', header: 'Status', render: (j) => <Badge>{j.status}</Badge> },
          { key: 'b', header: 'By', className: 'hidden md:table-cell', render: (j) => <span className="text-xs">{j.by}</span> },
          { key: 'c', header: 'When', sort: (j) => j.createdAt, className: 'hidden sm:table-cell', render: (j) => <span className="text-xs text-slate-500">{ago(j.createdAt)}</span> },
        ]} />
    </div>
  );
}

export function UploadDetail() {
  const { id } = useParams();
  const job = useStore((s) => s.db.uploads.find((u) => u.id === Number(id)));
  if (!job) return <Empty text="Upload not found" action={<Link to="/admin/uploads" className="text-brand">Back</Link>} />;
  const errSheet = () => downloadText(`${job.fileName.replace(/\.\w+$/, '')}-errors.csv`, `row,error\n${job.errors.map((e) => `${e.row},"${e.message.replace(/"/g, '""')}"`).join('\n')}\n`);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={job.fileName} subtitle={<Link to="/admin/uploads" className="hover:underline">← Uploads</Link>}
        actions={job.errors.length > 0 && <Button variant="outline" onClick={errSheet}><Download className="h-4 w-4" />Download error sheet</Button>} />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Status" value={<Badge className="text-sm">{job.status}</Badge>} />
        <Stat label="Rows" value={job.rows} />
        <Stat label="Imported" value={<span className="text-emerald-700">{job.success}</span>} />
        <Stat label="Failed" value={<span className="text-red-600">{job.failed}</span>} />
      </div>
      <Card className="mb-4 p-4 text-sm text-slate-600">Type <b className="capitalize">{job.kind.replace('_', ' ')}</b> · uploaded by {job.by} · {dateTime(job.createdAt)}</Card>
      <h2 className="mb-2 text-sm font-semibold">Row errors</h2>
      <DataTable rows={job.errors.map((e, i) => ({ ...e, id: i + 1 }))} empty="No errors — every row was imported"
        columns={[{ key: 'r', header: 'Row', render: (e) => e.row }, { key: 'm', header: 'Error', render: (e) => <span className="text-red-700">{e.message}</span> }]} />
    </div>
  );
}
