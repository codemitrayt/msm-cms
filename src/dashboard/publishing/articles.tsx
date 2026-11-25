import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Download, Pencil, Trash2, Star, Upload, Clock, Eye, Check } from 'lucide-react';
import { useStore, useCol, nowIso } from '../../store';
import type { Article, Id, PublishStatus } from '../../data/types';
import { Badge, Button, Card, ChipSelect, DataTable, Empty, Field, Html, Img, Input, PageHeader, RichText, SearchInput, Select, Textarea, Toggle, useConfirm } from '../../ui';
import { ago, byId, date, downloadCsv, fileToDataUrl, num, slugify, stripHtml } from '../../lib/format';
import { useCan } from '../Layout';
import { Counter, PreviewLink, STATUS_OPTIONS, StatusControl } from './shared';

const CATS = ['news', 'blog', 'guide', 'exam-news', 'college-news'].map((c) => ({ value: c, label: c.replace('-', ' ').replace(/^\w/, (x) => x.toUpperCase()) }));

export function ArticlesList() {
  const articles = useCol('articles');
  const authors = useCol('authors');
  const tags = useCol('tags');
  const { update, remove, toast, log } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [cat, setCat] = useState('');
  const [author, setAuthor] = useState('');
  const [tag, setTag] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sel, setSel] = useState<number[]>([]);

  const rows = articles.filter((a) => (!q || a.title.toLowerCase().includes(q.toLowerCase())) && (!status || a.status === status) && (!cat || a.category === cat)
    && (!author || a.authorId === Number(author)) && (!tag || a.tagIds.includes(Number(tag))) && (!featured || a.featured));

  const bulk = async (op: 'publish' | 'unpublish' | 'delete') => {
    if (op === 'delete') {
      if (!(await confirm(`Delete ${sel.length} article(s)?`))) return;
      remove('articles', sel); toast(`${sel.length} deleted`); log('deleted', `${sel.length} articles`);
    } else {
      sel.forEach((id) => { const a = byId(articles, id)!; update('articles', id, op === 'publish' ? { status: 'published', publishedAt: a.publishedAt ?? nowIso(), updatedAt: nowIso() } : { status: 'draft', updatedAt: nowIso() }); });
      toast(`${sel.length} article(s) ${op}ed`); log(`${op}ed`, `${sel.length} articles`);
    }
    setSel([]);
  };

  return (
    <div>
      <PageHeader title="Blog" subtitle={`${articles.length} articles · ${articles.filter((a) => a.status === 'in_review').length} awaiting review`}
        actions={<>
          <Button variant="outline" onClick={() => downloadCsv('articles.csv', rows.map((a) => ({ id: a.id, title: a.title, slug: a.slug, category: a.category, author: byId(authors, a.authorId)?.name, status: a.status, views: a.views, published_at: a.publishedAt ?? '' })))}><Download className="h-4 w-4" />CSV</Button>
          {can('articles.create') && <Button onClick={() => nav('/admin/articles/new')}><Plus className="h-4 w-4" />New article</Button>}
        </>} />
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <SearchInput className="lg:col-span-2" value={q} onChange={setQ} placeholder="Search titles…" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={STATUS_OPTIONS} />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} placeholder="All categories" options={CATS} />
        <Select value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="All authors" options={authors.map((a) => ({ value: a.id, label: a.name }))} />
        <Select value={tag} onChange={(e) => setTag(e.target.value)} placeholder="All tags" options={tags.map((t) => ({ value: t.id, label: t.name }))} />
      </div>
      <div className="mb-3"><Toggle checked={featured} onChange={setFeatured} label="Featured only" /></div>
      {sel.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
          <span>{sel.length} selected</span>
          {can('articles.publish') && <><Button size="sm" variant="secondary" onClick={() => bulk('publish')}>Publish</Button><Button size="sm" variant="secondary" onClick={() => bulk('unpublish')}>Unpublish</Button></>}
          {can('articles.delete') && <Button size="sm" variant="danger" onClick={() => bulk('delete')}>Delete</Button>}
          <button className="ml-auto text-xs underline cursor-pointer" onClick={() => setSel([])}>Clear</button>
        </div>
      )}
      <DataTable rows={rows} selectable selected={sel} onSelect={setSel} onRowClick={(a) => nav(`/admin/articles/${a.id}/edit`)}
        columns={[
          { key: 't', header: 'Article', sort: (a) => a.title, render: (a) => (
            <div className="flex items-center gap-3">
              <Img src={a.cover} className="hidden h-10 w-16 shrink-0 rounded-md sm:block" />
              <div className="min-w-0"><div className="line-clamp-1 font-medium">{a.featured && <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />}{a.title}</div>
                <div className="flex flex-wrap gap-1 pt-0.5">{a.tagIds.slice(0, 3).map((id) => <span key={id} className="text-[11px] text-slate-500">#{byId(tags, id)?.name}</span>)}</div></div>
            </div>) },
          { key: 'c', header: 'Category', className: 'hidden md:table-cell', render: (a) => <span className="text-xs capitalize text-slate-600">{a.category.replace('-', ' ')}</span> },
          { key: 'au', header: 'Author', className: 'hidden lg:table-cell', render: (a) => <span className="text-xs">{byId(authors, a.authorId)?.name}</span> },
          { key: 'v', header: 'Views', sort: (a) => a.views, className: 'hidden md:table-cell', render: (a) => <span className="tabular-nums text-xs">{num(a.views)}</span> },
          { key: 's', header: 'Status', sort: (a) => a.status, render: (a) => <Badge>{a.status}</Badge> },
          { key: 'u', header: 'Updated', sort: (a) => a.updatedAt, className: 'hidden sm:table-cell', render: (a) => <span className="text-xs text-slate-500">{ago(a.updatedAt)}</span> },
          { key: 'x', header: '', render: (a) => <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}><Link to={`/admin/articles/${a.id}`} className="rounded p-1 hover:bg-slate-100"><Eye className="h-3.5 w-3.5" /></Link><Link to={`/admin/articles/${a.id}/edit`} className="rounded p-1 hover:bg-slate-100"><Pencil className="h-3.5 w-3.5" /></Link></div> },
        ]} />
      {node}
    </div>
  );
}

