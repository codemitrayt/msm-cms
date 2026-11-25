import { useRef, useState } from 'react';
import { Copy, FileText, Film, Grid2x2, List, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, DataTable, Field, Img, Input, Modal, PageHeader, SearchInput, Select, Sheet, Textarea, useConfirm, cx, type Column } from '../../ui';
import { date, fileToDataUrl, slugify } from '../../lib/format';
import { useCan } from '../Layout';
import type { Author, Media, Tag } from '../../data/types';

/* ---------------- Tags ---------------- */
export function TagsPage() {
  const db = useStore((s) => s.db);
  const { add, update, remove, toast, log } = useStore.getState();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<(Omit<Tag, 'id'> & { id?: number }) | null>(null);
  const uses = (id: number) => db.articles.filter((a) => a.tagIds.includes(id)).length;
  const rows = db.tags.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
  const save = () => {
    if (!draft?.name.trim()) return toast('Name is required', 'error');
    const slug = draft.slug || slugify(draft.name);
    if (db.tags.some((t) => t.slug === slug && t.id !== draft.id)) return toast('Slug already used', 'error');
    if (draft.id) update('tags', draft.id, { ...draft, slug }); else add('tags', { ...draft, slug });
    log(draft.id ? 'updated tag' : 'created tag', draft.name);
    toast('Tag saved'); setDraft(null);
  };
  const cols: Column<Tag>[] = [
    { key: 'name', header: 'Tag', sort: (t) => t.name, render: (t) => <span className="inline-flex items-center gap-2 font-medium"><span className="h-3 w-3 rounded-full" style={{ background: t.color }} />{t.name}</span> },
    { key: 'slug', header: 'Slug', render: (t) => <code className="text-xs text-slate-500">{t.slug}</code> },
    { key: 'n', header: 'Articles', sort: (t) => uses(t.id), render: (t) => uses(t.id) },
    { key: 'a', header: '', className: 'text-right', render: (t) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {can('tags.edit') && <Button size="sm" variant="ghost" onClick={() => setDraft({ ...t })}><Pencil className="h-3.5 w-3.5" /></Button>}
        {can('tags.delete') && <Button size="sm" variant="ghost" onClick={async () => { if (await confirm(`Delete tag "${t.name}"? It will be removed from ${uses(t.id)} articles.`)) { remove('tags', t.id); db.articles.filter((a) => a.tagIds.includes(t.id)).forEach((a) => update('articles', a.id, { tagIds: a.tagIds.filter((x) => x !== t.id) })); toast('Tag deleted'); } }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}
      </div>
    ) },
  ];
  return (
    <div>
      <PageHeader title="Tags" subtitle="Used to group blog articles" actions={can('tags.create') && <Button onClick={() => setDraft({ name: '', slug: '', color: '#fa0000' })}><Plus className="h-4 w-4" />Add tag</Button>} />
      <SearchInput className="mb-3 w-72" value={q} onChange={setQ} />
      <DataTable rows={rows} columns={cols} />
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit tag' : 'New tag'} size="sm" footer={<><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {draft && <div className="space-y-3">
          <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} /></Field>
          <Field label="Slug"><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} /></Field>
          <Field label="Colour"><div className="flex gap-2"><input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-9 w-12 rounded border border-slate-300" /><Input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></div></Field>
        </div>}
      </Modal>
      {node}
    </div>
  );
}

