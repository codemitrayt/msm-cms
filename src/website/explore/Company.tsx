import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, Clock, ExternalLink, GraduationCap, HeartHandshake, Mail, MapPin, Phone, Target, Users } from 'lucide-react';
import { useCol, useStore } from '../../store';
import { Badge, Button, Card, Empty, Field, Html, Input, Logo, Modal, Select, Textarea, cx } from '../../ui';
import { ago, date, num } from '../../lib/format';
import type { Career } from '../../data/types';
import { Crumbs, Page, useCreateLead, validPhone } from './shared';

function Hero({ title, subtitle, crumb }: { title: string; subtitle?: string; crumb: string }) {
  return (
    <div className="bg-gradient-to-r from-brand-dark to-slate-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 [&_nav]:text-slate-300 [&_nav_span]:text-slate-200">
        <Crumbs items={[{ label: 'Home', to: '/' }, { label: crumb }]} />
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-300">{subtitle}</p>}
      </div>
    </div>
  );
}

export function AboutPage() {
  const config = useStore((s) => s.config);
  const press = useCol('pressReleases').filter((p) => p.status === 'published').slice(0, 6);
  return (
    <div>
      <Hero crumb="About us" title={`About ${config.siteName}`} subtitle="We help students discover the right college, course and career — with honest information and free expert counselling." />
      <Page>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {config.stats.map((s) => (
            <Card key={s.label} className="p-5 text-center"><div className="text-3xl font-bold text-brand">{num(s.value)}{s.suffix}</div><div className="mt-1 text-sm text-slate-600">{s.label}</div></Card>
          ))}
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Our mission</h2>
            <p className="mt-3 leading-7 text-slate-600">Every year millions of students make one of the most important decisions of their lives with incomplete information. {config.siteName} brings verified data on colleges, courses, fees, cut-offs and placements into one place, and pairs it with counsellors who actually listen.</p>
            <p className="mt-3 leading-7 text-slate-600">We work with hundreds of partner institutions across India and abroad, but our recommendations are always student-first.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ icon: Target, t: 'Student first', d: 'Advice based on your goals, not commissions.' }, { icon: GraduationCap, t: 'Verified data', d: 'Fees, cut-offs and placements from official sources.' }, { icon: HeartHandshake, t: 'Free counselling', d: 'Talk to an expert at no cost.' }, { icon: Building2, t: '450+ partners', d: 'Direct relationships with top institutions.' }].map((v) => (
              <Card key={v.t} className="p-4"><v.icon className="h-5 w-5 text-brand" /><div className="mt-2 font-semibold">{v.t}</div><div className="text-xs text-slate-500">{v.d}</div></Card>
            ))}
          </div>
        </div>
        {press.length > 0 && (
          <div className="mt-12">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">In the news</h2><Link to="/press" className="text-sm font-medium text-brand">All press</Link></div>
            <div className="flex flex-wrap gap-3">{press.map((p) => <Badge key={p.id} className="px-3 py-1.5 text-sm normal-case">{p.publication}</Badge>)}</div>
          </div>
        )}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand p-8 text-white md:flex-row md:items-center">
          <div><div className="text-2xl font-bold">Join our team</div><div className="text-white/80">We're hiring across content, counselling and engineering.</div></div>
          <Link to="/careers"><Button variant="secondary" size="lg">View open roles</Button></Link>
        </div>
      </Page>
    </div>
  );
}

