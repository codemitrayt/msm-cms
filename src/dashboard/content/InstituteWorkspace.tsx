import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Save, Send, Trash2, Undo2 } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, Empty, Logo, Tabs, useConfirm, cx } from '../../ui';
import { ago, byId } from '../../lib/format';
import type { Institute } from '../../data/types';
import { useCan } from '../Layout';
import { scoreChecklist } from './common';
import { BrandingTab, FeesSummaryTab, HomePageTab, OverviewTab, SectionTab, SeoTab } from './tabs-profile';
import { CutoffTab, GalleryTab, PlacementTab, RankingTab } from './tabs-data';
import { ArticlesTab, CourseFeesTab, CoursesTab, EventsTab, ReviewsTab } from './tabs-linked';

export interface TabProps { inst: Institute; set: (p: Partial<Institute>) => void }

const TABS = [
  ['overview', 'Overview'], ['home-page', 'Home page'], ['admission', 'Admission'], ['scholarship', 'Scholarship'], ['how-to-reach', 'How to reach'],
  ['counsellor', 'Counsellor'], ['cutoff', 'Cut-off'], ['placement', 'Placement'], ['ranking', 'Ranking'], ['courses', 'Courses'], ['course-fees', 'Course fees'],
  ['fees', 'Fees'], ['gallery', 'Gallery'], ['reviews', 'Reviews'], ['events', 'Events & updates'], ['articles', 'Articles'], ['branding', 'Branding'], ['seo', 'SEO'],
] as const;
type TabKey = (typeof TABS)[number][0];

