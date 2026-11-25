import { ArrowLeft, ArrowRight, Download, Plus, Star, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store';
import { Button, Empty, Field, Img, Input, Select, cx } from '../../ui';
import { downloadCsv, fileToDataUrl } from '../../lib/format';
import type { Institute } from '../../data/types';
import type { TabProps } from './InstituteWorkspace';
import { NumInput, Section } from './common';
import { SectionTab } from './tabs-profile';

const cell = 'h-8 text-xs';

export function CutoffTab({ inst, set }: TabProps) {
  const exams = useStore((s) => s.db.exams);
  const courses = useStore((s) => s.db.courses).filter((c) => c.instituteId === inst.id);
  const [examF, setExamF] = useState('');
  const rows = inst.cutoffData.map((r, i) => ({ ...r, i })).filter((r) => !examF || r.examId === Number(examF));
  const patch = (i: number, p: Partial<Institute['cutoffData'][number]>) => set({ cutoffData: inst.cutoffData.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const add = () => set({ cutoffData: [...inst.cutoffData, { examId: Number(examF) || exams[0].id, year: 2025, course: courses[0]?.name ?? '', category: 'General', round: 1, opening: 1, closing: 1000 }] });
  return (
    <div className="space-y-4">
      <Section title="Cut-off data" description="Used by the college Cut-offs page and by exam college predictors (closing rank)."
        actions={<>
          <Select className="h-8 w-40" value={examF} onChange={(e) => setExamF(e.target.value)} placeholder="All exams" options={exams.map((e) => ({ value: e.id, label: e.shortName }))} />
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`${inst.slug}-cutoffs.csv`, inst.cutoffData.map((r) => ({ ...r, exam: exams.find((e) => e.id === r.examId)?.shortName })))}><Download className="h-3.5 w-3.5" />CSV</Button>
          <Button size="sm" onClick={add}><Plus className="h-3.5 w-3.5" />Add row</Button>
        </>}>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs text-slate-500"><tr><th className="p-1">Exam</th><th className="p-1">Year</th><th className="p-1">Course</th><th className="p-1">Category</th><th className="p-1">Round</th><th className="p-1">Opening</th><th className="p-1">Closing</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.i}>
                    <td className="p-1"><Select className={cell} value={r.examId} onChange={(e) => patch(r.i, { examId: Number(e.target.value) })} options={exams.map((e) => ({ value: e.id, label: e.shortName }))} /></td>
                    <td className="p-1 w-20"><NumInput className={cell} value={r.year} onChange={(v) => patch(r.i, { year: v ?? 2025 })} /></td>
                    <td className="p-1"><Input className={cell} list={`courses-${inst.id}`} value={r.course} onChange={(e) => patch(r.i, { course: e.target.value })} /></td>
                    <td className="p-1 w-28"><Select className={cell} value={r.category} onChange={(e) => patch(r.i, { category: e.target.value })} options={['General', 'OBC', 'SC', 'ST', 'EWS'].map((c) => ({ value: c, label: c }))} /></td>
                    <td className="p-1 w-16"><NumInput className={cell} value={r.round} onChange={(v) => patch(r.i, { round: v ?? 1 })} /></td>
                    <td className="p-1 w-24"><NumInput className={cell} value={r.opening} onChange={(v) => patch(r.i, { opening: v ?? 0 })} /></td>
                    <td className="p-1 w-24"><NumInput className={cell} value={r.closing} onChange={(v) => patch(r.i, { closing: v ?? 0 })} /></td>
                    <td className="p-1"><Button size="sm" variant="ghost" onClick={() => set({ cutoffData: inst.cutoffData.filter((_, j) => j !== r.i) })}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id={`courses-${inst.id}`}>{courses.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          </div>
        ) : <Empty text="No cut-off rows" />}
      </Section>
      <SectionTab inst={inst} set={set} sectionKey="cut-off" heading="Cut-off" description="Cut-off page text" />
    </div>
  );
}