export function ContactPage() {
  const config = useStore((s) => s.config);
  const states = useCol('states');
  const toast = useStore((s) => s.toast);
  const createLead = useCreateLead();
  const [f, setF] = useState({ name: '', email: '', phone: '', stateId: '', topic: 'Admission guidance', message: '' });
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return toast('Please enter your name', 'error');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast('Enter a valid email', 'error');
    if (!validPhone(f.phone)) return toast('Enter a valid 10-digit mobile number', 'error');
    if (!f.message.trim()) return toast('Please write a message', 'error');
    createLead({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), stateId: f.stateId ? Number(f.stateId) : null, source: 'contact', notes: `[${f.topic}] ${f.message.trim()}` });
    toast('Thanks! Our team will get back to you within 24 hours.');
    setSent(true);
  };
  return (
    <div>
      <Hero crumb="Contact" title="Contact us" subtitle="Questions about admissions, partnerships or anything else? We're here to help." />
      <Page>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="p-6">
            {sent ? (
              <div className="py-10 text-center">
                <div className="text-xl font-semibold">Message sent ✓</div>
                <p className="mt-1 text-slate-500">We'll reach out on {f.phone} or {f.email}.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSent(false); setF({ ...f, message: '' }); }}>Send another</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><Input value={f.name} onChange={set('name')} /></Field>
                <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
                <Field label="Mobile"><Input value={f.phone} onChange={set('phone')} inputMode="tel" /></Field>
                <Field label="State"><Select value={f.stateId} onChange={set('stateId')} placeholder="Select state" options={states.map((s) => ({ value: s.id, label: s.name }))} /></Field>
                <Field label="Topic" className="sm:col-span-2"><Select value={f.topic} onChange={set('topic')} options={['Admission guidance', 'Partnership / institutions', 'Advertising', 'Report incorrect information', 'Other'].map((t) => ({ value: t, label: t }))} /></Field>
                <Field label="Message" className="sm:col-span-2"><Textarea value={f.message} onChange={set('message')} rows={5} /></Field>
                <div className="sm:col-span-2"><Button type="submit" size="lg">Send message</Button></div>
              </form>
            )}
          </Card>
          <div className="space-y-3">
            {[{ icon: Phone, t: 'Call us', d: config.supportPhone, href: `tel:${config.supportPhone}` }, { icon: Mail, t: 'Email', d: config.supportEmail, href: `mailto:${config.supportEmail}` }, { icon: MapPin, t: 'Office', d: 'Sector 62, Noida, Uttar Pradesh 201309' }, { icon: Clock, t: 'Hours', d: 'Mon–Sat, 9:30 AM – 7 PM' }].map((c) => (
              <Card key={c.t} className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-brand-soft p-2 text-brand"><c.icon className="h-4 w-4" /></div>
                <div><div className="text-sm font-semibold">{c.t}</div>{c.href ? <a href={c.href} className="text-sm text-slate-600 hover:text-brand">{c.d}</a> : <div className="text-sm text-slate-600">{c.d}</div>}</div>
              </Card>
            ))}
          </div>
        </div>
      </Page>
    </div>
  );
}

const legal = (site: string, kind: 'privacy' | 'terms') =>
  kind === 'privacy'
    ? `<p>This Privacy Policy explains how ${site} collects, uses and protects your information when you use our website and services.</p><h2>Information we collect</h2><ul><li>Contact details you share (name, phone, email)</li><li>Academic preferences such as course, stream and city</li><li>Usage data like pages visited and colleges bookmarked</li></ul><h2>How we use it</h2><ul><li>To provide counselling and respond to enquiries</li><li>To share relevant admission updates (you can opt out anytime)</li><li>To improve our recommendations and website</li></ul><h2>Sharing</h2><p>We share your details with partner institutions only when you ask us to (for example when you click Apply Now or request a brochure).</p><h2>Your rights</h2><p>You can request access, correction or deletion of your data by writing to our support team.</p><h2>Contact</h2><p>For privacy questions, use the <a href="#/contact">contact page</a>.</p>`
    : `<p>By using ${site} you agree to these Terms & Conditions.</p><h2>Use of the website</h2><p>Content is provided for general information. While we try to keep it accurate, fees, dates and cut-offs can change — always verify with the institution or exam authority.</p><h2>Accounts</h2><p>You are responsible for keeping your login secure. We may suspend accounts that misuse the service.</p><h2>Counselling services</h2><p>Counselling is free and advisory. Admission decisions are made solely by institutions.</p><h2>Intellectual property</h2><p>All content, logos and design belong to ${site} or its licensors.</p><h2>Limitation of liability</h2><p>${site} is not liable for decisions made based on information on this website.</p><h2>Changes</h2><p>We may update these terms from time to time. Continued use means you accept the updated terms.</p>`;

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const site = useStore((s) => s.config.siteName);
  const title = kind === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';
  return (
    <Page className="max-w-3xl">
      <Crumbs items={[{ label: 'Home', to: '/' }, { label: title }]} />
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="mt-1 text-sm text-slate-500">Last updated: 1 November 2026</div>
      <Html html={legal(site, kind)} className="mt-6" />
    </Page>
  );
}
export const PrivacyPage = () => <LegalPage kind="privacy" />;
export const TermsPage = () => <LegalPage kind="terms" />;

