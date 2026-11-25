import type { BaseCourse, Course, Institute, Specialization } from '../../data/types';
import { slugify } from '../../lib/format';

/** A sensible draft course for an institute from a base course (+ optional specialization). */
export function newCourse(inst: Institute, b: BaseCourse, sp: Specialization | null | undefined, examIds: number[] = []): Omit<Course, 'id'> {
  const name = sp ? `${b.shortName} in ${sp.name}` : b.shortName;
  const yearly = inst.minFee || 100000;
  return {
    instituteId: inst.id, baseCourseId: b.id, specializationId: sp?.id ?? null, name, slug: slugify(name),
    description: `${name} at ${inst.shortName}.`, streamId: b.streamId, modeId: 1, courseTypeId: 1,
    durationValue: b.durationYears, durationUnit: 'years', totalSeats: 60,
    fees: yearly * b.durationYears, tuitionFees: yearly * b.durationYears, hostelFees: 0, oneTimeFees: 0, feeForCommission: yearly,
    feeSchedule: Array.from({ length: b.durationYears }, (_, i) => ({ label: `Year ${i + 1}`, amount: yearly })), feeDiscountPercent: 0,
    tenthPercentage: null, twelfthPercentage: b.levelId === 1 ? 50 : null, ugPercentage: b.levelId === 2 ? 50 : null, examIds,
    averageSalaryLpa: null, highestSalaryLpa: null, status: 'draft', updatedAt: new Date().toISOString(),
  };
}