/* ---------------- Authors ---------------- */
export function AuthorsPage() {
  const db = useStore((s) => s.db);
  const { add, update, remove, toast, log } = useStore.getState();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [draft, setDraft] = useState<(Omit<Author, 'id'> & { id?: number }) | null>(null);
  const count = (id: number) => db.articles.filter((a) => a.authorId === id).length;
  const save = () => {
    if (!draft?.name.trim()) return toast('Name is required', 'error');
    const data = { ...draft, slug: draft.slug || slugify(draft.name) };
    if (draft.id) update('authors', draft.id, data); else add('authors', data);
    log(draft.id ? 'updated author' : 'created author', draft.name);
    toast('Author saved'); setDraft(null);
  };
  return (
    <div>
      <PageHeader title="Authors" subtitle="Bylines for articles and college pages"
        actions={can('authors.create') && <Button onClick={() => setDraft({ name: '', slug: '', designation: '', bio: '', avatar: '', email: '', linkedin: '' })}><Plus className="h-4 w-4" />Add author</Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {db.authors.map((a) => (
          <Card key={a.id} className="flex gap-3 p-4">
            <Img src={a.avatar} className="h-14 w-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{a.name}</div>
              <div className="text-xs text-slate-500">{a.designation}</div>
              <p className="mt-1.5 line-clamp-2 text-xs text-slate-600">{a.bio}</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <Badge tone="new">{`${count(a.id)} articles`}</Badge>
                <a href={`#/author/${a.slug}`} className="text-brand">Profile</a>
                <span className="ml-auto flex gap-0.5">
                  {can('authors.edit') && <Button size="sm" variant="ghost" onClick={() => setDraft({ ...a })}><Pencil className="h-3.5 w-3.5" /></Button>}
                  {can('authors.delete') && <Button size="sm" variant="ghost" onClick={async () => {
                    if (count(a.id)) return toast(`Reassign ${count(a.id)} articles before deleting`, 'error');
                    if (await confirm(`Delete ${a.name}?`)) { remove('authors', a.id); toast('Author deleted'); }
                  }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit author' : 'New author'} footer={<><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {draft && <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Img src={draft.avatar} className="h-20 w-20 rounded-full" />
            <label className="cursor-pointer text-sm text-brand">Upload photo
              <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, avatar: await fileToDataUrl(f) }); }} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} /></Field>
            <Field label="Slug"><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} /></Field>
            <Field label="Designation"><Input value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} /></Field>
            <Field label="Email"><Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
            <Field label="Avatar URL"><Input value={draft.avatar.startsWith('data:') ? '(uploaded)' : draft.avatar} onChange={(e) => setDraft({ ...draft, avatar: e.target.value })} /></Field>
            <Field label="LinkedIn"><Input value={draft.linkedin} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} /></Field>
          </div>
          <Field label="Bio"><Textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></Field>
        </div>}
      </Sheet>
      {node}
    </div>
  );
}

/* ---------------- Media ---------------- */
const typeOf = (f: File): Media['type'] => (f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : 'pdf');
function Thumb({ m, className }: { m: Media; className?: string }) {
  if (m.type === 'image') return <Img src={m.url} alt={m.alt} className={className} />;
  return <div className={cx('flex items-center justify-center bg-slate-100 text-slate-400', className)}>{m.type === 'video' ? <Film className="h-8 w-8" /> : <FileText className="h-8 w-8" />}</div>;
}