type Draft = Omit<Article, 'id'>;
const blank = (instituteId: Id | null, authorId: Id): Draft => ({
  title: '', slug: '', excerpt: '', body: '', cover: '', authorId, tagIds: [], category: instituteId ? 'college-news' : 'blog', instituteId, examId: null,
  status: 'draft', featured: false, views: 0, readMinutes: 1, publishedAt: null, updatedAt: nowIso(), seo: { title: '', description: '' },
});
const readTime = (html: string) => Math.max(1, Math.round(stripHtml(html).split(' ').filter(Boolean).length / 200));

export function ArticleEditor() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const isNew = !id;
  const articles = useCol('articles');
  const authors = useCol('authors');
  const tags = useCol('tags');
  const institutes = useCol('institutes');
  const exams = useCol('exams');
  const { add, update, remove, toast, log } = useStore();
  const can = useCan();
  const nav = useNavigate();
  const { confirm, node } = useConfirm();
  const existing = id ? byId(articles, Number(id)) : undefined;
  const [v, setV] = useState<Draft>(() => existing ? (({ id: _i, ...r }) => r)(existing) : blank(sp.get('instituteId') ? Number(sp.get('instituteId')) : null, authors[0]?.id ?? 1));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [savedAt, setSavedAt] = useState<string | null>(existing ? existing.updatedAt : null);
  const [newTag, setNewTag] = useState('');
  const first = useRef(true);
  const set = <K extends keyof Draft>(k: K, val: Draft[K]) => setV((x) => ({ ...x, [k]: val }));

  const validate = (d: Draft) => {
    if (!d.title.trim()) return 'Title is required';
    if (!d.slug) return 'Slug is required';
    if (articles.some((a) => a.slug === d.slug && a.id !== existing?.id)) return 'Slug already in use';
    return null;
  };

  // Autosave existing articles 1.2s after the last edit (drafts only keep their status).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (isNew || !existing || !can('articles.edit') || validate(v)) return;
    const t = setTimeout(() => { update('articles', existing.id, { ...v, readMinutes: readTime(v.body), updatedAt: nowIso() }); setSavedAt(nowIso()); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  if (id && !existing) return <Empty text="Article not found" action={<Link to="/admin/articles" className="text-brand">Back</Link>} />;

  const save = (status?: PublishStatus) => {
    const d: Draft = { ...v, status: status ?? v.status, readMinutes: readTime(v.body), updatedAt: nowIso() };
    if (d.status === 'published' && !d.publishedAt) d.publishedAt = nowIso();
    const err = validate(d); if (err) return toast(err, 'error');
    if (isNew) {
      const c = add('articles', d); log('created', c.title, c.id); toast('Article created'); nav(`/admin/articles/${c.id}/edit`, { replace: true });
    } else {
      update('articles', existing!.id, d); setV(d); setSavedAt(nowIso()); log(status ? `set ${status}` : 'updated', d.title, existing!.id); toast(status === 'published' ? 'Published' : status === 'in_review' ? 'Submitted for review' : 'Saved');
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500"><Link to="/admin/articles" className="hover:underline">Blog</Link> / {isNew ? 'New' : 'Edit'}</div>
          <h1 className="text-xl font-semibold">{isNew ? 'New article' : v.title || 'Untitled'}</h1>
          {!isNew && <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Check className="h-3 w-3 text-emerald-600" />Autosaved {ago(savedAt)}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && <PreviewLink href={`/blog/${v.slug}`} />}
          {!isNew && can('articles.delete') && <Button variant="ghost" onClick={async () => { if (await confirm('Delete this article?')) { remove('articles', existing!.id); toast('Deleted'); nav('/admin/articles'); } }}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
          {can('articles.publish') ? (
            <>
              <Button variant="outline" onClick={() => save(v.status === 'published' ? undefined : 'draft')}>Save {v.status === 'published' ? '' : 'draft'}</Button>
              {v.status !== 'published' ? <Button onClick={() => save('published')}>Publish</Button> : <Button variant="outline" onClick={() => save('draft')}>Unpublish</Button>}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => save()}>Save</Button>
              {v.status === 'draft' && <Button onClick={() => save('in_review')}>Submit for review</Button>}
            </>
          )}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <Field label="Title *"><Input className="h-11 text-base font-medium" value={v.title} onChange={(e) => { const t = e.target.value; setV((x) => ({ ...x, title: t, ...(slugTouched ? {} : { slug: slugify(t) }) })); }} placeholder="Article headline" /></Field>
            <Field label="Slug" hint={`/blog/${v.slug || '…'}`}><Input value={v.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Excerpt"><Textarea className="min-h-16" value={v.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></Field>
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-slate-600"><span>Body</span><span className="flex items-center gap-1 text-slate-400"><Clock className="h-3 w-3" />{readTime(v.body)} min read · {stripHtml(v.body).split(' ').filter(Boolean).length} words</span></div>
              <RichText value={v.body} onChange={(h) => set('body', h)} minHeight={420} />
            </div>
          </Card>
          <Card className="space-y-3 p-5">
            <h3 className="text-sm font-semibold">SEO</h3>
            <Field label="Meta title"><Input value={v.seo.title} onChange={(e) => set('seo', { ...v.seo, title: e.target.value })} placeholder={v.title} /><Counter value={v.seo.title} max={60} /></Field>
            <Field label="Meta description"><Textarea className="min-h-16" value={v.seo.description} onChange={(e) => set('seo', { ...v.seo, description: e.target.value })} /><Counter value={v.seo.description} max={160} /></Field>
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs text-emerald-700">msmunify.com › blog › {v.slug}</div>
              <div className="text-base text-blue-700">{v.seo.title || v.title || 'Title'}</div>
              <div className="line-clamp-2 text-xs text-slate-600">{v.seo.description || v.excerpt}</div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <Field label="Status"><StatusControl mod="articles" value={v.status} onChange={(s) => set('status', s)} /></Field>
            <Toggle checked={v.featured} onChange={(b) => set('featured', b)} label="Featured on homepage" />
            {v.publishedAt && <div className="text-xs text-slate-500">Published {date(v.publishedAt)}</div>}
          </Card>
          <Card className="space-y-3 p-4">
            <div className="text-xs font-medium text-slate-600">Cover image</div>
            {v.cover ? <Img src={v.cover} className="aspect-video w-full rounded-lg" /> : <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">No cover</div>}
            <Input value={v.cover.startsWith('data:') ? '(uploaded file)' : v.cover} onChange={(e) => set('cover', e.target.value)} placeholder="Image URL" />
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs hover:bg-slate-50">
              <Upload className="h-3.5 w-3.5" />Upload image
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set('cover', await fileToDataUrl(f)); }} />
            </label>
          </Card>
          <Card className="space-y-3 p-4">
            <Field label="Author"><Select value={v.authorId} onChange={(e) => set('authorId', Number(e.target.value))} options={authors.map((a) => ({ value: a.id, label: a.name }))} /></Field>
            <Field label="Category"><Select value={v.category} onChange={(e) => set('category', e.target.value as Article['category'])} options={CATS} /></Field>
            <Field label="Linked institute"><Select value={v.instituteId ?? ''} placeholder="None" onChange={(e) => set('instituteId', e.target.value ? Number(e.target.value) : null)} options={institutes.map((n) => ({ value: n.id, label: n.shortName }))} /></Field>
            <Field label="Linked exam"><Select value={v.examId ?? ''} placeholder="None" onChange={(e) => set('examId', e.target.value ? Number(e.target.value) : null)} options={exams.map((x) => ({ value: x.id, label: x.name }))} /></Field>
          </Card>
          <Card className="space-y-2 p-4">
            <div className="text-xs font-medium text-slate-600">Tags</div>
            <ChipSelect options={tags.map((t) => ({ value: t.id, label: t.name }))} value={v.tagIds} onChange={(ids) => set('tagIds', ids)} />
            <form className="flex gap-2 pt-1" onSubmit={(e) => {
              e.preventDefault(); const name = newTag.trim(); if (!name) return;
              const ex = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
              const t = ex ?? add('tags', { name, slug: slugify(name), color: '#64748b' });
              set('tagIds', [...new Set([...v.tagIds, t.id])]); setNewTag(''); if (!ex) toast(`Tag "${name}" created`);
            }}>
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag" className="h-8" /><Button size="sm" variant="outline" type="submit">Add</Button>
            </form>
          </Card>
        </div>
      </div>
      {node}
    </div>
  );
}

/** Rendered like the website article (used by view + preview pages). */
function ArticleRender({ a }: { a: Article }) {
  const authors = useCol('authors');
  const tags = useCol('tags');
  const author = byId(authors, a.authorId);
  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-2 flex flex-wrap gap-1.5">{a.tagIds.map((id) => <span key={id} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">{byId(tags, id)?.name}</span>)}</div>
      <h1 className="text-3xl font-bold leading-tight">{a.title}</h1>
      <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
        {author && <img src={author.avatar} alt="" className="h-8 w-8 rounded-full bg-slate-200" />}
        <span className="font-medium text-slate-700">{author?.name}</span>·<span>{date(a.publishedAt ?? a.updatedAt)}</span>·<span>{a.readMinutes} min read</span>
      </div>
      {a.cover && <Img src={a.cover} className="mt-5 aspect-[2/1] w-full rounded-xl" />}
      {a.excerpt && <p className="mt-5 text-lg text-slate-600">{a.excerpt}</p>}
      <Html html={a.body} className="mt-3" />
    </article>
  );
}

