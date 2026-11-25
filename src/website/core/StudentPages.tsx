import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, CheckCircle2, GitCompareArrows, Headphones, Plus, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useStore, nowIso } from '../../store';
import { Badge, Button, Card, Field, Input, Logo, Select, Stars, Textarea } from '../../ui';
import { ago, date, inr } from '../../lib/format';
import { CollegeCard } from './CollegeCard';
import { PLink, ownershipLabel, useInstitutes, useWebUi } from './common';

export function ComparePage() {
  const ids = useStore((s) => s.compare);
  const db = useStore((s) => s.db);
  const toggle = useStore((s) => s.toggleCompare);
  const clear = useStore((s) => s.clearCompare);
  const student = useStore((s) => s.student);
  const add = useStore((s) => s.add);
  const updateStudent = useStore((s) => s.updateStudent);
  const crm = useStore((s) => s.config.crmPushEnabled);
  const openLead = useWebUi((s) => s.openLead);
  const insts = useInstitutes();
  const [pick, setPick] = useState('');
  const list = ids.map((id) => db.institutes.find((n) => n.id === id)).filter((n) => !!n);
  const logged = useRef('');
  useEffect(() => {
    // Record a compare lead + activity once per distinct comparison, logged-in students only.
    const key = [...ids].sort().join(',');
    if (!student || ids.length < 2 || logged.current === key) return;
    logged.current = key;
    add('leads', { name: student.name, email: student.email, phone: student.phone, stateId: null, cityId: student.cityId, courseInterest: '', instituteId: ids[0], source: 'compare', page: '/compare', status: 'new', pushedToCrm: crm, notes: `Compared: ${list.map((n) => n.shortName).join(' vs ')}`, createdAt: nowIso() });
    updateStudent({ compared: [ids, ...student.compared].slice(0, 20), activity: [{ at: nowIso(), action: 'Compared colleges', target: list.map((n) => n.shortName).join(' vs ') }, ...student.activity] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(','), student?.id]);

  const rows: [string, (n: (typeof list)[number]) => React.ReactNode][] = [
    ['Location', (n) => `${db.cities.find((c) => c.id === n.cityId)?.name}, ${db.states.find((s) => s.id === n.stateId)?.name}`],
    ['Ownership', (n) => ownershipLabel(n.ownership)],
    ['Established', (n) => n.establishedYear],
    ['Accreditation', (n) => n.accreditation],
    ['Rating', (n) => <span className="flex items-center gap-1"><Stars value={n.rating} />{n.rating}</span>],
    ['Ranking', (n) => n.rankings.map((r) => `#${r.rank} ${db.rankingBodies.find((b) => b.id === r.bodyId)?.shortName}`).join(' · ')],
    ['MSM college score', (n) => <b className="text-brand">{n.score}/100</b>],
    ['Fees range', (n) => `${inr(n.minFee)} – ${inr(n.maxFee)}`],
    ['Average package', (n) => `₹${n.avgPackageLpa} LPA`],
    ['Highest package', (n) => `₹${n.highestPackageLpa} LPA`],
    ['Placement rate', (n) => `${n.placementPercent}%`],
    ['Courses offered', (n) => db.courses.filter((c) => c.instituteId === n.id && c.status === 'published').length],
    ['Campus size', (n) => n.campusSize],
    ['Streams', (n) => n.streamIds.map((id) => db.streams.find((s) => s.id === id)?.name).join(', ')],
    ['Amenities', (n) => <div className="flex flex-wrap gap-1">{n.amenityIds.map((id) => <span key={id} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">{db.amenities.find((a) => a.id === id)?.name}</span>)}</div>],
  ];
  const best = (vals: number[], high = true) => { const m = high ? Math.max(...vals) : Math.min(...vals); return vals.map((v) => v === m && vals.length > 1); };
  const highlight: Record<string, boolean[]> = list.length > 1 ? {
    Rating: best(list.map((n) => n.rating)), 'Average package': best(list.map((n) => n.avgPackageLpa)), 'Highest package': best(list.map((n) => n.highestPackageLpa)),
    'Placement rate': best(list.map((n) => n.placementPercent)), 'Fees range': best(list.map((n) => n.minFee), false), 'MSM college score': best(list.map((n) => n.score)),
  } : {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><GitCompareArrows className="h-6 w-6 text-brand" />Compare colleges</h1><p className="text-sm text-slate-500">Compare up to 4 colleges side by side. Best values are highlighted.</p></div>
        {list.length > 0 && <Button variant="ghost" onClick={clear}>Clear all</Button>}
      </div>
      {list.length < 4 && (
        <div className="mt-4 flex max-w-xl gap-2">
          <Select value={pick} onChange={(e) => setPick(e.target.value)} placeholder="Add a college to compare…" options={insts.filter((n) => !ids.includes(n.id)).map((n) => ({ value: n.id, label: n.name }))} />
          <Button disabled={!pick} onClick={() => { toggle(Number(pick)); setPick(''); }}><Plus className="h-4 w-4" />Add</Button>
        </div>
      )}
      {!list.length ? (
        <Card className="mt-6 p-10 text-center text-sm text-slate-500">No colleges selected. Use the “Compare” button on any college card, or add one above.</Card>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                <th className="w-44 bg-slate-50 p-3" />
                {list.map((n) => (
                  <th key={n.id} className="relative p-4 text-left align-top">
                    <button onClick={() => toggle(n.id)} className="absolute right-2 top-2 text-slate-400 hover:text-red-600 cursor-pointer"><X className="h-4 w-4" /></button>
                    <Logo text={n.logo} color={n.brandColor} size={44} />
                    <PLink to={`/college/${n.slug}`} className="mt-2 block font-semibold hover:text-brand">{n.name}</PLink>
                    <Button size="sm" variant="blue" className="mt-2" onClick={() => openLead({ source: 'apply-now', instituteId: n.id })}>Apply Now</Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(([label, fn]) => (
                <tr key={label}>
                  <td className="bg-slate-50 p-3 text-xs font-medium uppercase text-slate-500">{label}</td>
                  {list.map((n, i) => <td key={n.id} className={highlight[label]?.[i] ? 'bg-emerald-50 p-3 font-semibold text-emerald-800' : 'p-3'}>{fn(n)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!student && list.length > 1 && <p className="mt-3 text-xs text-slate-500">Log in to save your comparisons to your profile.</p>}
    </div>
  );
}

export function BookmarksPage() {
  const student = useStore((s) => s.student);
  const guest = useStore((s) => s.guestBookmarks);
  const insts = useStore((s) => s.db.institutes);
  const openAuth = useWebUi((s) => s.openAuth);
  const ids = student?.bookmarks ?? guest;
  const list = ids.map((id) => insts.find((n) => n.id === id)).filter((n) => !!n);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Bookmark className="h-6 w-6 text-brand" />Bookmarks</h1>
      <p className="text-sm text-slate-500">{list.length} saved colleges</p>
      {!student && <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-amber-50 p-4 text-sm"><span>You are browsing as a guest. Log in to keep bookmarks across devices.</span><Button size="sm" onClick={() => openAuth()}>Login / Sign up</Button></Card>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{list.map((n) => <CollegeCard key={n.id} inst={n} />)}</div>
      {!list.length && <Card className="mt-6 p-10 text-center text-sm text-slate-500">No bookmarks yet. Tap the bookmark icon on any college. <Link to="/colleges/all" className="text-brand">Browse colleges →</Link></Card>}
    </div>
  );
}

export function ProfilePage() {
  const student = useStore((s) => s.student);
  const db = useStore((s) => s.db);
  const updateStudent = useStore((s) => s.updateStudent);
  const toast = useStore((s) => s.toast);
  const openAuth = useWebUi((s) => s.openAuth);
  const [f, setF] = useState({ name: '', email: '', qualification: '', preferredStreamId: '', cityId: '' });
  useEffect(() => { if (student) setF({ name: student.name, email: student.email, qualification: student.qualification, preferredStreamId: String(student.preferredStreamId ?? ''), cityId: String(student.cityId ?? '') }); }, [student?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const applications = useMemo(() => (student ? db.leads.filter((l) => l.phone.replace(/\D/g, '').slice(-10) === student.phone.replace(/\D/g, '').slice(-10)) : []), [db.leads, student]);
  if (!student) return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Your profile</h1>
      <p className="mt-2 text-sm text-slate-500">Log in to see your profile, applications and activity.</p>
      <Button className="mt-4" onClick={() => openAuth()}>Login / Sign up</Button>
    </div>
  );
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Name is required', 'error');
    updateStudent({ name: f.name.trim(), email: f.email.trim(), qualification: f.qualification, preferredStreamId: f.preferredStreamId ? Number(f.preferredStreamId) : null, cityId: f.cityId ? Number(f.cityId) : null });
    toast('Profile updated');
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">{student.name[0]}</div>
        <div><h1 className="text-2xl font-bold">{student.name}</h1><div className="flex items-center gap-2 text-sm text-slate-500">{student.phone}{student.verified && <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-4 w-4" />Verified</span>} · Joined {date(student.createdAt)}</div></div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Personal details</h2>
          <form onSubmit={save} className="space-y-3">
            <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Qualification"><Select value={f.qualification} onChange={(e) => setF({ ...f, qualification: e.target.value })} placeholder="Select" options={['10th Pass', '12th Appearing', '12th Pass', 'Diploma', 'Graduate', 'Post Graduate'].map((q) => ({ value: q, label: q }))} /></Field>
              <Field label="City"><Select value={f.cityId} onChange={(e) => setF({ ...f, cityId: e.target.value })} placeholder="Select" options={db.cities.map((c) => ({ value: c.id, label: c.name }))} /></Field>
            </div>
            <Field label="Preferred stream"><Select value={f.preferredStreamId} onChange={(e) => setF({ ...f, preferredStreamId: e.target.value })} placeholder="Select" options={db.streams.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            <Button type="submit">Save changes</Button>
          </form>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">My applications & enquiries ({applications.length})</h2>
            <div className="divide-y divide-slate-100">
              {applications.map((l) => { const n = db.institutes.find((x) => x.id === l.instituteId); return (
                <div key={l.id} className="flex items-center gap-3 py-2 text-sm">
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{n?.name ?? 'General enquiry'}</div><div className="text-xs capitalize text-slate-500">{l.source.replace(/-/g, ' ')} · {l.courseInterest || '—'} · {ago(l.createdAt)}</div></div>
                  <Badge>{l.status}</Badge>
                </div>
              ); })}
              {!applications.length && <p className="py-3 text-sm text-slate-500">No applications yet.</p>}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Recent activity</h2>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {student.activity.map((a, i) => <div key={i} className="flex justify-between gap-3 text-sm"><span><span className="text-slate-500">{a.action}</span> <b>{a.target}</b></span><span className="shrink-0 text-xs text-slate-400">{ago(a.at)}</span></div>)}
            </div>
          </Card>
          <Card className="flex items-center justify-between p-5 text-sm"><span><b>{student.bookmarks.length}</b> bookmarked colleges</span><Link to="/bookmarks" className="font-medium text-brand">View →</Link></Card>
        </div>
      </div>
    </div>
  );
}

export function CounsellorPage() {
  const db = useStore((s) => s.db);
  const student = useStore((s) => s.student);
  const add = useStore((s) => s.add);
  const toast = useStore((s) => s.toast);
  const crm = useStore((s) => s.config.crmPushEnabled);
  const cfg = useStore((s) => s.config);
  const [f, setF] = useState({ name: student?.name ?? '', phone: student?.phone.replace(/\D/g, '').slice(-10) ?? '', email: student?.email ?? '', stateId: '', cityId: String(student?.cityId ?? ''), course: '', instituteId: '', qualification: student?.qualification ?? '', notes: '' });
  const [done, setDone] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Enter your name', 'error');
    if (f.phone.replace(/\D/g, '').length !== 10) return toast('Enter a valid 10-digit mobile number', 'error');
    if (!f.course) return toast('Select the course you are interested in', 'error');
    const city = db.cities.find((c) => c.id === Number(f.cityId));
    add('leads', { name: f.name.trim(), email: f.email.trim(), phone: `+91 ${f.phone}`, stateId: f.stateId ? Number(f.stateId) : city?.stateId ?? null, cityId: city?.id ?? null, courseInterest: f.course, instituteId: f.instituteId ? Number(f.instituteId) : null, source: 'talk-to-counsellor', page: '/talk-to-counsellor', status: 'new', pushedToCrm: crm, notes: [f.qualification && `Qualification: ${f.qualification}`, f.notes].filter(Boolean).join(' · '), createdAt: nowIso() });
    setDone(true);
    toast('Request received — a counsellor will call you soon');
  };
  return (
    <div className="bg-gradient-to-b from-brand-soft to-white pb-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand shadow-sm"><Sparkles className="h-3.5 w-3.5" />100% free</div>
          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Talk to an expert counsellor</h1>
          <p className="mt-3 text-lg text-slate-600">Get personalised guidance on colleges, courses, exams, fees and scholarships.</p>
          <ul className="mt-6 space-y-3">
            {['Shortlist colleges that match your score and budget', 'Understand fees, scholarships and education loans', 'Application and counselling support end-to-end', 'Unbiased advice from experienced counsellors'].map((t) => <li key={t} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />{t}</li>)}
          </ul>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"><Headphones className="h-8 w-8 text-brand" /><div><div className="text-sm text-slate-500">Prefer calling?</div><a href={`tel:${cfg.supportPhone}`} className="text-lg font-bold">{cfg.supportPhone}</a></div></div>
        </div>
        <Card className="p-6 shadow-lg">
          {done ? (
            <div className="space-y-3 py-10 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
              <h2 className="text-xl font-bold">Thank you, {f.name.split(' ')[0]}!</h2>
              <p className="text-sm text-slate-500">Our counsellor will call you on +91 {f.phone} within 24 hours.</p>
              <Button variant="outline" onClick={() => { setDone(false); setF({ ...f, notes: '' }); }}>Submit another request</Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={submit}>
              <h2 className="text-lg font-bold">Book a free session</h2>
              <Field label="Full name *"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mobile *"><Input value={f.phone} inputMode="numeric" onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></Field>
                <Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State"><Select value={f.stateId} onChange={(e) => setF({ ...f, stateId: e.target.value, cityId: '' })} placeholder="Select" options={db.states.map((s) => ({ value: s.id, label: s.name }))} /></Field>
                <Field label="City"><Select value={f.cityId} onChange={(e) => setF({ ...f, cityId: e.target.value })} placeholder="Select" options={db.cities.filter((c) => !f.stateId || c.stateId === Number(f.stateId)).map((c) => ({ value: c.id, label: c.name }))} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Course interested *"><Select value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })} placeholder="Select" options={db.baseCourses.map((b) => ({ value: b.shortName, label: b.shortName }))} /></Field>
                <Field label="Qualification"><Select value={f.qualification} onChange={(e) => setF({ ...f, qualification: e.target.value })} placeholder="Select" options={['12th Appearing', '12th Pass', 'Diploma', 'Graduate', 'Post Graduate'].map((q) => ({ value: q, label: q }))} /></Field>
              </div>
              <Field label="Preferred college (optional)"><Select value={f.instituteId} onChange={(e) => setF({ ...f, instituteId: e.target.value })} placeholder="Any" options={db.institutes.filter((n) => n.status === 'published').map((n) => ({ value: n.id, label: n.name }))} /></Field>
              <Field label="Anything else?"><Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="min-h-16" /></Field>
              <Button type="submit" size="lg" className="w-full">Request a call back</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