export function PlacementTab({ inst, set }: TabProps) {
  const patch = (i: number, p: Partial<Institute['placementData'][number]>) => set({ placementData: inst.placementData.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  return (
    <div className="space-y-4">
      <Section title="Placement highlights">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Average package (LPA)"><NumInput step={0.1} value={inst.avgPackageLpa} onChange={(v) => set({ avgPackageLpa: v ?? 0 })} /></Field>
          <Field label="Highest package (LPA)"><NumInput step={0.1} value={inst.highestPackageLpa} onChange={(v) => set({ highestPackageLpa: v ?? 0 })} /></Field>
          <Field label="Placement %"><NumInput value={inst.placementPercent} onChange={(v) => set({ placementPercent: v ?? 0 })} /></Field>
        </div>
      </Section>
      <Section title="Placement data (year-wise)" actions={<Button size="sm" onClick={() => set({ placementData: [...inst.placementData, { year: (inst.placementData.at(-1)?.year ?? 2025) + 1, placed: 0, total: 0, median: 0, highest: 0 }] })}><Plus className="h-3.5 w-3.5" />Add year</Button>}>
        {inst.placementData.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-slate-500"><tr><th className="p-1">Year</th><th className="p-1">Students</th><th className="p-1">Placed</th><th className="p-1">%</th><th className="p-1">Median (LPA)</th><th className="p-1">Highest (LPA)</th><th /></tr></thead>
              <tbody>
                {inst.placementData.map((r, i) => (
                  <tr key={i}>
                    <td className="p-1"><NumInput className={cell} value={r.year} onChange={(v) => patch(i, { year: v ?? 0 })} /></td>
                    <td className="p-1"><NumInput className={cell} value={r.total} onChange={(v) => patch(i, { total: v ?? 0 })} /></td>
                    <td className="p-1"><NumInput className={cell} value={r.placed} onChange={(v) => patch(i, { placed: v ?? 0 })} /></td>
                    <td className="p-1 text-xs text-slate-500">{r.total ? Math.round((r.placed / r.total) * 100) : 0}%</td>
                    <td className="p-1"><NumInput className={cell} value={r.median} onChange={(v) => patch(i, { median: v ?? 0 })} /></td>
                    <td className="p-1"><NumInput className={cell} value={r.highest} onChange={(v) => patch(i, { highest: v ?? 0 })} /></td>
                    <td className="p-1"><Button size="sm" variant="ghost" onClick={() => set({ placementData: inst.placementData.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty text="No placement data" />}
      </Section>
      <SectionTab inst={inst} set={set} sectionKey="placement" heading="Placement" description="Placement page text" />
    </div>
  );
}

export function RankingTab({ inst, set }: TabProps) {
  const bodies = useStore((s) => s.db.rankingBodies);
  const streams = useStore((s) => s.db.streams);
  const patch = (i: number, p: Partial<Institute['rankings'][number]>) => set({ rankings: inst.rankings.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  return (
    <div className="space-y-4">
      <Section title="Rankings" description="Used by ranking landing pages and the college Ranking tab."
        actions={<Button size="sm" onClick={() => set({ rankings: [...inst.rankings, { bodyId: bodies[0].id, year: 2026, rank: 1, category: streams[0].name }] })}><Plus className="h-3.5 w-3.5" />Add ranking</Button>}>
        {inst.rankings.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500"><tr><th className="p-1">Ranking body</th><th className="p-1">Year</th><th className="p-1">Category</th><th className="p-1">Rank</th><th /></tr></thead>
            <tbody>
              {inst.rankings.map((r, i) => (
                <tr key={i}>
                  <td className="p-1"><Select className={cell} value={r.bodyId} onChange={(e) => patch(i, { bodyId: Number(e.target.value) })} options={bodies.map((b) => ({ value: b.id, label: b.shortName }))} /></td>
                  <td className="p-1 w-24"><NumInput className={cell} value={r.year} onChange={(v) => patch(i, { year: v ?? 2026 })} /></td>
                  <td className="p-1"><Input className={cell} list="rank-cats" value={r.category} onChange={(e) => patch(i, { category: e.target.value })} /></td>
                  <td className="p-1 w-24"><NumInput className={cell} value={r.rank} onChange={(v) => patch(i, { rank: v ?? 1 })} /></td>
                  <td className="p-1"><Button size="sm" variant="ghost" onClick={() => set({ rankings: inst.rankings.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty text="No rankings" />}
        <datalist id="rank-cats">{['Overall', ...streams.map((s) => s.name)].map((c) => <option key={c} value={c} />)}</datalist>
      </Section>
      <SectionTab inst={inst} set={set} sectionKey="ranking" heading="Ranking" description="Ranking page text" />
    </div>
  );
}

export function GalleryTab({ inst, set }: TabProps) {
  const [album, setAlbum] = useState('');
  const albums = [...new Set(inst.gallery.map((g) => g.album))];
  const nextId = () => inst.gallery.reduce((m, g) => Math.max(m, g.id), 0) + 1;
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    let id = nextId();
    const added = await Promise.all([...files].map(async (f) => ({ id: id++, url: await fileToDataUrl(f), caption: f.name.replace(/\.[^.]+$/, ''), album: album || 'Campus' })));
    set({ gallery: [...inst.gallery, ...added] });
  };
  const move = (i: number, d: -1 | 1) => {
    const g = [...inst.gallery]; const j = i + d;
    if (j < 0 || j >= g.length) return;
    [g[i], g[j]] = [g[j], g[i]];
    set({ gallery: g });
  };
  const patch = (id: number, p: Partial<Institute['gallery'][number]>) => set({ gallery: inst.gallery.map((g) => (g.id === id ? { ...g, ...p } : g)) });
  return (
    <Section title={`Gallery (${inst.gallery.length})`} description="Uploads stay in this browser. Save to apply."
      actions={<>
        <Input className="h-8 w-36" list="albums" placeholder="Album for upload" value={album} onChange={(e) => setAlbum(e.target.value)} />
        <datalist id="albums">{albums.map((a) => <option key={a} value={a} />)}</datalist>
        <Button size="sm" variant="outline" onClick={() => { const u = prompt('Image URL'); if (u) set({ gallery: [...inst.gallery, { id: nextId(), url: u, caption: '', album: album || 'Campus' }] }); }}>Add URL</Button>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover">
          <Upload className="h-3.5 w-3.5" />Upload images
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
        </label>
      </>}>
      {inst.gallery.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {inst.gallery.map((g, i) => (
            <div key={g.id} className={cx('overflow-hidden rounded-lg border', inst.cover === g.url ? 'border-brand ring-2 ring-brand/30' : 'border-slate-200')}>
              <Img src={g.url} className="aspect-[4/3] w-full" />
              <div className="space-y-1.5 p-2">
                <Input className="h-7 text-xs" value={g.caption} placeholder="Caption" onChange={(e) => patch(g.id, { caption: e.target.value })} />
                <Input className="h-7 text-xs" value={g.album} placeholder="Album" onChange={(e) => patch(g.id, { album: e.target.value })} />
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <Button size="sm" variant="ghost" onClick={() => move(i, -1)}><ArrowLeft className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => move(i, 1)}><ArrowRight className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex">
                    <Button size="sm" variant="ghost" title="Set as cover" onClick={() => set({ cover: g.url })}><Star className={cx('h-3.5 w-3.5', inst.cover === g.url && 'fill-amber-400 text-amber-500')} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => set({ gallery: inst.gallery.filter((x) => x.id !== g.id) })}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty text="No photos yet" />}
    </Section>
  );
}
