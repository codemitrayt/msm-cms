import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { Button, Field, Modal, Select } from '../../ui';
import type { Institute } from '../../data/types';
import { newCourse } from './courseFactory';

export function AddCourseModal({ inst, open, onClose, baseCourseId }: { inst: Institute; open: boolean; onClose: () => void; baseCourseId?: number }) {
  const db = useStore((s) => s.db);
  const add = useStore((s) => s.add);
  const toast = useStore((s) => s.toast);
  const log = useStore((s) => s.log);
  const nav = useNavigate();
  const [bc, setBc] = useState(baseCourseId ? String(baseCourseId) : '');
  const [sp, setSp] = useState('');
  const base = db.baseCourses.find((b) => b.id === Number(bc));
  const specs = db.specializations.filter((s) => s.baseCourseId === Number(bc));
  const create = (andEdit: boolean) => {
    if (!base) return toast('Pick a base course', 'error');
    const spec = specs.find((s) => s.id === Number(sp));
    const data = newCourse(inst, base, spec, db.exams.filter((e) => e.streamIds.includes(base.streamId)).slice(0, 1).map((e) => e.id));
    if (db.courses.some((c) => c.instituteId === inst.id && c.slug === data.slug)) return toast(`${data.name} already exists for ${inst.shortName}`, 'error');
    const c = add('courses', data);
    log('added course', `${c.name} (${inst.shortName})`, c.id);
    toast(`Added ${c.name}`);
    onClose(); setSp('');
    if (andEdit) nav(`/admin/courses/${inst.id}/${c.id}`);
  };
  const sorted = [...db.baseCourses].sort((a, b) => Number(inst.streamIds.includes(b.streamId)) - Number(inst.streamIds.includes(a.streamId)));
  return (
    <Modal open={open} onClose={onClose} title={`Add course to ${inst.shortName}`} size="sm"
      footer={<><Button variant="outline" onClick={() => create(false)}>Add</Button><Button onClick={() => create(true)}>Add & edit</Button></>}>
      <div className="space-y-3">
        <Field label="Base course"><Select value={bc} onChange={(e) => { setBc(e.target.value); setSp(''); }} placeholder="Select base course" options={sorted.map((b) => ({ value: b.id, label: `${b.shortName} — ${b.name}` }))} /></Field>
        <Field label="Specialization" hint={specs.length ? undefined : 'No specializations for this base course'}>
          <Select value={sp} disabled={!specs.length} onChange={(e) => setSp(e.target.value)} placeholder="None (general)" options={specs.map((s) => ({ value: s.id, label: s.name }))} />
        </Field>
      </div>
    </Modal>
  );
}
