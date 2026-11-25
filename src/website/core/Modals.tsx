import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Phone } from 'lucide-react';
import { useStore, nowIso } from '../../store';
import { Button, Field, Input, Modal, Select } from '../../ui';
import { downloadBrochure, useWebUi } from './common';
import { inr } from '../../lib/format';

/** Phone + OTP login, then a details step for new students. */
export function AuthModal() {
  const open = useWebUi((s) => s.authOpen);
  const after = useWebUi((s) => s.afterAuth);
  const close = useWebUi((s) => s.closeAuth);
  const login = useStore((s) => s.loginStudent);
  const students = useStore((s) => s.db.students);
  const toast = useStore((s) => s.toast);
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  useEffect(() => { if (open) { setStep('phone'); setOtp(''); setName(''); setEmail(''); } }, [open]);

  const digits = phone.replace(/\D/g, '');
  const existing = students.find((s) => s.phone.replace(/\D/g, '').endsWith(digits.slice(-10)));
  const finish = () => { close(); after?.(); };

  return (
    <Modal open={open} onClose={close} title={step === 'details' ? 'Tell us about you' : 'Login / Sign up'} size="sm">
      {step === 'phone' && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (digits.length !== 10) return toast('Enter a valid 10-digit mobile number', 'error'); setStep('otp'); toast('OTP sent (demo OTP: 1234)', 'info'); }}>
          <p className="text-sm text-slate-500">Get personalised college recommendations, save bookmarks and track your applications.</p>
          <Field label="Mobile number">
            <div className="flex gap-2">
              <span className="flex h-9 items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm">+91</span>
              <Input autoFocus value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" inputMode="numeric" />
            </div>
          </Field>
          <Button className="w-full" type="submit"><Phone className="h-4 w-4" /> Send OTP</Button>
          <p className="text-center text-[11px] text-slate-400">By continuing you agree to our Terms and Privacy Policy.</p>
        </form>
      )}
      {step === 'otp' && (
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          if (!/^\d{4}$/.test(otp)) return toast('Enter the 4-digit OTP', 'error');
          if (existing) { login({ phone: `+91 ${digits}` }); toast(`Welcome back, ${existing.name.split(' ')[0]}!`); finish(); }
          else setStep('details');
        }}>
          <p className="text-sm text-slate-500">Enter the OTP sent to +91 {digits}. <button type="button" className="text-brand cursor-pointer" onClick={() => setStep('phone')}>Change</button></p>
          <Input autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className="text-center text-lg tracking-[0.6em]" inputMode="numeric" />
          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Demo: any 4 digits work, e.g. <b>1234</b>.</div>
          <Button className="w-full" type="submit">Verify</Button>
        </form>
      )}
      {step === 'details' && (
        <form className="space-y-3" onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return toast('Enter your name', 'error');
          login({ name: name.trim(), email: email.trim(), phone: `+91 ${digits}` });
          toast('Account created — welcome to MSM Unify!');
          finish();
        }}>
          <Field label="Full name"><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email (optional)"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Button className="w-full" type="submit">Create account</Button>
        </form>
      )}
    </Modal>
  );
}

const titles: Record<string, string> = {
  'apply-now': 'Apply Now', brochure: 'Download Brochure', 'talk-to-counsellor': 'Talk to a Counsellor', contact: 'Contact us', predictor: 'Get your prediction', compare: 'Compare colleges', signup: 'Sign up',
};

/** Lead capture for Apply Now / Brochure / Counsellor. Creates a Lead. */
export function LeadModal() {
  const intent = useWebUi((s) => s.lead);
  const close = useWebUi((s) => s.closeLead);
  const student = useStore((s) => s.student);
  const db = useStore((s) => s.db);
  const crm = useStore((s) => s.config.crmPushEnabled);
  const add = useStore((s) => s.add);
  const toast = useStore((s) => s.toast);
  const updateStudent = useStore((s) => s.updateStudent);
  const loc = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', cityId: '', course: '' });
  const [done, setDone] = useState(false);
  const inst = db.institutes.find((n) => n.id === intent?.instituteId);
  useEffect(() => {
    if (!intent) return;
    setDone(false);
    setForm({ name: student?.name ?? '', email: student?.email ?? '', phone: student?.phone.replace(/\D/g, '').slice(-10) ?? '', cityId: String(student?.cityId ?? ''), course: intent.courseInterest ?? '' });
  }, [intent, student]);
  if (!intent) return null;
  const courseOpts = inst ? [...new Set(db.courses.filter((c) => c.instituteId === inst.id).map((c) => db.baseCourses.find((b) => b.id === c.baseCourseId)?.shortName ?? ''))] : db.baseCourses.map((b) => b.shortName);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = form.phone.replace(/\D/g, '');
    if (!form.name.trim()) return toast('Enter your name', 'error');
    if (digits.length !== 10) return toast('Enter a valid 10-digit mobile number', 'error');
    const city = db.cities.find((c) => c.id === Number(form.cityId));
    add('leads', {
      name: form.name.trim(), email: form.email.trim(), phone: `+91 ${digits}`, stateId: city?.stateId ?? null, cityId: city?.id ?? null,
      courseInterest: form.course, instituteId: inst?.id ?? null, source: intent.source, page: loc.pathname, status: 'new', pushedToCrm: crm, notes: '', createdAt: nowIso(),
    });
    if (student) updateStudent({ activity: [{ at: nowIso(), action: titles[intent.source] ?? 'Enquiry', target: inst?.shortName ?? 'MSM Unify' }, ...student.activity] });
    if (intent.source === 'brochure' && inst) {
      const cs = db.courses.filter((c) => c.instituteId === inst.id && c.status === 'published');
      downloadBrochure(inst, ['COURSES & FEES', ...cs.map((c) => `- ${c.name}: ${inr(c.fees)} total (${c.durationValue} ${c.durationUnit})`), '', `Average package: ₹${inst.avgPackageLpa} LPA`, `Highest package: ₹${inst.highestPackageLpa} LPA`]);
    }
    setDone(true);
    toast(intent.source === 'brochure' ? 'Brochure downloaded' : 'Thanks! Our counsellor will call you shortly.');
  };

  return (
    <Modal open onClose={close} title={intent.title ?? titles[intent.source] ?? 'Enquire'} size="sm">
      {done ? (
        <div className="space-y-3 py-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <div className="font-semibold">{intent.source === 'brochure' ? 'Your brochure is downloading' : 'Request received'}</div>
          <p className="text-sm text-slate-500">An MSM Unify counsellor will reach out on +91 {form.phone} within 24 hours.</p>
          <Button onClick={close}>Done</Button>
        </div>
      ) : (
        <form className="space-y-3" onSubmit={submit}>
          {inst && <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="text-slate-500">College:</span> <b>{inst.name}</b></div>}
          <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputMode="numeric" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City"><Select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} placeholder="Select city" options={db.cities.map((c) => ({ value: c.id, label: c.name }))} /></Field>
            <Field label="Course interested"><Select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Select course" options={courseOpts.filter(Boolean).map((c) => ({ value: c, label: c }))} /></Field>
          </div>
          <Button className="w-full" type="submit" variant={intent.source === 'apply-now' ? 'blue' : 'primary'}>{intent.source === 'brochure' ? 'Download Brochure' : 'Submit'}</Button>
          <p className="text-center text-[11px] text-slate-400">Free counselling · No spam</p>
        </form>
      )}
    </Modal>
  );
}
