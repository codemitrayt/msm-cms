import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Card, DynIcon, Field, Input, PageHeader, SearchInput, Select, Tabs, Textarea, Toggle, useConfirm, cx } from '../../ui';
import { slugify } from '../../lib/format';
import { useCan } from '../Layout';
import type { CollectionKey, SiteConfig } from '../../data/types';

/* ---------------- Website settings ---------------- */
function WebsiteSettings() {
  const config = useStore((s) => s.config);
  const { setConfig, toast, log } = useStore.getState();
  const can = useCan();
  const [d, setD] = useState<SiteConfig>(structuredClone(config));
  const ro = !can('config.edit');
  const dirty = JSON.stringify(d) !== JSON.stringify(config);
  const save = () => { setConfig(d); log('updated', 'website configuration'); toast('Configuration saved — live on the website'); };
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">General</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Site name"><Input disabled={ro} value={d.siteName} onChange={(e) => setD({ ...d, siteName: e.target.value })} /></Field>
          <Field label="Support phone"><Input disabled={ro} value={d.supportPhone} onChange={(e) => setD({ ...d, supportPhone: e.target.value })} /></Field>
          <Field label="Support email"><Input disabled={ro} value={d.supportEmail} onChange={(e) => setD({ ...d, supportEmail: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <Toggle checked={d.crmPushEnabled} onChange={(v) => !ro && setD({ ...d, crmPushEnabled: v })} label="Push new leads to CRM automatically" />
          <Toggle checked={d.maintenanceMode} onChange={(v) => !ro && setD({ ...d, maintenanceMode: v })} label="Maintenance mode" />
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Home page hero</h3>
        <div className="grid gap-3">
          <Field label="Hero title"><Input disabled={ro} value={d.heroTitle} onChange={(e) => setD({ ...d, heroTitle: e.target.value })} /></Field>
          <Field label="Hero subtitle"><Textarea disabled={ro} className="min-h-16" value={d.heroSubtitle} onChange={(e) => setD({ ...d, heroSubtitle: e.target.value })} /></Field>
        </div>
      </Card>
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Promo banner</h3><Toggle checked={d.promoBanner.enabled} onChange={(v) => !ro && setD({ ...d, promoBanner: { ...d.promoBanner, enabled: v } })} label={d.promoBanner.enabled ? 'Shown' : 'Hidden'} /></div>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <Field label="Text"><Input disabled={ro} value={d.promoBanner.text} onChange={(e) => setD({ ...d, promoBanner: { ...d.promoBanner, text: e.target.value } })} /></Field>
          <Field label="Link"><Input disabled={ro} value={d.promoBanner.link} onChange={(e) => setD({ ...d, promoBanner: { ...d.promoBanner, link: e.target.value } })} /></Field>
        </div>
        {d.promoBanner.enabled && <div className="mt-3 rounded-lg bg-brand px-4 py-2 text-center text-sm font-medium text-white">{d.promoBanner.text}</div>}
      </Card>
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Stats strip</h3>{!ro && <Button size="sm" variant="outline" onClick={() => setD({ ...d, stats: [...d.stats, { label: 'New stat', value: 0, suffix: '+' }] })}><Plus className="h-3.5 w-3.5" />Add</Button>}</div>
        <div className="space-y-2">
          {d.stats.map((st, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_80px_auto] gap-2">
              <Input disabled={ro} value={st.label} onChange={(e) => setD({ ...d, stats: d.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <Input disabled={ro} type="number" value={st.value} onChange={(e) => setD({ ...d, stats: d.stats.map((x, j) => (j === i ? { ...x, value: +e.target.value } : x)) })} />
              <Input disabled={ro} value={st.suffix} onChange={(e) => setD({ ...d, stats: d.stats.map((x, j) => (j === i ? { ...x, suffix: e.target.value } : x)) })} />
              {!ro && <Button variant="ghost" onClick={() => setD({ ...d, stats: d.stats.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Testimonials</h3>{!ro && <Button size="sm" variant="outline" onClick={() => setD({ ...d, testimonials: [...d.testimonials, { name: '', course: '', quote: '' }] })}><Plus className="h-3.5 w-3.5" />Add</Button>}</div>
        <div className="space-y-3">
          {d.testimonials.map((t, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input disabled={ro} placeholder="Name" value={t.name} onChange={(e) => setD({ ...d, testimonials: d.testimonials.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Input disabled={ro} placeholder="Course, college" value={t.course} onChange={(e) => setD({ ...d, testimonials: d.testimonials.map((x, j) => (j === i ? { ...x, course: e.target.value } : x)) })} />
                {!ro && <Button variant="ghost" onClick={() => setD({ ...d, testimonials: d.testimonials.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
              </div>
              <Textarea disabled={ro} className="min-h-14" placeholder="Quote" value={t.quote} onChange={(e) => setD({ ...d, testimonials: d.testimonials.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)) })} />
            </div>
          ))}
        </div>
      </Card>
      {!ro && (
        <div className="sticky bottom-20 flex justify-end gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <span className="mr-auto self-center text-xs text-slate-500">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <Button variant="outline" disabled={!dirty} onClick={() => setD(structuredClone(config))}>Discard</Button>
          <Button disabled={!dirty} onClick={save}>Save configuration</Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Master data (generic) ---------------- */
type FieldDef = { key: string; label: string; type?: 'text' | 'icon' | 'ref'; ref?: CollectionKey; options?: string[] };
interface MasterDef { key: CollectionKey; label: string; fields: FieldDef[]; usage?: (db: ReturnType<typeof useStore.getState>['db'], id: number) => number }

const MASTERS: MasterDef[] = [
  { key: 'streams', label: 'Streams', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }, { key: 'icon', label: 'Icon (lucide)', type: 'icon' }], usage: (db, id) => db.institutes.filter((i) => i.streamIds.includes(id)).length },
  { key: 'states', label: 'States', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }, { key: 'zone', label: 'Zone', options: ['North', 'South', 'East', 'West', 'Central', 'North East'] }], usage: (db, id) => db.institutes.filter((i) => i.stateId === id).length },
  { key: 'cities', label: 'Cities', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }, { key: 'stateId', label: 'State', type: 'ref', ref: 'states' }], usage: (db, id) => db.institutes.filter((i) => i.cityId === id).length },
  { key: 'courseLevels', label: 'Course levels', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }], usage: (db, id) => db.baseCourses.filter((b) => b.levelId === id).length },
  { key: 'modes', label: 'Modes', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }], usage: (db, id) => db.courses.filter((c) => c.modeId === id).length },
  { key: 'courseTypes', label: 'Course types', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }], usage: (db, id) => db.courses.filter((c) => c.courseTypeId === id).length },
  { key: 'specializations', label: 'Specializations', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }, { key: 'baseCourseId', label: 'Base course', type: 'ref', ref: 'baseCourses' }], usage: (db, id) => db.courses.filter((c) => c.specializationId === id).length },
  { key: 'rankingBodies', label: 'Ranking bodies', fields: [{ key: 'name', label: 'Name' }, { key: 'shortName', label: 'Short name' }, { key: 'slug', label: 'Slug' }], usage: (db, id) => db.institutes.filter((i) => i.rankings.some((r) => r.bodyId === id)).length },
  { key: 'authorities', label: 'Recognizing authorities', fields: [{ key: 'name', label: 'Name' }, { key: 'shortName', label: 'Short name' }, { key: 'slug', label: 'Slug' }], usage: (db, id) => db.institutes.filter((i) => i.authorityIds.includes(id)).length },
  { key: 'amenities', label: 'Amenities', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }, { key: 'icon', label: 'Icon (lucide)', type: 'icon' }], usage: (db, id) => db.institutes.filter((i) => i.amenityIds.includes(id)).length },
  { key: 'companies', label: 'Companies (recruiters)', fields: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }], usage: (db, id) => db.institutes.filter((i) => i.topRecruiterIds.includes(id)).length },
];

type Row = Record<string, string | number> & { id: number };

function MasterTable({ def }: { def: MasterDef }) {
  const db = useStore((s) => s.db);
  const { add, update, remove, toast, log } = useStore.getState();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Row | null>(null);
  const rows = (db[def.key] as unknown as Row[]).filter((r) => !q || String(r.name).toLowerCase().includes(q.toLowerCase()));
  const ro = !can('config.edit');
  const refLabel = (f: FieldDef, v: number) => ((db[f.ref!] as unknown as Row[]).find((x) => x.id === v)?.name as string) ?? '—';

  const save = () => {
    if (!edit) return;
    if (!String(edit.name ?? '').trim()) return toast('Name is required', 'error');
    const row = { ...edit };
    if ('slug' in row || def.fields.some((f) => f.key === 'slug')) row.slug = row.slug ? slugify(String(row.slug)) : slugify(String(row.name));
    if (row.id) update(def.key, row.id, row as never);
    else { const { id: _id, ...rest } = row; add(def.key, rest as never); }
    log(row.id ? 'updated' : 'added', `${def.label}: ${row.name}`);
    toast('Saved'); setEdit(null);
  };
  const blank = (): Row => Object.fromEntries([['id', 0], ...def.fields.map((f) => [f.key, f.type === 'ref' ? ((db[f.ref!] as unknown as Row[])[0]?.id ?? 0) : f.type === 'icon' ? 'Circle' : f.options ? f.options[0] : ''])]) as Row;

  const input = (f: FieldDef) => {
    if (!edit) return null;
    const v = edit[f.key];
    if (f.type === 'ref') return <Select value={v} onChange={(e) => setEdit({ ...edit, [f.key]: +e.target.value })} options={(db[f.ref!] as unknown as Row[]).map((x) => ({ value: x.id, label: String(x.shortName ?? x.name) }))} />;
    if (f.options) return <Select value={v} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} options={f.options.map((o) => ({ value: o, label: o }))} />;
    return <div className="flex items-center gap-1.5">{f.type === 'icon' && <DynIcon name={String(v)} className="h-4 w-4 shrink-0 text-slate-500" />}<Input value={v ?? ''} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value, ...(f.key === 'name' && !edit.id ? { slug: slugify(e.target.value) } : {}) })} /></div>;
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{def.label} <span className="font-normal text-slate-400">({rows.length})</span></h3>
        <SearchInput className="ml-auto w-56" value={q} onChange={setQ} />
        {!ro && <Button size="md" onClick={() => setEdit(blank())}><Plus className="h-4 w-4" />Add</Button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>{def.fields.map((f) => <th key={f.key} className="px-3 py-2 font-medium">{f.label}</th>)}<th className="px-3 py-2 font-medium">Used by</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {edit && !edit.id && (
              <tr className="bg-brand-soft/30">{def.fields.map((f) => <td key={f.key} className="px-2 py-1.5">{input(f)}</td>)}<td />
                <td className="whitespace-nowrap px-2 text-right"><Button size="sm" onClick={save}><Check className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}><X className="h-3.5 w-3.5" /></Button></td></tr>
            )}
            {rows.map((r) => edit?.id === r.id ? (
              <tr key={r.id} className="bg-brand-soft/30">{def.fields.map((f) => <td key={f.key} className="px-2 py-1.5">{input(f)}</td>)}<td />
                <td className="whitespace-nowrap px-2 text-right"><Button size="sm" onClick={save}><Check className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}><X className="h-3.5 w-3.5" /></Button></td></tr>
            ) : (
              <tr key={r.id} className="hover:bg-slate-50">
                {def.fields.map((f) => (
                  <td key={f.key} className={cx('px-3 py-2', f.key === 'slug' && 'font-mono text-xs text-slate-500')}>
                    {f.type === 'ref' ? refLabel(f, Number(r[f.key])) : f.type === 'icon' ? <span className="inline-flex items-center gap-1.5"><DynIcon name={String(r[f.key])} className="h-4 w-4" />{r[f.key]}</span> : r[f.key]}
                  </td>
                ))}
                <td className="px-3 py-2 text-slate-500">{def.usage?.(db, r.id) ?? '—'}</td>
                <td className="whitespace-nowrap px-2 text-right">
                  {!ro && <>
                    <Button size="sm" variant="ghost" onClick={() => setEdit({ ...r })}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={async () => {
                      const n = def.usage?.(db, r.id) ?? 0;
                      if (n) return toast(`In use by ${n} records — can't delete`, 'error');
                      if (await confirm(`Delete "${r.name}"?`)) { remove(def.key, r.id); toast('Deleted'); }
                    }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {node}
    </Card>
  );
}

function MasterData() {
  const [k, setK] = useState<CollectionKey>('streams');
  const def = MASTERS.find((m) => m.key === k)!;
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="flex gap-1 overflow-x-auto lg:flex-col">
        {MASTERS.map((m) => (
          <button key={m.key} onClick={() => setK(m.key)} className={cx('whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm cursor-pointer', k === m.key ? 'bg-brand-soft font-medium text-brand' : 'text-slate-600 hover:bg-white')}>{m.label}</button>
        ))}
      </div>
      <MasterTable key={k} def={def} />
    </div>
  );
}

export default function ConfigPage() {
  const [tab, setTab] = useState<'website' | 'master'>('website');
  return (
    <div>
      <PageHeader title="Configuration" subtitle="Website settings and master data used across the CMS" />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'website', label: 'Website' }, { value: 'master', label: 'Master data' }]} />
      {tab === 'website' ? <WebsiteSettings /> : <MasterData />}
    </div>
  );
}
