import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { Badge, Button, Card, Field, Input, PageHeader, RichText, SearchInput, Select, Sheet, Empty, useConfirm, cx } from '../../ui';
import { stripHtml } from '../../lib/format';
import { useCan } from '../Layout';
import type { Faq } from '../../data/types';

const TYPES: Faq['entityType'][] = ['global', 'institute', 'exam', 'course', 'landing'];
type Draft = Omit<Faq, 'id'> & { id?: number };
const blank = (): Draft => ({ question: '', answer: '', entityType: 'global', entityId: null, order: 1, status: 'published' });

function useEntityOptions(type: Faq['entityType']) {
  const db = useStore((s) => s.db);
  if (type === 'institute') return db.institutes.map((i) => ({ value: i.id, label: i.shortName }));
  if (type === 'exam') return db.exams.map((e) => ({ value: e.id, label: e.shortName }));
  if (type === 'course') return db.baseCourses.map((c) => ({ value: c.id, label: c.shortName }));
  if (type === 'landing') return db.landingPages.map((l) => ({ value: l.id, label: l.title }));
  return [];
}

export default function Faqs() {
  const faqs = useStore((s) => s.db.faqs);
  const { add, update, remove, toast, log, setCollection } = useStore.getState();
  const can = useCan();
  const { confirm, node } = useConfirm();
  const [type, setType] = useState<Faq['entityType'] | ''>('');
  const [entity, setEntity] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<number[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const entityOpts = useEntityOptions((type || 'global') as Faq['entityType']);
  const draftOpts = useEntityOptions(draft?.entityType ?? 'global');
  const labelOf = (f: Faq) => {
    const o = f.entityType === type ? entityOpts : null;
    return o?.find((x) => x.value === f.entityId)?.label;
  };
  const db = useStore((s) => s.db);
  const entityName = (f: Faq) => labelOf(f) ?? (f.entityType === 'institute' ? db.institutes.find((i) => i.id === f.entityId)?.shortName
    : f.entityType === 'exam' ? db.exams.find((i) => i.id === f.entityId)?.shortName
    : f.entityType === 'course' ? db.baseCourses.find((i) => i.id === f.entityId)?.shortName
    : f.entityType === 'landing' ? db.landingPages.find((i) => i.id === f.entityId)?.title : 'Global');

  const rows = useMemo(() => faqs
    .filter((f) => (!type || f.entityType === type) && (!entity || f.entityId === +entity) && (!q || (f.question + f.answer).toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.entityType.localeCompare(b.entityType) || (a.entityId ?? 0) - (b.entityId ?? 0) || a.order - b.order), [faqs, type, entity, q]);

  const move = (f: Faq, dir: -1 | 1) => {
    const group = faqs.filter((x) => x.entityType === f.entityType && x.entityId === f.entityId).sort((a, b) => a.order - b.order);
    const i = group.findIndex((x) => x.id === f.id);
    const j = i + dir;
    if (j < 0 || j >= group.length) return;
    [group[i], group[j]] = [group[j], group[i]];
    const orders = new Map(group.map((x, k) => [x.id, k + 1]));
    setCollection('faqs', faqs.map((x) => (orders.has(x.id) ? { ...x, order: orders.get(x.id)! } : x)));
  };

  const save = () => {
    if (!draft) return;
    if (!draft.question.trim() || !stripHtml(draft.answer)) return toast('Question and answer are required', 'error');
    if (draft.entityType !== 'global' && !draft.entityId) return toast('Pick which item this FAQ belongs to', 'error');
    const data = { ...draft, entityId: draft.entityType === 'global' ? null : draft.entityId };
    if (draft.id) { update('faqs', draft.id, data); log('updated FAQ', draft.question, draft.id); }
    else { const c = add('faqs', data); log('created FAQ', c.question, c.id); }
    toast('FAQ saved');
    setDraft(null);
  };

  return (
    <div>
      <PageHeader title="FAQs" subtitle="Shared FAQ library — shown on colleges, exams, courses and landing pages"
        actions={can('faqs.create') && <Button onClick={() => setDraft({ ...blank(), entityType: type || 'global', entityId: entity ? +entity : null })}><Plus className="h-4 w-4" />Add FAQ</Button>} />
      <Card className="mb-3 flex flex-wrap gap-2 p-3">
        <SearchInput className="w-72" value={q} onChange={setQ} placeholder="Search questions and answers" />
        <Select className="w-40" value={type} onChange={(e) => { setType(e.target.value as Faq['entityType']); setEntity(''); }} options={TYPES.map((t) => ({ value: t, label: t }))} placeholder="All types" />
        {type && type !== 'global' && <Select className="w-64" value={entity} onChange={(e) => setEntity(e.target.value)} options={entityOpts} placeholder={`All ${type}s`} />}
        {sel.length > 0 && can('faqs.delete') && (
          <Button variant="danger" size="md" className="ml-auto" onClick={async () => { if (await confirm(`Delete ${sel.length} FAQs?`)) { remove('faqs', sel); toast(`${sel.length} FAQs deleted`); setSel([]); } }}>
            <Trash2 className="h-4 w-4" />Delete {sel.length}
          </Button>
        )}
      </Card>
      <div className="text-sm text-slate-500 mb-2">{rows.length} FAQs</div>
      {!rows.length ? <Card><Empty text="No FAQs match" /></Card> : (
        <div className="space-y-2">
          {rows.slice(0, 200).map((f) => (
            <Card key={f.id} className={cx('flex gap-3 p-3', sel.includes(f.id) && 'border-brand')}>
              <input type="checkbox" className="mt-1" checked={sel.includes(f.id)} onChange={() => setSel(sel.includes(f.id) ? sel.filter((x) => x !== f.id) : [...sel, f.id])} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{f.question}</span>
                  <Badge>{f.status}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{stripHtml(f.answer)}</p>
                <div className="mt-1.5 text-xs text-slate-400"><span className="capitalize">{f.entityType}</span>{f.entityType !== 'global' && ` · ${entityName(f) ?? '—'}`} · order {f.order}</div>
              </div>
              <div className="flex shrink-0 items-start gap-0.5">
                {can('faqs.edit') && <>
                  <Button size="sm" variant="ghost" title="Move up" onClick={() => move(f, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" title="Move down" onClick={() => move(f, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraft({ ...f })}><Pencil className="h-3.5 w-3.5" /></Button>
                </>}
                {can('faqs.delete') && <Button size="sm" variant="ghost" onClick={async () => { if (await confirm('Delete this FAQ?')) { remove('faqs', f.id); toast('FAQ deleted'); } }}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>}
              </div>
            </Card>
          ))}
          {rows.length > 200 && <p className="text-center text-xs text-slate-400">Showing first 200 — narrow the filters.</p>}
        </div>
      )}
      <Sheet open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit FAQ' : 'New FAQ'}
        footer={<><Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button><Button onClick={save}>Save FAQ</Button></>}>
        {draft && (
          <div className="space-y-4">
            <Field label="Question"><Input value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} /></Field>
            <Field label="Answer"><RichText value={draft.answer} onChange={(answer) => setDraft((d) => d && { ...d, answer })} minHeight={140} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Belongs to"><Select value={draft.entityType} onChange={(e) => setDraft({ ...draft, entityType: e.target.value as Faq['entityType'], entityId: null })} options={TYPES.map((t) => ({ value: t, label: t }))} /></Field>
              {draft.entityType !== 'global' && <Field label="Item"><Select value={draft.entityId ?? ''} onChange={(e) => setDraft({ ...draft, entityId: e.target.value ? +e.target.value : null })} options={draftOpts} placeholder="Select…" /></Field>}
              <Field label="Order"><Input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: +e.target.value })} /></Field>
              <Field label="Status"><Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Faq['status'] })} options={['published', 'draft', 'archived'].map((s) => ({ value: s, label: s }))} /></Field>
            </div>
          </div>
        )}
      </Sheet>
      {node}
    </div>
  );
}
