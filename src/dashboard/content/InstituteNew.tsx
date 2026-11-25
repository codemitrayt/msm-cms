import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../../store';
import { Button, Card, ChipSelect, Field, Input, PageHeader, Select } from '../../ui';
import { slugify } from '../../lib/format';
import type { Institute } from '../../data/types';
import { OWNERSHIPS, TYPES, opts } from './common';
import { useCan } from '../Layout';

export function InstituteNew() {
  const db = useStore((s) => s.db);
  const add = useStore((s) => s.add);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const admin = useStore((s) => s.admin);
  const can = useCan();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', shortName: '', slug: '', slugTouched: false, type: 'college' as Institute['type'], ownership: 'private' as Institute['ownership'], establishedYear: 2000, stateId: '', cityId: '', streamIds: [] as number[], email: '', phone: '', website: '' });
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  if (!can('institutes.create')) return <p className="text-sm text-slate-500">You do not have permission to create institutions.</p>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.shortName.trim()) return toast('Name and short name are required', 'error');
    if (!f.cityId) return toast('Pick a city', 'error');
    const slug = f.slug || slugify(f.shortName);
    if (db.institutes.some((i) => i.slug === slug)) return toast(`Slug "${slug}" already exists`, 'error');
    const now = new Date().toISOString();
    const inst = add('institutes', {
      name: f.name.trim(), shortName: f.shortName.trim(), slug, type: f.type, ownership: f.ownership, status: 'draft', establishedYear: f.establishedYear,
      isAutonomous: false, isPartner: false, onlineCourses: false, authorityIds: [1], accreditation: '', email: f.email, phone: f.phone, website: f.website,
      stateId: Number(f.stateId), cityId: Number(f.cityId), campusAddress: '', pincode: '', latitude: 20, longitude: 78, campusSize: '',
      streamIds: f.streamIds, amenityIds: [], rankings: [], rating: 0, reviewCount: 0, minFee: 0, maxFee: 0, avgPackageLpa: 0, highestPackageLpa: 0, placementPercent: 0,
      topRecruiterIds: [], brandColor: '#fa0000', logo: f.shortName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), cover: '', gallery: [],
      about: `<p>${f.name.trim()} is a ${f.ownership} ${f.type}.</p>`,
      sections: ['Admission', 'Scholarship', 'How to reach', 'Cut-off', 'Placement', 'Counsellor', 'Ranking', 'Fees'].map((t) => ({ key: slugify(t), title: `${f.shortName.trim()} ${t} 2026`, content: '' })),
      placementData: [], cutoffData: [], seo: { title: '', description: '', keywords: '' }, views: 0, authorId: 1, updatedAt: now, publishedAt: null, score: 10,
    } as Omit<Institute, 'id'>);
    log('created', inst.shortName, inst.id);
    toast(`Created ${inst.shortName} as draft${admin ? '' : ''}`);
    nav(`/admin/institutes/${inst.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => nav('/admin')} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 cursor-pointer"><ArrowLeft className="h-4 w-4" />Institutions</button>
      <PageHeader title="New institution" subtitle="Creates a draft. You can fill in the rest on the institution page." />
      <Card className="p-5">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Indian Institute of Technology Madras" /></Field>
          <Field label="Short name *"><Input value={f.shortName} onChange={(e) => set({ shortName: e.target.value, slug: f.slugTouched ? f.slug : slugify(e.target.value) })} placeholder="IIT Madras" /></Field>
          <Field label="Slug" hint={`URL: /college/${f.slug || '…'}`}><Input value={f.slug} onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })} /></Field>
          <Field label="Type"><Select value={f.type} onChange={(e) => set({ type: e.target.value as Institute['type'] })} options={opts(TYPES)} /></Field>
          <Field label="Ownership"><Select value={f.ownership} onChange={(e) => set({ ownership: e.target.value as Institute['ownership'] })} options={opts(OWNERSHIPS)} /></Field>
          <Field label="Established year"><Input type="number" value={f.establishedYear} onChange={(e) => set({ establishedYear: Number(e.target.value) })} /></Field>
          <div />
          <Field label="State"><Select value={f.stateId} onChange={(e) => set({ stateId: e.target.value, cityId: '' })} placeholder="Select state" options={db.states.map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label="City *"><Select value={f.cityId} disabled={!f.stateId} onChange={(e) => set({ cityId: e.target.value })} placeholder="Select city" options={db.cities.filter((c) => c.stateId === Number(f.stateId)).map((c) => ({ value: c.id, label: c.name }))} /></Field>
          <Field label="Streams" className="sm:col-span-2"><ChipSelect options={db.streams.map((s) => ({ value: s.id, label: s.name }))} value={f.streamIds} onChange={(v) => set({ streamIds: v })} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Website" className="sm:col-span-2"><Input value={f.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://" /></Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => nav('/admin')}>Cancel</Button>
            <Button type="submit">Create draft</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