export function ArticleView() {
  const { id } = useParams();
  const a = useStore((s) => s.db.articles.find((x) => x.id === Number(id)));
  const institutes = useCol('institutes');
  const exams = useCol('exams');
  const can = useCan();
  const nav = useNavigate();
  const stats = useMemo(() => a && [
    ['Status', <Badge key="s">{a.status}</Badge>], ['Views', num(a.views)], ['Category', a.category], ['Published', date(a.publishedAt)], ['Updated', ago(a.updatedAt)],
    ['Institute', byId(institutes, a.instituteId)?.shortName ?? '—'], ['Exam', byId(exams, a.examId)?.name ?? '—'],
  ], [a, institutes, exams]);
  if (!a) return <Empty text="Article not found" />;
  return (
    <div>
      <PageHeader title={a.title} subtitle={<Link to="/admin/articles" className="hover:underline">← Blog</Link>}
        actions={<><PreviewLink href={`/blog/${a.slug}`} />{can('articles.edit') && <Button onClick={() => nav(`/admin/articles/${a.id}/edit`)}><Pencil className="h-4 w-4" />Edit</Button>}</>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <Card className="p-6"><ArticleRender a={a} /></Card>
        <Card className="h-fit divide-y divide-slate-100 p-1 text-sm">
          {stats!.map(([k, val]) => <div key={String(k)} className="flex justify-between px-3 py-2"><span className="text-slate-500">{k}</span><span className="capitalize">{val}</span></div>)}
        </Card>
      </div>
    </div>
  );
}

export function ArticlePreview() {
  const { id } = useParams();
  const a = useStore((s) => s.db.articles.find((x) => x.id === Number(id)));
  if (!a) return <Empty text="Article not found" />;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span>Preview — {a.status !== 'published' ? 'this article is not live yet' : 'live version'}</span>
        <Link to={`/admin/articles/${a.id}/edit`} className="font-medium underline">Back to editor</Link>
      </div>
      <Card className="p-6 md:p-10"><ArticleRender a={a} /></Card>
    </div>
  );
}
