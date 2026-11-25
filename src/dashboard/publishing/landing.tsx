import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Pencil, Save, Copy } from 'lucide-react';
import { useStore, useCol, nowIso } from '../../store';
import type { DB, ExamListing, Faq, Institute, LandingPage } from '../../data/types';
import { Badge, Button, Card, ChipSelect, DataTable, Empty, Field, Html, Input, Logo, Modal, PageHeader, RichText, SearchInput, Select, Tabs, Textarea, useConfirm } from '../../ui';
import { ago, byId, inr, slugify } from '../../lib/format';
import { useCan } from '../Layout';
import { Counter, OrderedPicker, PreviewLink, StatusControl } from './shared';

/** Same filter the website uses for ranking/category pages. Pinned first, then by rank/score. */
export function matchLanding(p: Pick<LandingPage, 'streamId' | 'baseCourseId' | 'stateId' | 'cityId' | 'ownership' | 'rankingBodyId' | 'pinnedInstituteIds'>, db: Pick<DB, 'institutes' | 'courses'>): Institute[] {
  const list = db.institutes.filter((n) => n.status === 'published'
    && (!p.streamId || n.streamIds.includes(p.streamId))
    && (!p.baseCourseId || db.courses.some((c) => c.instituteId === n.id && c.baseCourseId === p.baseCourseId))
    && (!p.stateId || n.stateId === p.stateId)
    && (!p.cityId || n.cityId === p.cityId)
    && (!p.ownership || n.ownership === p.ownership));
  const rank = (n: Institute) => (p.rankingBodyId ? n.rankings.find((r) => r.bodyId === p.rankingBodyId)?.rank ?? 9999 : 100 - n.score);
  const sorted = [...list].sort((a, b) => rank(a) - rank(b));
  const pinned = p.pinnedInstituteIds.map((id) => sorted.find((n) => n.id === id)).filter(Boolean) as Institute[];
  return [...pinned, ...sorted.filter((n) => !p.pinnedInstituteIds.includes(n.id))];
}

const landingHref = (p: LandingPage) => `/${p.kind === 'ranking' ? 'rankings' : 'colleges'}/${p.slug}`;

export function LandingList() {
  const pages = useCol('landingPages');
  const db = useStore((s) => s.db);
  const { remove, add, toast, log } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  const [tab, setTab] = useState<'ranking' | 'category'>('ranking');
  const [q, setQ] = useState('');
  const rows = pages.filter((p) => p.kind === tab && (!q || p.title.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <PageHeader title="Ranking & category pages" subtitle="Listing pages on the website, built from filters over institutes."
        actions={can('landing_pages.create') && <Button onClick={() => nav(`/admin/landing-pages/new?kind=${tab}`)}><Plus className="h-4 w-4" />New {tab} page</Button>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'ranking', label: `Ranking (${pages.filter((p) => p.kind === 'ranking').length})` }, { value: 'category', label: `Category (${pages.filter((p) => p.kind === 'category').length})` }]} />
      <SearchInput className="mb-3 max-w-sm" value={q} onChange={setQ} placeholder="Search pages…" />
      <DataTable rows={rows} onRowClick={(p) => nav(`/admin/landing-pages/${p.id}/edit`)}
        columns={[
          { key: 't', header: 'Title', sort: (p) => p.title, render: (p) => <div><div className="font-medium">{p.title}</div><div className="text-xs text-slate-500">{landingHref(p)}</div></div> },
          { key: 'm', header: 'Colleges', render: (p) => <span className="tabular-nums">{matchLanding(p, db).length}</span> },
          { key: 's', header: 'Status', sort: (p) => p.status, render: (p) => <Badge>{p.status}</Badge> },
          { key: 'u', header: 'Updated', className: 'hidden sm:table-cell', sort: (p) => p.updatedAt, render: (p) => <span className="text-xs text-slate-500">{ago(p.updatedAt)}</span> },
          { key: 'x', header: '', render: (p) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <PreviewLink size="sm" href={landingHref(p)} label="View" />
              {can('landing_pages.create') && <button title="Duplicate" className="rounded p-1.5 hover:bg-slate-100 cursor-pointer" onClick={() => { const { id: _i, ...r } = p; const c = add('landingPages', { ...r, title: `${p.title} (copy)`, slug: `${p.slug}-copy-${Date.now() % 1000}`, status: 'draft', updatedAt: nowIso() }); toast('Duplicated'); nav(`/admin/landing-pages/${c.id}/edit`); }}><Copy className="h-3.5 w-3.5" /></button>}
              {can('landing_pages.delete') && <button className="rounded p-1.5 text-red-500 hover:bg-red-50 cursor-pointer" onClick={async () => { if (await confirm(`Delete "${p.title}"?`)) { remove('landingPages', p.id); log('deleted', p.title, p.id); toast('Deleted'); } }}><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>) },
        ]} />
      {node}
    </div>
  );
}

