import { Bookmark, BookmarkCheck, Download, GitCompareArrows, MapPin, Trophy } from 'lucide-react';
import type { Institute } from '../../data/types';
import { useStore } from '../../store';
import { Badge, Button, Img, Logo, Stars, cx } from '../../ui';
import { inr } from '../../lib/format';
import { PLink, ownershipLabel, useCity, useWebUi } from './common';

export function BookmarkButton({ inst, className }: { inst: Institute; className?: string }) {
  const marked = useStore((s) => (s.student?.bookmarks ?? s.guestBookmarks).includes(inst.id));
  const toggle = useStore((s) => s.toggleBookmark);
  const toast = useStore((s) => s.toast);
  return (
    <button title={marked ? 'Remove bookmark' : 'Bookmark'} onClick={(e) => { e.preventDefault(); toggle(inst.id); toast(marked ? 'Removed from bookmarks' : 'Saved to bookmarks', 'info'); }}
      className={cx('rounded-full p-2 transition cursor-pointer', marked ? 'bg-brand text-white' : 'bg-white/90 text-slate-600 hover:text-brand', className)}>
      {marked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
    </button>
  );
}

export function CompareButton({ inst, size = 'sm' }: { inst: Institute; size?: 'sm' | 'md' }) {
  const on = useStore((s) => s.compare.includes(inst.id));
  const toggle = useStore((s) => s.toggleCompare);
  return (
    <Button size={size} variant={on ? 'secondary' : 'outline'} onClick={(e) => { e.preventDefault(); toggle(inst.id); }}>
      <GitCompareArrows className="h-3.5 w-3.5" /> {on ? 'Added' : 'Compare'}
    </Button>
  );
}

/** College listing card used on home, listings, search, bookmarks. */
export function CollegeCard({ inst, rank, rankLabel }: { inst: Institute; rank?: number; rankLabel?: string }) {
  const place = useCity(inst);
  const bodies = useStore((s) => s.db.rankingBodies);
  const openLead = useWebUi((s) => s.openLead);
  const r = inst.rankings[0];
  const body = bodies.find((b) => b.id === r?.bodyId);
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <PLink to={`/college/${inst.slug}`} className="relative block">
        <Img src={inst.cover} alt={inst.name} className="h-36 w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <BookmarkButton inst={inst} className="absolute right-2 top-2" />
        {rank != null && <div className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-white">#{rank} {rankLabel}</div>}
        {inst.status !== 'published' && <div className="absolute left-2 bottom-2 rounded bg-amber-400 px-1.5 text-[10px] font-semibold uppercase">{inst.status.replace('_', ' ')}</div>}
        <Logo text={inst.logo} color={inst.brandColor} size={44} className="absolute -bottom-5 left-3 ring-2 ring-white" />
      </PLink>
      <div className="flex flex-1 flex-col p-4 pt-7">
        <PLink to={`/college/${inst.slug}`} className="line-clamp-2 font-semibold leading-snug text-slate-900 hover:text-brand">{inst.name}</PLink>
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{place} · {ownershipLabel(inst.ownership)}</div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <Stars value={inst.rating} /> <b>{inst.rating}</b><span className="text-slate-400">({inst.reviewCount})</span>
          <Badge tone="new" className="ml-auto normal-case">{inst.accreditation}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
          <div><div className="text-slate-500">Fees (total)</div><div className="font-semibold">{inr(inst.minFee)} – {inr(inst.maxFee)}</div></div>
          <div><div className="text-slate-500">Avg package</div><div className="font-semibold">₹{inst.avgPackageLpa} LPA</div></div>
        </div>
        {r && body && <div className="mt-2 flex items-center gap-1 text-xs text-slate-600"><Trophy className="h-3.5 w-3.5 text-amber-500" />#{r.rank} {body.shortName} {r.year} ({r.category})</div>}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button size="sm" variant="blue" className="flex-1" onClick={() => openLead({ source: 'apply-now', instituteId: inst.id })}>Apply Now</Button>
          <Button size="sm" className="flex-1" onClick={() => openLead({ source: 'brochure', instituteId: inst.id })}><Download className="h-3.5 w-3.5" /> Brochure</Button>
          <CompareButton inst={inst} />
        </div>
      </div>
    </div>
  );
}

/** Horizontal list-style card (used in listings on wide screens). */
export function CollegeRow({ inst, rank }: { inst: Institute; rank?: number }) {
  const place = useCity(inst);
  const openLead = useWebUi((s) => s.openLead);
  const courseCount = useStore((s) => s.db.courses.filter((c) => c.instituteId === inst.id && c.status === 'published').length);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:shadow-md sm:flex-row">
      <PLink to={`/college/${inst.slug}`} className="relative block shrink-0">
        <Img src={inst.cover} className="h-32 w-full rounded-xl sm:w-48" />
        {rank != null && <div className="absolute left-2 top-2 rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-white">#{rank}</div>}
      </PLink>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <Logo text={inst.logo} color={inst.brandColor} size={40} />
          <div className="min-w-0 flex-1">
            <PLink to={`/college/${inst.slug}`} className="font-semibold text-slate-900 hover:text-brand">{inst.name}</PLink>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{place}</span>·<span>{ownershipLabel(inst.ownership)}</span>·<span>Estd. {inst.establishedYear}</span>·<span>{inst.accreditation}</span>
            </div>
          </div>
          <BookmarkButton inst={inst} className="border border-slate-200" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div><div className="text-slate-500">Fees</div><div className="font-semibold">{inr(inst.minFee)} – {inr(inst.maxFee)}</div></div>
          <div><div className="text-slate-500">Avg package</div><div className="font-semibold">₹{inst.avgPackageLpa} LPA</div></div>
          <div><div className="text-slate-500">Rating</div><div className="flex items-center gap-1 font-semibold"><Stars value={inst.rating} />{inst.rating}</div></div>
          <div><div className="text-slate-500">Courses</div><div className="font-semibold">{courseCount}</div></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="blue" onClick={() => openLead({ source: 'apply-now', instituteId: inst.id })}>Apply Now</Button>
          <Button size="sm" onClick={() => openLead({ source: 'brochure', instituteId: inst.id })}><Download className="h-3.5 w-3.5" /> Brochure</Button>
          <CompareButton inst={inst} />
          <PLink to={`/college/${inst.slug}/courses`} className="ml-auto self-center text-xs font-medium text-brand hover:underline">Courses & Fees →</PLink>
        </div>
      </div>
    </div>
  );
}
