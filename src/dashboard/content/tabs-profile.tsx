import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store';
import { Button, ChipSelect, Field, Img, Input, Logo, RichText, Select, Textarea, Toggle, cx } from '../../ui';
import { fileToDataUrl, inr, slugify, byId } from '../../lib/format';
import type { TabProps } from './InstituteWorkspace';
import { NumInput, OWNERSHIPS, Section, TYPES, opts } from './common';

export function OverviewTab({ inst, set }: TabProps) {
  const db = useStore((s) => s.db);
  return (
    <div className="space-y-4">
      <Section title="Basic details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2"><Input value={inst.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Short name"><Input value={inst.shortName} onChange={(e) => set({ shortName: e.target.value })} /></Field>
          <Field label="Slug" hint={`/college/${inst.slug}`}><Input value={inst.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} /></Field>
          <Field label="Type"><Select value={inst.type} onChange={(e) => set({ type: e.target.value as typeof inst.type })} options={opts(TYPES)} /></Field>
          <Field label="Ownership"><Select value={inst.ownership} onChange={(e) => set({ ownership: e.target.value as typeof inst.ownership })} options={opts(OWNERSHIPS)} /></Field>
          <Field label="Established year"><NumInput value={inst.establishedYear} onChange={(v) => set({ establishedYear: v ?? 0 })} /></Field>
          <Field label="Accreditation"><Input value={inst.accreditation} onChange={(e) => set({ accreditation: e.target.value })} placeholder="NAAC A++" /></Field>
          <Field label="Campus size"><Input value={inst.campusSize} onChange={(e) => set({ campusSize: e.target.value })} placeholder="250 acres" /></Field>
          <Field label="Rating (from reviews)"><NumInput step={0.1} value={inst.rating} onChange={(v) => set({ rating: v ?? 0 })} /></Field>
          <div className="flex flex-wrap gap-5 sm:col-span-2">
            <Toggle checked={inst.isAutonomous} onChange={(v) => set({ isAutonomous: v })} label="Autonomous" />
            <Toggle checked={inst.isPartner} onChange={(v) => set({ isPartner: v })} label="Partner institute" />
            <Toggle checked={inst.onlineCourses} onChange={(v) => set({ onlineCourses: v })} label="Offers online courses" />
          </div>
          <Field label="Recognised / approved by" className="sm:col-span-2"><ChipSelect options={db.authorities.map((a) => ({ value: a.id, label: a.shortName }))} value={inst.authorityIds} onChange={(v) => set({ authorityIds: v })} /></Field>
          <Field label="Streams" className="sm:col-span-2"><ChipSelect options={db.streams.map((a) => ({ value: a.id, label: a.name }))} value={inst.streamIds} onChange={(v) => set({ streamIds: v })} /></Field>
        </div>
      </Section>
      <Section title="Contact & location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><Input value={inst.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={inst.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Website" className="sm:col-span-2"><Input value={inst.website} onChange={(e) => set({ website: e.target.value })} /></Field>
          <Field label="State"><Select value={inst.stateId} onChange={(e) => { const sid = Number(e.target.value); set({ stateId: sid, cityId: db.cities.find((c) => c.stateId === sid)?.id ?? inst.cityId }); }} options={db.states.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="City"><Select value={inst.cityId} onChange={(e) => set({ cityId: Number(e.target.value) })} options={db.cities.filter((c) => c.stateId === inst.stateId).map((c) => ({ value: c.id, label: c.name }))} /></Field>
          <Field label="Campus address" className="sm:col-span-2"><Textarea className="min-h-16" value={inst.campusAddress} onChange={(e) => set({ campusAddress: e.target.value })} /></Field>
          <Field label="Pincode"><Input value={inst.pincode} onChange={(e) => set({ pincode: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Latitude"><NumInput step={0.0001} value={Number(inst.latitude.toFixed(4))} onChange={(v) => set({ latitude: v ?? 0 })} /></Field>
            <Field label="Longitude"><NumInput step={0.0001} value={Number(inst.longitude.toFixed(4))} onChange={(v) => set({ longitude: v ?? 0 })} /></Field>
          </div>
        </div>
      </Section>
      <Section title="Amenities & recruiters">
        <div className="space-y-4">
          <Field label="Amenities"><ChipSelect options={db.amenities.map((a) => ({ value: a.id, label: a.name }))} value={inst.amenityIds} onChange={(v) => set({ amenityIds: v })} /></Field>
          <Field label="Top recruiters"><ChipSelect options={db.companies.map((a) => ({ value: a.id, label: a.name }))} value={inst.topRecruiterIds} onChange={(v) => set({ topRecruiterIds: v })} /></Field>
        </div>
      </Section>
      <Section title="About" description="Shown at the top of the college home page.">
        <RichText value={inst.about} onChange={(about) => set({ about })} />
      </Section>
    </div>
  );
}

/** Ordered list of content sections that make up the college home page. */
export function HomePageTab({ inst, set }: TabProps) {
  const [open, setOpen] = useState<string | null>(inst.sections[0]?.key ?? null);
  const move = (i: number, d: -1 | 1) => {
    const s = [...inst.sections];
    const j = i + d;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    set({ sections: s });
  };
  const addSection = () => {
    const title = prompt('Section title');
    if (!title) return;
    let key = slugify(title);
    if (inst.sections.some((x) => x.key === key)) key += `-${Date.now() % 1000}`;
    set({ sections: [...inst.sections, { key, title, content: '<p></p>' }] });
    setOpen(key);
  };
  return (
    <Section title="Home page builder" description="Order of the sections on the college page. Click a section to edit it. The page tabs (Admission, Scholarship…) edit the same sections."
      actions={<Button size="sm" variant="outline" onClick={addSection}><Plus className="h-4 w-4" />Add section</Button>}>
      <div className="space-y-2">
        {inst.sections.map((sec, i) => (
          <div key={sec.key} className="rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="w-5 text-xs text-slate-400">{i + 1}</span>
              <button className="flex-1 text-left text-sm font-medium cursor-pointer" onClick={() => setOpen(open === sec.key ? null : sec.key)}>{sec.title}</button>
              <span className="text-[11px] text-slate-400">{sec.key}</span>
              <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === inst.sections.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => set({ sections: inst.sections.filter((x) => x.key !== sec.key) })}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
            </div>
            {open === sec.key && (
              <div className="space-y-3 border-t border-slate-100 p-3">
                <Field label="Heading"><Input value={sec.title} onChange={(e) => set({ sections: inst.sections.map((x) => (x.key === sec.key ? { ...x, title: e.target.value } : x)) })} /></Field>
                <RichText value={sec.content} onChange={(content) => set({ sections: inst.sections.map((x) => (x.key === sec.key ? { ...x, content } : x)) })} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/** One named section (admission, scholarship…) — creates it when missing. */
export function SectionTab({ inst, set, sectionKey, heading, description }: TabProps & { sectionKey: string; heading: string; description: string }) {
  const sec = inst.sections.find((s) => s.key === sectionKey);
  const patch = (p: { title?: string; content?: string }) => {
    if (sec) set({ sections: inst.sections.map((s) => (s.key === sectionKey ? { ...s, ...p } : s)) });
    else set({ sections: [...inst.sections, { key: sectionKey, title: `${inst.shortName} ${heading} 2026`, content: '', ...p }] });
  };
  return (
    <Section title={heading} description={description}>
      <div className="space-y-3">
        <Field label="Page heading (H1)"><Input value={sec?.title ?? `${inst.shortName} ${heading} 2026`} onChange={(e) => patch({ title: e.target.value })} /></Field>
        <RichText value={sec?.content ?? ''} onChange={(content) => patch({ content })} minHeight={320} />
      </div>
    </Section>
  );
}

export function FeesSummaryTab({ inst, set }: TabProps) {
  const courses = useStore((s) => s.db.courses).filter((c) => c.instituteId === inst.id);
  const yearly = courses.map((c) => c.feeForCommission || c.fees / Math.max(1, c.durationValue)).filter(Boolean);
  const total = courses.map((c) => c.fees).filter(Boolean);
  const recompute = () => {
    if (!total.length) return;
    set({ minFee: Math.min(...yearly), maxFee: Math.max(...total) });
  };
  const sec = inst.sections.find((s) => s.key === 'fees');
  return (
    <div className="space-y-4">
      <Section title="Fee range" description="Shown on college cards and listings." actions={<Button size="sm" variant="outline" onClick={recompute} disabled={!courses.length}>Recalculate from courses</Button>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum fee (₹)" hint={inr(inst.minFee)}><NumInput value={inst.minFee} onChange={(v) => set({ minFee: v ?? 0 })} /></Field>
          <Field label="Maximum fee (₹)" hint={inr(inst.maxFee)}><NumInput value={inst.maxFee} onChange={(v) => set({ maxFee: v ?? 0 })} /></Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">{courses.length} courses · course total fees range {total.length ? `${inr(Math.min(...total))} – ${inr(Math.max(...total))}` : '—'}</p>
      </Section>
      <SectionTab inst={inst} set={set} sectionKey="fees" heading="Fees" description={sec ? 'Fees page content' : 'No fees page content yet — start typing to create it.'} />
    </div>
  );
}

export function BrandingTab({ inst, set }: TabProps) {
  const db = useStore((s) => s.db);
  const swatches = ['#fa0000', '#1f5eff', '#0f766e', '#7c3aed', '#c2410c', '#0369a1', '#be123c', '#15803d', '#a16207', '#4338ca'];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Brand">
        <div className="space-y-4">
          <Field label="Brand colour" hint="Used for the college site header, buttons and logo tile.">
            <div className="flex items-center gap-2">
              <input type="color" value={inst.brandColor} onChange={(e) => set({ brandColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-300" />
              <Input value={inst.brandColor} onChange={(e) => set({ brandColor: e.target.value })} className="w-32" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {swatches.map((c) => <button key={c} type="button" onClick={() => set({ brandColor: c })} className={cx('h-6 w-6 rounded-full ring-2 ring-offset-1 cursor-pointer', inst.brandColor === c ? 'ring-slate-800' : 'ring-transparent')} style={{ background: c }} />)}
            </div>
          </Field>
          <Field label="Logo initials" hint="Max 4 characters"><Input maxLength={4} value={inst.logo} onChange={(e) => set({ logo: e.target.value.toUpperCase() })} className="w-32" /></Field>
          <Field label="Cover image URL"><Input value={inst.cover} onChange={(e) => set({ cover: e.target.value })} /></Field>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
            <Upload className="h-4 w-4" />Upload cover
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ cover: await fileToDataUrl(f) }); }} />
          </label>
        </div>
      </Section>
      <Section title="Live preview">
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="relative h-36">
            <Img src={inst.cover} className="h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-3 text-white">
              <Logo text={inst.logo} color={inst.brandColor} size={48} />
              <div><div className="font-semibold">{inst.name}</div><div className="text-xs opacity-80">{byId(db.cities, inst.cityId)?.name} · Estd. {inst.establishedYear}</div></div>
            </div>
          </div>
          <div className="flex gap-2 p-3">
            <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: inst.brandColor }}>Download brochure</button>
            <button className="rounded-lg bg-cta-blue px-3 py-1.5 text-sm font-medium text-white">Apply now</button>
          </div>
          <div className="flex gap-4 border-t border-slate-100 px-3 text-sm">
            {['Overview', 'Courses', 'Fees', 'Placements'].map((t, i) => <span key={t} className="border-b-2 py-2" style={{ borderColor: i === 0 ? inst.brandColor : 'transparent', color: i === 0 ? inst.brandColor : undefined }}>{t}</span>)}
          </div>
        </div>
      </Section>
    </div>
  );
}

export function SeoTab({ inst, set }: TabProps) {
  const seo = inst.seo;
  const p = (x: Partial<typeof seo>) => set({ seo: { ...seo, ...x } });
  const count = (v: string, max: number) => <span className={v.length > max ? 'text-red-600' : ''}>{v.length}/{max}</span>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Search engine">
        <div className="space-y-4">
          <Field label="Meta title" hint={undefined}><Input value={seo.title} onChange={(e) => p({ title: e.target.value })} /><div className="text-right text-[11px] text-slate-400">{count(seo.title, 60)}</div></Field>
          <Field label="Meta description"><Textarea value={seo.description} onChange={(e) => p({ description: e.target.value })} /><div className="text-right text-[11px] text-slate-400">{count(seo.description, 160)}</div></Field>
          <Field label="Keywords" hint="Comma separated"><Input value={seo.keywords} onChange={(e) => p({ keywords: e.target.value })} /></Field>
          <Button size="sm" variant="outline" onClick={() => p({ title: `${inst.shortName}: Courses, Fees, Admission 2026, Placements, Ranking`, description: `${inst.name} — check courses, fees, cut-off, placements, rankings and admission process for 2026.` })}>Fill from SEO template</Button>
        </div>
      </Section>
      <Section title="Google preview">
        <div className="rounded-lg border border-slate-200 p-4 font-[arial]">
          <div className="text-xs text-slate-600">msmunify.com › college › {inst.slug}</div>
          <div className="mt-1 truncate text-lg text-[#1a0dab]">{seo.title || inst.name}</div>
          <div className="mt-0.5 line-clamp-2 text-sm text-slate-600">{seo.description || 'No description — Google will pick text from the page.'}</div>
        </div>
      </Section>
    </div>
  );
}
