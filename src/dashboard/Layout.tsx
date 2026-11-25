import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, BookOpen, Briefcase, Building2, CalendarDays, ClipboardList, CloudUpload, FileText, Globe, GraduationCap, Handshake, ImageIcon, Inbox,
  Link2, ListOrdered, LogOut, Megaphone, Menu, MessageSquareText, Newspaper, PenLine, Plug, ShieldCheck, SlidersHorizontal, Tags, UsersRound, LayoutGrid,
} from 'lucide-react';
import { useStore } from '../store';
import { Button, Card, Field, Input, cx } from '../ui';

export const NAV: { label: string; items: { to: string; label: string; icon: typeof Building2; perm: string; end?: boolean }[] }[] = [
  { label: 'Overview', items: [{ to: '/admin/overview', label: 'Overview', icon: LayoutGrid, perm: 'institutes' }] },
  {
    label: 'Content',
    items: [
      { to: '/admin', label: 'Institutions', icon: Building2, perm: 'institutes', end: true },
      { to: '/admin/courses', label: 'Courses', icon: BookOpen, perm: 'courses' },
      { to: '/admin/base-courses', label: 'Base courses', icon: GraduationCap, perm: 'base_courses' },
      { to: '/admin/exams', label: 'Exams', icon: ClipboardList, perm: 'exams' },
      { to: '/admin/articles', label: 'Blog', icon: FileText, perm: 'articles' },
      { to: '/admin/landing-pages', label: 'Ranking & category', icon: ListOrdered, perm: 'landing_pages' },
      { to: '/admin/exam-listings', label: 'Exam listings', icon: ClipboardList, perm: 'exam_listings' },
      { to: '/admin/events', label: 'Events', icon: CalendarDays, perm: 'events' },
      { to: '/admin/updates', label: 'Updates', icon: Megaphone, perm: 'updates' },
      { to: '/admin/uploads', label: 'Uploads', icon: CloudUpload, perm: 'uploads' },
      { to: '/admin/partner-institutes', label: 'Partner institutes', icon: Handshake, perm: 'partner_institutes' },
      { to: '/admin/press-releases', label: 'Press Releases', icon: Newspaper, perm: 'press_releases' },
      { to: '/admin/careers', label: 'Careers', icon: Briefcase, perm: 'careers' },
    ],
  },
  {
    label: 'Enquiries',
    items: [
      { to: '/admin/leads', label: 'Student Leads', icon: Inbox, perm: 'leads' },
      { to: '/admin/students', label: 'Student Activity', icon: Activity, perm: 'students' },
    ],
  },
  {
    label: 'Shared library',
    items: [
      { to: '/admin/faqs', label: 'FAQs', icon: MessageSquareText, perm: 'faqs' },
      { to: '/admin/tags', label: 'Tags', icon: Tags, perm: 'tags' },
      { to: '/admin/authors', label: 'Authors', icon: PenLine, perm: 'authors' },
      { to: '/admin/media', label: 'Media Library', icon: ImageIcon, perm: 'media' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/users', label: 'Users', icon: UsersRound, perm: 'users' },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles' },
      { to: '/admin/config', label: 'Configuration', icon: SlidersHorizontal, perm: 'config' },
      { to: '/admin/seo-templates', label: 'SEO Templates', icon: Globe, perm: 'seo' },
      { to: '/admin/link-status', label: 'Link status', icon: Link2, perm: 'link_status' },
      { to: '/admin/mcp-access', label: 'MCP access', icon: Plug, perm: 'mcp' },
    ],
  },
];

/** Permission check for the logged-in admin. perm like "articles" or "articles.publish". */
export function useCan() {
  const admin = useStore((s) => s.admin);
  const roles = useStore((s) => s.db.roles);
  // Read the live user row so a role change applies without re-login.
  const live = useStore((s) => s.db.users.find((u) => u.id === admin?.id));
  const role = roles.find((r) => r.id === (live ?? admin)?.roleId);
  return (perm: string) => {
    if (!role) return false;
    const [mod, act] = perm.split('.');
    return role.permissions.some((p) => p === '*' || p === `${mod}.*` || p === perm || (!act && p.startsWith(`${mod}.`)) || (act && p === `${mod}.${act}`));
  };
}

function Login() {
  const users = useStore((s) => s.db.users);
  const roles = useStore((s) => s.db.roles);
  const login = useStore((s) => s.loginAdmin);
  const toast = useStore((s) => s.toast);
  const [email, setEmail] = useState('admin@msmunify.com');
  const [pw, setPw] = useState('demo1234');
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold text-white">M</div>
          <div><div className="font-semibold">MSM Unify CMS</div><div className="text-xs text-slate-500">Sign in to the admin dashboard</div></div>
        </div>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!pw) return toast('Enter password', 'error'); if (!login(email)) toast('No active user with that email', 'error'); }}>
          <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <Button className="w-full" type="submit">Sign in</Button>
        </form>
        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <div className="mb-1.5 font-medium text-slate-700">Demo accounts (any password) — try different roles:</div>
          {users.filter((u) => u.status !== 'disabled').map((u) => (
            <button key={u.id} onClick={() => setEmail(u.email)} className="flex w-full justify-between rounded px-1.5 py-1 text-left hover:bg-white cursor-pointer">
              <span>{u.email}</span><span className="text-slate-400">{roles.find((r) => r.id === u.roleId)?.name}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function DashboardLayout() {
  const admin = useStore((s) => s.admin);
  const logout = useStore((s) => s.logoutAdmin);
  const roles = useStore((s) => s.db.roles);
  const can = useCan();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  if (!admin) return <Login />;
  const role = roles.find((r) => r.id === admin.roleId);
  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">M</div>
        <div className="leading-tight"><div className="text-sm font-semibold">MSM Unify</div><div className="text-[11px] text-slate-500">Content Management</div></div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-24">
        {NAV.map((g) => {
          const items = g.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.label}>
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.label}</div>
              {items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setOpen(false)}
                  className={({ isActive }) => {
                    // Institutions (/admin) is also active on /admin/institutes/*.
                    const act = isActive || (i.to === '/admin' && loc.pathname.startsWith('/admin/institutes'));
                    return cx('flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition', act ? 'bg-brand-soft font-medium text-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900');
                  }}>
                  <i.icon className="h-4 w-4" />{i.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>
    </nav>
  );
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-64 bg-white" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
          <button className="rounded-md p-1.5 hover:bg-slate-100 lg:hidden cursor-pointer" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="hidden text-xs text-slate-400 lg:block">Prototype — dummy data, saved in this browser</div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">{admin.name}</div>
              <div className="text-[11px] text-slate-500">{role?.name}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { logout(); nav('/admin'); }} title="Sign out"><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 pb-24 md:p-6 md:pb-24"><Outlet /></main>
      </div>
    </div>
  );
}

/** Wrap a page/button that needs a permission. */
export function Gate({ perm, children, fallback = null }: { perm: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  const can = useCan();
  return <>{can(perm) ? children : fallback}</>;
}
