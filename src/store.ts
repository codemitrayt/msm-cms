// Single in-browser "backend". Everything is kept in a zustand store that is
// persisted to localStorage, so changes made in the Dashboard show up on the
// Website immediately (and survive reloads). "Reset demo data" restores seed.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeed, defaultConfig } from './data/seed';
import type { CollectionKey, DB, Id, SiteConfig, Student, AdminUser } from './data/types';

type Item<K extends CollectionKey> = DB[K][number];

export interface Toast { id: number; message: string; tone: 'success' | 'error' | 'info' }

interface State {
  db: DB;
  config: SiteConfig;
  /** Logged-in admin (dashboard). null = show login screen. */
  admin: AdminUser | null;
  /** Logged-in student (website). */
  student: Student | null;
  /** Website compare tray (institute ids, max 4). */
  compare: Id[];
  /** Guest bookmarks when no student is logged in. */
  guestBookmarks: Id[];
  toasts: Toast[];

  add: <K extends CollectionKey>(key: K, item: Omit<Item<K>, 'id'> & { id?: Id }) => Item<K>;
  update: <K extends CollectionKey>(key: K, id: Id, patch: Partial<Item<K>>) => void;
  remove: <K extends CollectionKey>(key: K, id: Id | Id[]) => void;
  setCollection: <K extends CollectionKey>(key: K, items: DB[K]) => void;
  setConfig: (patch: Partial<SiteConfig>) => void;
  log: (action: string, entity: string, entityId?: Id | null) => void;

  loginAdmin: (email: string) => boolean;
  logoutAdmin: () => void;
  loginStudent: (data: { name?: string; phone: string; email?: string }) => Student;
  logoutStudent: () => void;
  updateStudent: (patch: Partial<Student>) => void;
  toggleBookmark: (instituteId: Id) => void;
  isBookmarked: (instituteId: Id) => boolean;
  toggleCompare: (instituteId: Id) => void;
  clearCompare: () => void;

  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
  resetDemo: () => void;
}

const nextId = (items: { id: Id }[]) => items.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const now = () => new Date().toISOString();

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      db: buildSeed(),
      config: structuredClone(defaultConfig),
      admin: null,
      student: null,
      compare: [],
      guestBookmarks: [],
      toasts: [],

      add: (key, item) => {
        const list = get().db[key] as { id: Id }[];
        const created = { ...item, id: item.id ?? nextId(list) } as Item<typeof key>;
        set((st) => ({ db: { ...st.db, [key]: [created, ...(st.db[key] as unknown[])] } }));
        return created;
      },
      update: (key, id, patch) =>
        set((st) => ({ db: { ...st.db, [key]: (st.db[key] as { id: Id }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) } })),
      remove: (key, id) => {
        const ids = new Set(Array.isArray(id) ? id : [id]);
        set((st) => ({ db: { ...st.db, [key]: (st.db[key] as { id: Id }[]).filter((x) => !ids.has(x.id)) } }));
      },
      setCollection: (key, items) => set((st) => ({ db: { ...st.db, [key]: items } })),
      setConfig: (patch) => set((st) => ({ config: { ...st.config, ...patch } })),
      log: (action, entity, entityId = null) => {
        const user = get().admin?.name ?? 'System';
        set((st) => ({ db: { ...st.db, activity: [{ id: nextId(st.db.activity), at: now(), user, action, entity, entityId }, ...st.db.activity].slice(0, 300) } }));
      },

      loginAdmin: (email) => {
        const u = get().db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.status !== 'disabled');
        if (!u) return false;
        set((st) => ({ admin: u, db: { ...st.db, users: st.db.users.map((x) => (x.id === u.id ? { ...x, lastLoginAt: now(), status: 'active' } : x)) } }));
        return true;
      },
      logoutAdmin: () => set({ admin: null }),

      loginStudent: ({ name, phone, email }) => {
        const st = get();
        let s = st.db.students.find((x) => x.phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-10)));
        if (!s) {
          s = {
            id: nextId(st.db.students), name: name || 'Student', email: email || '', phone, cityId: null, preferredStreamId: null, qualification: '',
            bookmarks: [...st.guestBookmarks], compared: [], activity: [{ at: now(), action: 'Signed up', target: 'Website' }], verified: true, createdAt: now(), lastSeenAt: now(),
          };
          set((x) => ({ db: { ...x.db, students: [s!, ...x.db.students] } }));
          get().add('leads', { name: s.name, email: s.email, phone, stateId: null, cityId: null, courseInterest: '', instituteId: null, source: 'signup', page: location.hash.slice(1) || '/', status: 'new', pushedToCrm: get().config.crmPushEnabled, notes: '', createdAt: now() });
        }
        set({ student: s, guestBookmarks: [] });
        return s;
      },
      logoutStudent: () => set({ student: null }),
      updateStudent: (patch) => {
        const s = get().student; if (!s) return;
        const next = { ...s, ...patch, lastSeenAt: now() };
        set((st) => ({ student: next, db: { ...st.db, students: st.db.students.map((x) => (x.id === s.id ? next : x)) } }));
      },
      toggleBookmark: (iid) => {
        const s = get().student;
        if (s) {
          const has = s.bookmarks.includes(iid);
          get().updateStudent({ bookmarks: has ? s.bookmarks.filter((x) => x !== iid) : [...s.bookmarks, iid], activity: [{ at: now(), action: has ? 'Removed bookmark' : 'Bookmarked', target: get().db.institutes.find((n) => n.id === iid)?.shortName ?? '' }, ...s.activity] });
        } else {
          const b = get().guestBookmarks;
          set({ guestBookmarks: b.includes(iid) ? b.filter((x) => x !== iid) : [...b, iid] });
        }
      },
      isBookmarked: (iid) => (get().student?.bookmarks ?? get().guestBookmarks).includes(iid),
      toggleCompare: (iid) => {
        const c = get().compare;
        if (c.includes(iid)) set({ compare: c.filter((x) => x !== iid) });
        else if (c.length >= 4) get().toast('You can compare up to 4 colleges', 'error');
        else set({ compare: [...c, iid] });
      },
      clearCompare: () => set({ compare: [] }),

      toast: (message, tone = 'success') => {
        const id = Date.now() + Math.random();
        set((st) => ({ toasts: [...st.toasts, { id, message, tone }] }));
        setTimeout(() => get().dismissToast(id), 3200);
      },
      dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),
      resetDemo: () => set({ db: buildSeed(), config: structuredClone(defaultConfig), compare: [], guestBookmarks: [], student: null }),
    }),
    { name: 'msm-cms-prototype-v1', partialize: ({ toasts: _t, ...rest }) => rest },
  ),
);

/** Read one collection reactively. */
export const useCol = <K extends CollectionKey>(key: K) => useStore((s) => s.db[key]);
export const nowIso = now;