export function InstituteWorkspace() {
  const { id, tab = 'overview' } = useParams();
  const nav = useNavigate();
  const stored = useStore((s) => s.db.institutes.find((i) => i.id === Number(id)));
  const db = useStore((s) => s.db);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [draft, setDraft] = useState<Institute | undefined>(stored);
  useEffect(() => { setDraft(stored); /* reset only when switching institute */ }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => !!draft && !!stored && JSON.stringify(draft) !== JSON.stringify(stored), [draft, stored]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!stored || !draft) return <Empty text="Institution not found" action={<Link className="text-brand" to="/admin">Back to institutions</Link>} />;
  const courseCount = db.courses.filter((c) => c.instituteId === draft.id).length;
  const { checks, score } = scoreChecklist(draft, courseCount);
  const set = (p: Partial<Institute>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = (extra: Partial<Institute> = {}, msg = 'Saved') => {
    const next = { ...draft, ...extra, score, updatedAt: new Date().toISOString() };
    update('institutes', draft.id, next);
    setDraft(next);
    log(msg === 'Saved' ? 'updated' : msg.toLowerCase(), draft.shortName, draft.id);
    toast(`${draft.shortName}: ${msg}`);
  };
  const leave = async (to: string) => { if (!dirty || (await confirm('You have unsaved changes. Leave without saving?'))) nav(to); };
  const del = async () => {
    if (!(await confirm(`Delete ${draft.name} and all its courses?`))) return;
    remove('courses', db.courses.filter((c) => c.instituteId === draft.id).map((c) => c.id));
    remove('institutes', draft.id);
    log('deleted', draft.shortName, draft.id);
    toast('Institution deleted');
    nav('/admin');
  };

  const props: TabProps = { inst: draft, set };
  const sectionTab = (key: string, title: string, desc: string) => <SectionTab {...props} sectionKey={key} heading={title} description={desc} />;
  const body: Record<TabKey, React.ReactNode> = {
    overview: <OverviewTab {...props} />,
    'home-page': <HomePageTab {...props} />,
    admission: sectionTab('admission', 'Admission', 'Shown on /college/<slug>/admission'),
    scholarship: sectionTab('scholarship', 'Scholarship', 'Shown on /college/<slug>/scholarships'),
    'how-to-reach': sectionTab('how-to-reach', 'How to reach', 'Shown on /college/<slug>/how-to-reach'),
    counsellor: sectionTab('counsellor', 'For counsellor (internal)', 'Internal only — never shown on the website. Used by CRM "About the college".'),
    cutoff: <CutoffTab {...props} />,
    placement: <PlacementTab {...props} />,
    ranking: <RankingTab {...props} />,
    courses: <CoursesTab {...props} />,
    'course-fees': <CourseFeesTab {...props} />,
    fees: <FeesSummaryTab {...props} />,
    gallery: <GalleryTab {...props} />,
    reviews: <ReviewsTab {...props} />,
    events: <EventsTab {...props} />,
    articles: <ArticlesTab {...props} />,
    branding: <BrandingTab {...props} />,
    seo: <SeoTab {...props} />,
  };
  const city = byId(db.cities, draft.cityId)?.name;

  return (
    <div>
      {node}
      <button onClick={() => leave('/admin')} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 cursor-pointer"><ArrowLeft className="h-4 w-4" />Institutions</button>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo text={draft.logo} color={draft.brandColor} size={52} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{draft.name}</h1>
              <Badge>{stored.status}</Badge>
              {dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">Unsaved changes</span>}
            </div>
            <div className="text-sm text-slate-500">{draft.shortName} · {city} · /college/{draft.slug} · updated {ago(stored.updatedAt)}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`#/college/${draft.slug}?preview=1`} target="_blank" rel="noreferrer"><Button variant="outline"><ExternalLink className="h-4 w-4" />Preview</Button></a>
          {dirty && <Button variant="ghost" onClick={() => setDraft(stored)}><Undo2 className="h-4 w-4" />Discard</Button>}
          <Button variant="outline" onClick={() => save()} disabled={!dirty || !can('institutes.edit')}><Save className="h-4 w-4" />Save</Button>
          {!can('institutes.publish') && stored.status !== 'in_review' && can('institutes.edit') && <Button variant="blue" onClick={() => save({ status: 'in_review' }, 'Submitted for review')}><Send className="h-4 w-4" />Submit for review</Button>}
          {can('institutes.publish') && stored.status !== 'published' && <Button onClick={() => save({ status: 'published', publishedAt: stored.publishedAt ?? new Date().toISOString() }, 'Published')}>Publish</Button>}
          {can('institutes.publish') && stored.status === 'published' && <Button variant="secondary" onClick={() => save({ status: 'draft' }, 'Unpublished')}>Unpublish</Button>}
          {can('institutes.publish') && stored.status !== 'archived' && <Button variant="ghost" onClick={() => save({ status: 'archived' }, 'Archived')}>Archive</Button>}
          {can('institutes.delete') && <Button variant="ghost" onClick={del} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></Button>}
        </div>
      </div>
      {stored.status === 'in_review' && can('institutes.publish') && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">This institution was submitted for review. Check the changes and publish, or send it back to draft.</div>
      )}
      <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <Tabs className="mb-4" value={tab as TabKey} onChange={(t) => nav(`/admin/institutes/${draft.id}/${t}`)} tabs={TABS.map(([value, l]) => ({ value, label: l }))} />
          {body[tab as TabKey] ?? body.overview}
        </div>
        <aside className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">College score</div>
              <div className={cx('text-2xl font-bold tabular-nums', score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600')}>{score}</div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cx('h-full', score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${score}%` }} /></div>
            <ul className="mt-3 space-y-1.5 text-xs">
              {checks.map((c) => (
                <li key={c.label} className={cx('flex items-center gap-1.5', c.ok ? 'text-slate-500' : 'text-slate-800')}>
                  {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Circle className="h-3.5 w-3.5 text-slate-300" />}{c.label}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="space-y-1.5 p-4 text-xs text-slate-600">
            <div className="flex justify-between"><span>Courses</span><span className="font-medium">{courseCount}</span></div>
            <div className="flex justify-between"><span>Reviews</span><span className="font-medium">{db.reviews.filter((r) => r.instituteId === draft.id).length}</span></div>
            <div className="flex justify-between"><span>Views</span><span className="font-medium">{draft.views.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span>Published</span><span className="font-medium">{stored.publishedAt ? ago(stored.publishedAt) : '—'}</span></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