export function CareersPage() {
  const careers = useCol('careers');
  const [dept, setDept] = useState('');
  const [open, setOpen] = useState<Career | null>(null);
  const [apply, setApply] = useState(false);
  const openRoles = careers.filter((c) => c.status === 'open' && (!dept || c.department === dept));
  const depts = [...new Set(careers.filter((c) => c.status === 'open').map((c) => c.department))];
  return (
    <div>
      <Hero crumb="Careers" title="Careers at MSM Unify" subtitle="Help millions of students make better decisions. Join a fast-growing team." />
      <Page>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600"><b>{openRoles.length}</b> open positions</div>
          <div className="flex flex-wrap gap-1.5">
            {['', ...depts].map((d) => (
              <button key={d || 'all'} onClick={() => setDept(d)} className={cx('rounded-full border px-3 py-1 text-xs font-medium cursor-pointer', dept === d ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-600')}>{d || 'All'}</button>
            ))}
          </div>
        </div>
        {openRoles.length ? (
          <div className="space-y-3">
            {openRoles.map((c) => (
              <Card key={c.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <button onClick={() => { setOpen(c); setApply(false); }} className="text-left font-semibold hover:text-brand cursor-pointer">{c.title}</button>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{c.department}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{c.experience}</span>
                    <span>Posted {ago(c.postedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{c.type}</Badge>
                  <Button variant="outline" size="sm" onClick={() => { setOpen(c); setApply(false); }}>View</Button>
                  <Button size="sm" onClick={() => { setOpen(c); setApply(true); }}>Apply</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : <Card><Empty text="No open positions right now — check back soon." /></Card>}
      </Page>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} size="lg">
        {open && (apply ? <ApplyForm career={open} onDone={() => setOpen(null)} /> : (
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-xs"><Badge>{open.type}</Badge><Badge>{open.department}</Badge><Badge>{open.location}</Badge><Badge>{open.experience}</Badge></div>
            <Html html={open.description} />
            <div className="mt-2 text-xs text-slate-500">Posted {date(open.postedAt)}</div>
            <Button className="mt-4" onClick={() => setApply(true)}>Apply for this role</Button>
          </div>
        ))}
      </Modal>
    </div>
  );
}

function ApplyForm({ career, onDone }: { career: Career; onDone: () => void }) {
  const update = useStore((s) => s.update);
  const toast = useStore((s) => s.toast);
  const student = useStore((s) => s.student);
  const [f, setF] = useState({ name: student?.name ?? '', email: student?.email ?? '', phone: student?.phone ?? '', note: '' });
  const [file, setFile] = useState<File | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return toast('Enter your name', 'error');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast('Enter a valid email', 'error');
    if (!validPhone(f.phone)) return toast('Enter a valid 10-digit mobile number', 'error');
    if (!file) return toast('Please attach your resume', 'error');
    if (file.size > 5 * 1024 * 1024) return toast('Resume must be under 5 MB', 'error');
    const cur = useStore.getState().db.careers.find((c) => c.id === career.id);
    update('careers', career.id, { applicants: (cur?.applicants ?? career.applicants) + 1 });
    toast(`Application for ${career.title} submitted!`);
    onDone();
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Email"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Mobile"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <Field label="Resume (PDF/DOC, max 5 MB)"><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="pt-1.5" /></Field>
      <Field label="Why do you want to join? (optional)" className="sm:col-span-2"><Textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <div className="sm:col-span-2"><Button type="submit">Submit application</Button></div>
    </form>
  );
}

export function PressPage() {
  const press = useCol('pressReleases').filter((p) => p.status === 'published').sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div>
      <Hero crumb="Press" title="MSM Unify in the news" subtitle="Press coverage and announcements." />
      <Page>
        {press.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {press.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="group">
                <Card className="flex h-full flex-col p-5 transition group-hover:shadow-md">
                  <div className="flex items-center gap-3"><Logo text={p.logo} color="#16181d" size={40} /><div className="text-sm font-semibold">{p.publication}</div></div>
                  <div className="mt-3 flex-1 font-medium leading-snug group-hover:text-brand">{p.title}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">{date(p.date)}<ExternalLink className="h-3.5 w-3.5" /></div>
                </Card>
              </a>
            ))}
          </div>
        ) : <Card><Empty text="No press coverage yet" /></Card>}
      </Page>
    </div>
  );
}
