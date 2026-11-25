import { useRef, useState } from 'react';
import { Copy, KeyRound, Plug, RefreshCw, Radar, Trash2, ExternalLink } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, DataTable, Field, Input, PageHeader, Select, Toggle, inputCls, useConfirm, type Column } from '../../ui';
import { ago, dateTime } from '../../lib/format';
import { useCan } from '../Layout';
import type { LinkCheck, McpClient, SeoTemplate } from '../../data/types';

/* ---------------- SEO templates ---------------- */
const VARS = ['{name}', '{year}', '{exam}', '{count}', '{title}', '{city}'];

export function SeoTemplatesPage() {
  const db = useStore((s) => s.db);
  const { update, toast, log } = useStore.getState();
  const can = useCan();
  const [selId, setSelId] = useState(db.seoTemplates[0]?.id ?? 1);
  const [instId, setInstId] = useState(db.institutes[0]?.id ?? 1);
  const [examId, setExamId] = useState(db.exams[0]?.id ?? 1);
  const [focus, setFocus] = useState<keyof SeoTemplate>('titleTemplate');
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const t = db.seoTemplates.find((x) => x.id === selId);
  const [draft, setDraft] = useState<SeoTemplate | undefined>(t);
  if (t && draft?.id !== t.id) setDraft(t);
  const inst = db.institutes.find((i) => i.id === instId)!;
  const exam = db.exams.find((e) => e.id === examId)!;
  const lp = db.landingPages[0];
  const fill = (s: string) => s
    .replace(/\{name\}/g, inst?.shortName ?? '').replace(/\{year\}/g, '2026').replace(/\{exam\}/g, exam?.shortName ?? '')
    .replace(/\{count\}/g, String(db.institutes.length)).replace(/\{title\}/g, lp?.title ?? '').replace(/\{city\}/g, db.cities.find((c) => c.id === inst?.cityId)?.name ?? '');
  const ro = !can('seo.edit');
  const insert = (v: string) => {
    if (!draft || ro) return;
    const el = refs.current[focus];
    const cur = String(draft[focus]);
    const pos = el?.selectionStart ?? cur.length;
    setDraft({ ...draft, [focus]: cur.slice(0, pos) + v + cur.slice(pos) });
    setTimeout(() => { el?.focus(); el?.setSelectionRange(pos + v.length, pos + v.length); });
  };
  const title = draft ? fill(draft.titleTemplate) : '';
  const desc = draft ? fill(draft.descriptionTemplate) : '';
  return (
    <div>
      <PageHeader title="SEO Templates" subtitle="Default title, meta description and H1 per page type — used when a page has no custom SEO" />
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1">
          {db.seoTemplates.map((x) => (
            <button key={x.id} onClick={() => setSelId(x.id)} className={`w-full rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${x.id === selId ? 'bg-brand-soft font-medium text-brand' : 'text-slate-600 hover:bg-white'}`}>{x.pageType}</button>
          ))}
        </div>
        {draft && (
          <div className="space-y-4">
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-500">Insert variable:</span>
                {VARS.map((v) => <button key={v} disabled={ro} onClick={() => insert(v)} className="rounded-full border border-slate-300 px-2 py-0.5 font-mono text-xs text-slate-700 hover:border-brand hover:text-brand cursor-pointer disabled:opacity-50">{v}</button>)}
              </div>
              {(['titleTemplate', 'descriptionTemplate', 'h1Template'] as const).map((k) => (
                <Field key={k} label={k === 'titleTemplate' ? `Title (${fill(draft[k]).length}/60)` : k === 'descriptionTemplate' ? `Meta description (${fill(draft[k]).length}/160)` : 'H1'}>
                  <input disabled={ro} ref={(el) => { refs.current[k] = el; }} onFocus={() => setFocus(k)} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className={`${inputCls} font-mono text-xs`} />
                </Field>
              ))}
              {!ro && <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDraft(t)}>Reset</Button>
                <Button onClick={() => { update('seoTemplates', draft.id, draft); log('updated SEO template', draft.pageType, draft.id); toast('Template saved'); }}>Save template</Button>
              </div>}
            </Card>
            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="mr-auto text-sm font-semibold">Live preview</h3>
                <Select className="w-48" value={instId} onChange={(e) => setInstId(+e.target.value)} options={db.institutes.map((i) => ({ value: i.id, label: i.shortName }))} />
                <Select className="w-36" value={examId} onChange={(e) => setExamId(+e.target.value)} options={db.exams.map((i) => ({ value: i.id, label: i.shortName }))} />
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="text-xs text-slate-500">msmunify.com › {draft.pageType.toLowerCase().replace(/ /g, '-')}</div>
                <div className={`mt-0.5 text-lg text-[#1a0dab] ${title.length > 60 ? 'underline decoration-red-400 decoration-wavy' : ''}`}>{title.length > 60 ? `${title.slice(0, 60)}…` : title}</div>
                <div className="text-sm text-slate-600">{desc.length > 160 ? `${desc.slice(0, 160)}…` : desc}</div>
              </div>
              <div className="mt-3 text-sm"><span className="text-xs text-slate-500">H1: </span><span className="font-semibold">{fill(draft.h1Template)}</span></div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Link status ---------------- */
const tone = (s: number) => (s < 300 ? 'published' : s < 400 ? 'pending' : 'failed');
export function LinkStatusPage() {
  const rows = useStore((s) => s.db.linkChecks);
  const articles = useStore((s) => s.db.articles);
  const { add, update, remove, toast } = useStore.getState();
  const [broken, setBroken] = useState(false);
  const [scanning, setScanning] = useState(false);
  const view = rows.filter((r) => !broken || r.status >= 400);
  const recheck = (r: LinkCheck) => update('linkChecks', r.id, { status: Math.random() > 0.5 ? 200 : r.status, checkedAt: new Date().toISOString() });
  const scan = () => {
    setScanning(true);
    setTimeout(() => {
      const urls = ['https://ugc.gov.in/oldpage', 'https://aicte-india.org/circulars', 'https://jeemain.nta.ac.in/information-bulletin', 'https://neet.nta.nic.in/archive', 'https://cat.iim.ac.in/2025-notice'];
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) add('linkChecks', { url: urls[Math.floor(Math.random() * urls.length)], foundOn: articles[Math.floor(Math.random() * articles.length)].title, status: [200, 200, 301, 404, 500][Math.floor(Math.random() * 5)], checkedAt: new Date().toISOString() });
      setScanning(false);
      toast(`Scan complete — ${n} links checked`);
    }, 1200);
  };
  const cols: Column<LinkCheck>[] = [
    { key: 's', header: 'Status', sort: (r) => r.status, render: (r) => <Badge tone={tone(r.status)}>{String(r.status)}</Badge> },
    { key: 'u', header: 'URL', render: (r) => <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-brand">{r.url}<ExternalLink className="h-3 w-3" /></a> },
    { key: 'f', header: 'Found on', render: (r) => <span className="text-slate-600">{r.foundOn}</span> },
    { key: 'c', header: 'Checked', sort: (r) => r.checkedAt, render: (r) => <span className="text-xs text-slate-500">{ago(r.checkedAt)}</span> },
    { key: 'a', header: '', className: 'text-right', render: (r) => <div className="flex justify-end gap-0.5"><Button size="sm" variant="ghost" title="Re-check" onClick={() => { recheck(r); toast('Re-checked', 'info'); }}><RefreshCw className="h-3.5 w-3.5" /></Button><Button size="sm" variant="ghost" title="Dismiss" onClick={() => remove('linkChecks', r.id)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button></div> },
  ];
  const bad = rows.filter((r) => r.status >= 400).length;
  return (
    <div>
      <PageHeader title="Link status" subtitle="Outbound links found in content and whether they still work"
        actions={<>
          <Button variant="outline" onClick={() => { rows.forEach(recheck); toast('All links re-checked'); }}><RefreshCw className="h-4 w-4" />Re-check all</Button>
          <Button disabled={scanning} onClick={scan}><Radar className="h-4 w-4" />{scanning ? 'Scanning…' : 'Run scan'}</Button>
        </>} />
      <div className="mb-3 grid grid-cols-3 gap-3 sm:max-w-lg">
        <Card className="p-3"><div className="text-xs text-slate-500">Checked</div><div className="text-xl font-semibold">{rows.length}</div></Card>
        <Card className="p-3"><div className="text-xs text-slate-500">Redirects</div><div className="text-xl font-semibold text-amber-600">{rows.filter((r) => r.status >= 300 && r.status < 400).length}</div></Card>
        <Card className="p-3"><div className="text-xs text-slate-500">Broken</div><div className="text-xl font-semibold text-red-600">{bad}</div></Card>
      </div>
      <div className="mb-3"><Toggle checked={broken} onChange={setBroken} label="Show broken only" /></div>
      <DataTable rows={view} columns={cols} />
    </div>
  );
}

/* ---------------- MCP access ---------------- */
export function McpAccessPage() {
  const clients = useStore((s) => s.db.mcpClients);
  const admin = useStore((s) => s.admin);
  const { add, remove, toast, log } = useStore.getState();
  const { confirm, node } = useConfirm();
  const can = useCan();
  const [token, setToken] = useState('');
  const [client, setClient] = useState('Claude Desktop');
  const [scopes, setScopes] = useState<string[]>(['institutes:read', 'articles:read']);
  const url = 'https://cms-api.msmunify.com/mcp';
  const copy = (s: string) => { navigator.clipboard?.writeText(s); toast('Copied', 'info'); };
  const gen = () => {
    const t = `msm_mcp_${Array.from(crypto.getRandomValues(new Uint8Array(18))).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
    setToken(t);
    add('mcpClients', { name: client, user: admin?.name ?? 'Admin', scopes, connectedAt: new Date().toISOString(), lastUsedAt: new Date().toISOString() });
    log('created MCP token for', client);
    toast('Token generated — copy it now, it will not be shown again');
  };
  const ALL = ['institutes:read', 'institutes:write', 'courses:read', 'courses:write', 'exams:read', 'exams:write', 'articles:read', 'articles:write', 'leads:read'];
  const json = JSON.stringify({ mcpServers: { 'msm-unify-cms': { url, headers: { Authorization: `Bearer ${token || '<your-token>'}` } } } }, null, 2);
  const cols: Column<McpClient>[] = [
    { key: 'n', header: 'Client', render: (c) => <span className="inline-flex items-center gap-2 font-medium"><Plug className="h-4 w-4 text-slate-400" />{c.name}</span> },
    { key: 'u', header: 'User', render: (c) => c.user },
    { key: 's', header: 'Scopes', render: (c) => <div className="flex flex-wrap gap-1">{c.scopes.map((s) => <Badge key={s} tone="new">{s}</Badge>)}</div> },
    { key: 'c', header: 'Connected', render: (c) => <span className="text-xs text-slate-500">{dateTime(c.connectedAt)}</span> },
    { key: 'l', header: 'Last used', render: (c) => <span className="text-xs text-slate-500">{ago(c.lastUsedAt)}</span> },
    { key: 'a', header: '', className: 'text-right', render: (c) => can('mcp.delete') || can('mcp.edit') ? <Button size="sm" variant="outline" onClick={async () => { if (await confirm(`Revoke ${c.name}? It will stop working immediately.`)) { remove('mcpClients', c.id); toast('Access revoked'); } }}>Revoke</Button> : null },
  ];
  return (
    <div>
      <PageHeader title="MCP access" subtitle="Connect AI assistants (Claude, Cursor…) to the CMS through the Model Context Protocol" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold">1. Generate a token</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><Select value={client} onChange={(e) => setClient(e.target.value)} options={['Claude Desktop', 'Claude Code', 'Cursor', 'VS Code', 'Other'].map((x) => ({ value: x, label: x }))} /></Field>
            <Field label="Server URL"><div className="flex gap-1"><Input readOnly value={url} className="font-mono text-xs" /><Button variant="outline" onClick={() => copy(url)}><Copy className="h-4 w-4" /></Button></div></Field>
          </div>
          <Field label="Scopes">
            <div className="flex flex-wrap gap-1.5">
              {ALL.map((s) => <label key={s} className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs"><input type="checkbox" checked={scopes.includes(s)} onChange={() => setScopes(scopes.includes(s) ? scopes.filter((x) => x !== s) : [...scopes, s])} />{s}</label>)}
            </div>
          </Field>
          <Button disabled={!scopes.length || !can('mcp')} onClick={gen}><KeyRound className="h-4 w-4" />Generate token</Button>
          {token && <div className="flex gap-1"><Input readOnly value={token} className="font-mono text-xs" /><Button variant="outline" onClick={() => copy(token)}><Copy className="h-4 w-4" /></Button></div>}
        </Card>
        <Card className="space-y-3 p-4">
          <h3 className="text-sm font-semibold">2. Add it to your client</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Open {client} settings → MCP servers / Connectors.</li>
            <li>Paste the config below (or add a remote server with the URL and token).</li>
            <li>Restart the client. Try: “List draft articles in the CMS”.</li>
          </ol>
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{json}</pre>
            <Button size="sm" variant="secondary" className="absolute right-2 top-2" onClick={() => copy(json)}><Copy className="h-3.5 w-3.5" />Copy</Button>
          </div>
        </Card>
      </div>
      <h3 className="mb-2 mt-6 text-sm font-semibold">Connected clients ({clients.length})</h3>
      <DataTable rows={clients} columns={cols} empty="No clients connected" />
      {node}
    </div>
  );
}
