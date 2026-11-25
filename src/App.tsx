import { useEffect, useRef } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Globe, LayoutDashboard, RotateCcw } from 'lucide-react';
import { Toasts, cx, useConfirm } from './ui';
import { useStore } from './store';
import { WebsiteLayout } from './website/core/Layout';
import { websiteRoutes } from './website/routes';
import { DashboardLayout } from './dashboard/Layout';
import { dashboardRoutes } from './dashboard/routes';
import { NotFound } from './website/core/NotFound';

/** Floating Website ⇄ Dashboard switch. Remembers the last page of each side. */
function ModeToggle() {
  const loc = useLocation();
  const nav = useNavigate();
  const isAdmin = loc.pathname.startsWith('/admin');
  const last = useRef<{ web: string; admin: string }>({ web: '/', admin: '/admin' });
  const reset = useStore((s) => s.resetDemo);
  const toast = useStore((s) => s.toast);
  const { confirm, node } = useConfirm();
  useEffect(() => {
    last.current[isAdmin ? 'admin' : 'web'] = loc.pathname + loc.search;
    window.scrollTo(0, 0);
  }, [loc.pathname, loc.search, isAdmin]);
  const go = (admin: boolean) => nav(admin ? last.current.admin : last.current.web);
  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur">
        <button onClick={() => go(false)} className={cx('flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer', !isAdmin ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-100')}>
          <Globe className="h-4 w-4" /> Website
        </button>
        <button onClick={() => go(true)} className={cx('flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium cursor-pointer', isAdmin ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </button>
        <button title="Reset demo data" onClick={async () => { if (await confirm('Reset all dummy data to the original seed? Your changes will be lost.')) { reset(); toast('Demo data reset'); } }}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"><RotateCcw className="h-4 w-4" /></button>
      </div>
      {node}
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/admin/*" element={<DashboardLayout />}>
          {dashboardRoutes}
        </Route>
        <Route element={<WebsiteLayout />}>
          {websiteRoutes}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ModeToggle />
      <Toasts />
    </HashRouter>
  );
}