export function MediaPage() {
  const media = useStore((s) => s.db.media);
  const { add, update, remove, toast, log } = useStore.getState();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [folder, setFolder] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [uploadFolder, setUploadFolder] = useState('uploads');
  const [preview, setPreview] = useState<Media | null>(null);
  const [edit, setEdit] = useState<Media | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const folders = [...new Set(media.map((m) => m.folder))].sort();
  const rows = media.filter((m) => (!folder || m.folder === folder) && (!type || m.type === type) && (!q || (m.name + m.alt).toLowerCase().includes(q.toLowerCase())));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const url = f.size < 400_000 ? await fileToDataUrl(f) : URL.createObjectURL(f);
      add('media', { name: f.name, url, type: typeOf(f), sizeKb: Math.round(f.size / 1024), folder: uploadFolder || 'uploads', alt: f.name.replace(/\.[^.]+$/, ''), uploadedAt: new Date().toISOString() });
    }
    log('uploaded', `${files.length} media files`);
    toast(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`);
    if (input.current) input.current.value = '';
  };
  const copy = (m: Media) => { navigator.clipboard?.writeText(m.url.startsWith('data:') ? `media://${m.id}/${m.name}` : m.url); toast('URL copied', 'info'); };
  const del = async (m: Media) => { if (await confirm(`Delete ${m.name}?`)) { remove('media', m.id); setPreview(null); toast('File deleted'); } };

  const cols: Column<Media>[] = [
    { key: 't', header: '', render: (m) => <Thumb m={m} className="h-10 w-14 rounded" /> },
    { key: 'n', header: 'Name', sort: (m) => m.name, render: (m) => <div><div className="font-medium">{m.name}</div><div className="text-xs text-slate-500">{m.alt}</div></div> },
    { key: 'f', header: 'Folder', render: (m) => <Badge>{m.folder}</Badge> },
    { key: 'ty', header: 'Type', render: (m) => <span className="uppercase text-xs">{m.type}</span> },
    { key: 's', header: 'Size', sort: (m) => m.sizeKb, render: (m) => `${m.sizeKb} KB` },
    { key: 'd', header: 'Uploaded', sort: (m) => m.uploadedAt, render: (m) => <span className="text-xs text-slate-500">{date(m.uploadedAt)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Media Library" subtitle={`${media.length} files`}
        actions={can('media.create') && <>
          <Input className="w-32" value={uploadFolder} onChange={(e) => setUploadFolder(slugify(e.target.value))} title="Upload to folder" placeholder="folder" />
          <Button onClick={() => input.current?.click()}><Upload className="h-4 w-4" />Upload files</Button>
          <input ref={input} type="file" multiple hidden accept="image/*,application/pdf,video/*" onChange={(e) => onFiles(e.target.files)} />
        </>} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput className="w-64" value={q} onChange={setQ} placeholder="Name or alt text" />
        <Select className="w-40" value={folder} onChange={(e) => setFolder(e.target.value)} options={folders.map((f) => ({ value: f, label: f }))} placeholder="All folders" />
        <Select className="w-32" value={type} onChange={(e) => setType(e.target.value)} options={['image', 'pdf', 'video'].map((f) => ({ value: f, label: f }))} placeholder="All types" />
        <div className="ml-auto flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button onClick={() => setView('grid')} className={cx('rounded p-1.5 cursor-pointer', view === 'grid' && 'bg-slate-100')}><Grid2x2 className="h-4 w-4" /></button>
          <button onClick={() => setView('list')} className={cx('rounded p-1.5 cursor-pointer', view === 'list' && 'bg-slate-100')}><List className="h-4 w-4" /></button>
        </div>
      </div>
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (can('media.create')) onFiles(e.dataTransfer.files); }}>
        {view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {rows.map((m) => (
              <button key={m.id} onClick={() => setPreview(m)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left cursor-pointer hover:border-brand">
                <Thumb m={m} className="aspect-[4/3] w-full" />
                <div className="p-2"><div className="truncate text-xs font-medium">{m.name}</div><div className="text-[11px] text-slate-400">{m.folder} · {m.sizeKb} KB</div></div>
              </button>
            ))}
          </div>
        ) : <DataTable rows={rows} columns={cols} onRowClick={setPreview} />}
        <p className="mt-3 text-center text-xs text-slate-400">Tip: drag & drop files here to upload</p>
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name} size="lg"
        footer={preview && <>
          {can('media.delete') && <Button variant="danger" onClick={() => del(preview)}><Trash2 className="h-4 w-4" />Delete</Button>}
          <Button variant="outline" onClick={() => copy(preview)}><Copy className="h-4 w-4" />Copy URL</Button>
          {can('media.edit') && <Button onClick={() => { setEdit(preview); setPreview(null); }}><Pencil className="h-4 w-4" />Edit</Button>}
        </>}>
        {preview && <div className="space-y-3">
          {preview.type === 'video' ? <video src={preview.url} controls className="w-full rounded-lg" /> : <Thumb m={preview} className="max-h-[50vh] w-full rounded-lg object-contain" />}
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div><div className="text-xs text-slate-500">Folder</div>{preview.folder}</div>
            <div><div className="text-xs text-slate-500">Type</div>{preview.type}</div>
            <div><div className="text-xs text-slate-500">Size</div>{preview.sizeKb} KB</div>
            <div><div className="text-xs text-slate-500">Uploaded</div>{date(preview.uploadedAt)}</div>
          </div>
          <div className="text-sm"><span className="text-xs text-slate-500">Alt text: </span>{preview.alt}</div>
        </div>}
      </Modal>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit file" size="sm"
        footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={() => { if (edit) { update('media', edit.id, edit); toast('File updated'); setEdit(null); } }}>Save</Button></>}>
        {edit && <div className="space-y-3">
          <Field label="Name"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Alt text"><Input value={edit.alt} onChange={(e) => setEdit({ ...edit, alt: e.target.value })} /></Field>
          <Field label="Folder"><Input value={edit.folder} onChange={(e) => setEdit({ ...edit, folder: slugify(e.target.value) })} list="media-folders" /></Field>
          <datalist id="media-folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
        </div>}
      </Modal>
      {node}
    </div>
  );
}
