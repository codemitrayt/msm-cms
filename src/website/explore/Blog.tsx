import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, Eye, Link2, Share2, ChevronLeft, ChevronRight, ExternalLink as Linkedin } from "lucide-react";
import { useCol, useStore } from '../../store';
import { Badge, Button, Card, Empty, Html, Img, Logo, SearchInput, cx } from '../../ui';
import { compact, date } from '../../lib/format';
import type { Article } from '../../data/types';
import { Crumbs, Page, usePreview, visible } from './shared';
import { NotFound } from '../core/NotFound';

const CATS: { value: '' | Article['category']; label: string }[] = [
  { value: '', label: 'All' }, { value: 'news', label: 'News' }, { value: 'blog', label: 'Blog' }, { value: 'guide', label: 'Guides' },
  { value: 'exam-news', label: 'Exam news' }, { value: 'college-news', label: 'College news' },
];
const catLabel = (c: string) => CATS.find((x) => x.value === c)?.label ?? c;
const PAGE = 9;
const lastView = new Map<number, number>();

function usePublished() {
  const preview = usePreview();
  const articles = useCol('articles');
  return useMemo(() => articles.filter((a) => visible(a.status, preview)).sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt)), [articles, preview]);
}

export function ArticleCard({ a, big }: { a: Article; big?: boolean }) {
  const author = useCol('authors').find((x) => x.id === a.authorId);
  return (
    <Link to={`/blog/${a.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md">
      <Img src={a.cover} alt={a.title} className={cx('w-full', big ? 'h-64' : 'h-40')} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-brand">{catLabel(a.category)}{a.status !== 'published' && <Badge>{a.status}</Badge>}</div>
        <div className={cx('font-semibold leading-snug group-hover:text-brand', big ? 'text-xl' : 'line-clamp-2')}>{a.title}</div>
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{a.excerpt}</p>
        <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-slate-500">
          {author && <Img src={author.avatar} className="h-5 w-5 rounded-full" />}
          <span>{author?.name}</span><span>·</span><span>{date(a.publishedAt ?? a.updatedAt)}</span><span>·</span><span>{a.readMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}

export function BlogPage() {
  const all = usePublished();
  const tags = useCol('tags');
  const [cat, setCat] = useState<'' | Article['category']>('');
  const [tag, setTag] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const featured = all.filter((a) => a.featured).slice(0, 3);
  const list = all.filter((a) => (!cat || a.category === cat) && (!tag || a.tagIds.includes(tag)) && (!q || `${a.title} ${a.excerpt}`.toLowerCase().includes(q.toLowerCase())));
  useEffect(() => setPage(0), [cat, tag, q]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const popular = [...all].sort((a, b) => b.views - a.views).slice(0, 5);
  const filtering = !!(cat || tag || q);
  return (
    <Page>
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog' }]} />
      <h1 className="text-3xl font-bold">News & Articles</h1>
      <p className="mt-1 text-slate-600">Latest exam news, admission guides and career advice from our experts.</p>

      {!filtering && featured.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <ArticleCard a={featured[0]} big />
          <div className="grid gap-4">{featured.slice(1).map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {CATS.map((c) => (
            <button key={c.value} onClick={() => setCat(c.value)} className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium cursor-pointer', cat === c.value ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800')}>{c.label}</button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Search articles…" className="mb-2 w-full sm:w-64" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {tag && (
            <div className="mb-3 text-sm">Tagged <Badge className="mx-1">{tags.find((t) => t.id === tag)?.name ?? ''}</Badge><button className="text-xs text-brand cursor-pointer" onClick={() => setTag(null)}>clear</button></div>
          )}
          {list.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.slice(page * PAGE, page * PAGE + PAGE).map((a) => <ArticleCard key={a.id} a={a} />)}</div>
          ) : <Card><Empty text="No articles match" /></Card>}
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} className={cx('h-8 w-8 rounded-lg text-sm cursor-pointer', i === page ? 'bg-brand text-white' : 'hover:bg-slate-100')}>{i + 1}</button>
              ))}
              <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
        <aside className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold">Most popular</div>
            <ol className="space-y-3">
              {popular.map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <span className="text-2xl font-bold text-slate-200">{i + 1}</span>
                  <Link to={`/blog/${a.slug}`} className="text-sm font-medium leading-snug hover:text-brand">{a.title}<div className="mt-0.5 text-xs font-normal text-slate-400">{compact(a.views)} views</div></Link>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold">Topics</div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button key={t.id} onClick={() => setTag(tag === t.id ? null : t.id)} className={cx('rounded-full border px-2.5 py-1 text-xs cursor-pointer', tag === t.id ? 'border-brand bg-brand-soft text-brand' : 'border-slate-200 text-slate-600 hover:border-slate-400')}>#{t.name}</button>
              ))}
            </div>
          </Card>
          <div className="rounded-xl bg-brand p-5 text-white">
            <div className="font-semibold">Need help choosing a college?</div>
            <p className="mt-1 text-sm text-white/80">Get free 1:1 counselling from our experts.</p>
            <Link to="/talk-to-counsellor"><Button variant="secondary" className="mt-3">Talk to counsellor</Button></Link>
          </div>
        </aside>
      </div>
    </Page>
  );
}

/** Add ids to <h2>s and return the TOC. */
function withToc(html: string) {
  const toc: { id: string; text: string }[] = [];
  const out = html.replace(/<h2([^>]*)>(.*?)<\/h2>/g, (_m, attrs, inner) => {
    const text = String(inner).replace(/<[^>]+>/g, '');
    const id = `s-${toc.length + 1}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
    toc.push({ id, text });
    return `<h2${attrs} id="${id}" style="scroll-margin-top:90px">${inner}</h2>`;
  });
  return { html: out, toc };
}