type LDraft = Omit<LandingPage, 'id'>;

export function LandingEditor() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const db = useStore((s) => s.db);
  const { add, update, remove, toast, log } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const existing = id ? byId(db.landingPages, Number(id)) : undefined;
  const [v, setV] = useState<LDraft>(() => existing ? (({ id: _i, ...r }) => r)(existing) : {
    kind: (sp.get('kind') as LandingPage['kind']) || 'category', title: '', slug: '', intro: '', streamId: null, baseCourseId: null, stateId: null, cityId: null,
    rankingBodyId: null, ownership: null, pinnedInstituteIds: [], status: 'draft', seo: { title: '', description: '' }, updatedAt: nowIso(),
  });
  const [slugTouched, setSlugTouched] = useState(!!existing);
  if (id && !existing) return <Empty text="Page not found" />;
  const set = <K extends keyof LDraft>(k: K, val: LDraft[K]) => setV((x) => ({ ...x, [k]: val }));
  const nOrNull = (s: string) => (s ? Number(s) : null);
  const matches = matchLanding(v, db);

  const save = () => {
    if (!v.title.trim() || !v.slug) return toast('Title and slug are required', 'error');
    if (db.landingPages.some((p) => p.slug === v.slug && p.kind === v.kind && p.id !== existing?.id)) return toast('Slug already used', 'error');
    const d = { ...v, updatedAt: nowIso() };
    if (existing) { update('landingPages', existing.id, d); log('updated', d.title, existing.id); toast('Page saved'); }
    else { const c = add('landingPages', d); log('created', c.title, c.id); toast('Page created'); nav(`/admin/landing-pages/${c.id}/edit`, { replace: true }); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500"><Link to="/admin/landing-pages" className="hover:underline">Ranking & category</Link> / {existing ? 'Edit' : 'New'}</div>
          <h1 className="text-xl font-semibold">{v.title || 'Untitled page'}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {existing && <PreviewLink href={landingHref(existing)} />}
          {existing && <Link to={`/admin/landing-pages/${existing.id}/preview`} className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100">In-dashboard preview</Link>}
          {existing && can('landing_pages.delete') && <Button variant="ghost" onClick={() => { remove('landingPages', existing.id); toast('Deleted'); nav('/admin/landing-pages'); }}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
          <Button onClick={save} disabled={!can('landing_pages.edit') && !!existing}><Save className="h-4 w-4" />Save</Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <Field label="Kind"><Select value={v.kind} onChange={(e) => set('kind', e.target.value as LandingPage['kind'])} options={[{ value: 'ranking', label: 'Ranking' }, { value: 'category', label: 'Category' }]} /></Field>
              <Field label="Title *"><Input value={v.title} onChange={(e) => { const t = e.target.value; setV((x) => ({ ...x, title: t, ...(slugTouched ? {} : { slug: slugify(t.replace(/ 20\d\d$/, '')) }) })); }} placeholder="Top MBA Colleges in India 2026" /></Field>
            </div>
            <Field label="Slug" hint={`/${v.kind === 'ranking' ? 'rankings' : 'colleges'}/${v.slug || '…'}`}><Input value={v.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <div><div className="mb-1 text-xs font-medium text-slate-600">Intro</div><RichText value={v.intro} onChange={(h) => set('intro', h)} minHeight={140} /></div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Filters</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Stream"><Select value={v.streamId ?? ''} placeholder="Any" onChange={(e) => set('streamId', nOrNull(e.target.value))} options={db.streams.map((x) => ({ value: x.id, label: x.name }))} /></Field>
              <Field label="Base course"><Select value={v.baseCourseId ?? ''} placeholder="Any" onChange={(e) => set('baseCourseId', nOrNull(e.target.value))} options={db.baseCourses.filter((b) => !v.streamId || b.streamId === v.streamId).map((x) => ({ value: x.id, label: x.shortName }))} /></Field>
              <Field label="Ownership"><Select value={v.ownership ?? ''} placeholder="Any" onChange={(e) => set('ownership', (e.target.value || null) as LandingPage['ownership'])} options={['government', 'private', 'deemed', 'public_private'].map((x) => ({ value: x, label: x.replace('_', '-') }))} /></Field>
              <Field label="State"><Select value={v.stateId ?? ''} placeholder="Any" onChange={(e) => setV((x) => ({ ...x, stateId: nOrNull(e.target.value), cityId: null }))} options={db.states.map((x) => ({ value: x.id, label: x.name }))} /></Field>
              <Field label="City"><Select value={v.cityId ?? ''} placeholder="Any" onChange={(e) => set('cityId', nOrNull(e.target.value))} options={db.cities.filter((c) => !v.stateId || c.stateId === v.stateId).map((x) => ({ value: x.id, label: x.name }))} /></Field>
              <Field label="Rank by"><Select value={v.rankingBodyId ?? ''} placeholder="College score" onChange={(e) => set('rankingBodyId', nOrNull(e.target.value))} options={db.rankingBodies.map((x) => ({ value: x.id, label: x.shortName }))} /></Field>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-1 text-sm font-semibold">Pinned institutes</h3>
            <p className="mb-3 text-xs text-slate-500">Shown first, in this order. Only pinned institutes that match the filters are displayed.</p>
            <OrderedPicker ids={v.pinnedInstituteIds} onChange={(ids) => set('pinnedInstituteIds', ids)} label={(i) => byId(db.institutes, i)?.name}
              options={matches.map((n) => ({ value: n.id, label: n.name }))} />
          </Card>
          {existing ? <LandingFaqs pageId={existing.id} /> : <Card className="p-5 text-sm text-slate-500">Save the page to add FAQs.</Card>}
          <Card className="space-y-3 p-5">
            <h3 className="text-sm font-semibold">SEO</h3>
            <Field label="Meta title"><Input value={v.seo.title} onChange={(e) => set('seo', { ...v.seo, title: e.target.value })} /><Counter value={v.seo.title} max={60} /></Field>
            <Field label="Meta description"><Textarea className="min-h-16" value={v.seo.description} onChange={(e) => set('seo', { ...v.seo, description: e.target.value })} /><Counter value={v.seo.description} max={160} /></Field>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-4"><Field label="Status"><StatusControl mod="landing_pages" value={v.status} onChange={(s) => set('status', s)} /></Field></Card>
          <Card className="p-4 lg:sticky lg:top-20">
            <div className="mb-2 flex items-baseline justify-between"><h3 className="text-sm font-semibold">Matching institutes</h3><span className="text-2xl font-semibold tabular-nums">{matches.length}</span></div>
            <div className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto">
              {matches.map((n, i) => (
                <div key={n.id} className="flex items-center gap-2 py-2">
                  <span className="w-5 text-xs text-slate-400">{i + 1}</span>
                  <Logo text={n.logo} color={n.brandColor} size={28} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm">{n.shortName}{v.pinnedInstituteIds.includes(n.id) && <Badge tone="new" className="ml-1">pinned</Badge>}</div><div className="text-[11px] text-slate-500">{inr(n.minFee)}–{inr(n.maxFee)}</div></div>
                </div>
              ))}
              {!matches.length && <p className="py-6 text-center text-xs text-slate-400">No published institutes match</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LandingFaqs({ pageId }: { pageId: number }) {
  const faqs = useCol('faqs').filter((f) => f.entityType === 'landing' && f.entityId === pageId).sort((a, b) => a.order - b.order);
  const { add, update, remove, toast } = useStore();
  const [edit, setEdit] = useState<Partial<Faq> | null>(null);
  const save = () => {
    if (!edit?.question?.trim() || !edit.answer?.trim()) return toast('Question and answer are required', 'error');
    if (edit.id) update('faqs', edit.id, { question: edit.question, answer: edit.answer });
    else add('faqs', { question: edit.question, answer: edit.answer, entityType: 'landing', entityId: pageId, order: faqs.length + 1, status: 'published' });
    toast('FAQ saved'); setEdit(null);
  };
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">FAQs ({faqs.length})</h3><Button size="sm" variant="outline" onClick={() => setEdit({})}><Plus className="h-4 w-4" />Add FAQ</Button></div>
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {faqs.map((f) => (
          <div key={f.id} className="flex items-start gap-2 px-3 py-2">
            <div className="flex-1"><div className="text-sm font-medium">{f.question}</div><div className="line-clamp-1 text-xs text-slate-500">{f.answer}</div></div>
            <button className="rounded p-1 hover:bg-slate-100 cursor-pointer" onClick={() => setEdit(f)}><Pencil className="h-3.5 w-3.5" /></button>
            <button className="rounded p-1 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => { remove('faqs', f.id); toast('FAQ removed'); }}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {!faqs.length && <p className="py-4 text-center text-xs text-slate-400">No FAQs yet</p>}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit FAQ' : 'Add FAQ'} footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="space-y-3">
          <Field label="Question"><Input value={edit?.question ?? ''} onChange={(e) => setEdit({ ...edit, question: e.target.value })} /></Field>
          <Field label="Answer"><Textarea value={edit?.answer ?? ''} onChange={(e) => setEdit({ ...edit, answer: e.target.value })} /></Field>
        </div>
      </Modal>
    </Card>
  );
}

export function LandingPreview() {
  const { id } = useParams();
  const db = useStore((s) => s.db);
  const p = byId(db.landingPages, Number(id));
  if (!p) return <Empty text="Page not found" />;
  const list = matchLanding(p, db);
  const faqs = db.faqs.filter((f) => f.entityType === 'landing' && f.entityId === p.id);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800"><span>Preview · {p.status}</span><Link to={`/admin/landing-pages/${p.id}/edit`} className="font-medium underline">Back to editor</Link></div>
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{p.title}</h1>
        <Html html={p.intro} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">College</th><th className="px-3 py-2">Fees</th><th className="px-3 py-2">Avg package</th><th className="px-3 py-2">Rating</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((n, i) => <tr key={n.id}><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2 font-medium">{n.name}</td><td className="px-3 py-2">{inr(n.minFee)}–{inr(n.maxFee)}</td><td className="px-3 py-2">₹{n.avgPackageLpa} LPA</td><td className="px-3 py-2">{n.rating}</td></tr>)}
            </tbody>
          </table>
        </div>
        {faqs.length > 0 && <div className="mt-6"><h2 className="mb-2 text-lg font-semibold">FAQs</h2>{faqs.map((f) => <details key={f.id} className="border-b border-slate-100 py-2"><summary className="cursor-pointer text-sm font-medium">{f.question}</summary><p className="pt-1 text-sm text-slate-600">{f.answer}</p></details>)}</div>}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------ exam listings */

export function ExamListingsList() {
  const rows = useCol('examListings');
  const { remove, toast } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  return (
    <div>
      <PageHeader title="Exam listings" subtitle="Curated lists of exams shown on the website." actions={can('exam_listings.create') && <Button onClick={() => nav('/admin/exam-listings/new')}><Plus className="h-4 w-4" />New listing</Button>} />
      <DataTable rows={rows} onRowClick={(r) => nav(`/admin/exam-listings/${r.id}/edit`)}
        columns={[
          { key: 't', header: 'Title', sort: (r) => r.title, render: (r) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-slate-500">/exam-list/{r.slug}</div></div> },
          { key: 'n', header: 'Exams', render: (r) => r.examIds.length },
          { key: 's', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          { key: 'u', header: 'Updated', className: 'hidden sm:table-cell', render: (r) => <span className="text-xs text-slate-500">{ago(r.updatedAt)}</span> },
          { key: 'x', header: '', render: (r) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}><Link to={`/admin/exam-listings/${r.id}/preview`} className="rounded px-2 py-1 text-xs hover:bg-slate-100">Preview</Link>{can('exam_listings.delete') && <button className="rounded p-1.5 text-red-500 hover:bg-red-50 cursor-pointer" onClick={async () => { if (await confirm(`Delete "${r.title}"?`)) { remove('examListings', r.id); toast('Deleted'); } }}><Trash2 className="h-3.5 w-3.5" /></button>}</div> },
        ]} />
      {node}
    </div>
  );
}

export function ExamListingEditor() {
  const { id } = useParams();
  const listings = useCol('examListings');
  const exams = useCol('exams');
  const streams = useCol('streams');
  const { add, update, toast, log } = useStore();
  const nav = useNavigate();
  const existing = id ? byId(listings, Number(id)) : undefined;
  const [v, setV] = useState<Omit<ExamListing, 'id'>>(() => existing ? (({ id: _i, ...r }) => r)(existing) : { title: '', slug: '', intro: '', streamId: null, level: null, examIds: [], status: 'draft', updatedAt: nowIso() });
  if (id && !existing) return <Empty text="Listing not found" />;
  const suggested = exams.filter((e) => (v.streamId || v.level) && (!v.streamId || e.streamIds.includes(v.streamId)) && (!v.level || e.level === v.level) && !v.examIds.includes(e.id));
  const save = () => {
    if (!v.title.trim() || !v.slug) return toast('Title and slug are required', 'error');
    if (listings.some((l) => l.slug === v.slug && l.id !== existing?.id)) return toast('Slug already used', 'error');
    const d = { ...v, updatedAt: nowIso() };
    if (existing) { update('examListings', existing.id, d); toast('Saved'); log('updated', d.title, existing.id); }
    else { const c = add('examListings', d); toast('Listing created'); log('created', c.title, c.id); nav(`/admin/exam-listings/${c.id}/edit`, { replace: true }); }
  };
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={existing ? 'Edit exam listing' : 'New exam listing'} subtitle={<Link to="/admin/exam-listings" className="hover:underline">← Exam listings</Link>}
        actions={<>{existing && <PreviewLink href={`/exam-list/${v.slug}`} />}<Button onClick={save}><Save className="h-4 w-4" />Save</Button></>} />
      <div className="space-y-4">
        <Card className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *"><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value, ...(existing ? {} : { slug: slugify(e.target.value) }) })} /></Field>
            <Field label="Slug" hint={`/exam-list/${v.slug}`}><Input value={v.slug} onChange={(e) => setV({ ...v, slug: slugify(e.target.value) })} /></Field>
          </div>
          <div><div className="mb-1 text-xs font-medium text-slate-600">Intro</div><RichText value={v.intro} onChange={(h) => setV({ ...v, intro: h })} minHeight={120} /></div>
          <Field label="Status"><StatusControl mod="exam_listings" value={v.status} onChange={(s) => setV({ ...v, status: s })} /></Field>
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-semibold">Exams</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Suggest by stream"><Select value={v.streamId ?? ''} placeholder="Any" onChange={(e) => setV({ ...v, streamId: e.target.value ? Number(e.target.value) : null })} options={streams.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            <Field label="Suggest by level"><Select value={v.level ?? ''} placeholder="Any" onChange={(e) => setV({ ...v, level: (e.target.value || null) as ExamListing['level'] })} options={['national', 'state', 'university'].map((x) => ({ value: x, label: x }))} /></Field>
          </div>
          {suggested.length > 0 && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-600"><span>Suggested ({suggested.length})</span><button className="font-medium text-brand cursor-pointer" onClick={() => setV({ ...v, examIds: [...v.examIds, ...suggested.map((e) => e.id)] })}>Add all</button></div>
              <ChipSelect options={suggested.map((e) => ({ value: e.id, label: `+ ${e.name}` }))} value={[]} onChange={(ids) => setV({ ...v, examIds: [...v.examIds, ...ids] })} />
            </div>
          )}
          <OrderedPicker ids={v.examIds} onChange={(ids) => setV({ ...v, examIds: ids })} label={(i) => byId(exams, i)?.fullName} options={exams.map((e) => ({ value: e.id, label: e.name }))} />
        </Card>
      </div>
    </div>
  );
}

export function ExamListingPreview() {
  const { id } = useParams();
  const l = useStore((s) => s.db.examListings.find((x) => x.id === Number(id)));
  const exams = useCol('exams');
  if (!l) return <Empty text="Listing not found" />;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800"><span>Preview · {l.status}</span><Link to={`/admin/exam-listings/${l.id}/edit`} className="font-medium underline">Back to editor</Link></div>
      <Card className="p-6">
        <h1 className="text-2xl font-bold">{l.title}</h1>
        <Html html={l.intro} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {l.examIds.map((eid) => byId(exams, eid)).filter(Boolean).map((e) => (
            <div key={e!.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
              <Logo text={e!.logo} color="#16181d" size={40} />
              <div><div className="font-medium">{e!.name}</div><div className="text-xs text-slate-500">{e!.fullName}</div><div className="mt-1 text-xs text-slate-600">Exam: {e!.dates.find((d) => /exam/i.test(d.event))?.start ?? 'TBA'}</div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
