import { useState } from 'react';
import { Copy, Lock, Mail, Pencil, Plus, Trash2, UserX, UserCheck } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, ChipSelect, DataTable, Field, Input, Modal, PageHeader, SearchInput, Select, Textarea, useConfirm, cx, type Column } from '../../ui';
import { ago } from '../../lib/format';
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '../../data/seed';
import { useCan } from '../Layout';
import type { AdminUser, Role } from '../../data/types';

/* ---------------- Users ---------------- */
type UDraft = Omit<AdminUser, 'id'> & { id?: number };

export function UsersPage() {
  const db = useStore((s) => s.db);
  const me = useStore((s) => s.admin);
  const { add, update, remove, toast, log } = useStore.getState();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('');
  const [draft, setDraft] = useState<UDraft | null>(null);
  const rows = db.users.filter((u) => (!q || (u.name + u.email).toLowerCase().includes(q.toLowerCase())) && (!roleF || u.roleId === +roleF));
  const roleName = (id: number) => db.roles.find((r) => r.id === id)?.name ?? '—';
  const writerRole = (id: number) => { const r = db.roles.find((x) => x.id === id); return !!r && !r.permissions.includes('*') && !r.permissions.some((p) => p.endsWith('.publish') || p.endsWith('.*')); };

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || !/^\S+@\S+\.\S+$/.test(draft.email)) return toast('Valid name and email required', 'error');
    if (db.users.some((u) => u.email.toLowerCase() === draft.email.toLowerCase() && u.id !== draft.id)) return toast('A user with that email exists', 'error');
    if (draft.id) { update('users', draft.id, draft); log('updated user', draft.name, draft.id); toast('User updated'); }
    else { const u = add('users', draft); log('invited user', u.name, u.id); toast(`Invitation sent to ${u.email}`); }
    setDraft(null);
  };

  const cols: Column<AdminUser>[] = [
    { key: 'n', header: 'User', sort: (u) => u.name, render: (u) => <div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold">{u.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div><div><div className="font-medium">{u.name}{u.id === me?.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</div><div className="text-xs text-slate-500">{u.email}</div></div></div> },
    { key: 'r', header: 'Role', sort: (u) => roleName(u.roleId), render: (u) => roleName(u.roleId) },
    { key: 'i', header: 'Institutes', render: (u) => (u.instituteIds.length ? `${u.instituteIds.length} assigned` : <span className="text-slate-400">All</span>) },
    { key: 's', header: 'Status', render: (u) => <Badge>{u.status}</Badge> },
    { key: 'l', header: 'Last login', sort: (u) => u.lastLoginAt ?? '', render: (u) => <span className="text-xs text-slate-500">{u.lastLoginAt ? ago(u.lastLoginAt) : 'Never'}</span> },
    { key: 'a', header: '', className: 'text-right', render: (u) => (
      <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        {u.status === 'invited' && can('users.edit') && <Button size="sm" variant="ghost" title="Resend invite" onClick={() => toast(`Invite re-sent to ${u.email}`, 'info')}><Mail className="h-3.5 w-3.5" /></Button>}
        {can('users.edit') && <Button size="sm" variant="ghost" onClick={() => setDraft({ ...u })}><Pencil className="h-3.5 w-3.5" /></Button>}
        {can('users.edit') && u.id !== me?.id && (u.status === 'disabled'
          ? <Button size="sm" variant="ghost" title="Enable" onClick={() => { update('users', u.id, { status: 'active' }); toast(`${u.name} enabled`); }}><UserCheck className="h-3.5 w-3.5 text-emerald-600" /></Button>
          : <Button size="sm" variant="ghost" title="Disable" onClick={() => { update('users', u.id, { status: 'disabled' }); toast(`${u.name} disabled`); log('disabled user', u.name, u.id); }}><UserX className="h-3.5 w-3.5 text-amber-600" /></Button>)}
        {can('users.delete') && u.id !== me?.id && <Button size="sm" variant="ghost" onClick={async () => { if (await confirm(`Delete ${u.name}? They lose access immediately.`)) { remove('users', u.id); toast('User deleted'); } }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="People who can sign in to this dashboard"
        actions={can('users.create') && <Button onClick={() => setDraft({ name: '', email: '', roleId: 3, status: 'invited', lastLoginAt: null, instituteIds: [] })}><Plus className="h-4 w-4" />Invite user</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput className="w-72" value={q} onChange={setQ} placeholder="Name or email" />
        <Select className="w-48" value={roleF} onChange={(e) => setRoleF(e.target.value)} options={db.roles.map((r) => ({ value: r.id, label: r.name }))} placeholder="All roles" />
      </div>
      <DataTable rows={rows} columns={cols} onRowClick={(u) => can('users.edit') && setDraft({ ...u })} />
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit user' : 'Invite user'} size="lg"
        footer={<><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={save}>{draft?.id ? 'Save' : 'Send invite'}</Button></>}>
        {draft && <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="Email"><Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
            <Field label="Role"><Select value={draft.roleId} onChange={(e) => setDraft({ ...draft, roleId: +e.target.value })} options={db.roles.map((r) => ({ value: r.id, label: r.name }))} /></Field>
            {draft.id && <Field label="Status"><Select value={draft.status} disabled={draft.id === me?.id} onChange={(e) => setDraft({ ...draft, status: e.target.value as AdminUser['status'] })} options={['active', 'invited', 'disabled'].map((s) => ({ value: s, label: s }))} /></Field>}
          </div>
          <Field label="Assigned institutes" hint={writerRole(draft.roleId) ? 'Writers only see the institutes assigned here. Leave empty for all.' : 'Optional — limit this user to specific institutes. Empty = all.'}>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 p-2">
              <ChipSelect options={db.institutes.map((i) => ({ value: i.id, label: i.shortName }))} value={draft.instituteIds} onChange={(instituteIds) => setDraft({ ...draft, instituteIds })} />
            </div>
          </Field>
        </div>}
      </Modal>
      {node}
    </div>
  );
}

/* ---------------- Roles ---------------- */
export function RolesPage() {
  const db = useStore((s) => s.db);
  const { add, update, remove, toast, log } = useStore.getState();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [selId, setSelId] = useState<number>(db.roles[0]?.id ?? 1);
  const [newRole, setNewRole] = useState<{ name: string; description: string; from?: Role } | null>(null);
  const role = db.roles.find((r) => r.id === selId) ?? db.roles[0];
  const editable = can('roles.edit') && !!role && !role.permissions.includes('*');
  const users = (id: number) => db.users.filter((u) => u.roleId === id).length;

  // Expand role permissions into explicit module.action set.
  const has = (r: Role, m: string, a: string) => r.permissions.includes('*') || r.permissions.includes(`${m}.*`) || r.permissions.includes(`${m}.${a}`);
  const setPerms = (perms: Set<string>) => {
    // Collapse full rows back to module.*
    const out: string[] = [];
    for (const m of PERMISSION_MODULES) {
      const acts = PERMISSION_ACTIONS.filter((a) => perms.has(`${m}.${a}`));
      if (acts.length === PERMISSION_ACTIONS.length) out.push(`${m}.*`);
      else acts.forEach((a) => out.push(`${m}.${a}`));
    }
    update('roles', role.id, { permissions: out });
  };
  const current = () => new Set(PERMISSION_MODULES.flatMap((m) => PERMISSION_ACTIONS.filter((a) => has(role, m, a)).map((a) => `${m}.${a}`)));
  const toggle = (keys: string[], on: boolean) => {
    const s = current();
    keys.forEach((k) => (on ? s.add(k) : s.delete(k)));
    // view is implied by any other action
    keys.forEach((k) => { const [m, a] = k.split('.'); if (on && a !== 'view') s.add(`${m}.view`); if (!on && a === 'view') PERMISSION_ACTIONS.forEach((x) => s.delete(`${m}.${x}`)); });
    setPerms(s);
  };

  const createRole = () => {
    if (!newRole?.name.trim()) return toast('Role name required', 'error');
    const r = add('roles', { name: newRole.name, description: newRole.description, permissions: newRole.from ? (newRole.from.permissions.includes('*') ? PERMISSION_MODULES.map((m) => `${m}.*`) : [...newRole.from.permissions]) : [], system: false });
    log('created role', r.name, r.id);
    toast('Role created'); setSelId(r.id); setNewRole(null);
  };

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="What each role can see and do. Changes apply immediately."
        actions={can('roles.create') && <Button onClick={() => setNewRole({ name: '', description: '' })}><Plus className="h-4 w-4" />New role</Button>} />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {db.roles.map((r) => (
            <button key={r.id} onClick={() => setSelId(r.id)} className={cx('w-full rounded-xl border p-3 text-left cursor-pointer', r.id === role?.id ? 'border-brand bg-brand-soft/50' : 'border-slate-200 bg-white hover:border-slate-300')}>
              <div className="flex items-center justify-between"><span className="font-medium">{r.name}</span>{r.system && <Lock className="h-3.5 w-3.5 text-slate-400" />}</div>
              <div className="mt-0.5 text-xs text-slate-500">{r.description}</div>
              <div className="mt-1 text-[11px] text-slate-400">{users(r.id)} users</div>
            </button>
          ))}
        </div>
        {role && (
          <Card className="p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                {editable ? <>
                  <Input className="max-w-sm font-medium" value={role.name} onChange={(e) => update('roles', role.id, { name: e.target.value })} />
                  <Textarea className="min-h-0 max-w-xl" rows={1} value={role.description} onChange={(e) => update('roles', role.id, { description: e.target.value })} />
                </> : <><h2 className="text-lg font-semibold">{role.name}</h2><p className="text-sm text-slate-500">{role.description}</p></>}
              </div>
              <div className="flex gap-2">
                {can('roles.create') && <Button size="sm" variant="outline" onClick={() => setNewRole({ name: `${role.name} copy`, description: role.description, from: role })}><Copy className="h-3.5 w-3.5" />Duplicate</Button>}
                {can('roles.delete') && !role.system && <Button size="sm" variant="outline" onClick={async () => {
                  if (users(role.id)) return toast(`Move ${users(role.id)} users to another role first`, 'error');
                  if (await confirm(`Delete role ${role.name}?`)) { remove('roles', role.id); setSelId(db.roles[0].id); toast('Role deleted'); }
                }}><Trash2 className="h-3.5 w-3.5 text-red-600" />Delete</Button>}
              </div>
            </div>
            {role.permissions.includes('*') && <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"><Lock className="h-4 w-4" />Super Admin has every permission and cannot be edited.</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-medium">Module</th>
                    {PERMISSION_ACTIONS.map((a) => {
                      const all = PERMISSION_MODULES.every((m) => has(role, m, a));
                      return <th key={a} className="px-2 py-2 text-center font-medium">
                        <label className="flex flex-col items-center gap-1 capitalize">{a}<input type="checkbox" disabled={!editable} checked={all} onChange={() => toggle(PERMISSION_MODULES.map((m) => `${m}.${a}`), !all)} /></label>
                      </th>;
                    })}
                    <th className="px-2 py-2 text-center font-medium">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERMISSION_MODULES.map((m) => {
                    const all = PERMISSION_ACTIONS.every((a) => has(role, m, a));
                    return (
                      <tr key={m} className="hover:bg-slate-50">
                        <td className="py-1.5 pr-3 capitalize">{m.replace(/_/g, ' ')}</td>
                        {PERMISSION_ACTIONS.map((a) => (
                          <td key={a} className="px-2 py-1.5 text-center"><input type="checkbox" disabled={!editable} checked={has(role, m, a)} onChange={(e) => toggle([`${m}.${a}`], e.target.checked)} /></td>
                        ))}
                        <td className="px-2 py-1.5 text-center"><input type="checkbox" disabled={!editable} checked={all} onChange={() => toggle(PERMISSION_ACTIONS.map((a) => `${m}.${a}`), !all)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
      <Modal open={!!newRole} onClose={() => setNewRole(null)} title={newRole?.from ? `Duplicate ${newRole.from.name}` : 'New role'} size="sm"
        footer={<><Button variant="outline" onClick={() => setNewRole(null)}>Cancel</Button><Button onClick={createRole}>Create</Button></>}>
        {newRole && <div className="space-y-3">
          <Field label="Name"><Input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} /></Field>
          <Field label="Description"><Textarea value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} /></Field>
        </div>}
      </Modal>
      {node}
    </div>
  );
}