export function ArticlePage() {
  const { slug } = useParams();
  const preview = usePreview();
  const articles = useCol('articles');
  const a = articles.find((x) => x.slug === slug);
  const authors = useCol('authors');
  const tags = useCol('tags');
  const institutes = useCol('institutes');
  const exams = useCol('exams');
  const update = useStore((s) => s.update);
  const toast = useStore((s) => s.toast);
  const id = a?.id;
  useEffect(() => {
    if (!id) return;
    // StrictMode runs effects twice in dev — count one view per 2s per article.
    const last = lastView.get(id) ?? 0;
    if (Date.now() - last < 2000) return;
    lastView.set(id, Date.now());
    const cur = useStore.getState().db.articles.find((x) => x.id === id);
    if (cur) update('articles', id, { views: cur.views + 1 });
  }, [id, update]);
  if (!a || !visible(a.status, preview)) return <NotFound />;
  const author = authors.find((x) => x.id === a.authorId);
  const { html, toc } = withToc(a.body);
  const inst = institutes.find((n) => n.id === a.instituteId && n.status === 'published');
  const exam = exams.find((e) => e.id === a.examId && e.status === 'published');
  const related = articles.filter((x) => x.id !== a.id && x.status === 'published' && (x.category === a.category || x.tagIds.some((t) => a.tagIds.includes(t)))).slice(0, 3);
  const url = window.location.href;
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { toast('Could not copy link', 'error'); } };
  return (
    <Page className="max-w-6xl">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: a.title }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand">{catLabel(a.category)} {a.status !== 'published' && <Badge className="ml-1">{a.status}</Badge>}</div>
          <h1 className="mt-1 text-2xl font-bold leading-tight md:text-4xl">{a.title}</h1>
          <p className="mt-2 text-slate-600">{a.excerpt}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-3">
            {author && (
              <Link to={`/author/${author.slug}`} className="flex items-center gap-2.5">
                <Img src={author.avatar} className="h-10 w-10 rounded-full" />
                <div><div className="text-sm font-medium hover:text-brand">{author.name}</div><div className="text-xs text-slate-500">{author.designation}</div></div>
              </Link>
            )}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{date(a.publishedAt ?? a.updatedAt)}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{a.readMinutes} min read</span>
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{compact(a.views)}</span>
            </div>
          </div>
          <Img src={a.cover} alt={a.title} className="mt-5 h-56 w-full rounded-xl md:h-80" />
          <Html html={html} className="mt-5" />
          <div className="mt-6 flex flex-wrap gap-1.5">
            {a.tagIds.map((t) => tags.find((x) => x.id === t)).filter(Boolean).map((t) => <Badge key={t!.id} className="normal-case">#{t!.name}</Badge>)}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-4">
            <Share2 className="h-4 w-4 text-slate-500" /><span className="text-sm font-medium">Share this article</span>
            <Button size="sm" variant="outline" onClick={copy}><Link2 className="h-3.5 w-3.5" />Copy link</Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${a.title} ${url}`)}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">WhatsApp</Button></a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><Linkedin className="h-3.5 w-3.5" />LinkedIn</Button></a>
          </div>
          {author && (
            <Card className="mt-6 flex gap-4 p-5">
              <Img src={author.avatar} className="h-16 w-16 shrink-0 rounded-full" />
              <div><div className="text-xs text-slate-500">Written by</div><Link to={`/author/${author.slug}`} className="font-semibold hover:text-brand">{author.name}</Link><p className="mt-1 text-sm text-slate-600">{author.bio}</p></div>
            </Card>
          )}
          {related.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Related articles</h2>
              <div className="grid gap-4 sm:grid-cols-3">{related.map((r) => <ArticleCard key={r.id} a={r} />)}</div>
            </div>
          )}
        </article>
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          {toc.length > 0 && (
            <Card className="p-4">
              <div className="mb-2 text-sm font-semibold">On this page</div>
              <ul className="space-y-1.5 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-600 hover:text-brand">{t.text}</a></li>)}</ul>
            </Card>
          )}
          {inst && (
            <Card className="p-4">
              <div className="mb-2 text-xs text-slate-500">College in this article</div>
              <Link to={`/college/${inst.slug}`} className="flex items-center gap-3 group"><Logo text={inst.logo} color={inst.brandColor} size={40} /><div className="text-sm font-medium group-hover:text-brand">{inst.name}</div></Link>
            </Card>
          )}
          {exam && (
            <Card className="p-4">
              <div className="mb-2 text-xs text-slate-500">Exam in this article</div>
              <Link to={`/exams/${exam.slug}`} className="font-medium hover:text-brand">{exam.name} 2027</Link>
              <div className="text-xs text-slate-500">{exam.fullName}</div>
              {exam.hasCollegePredictor && <Link to={`/exams/${exam.slug}/college-predictor`}><Button size="sm" className="mt-3 w-full">Predict colleges</Button></Link>}
            </Card>
          )}
          <div className="rounded-xl bg-slate-900 p-5 text-white">
            <div className="font-semibold">Free expert counselling</div>
            <p className="mt-1 text-sm text-slate-300">Get your doubts cleared by experts.</p>
            <Link to="/talk-to-counsellor"><Button className="mt-3">Talk to counsellor</Button></Link>
          </div>
        </aside>
      </div>
    </Page>
  );
}

export function AuthorPage() {
  const { slug } = useParams();
  const author = useCol('authors').find((a) => a.slug === slug);
  const all = usePublished();
  if (!author) return <NotFound />;
  const mine = all.filter((a) => a.authorId === author.id);
  const views = mine.reduce((s, a) => s + a.views, 0);
  return (
    <Page>
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: author.name }]} />
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Img src={author.avatar} className="h-24 w-24 rounded-full" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{author.name}</h1>
          <div className="text-sm text-brand">{author.designation}</div>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{author.bio}</p>
          <div className="mt-3 flex gap-5 text-sm"><span><b>{mine.length}</b> articles</span><span><b>{compact(views)}</b> reads</span></div>
        </div>
        <a href={author.linkedin}><Button variant="outline"><Linkedin className="h-4 w-4" />LinkedIn</Button></a>
      </Card>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Articles by {author.name.split(' ')[0]}</h2>
      {mine.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mine.map((a) => <ArticleCard key={a.id} a={a} />)}</div> : <Card><Empty text="No articles yet" /></Card>}
    </Page>
  );
}
