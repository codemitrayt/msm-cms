// Dummy data for the prototype. Deterministic (seeded RNG) so every reset
// gives the same dataset. Names are realistic but this is NOT real data.
import type {
  Article, Author, BaseCourse, Career, City, Course, DB, EventItem, Exam, ExamPageSegment, Faq, Institute,
  Lead, LandingPage, Media, PressRelease, Review, State, Stream, Student, Tag, UpdateItem, ExamListing,
  PartnerInstitute, UploadJob, PredictorLead, ActivityLog, SiteConfig,
} from './types';

let s = 20261125;
const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const int = (a: number, b: number) => Math.floor(rnd() * (b - a + 1)) + a;
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const pickN = <T,>(arr: T[], n: number) => [...arr].sort(() => rnd() - 0.5).slice(0, n);
export const slugify = (t: string) => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const daysAgo = (d: number) => new Date(Date.UTC(2026, 10, 25) - d * 86400000).toISOString();
const daysAhead = (d: number) => new Date(Date.UTC(2026, 10, 25) + d * 86400000).toISOString().slice(0, 10);
const img = (seed: string, w = 1200, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const streams: Stream[] = [
  ['Engineering', 'Cpu'], ['Management', 'Briefcase'], ['Medical', 'Stethoscope'], ['Law', 'Scale'], ['Commerce', 'Calculator'],
  ['Science', 'FlaskConical'], ['Arts & Humanities', 'Palette'], ['Design', 'PenTool'], ['Computer Applications', 'Monitor'], ['Pharmacy', 'Pill'],
].map(([name, icon], i) => ({ id: i + 1, name, slug: slugify(name), icon }));

const stateCity: [string, string, string[]][] = [
  ['Maharashtra', 'West', ['Mumbai', 'Pune', 'Nagpur']],
  ['Delhi', 'North', ['New Delhi']],
  ['Karnataka', 'South', ['Bengaluru', 'Mysuru', 'Manipal']],
  ['Tamil Nadu', 'South', ['Chennai', 'Vellore', 'Coimbatore']],
  ['Uttar Pradesh', 'North', ['Noida', 'Lucknow', 'Greater Noida']],
  ['West Bengal', 'East', ['Kolkata', 'Kharagpur']],
  ['Telangana', 'South', ['Hyderabad']],
  ['Gujarat', 'West', ['Ahmedabad', 'Gandhinagar']],
  ['Rajasthan', 'North', ['Jaipur', 'Pilani']],
  ['Punjab', 'North', ['Mohali', 'Phagwara']],
];
export const states: State[] = stateCity.map(([name, zone], i) => ({ id: i + 1, name, slug: slugify(name), zone }));
export const cities: City[] = stateCity.flatMap(([, , cs], si) => cs.map((c) => ({ name: c, stateId: si + 1 }))).map((c, i) => ({ id: i + 1, ...c, slug: slugify(c.name) }));

const levels = ['UG', 'PG', 'Diploma', 'Doctorate', 'Certificate'].map((name, i) => ({ id: i + 1, name, slug: slugify(name) }));
const modes = ['Full Time', 'Part Time', 'Online', 'Distance'].map((name, i) => ({ id: i + 1, name, slug: slugify(name) }));
const courseTypes = ['Degree', 'Diploma', 'Certificate', 'Integrated'].map((name, i) => ({ id: i + 1, name, slug: slugify(name) }));

const bc: [string, string, number, number, number][] = [
  ['Bachelor of Technology', 'B.Tech', 1, 1, 4], ['Master of Technology', 'M.Tech', 1, 2, 2],
  ['Master of Business Administration', 'MBA', 2, 2, 2], ['Bachelor of Business Administration', 'BBA', 2, 1, 3],
  ['Post Graduate Diploma in Management', 'PGDM', 2, 2, 2], ['Bachelor of Medicine, Bachelor of Surgery', 'MBBS', 3, 1, 5],
  ['Bachelor of Dental Surgery', 'BDS', 3, 1, 5], ['Bachelor of Laws', 'LLB', 4, 1, 3], ['BA LLB', 'BA LLB', 4, 1, 5],
  ['Bachelor of Commerce', 'B.Com', 5, 1, 3], ['Master of Commerce', 'M.Com', 5, 2, 2], ['Bachelor of Science', 'B.Sc', 6, 1, 3],
  ['Master of Science', 'M.Sc', 6, 2, 2], ['Bachelor of Arts', 'BA', 7, 1, 3], ['Bachelor of Design', 'B.Des', 8, 1, 4],
  ['Bachelor of Computer Applications', 'BCA', 9, 1, 3], ['Master of Computer Applications', 'MCA', 9, 2, 2], ['Bachelor of Pharmacy', 'B.Pharm', 10, 1, 4],
];
export const baseCourses: BaseCourse[] = bc.map(([name, shortName, streamId, levelId, durationYears], i) => ({
  id: i + 1, name, shortName, slug: slugify(shortName), streamId, levelId, durationYears,
  description: `${shortName} (${name}) is a ${durationYears}-year ${levels[levelId - 1].name} programme in ${streams[streamId - 1].name}.`,
}));
const specNames: Record<string, string[]> = {
  'B.Tech': ['Computer Science', 'Electronics & Communication', 'Mechanical', 'Civil', 'Artificial Intelligence & Data Science'],
  MBA: ['Finance', 'Marketing', 'Human Resources', 'Business Analytics', 'Operations'],
  BBA: ['General', 'Digital Marketing'], 'M.Tech': ['VLSI', 'Structural Engineering'], 'B.Sc': ['Physics', 'Chemistry', 'Data Science'],
  BCA: ['Cloud Computing', 'Cyber Security'], 'B.Des': ['Fashion Design', 'UX Design', 'Interior Design'], 'B.Com': ['Honours', 'Accounting & Finance'],
};
let specId = 0;
const specializations = baseCourses.flatMap((b) => (specNames[b.shortName] ?? []).map((name) => ({ id: ++specId, name, slug: slugify(name), baseCourseId: b.id })));

const rankingBodies = [['National Institutional Ranking Framework', 'NIRF'], ['India Today', 'India Today'], ['Outlook', 'Outlook'], ['QS World University Rankings', 'QS'], ['The Week', 'The Week']]
  .map(([name, shortName], i) => ({ id: i + 1, name, shortName, slug: slugify(shortName) }));
const authorities = [['University Grants Commission', 'UGC'], ['All India Council for Technical Education', 'AICTE'], ['National Medical Commission', 'NMC'], ['Bar Council of India', 'BCI'], ['Pharmacy Council of India', 'PCI'], ['Council of Architecture', 'COA']]
  .map(([name, shortName], i) => ({ id: i + 1, name, shortName, slug: slugify(shortName) }));
const amenities = [['Hostel', 'BedDouble'], ['Library', 'Library'], ['Wi-Fi Campus', 'Wifi'], ['Sports Complex', 'Trophy'], ['Cafeteria', 'Coffee'], ['Gym', 'Dumbbell'], ['Medical Centre', 'HeartPulse'], ['Labs', 'FlaskConical'], ['Auditorium', 'Theater'], ['Transport', 'Bus']]
  .map(([name, icon], i) => ({ id: i + 1, name, icon, slug: slugify(name) }));
const companies = ['Google', 'Microsoft', 'Amazon', 'Deloitte', 'TCS', 'Infosys', 'Accenture', 'Goldman Sachs', 'McKinsey', 'Flipkart', 'Wipro', 'HDFC Bank', 'EY', 'KPMG', 'Adobe', 'Samsung']
  .map((name, i) => ({ id: i + 1, name, slug: slugify(name) }));

const instSpec: [string, string, Institute['type'], Institute['ownership'], string, number[]][] = [
  ['Indian Institute of Technology Bombay', 'IIT Bombay', 'institute', 'government', 'Mumbai', [1, 6, 8]],
  ['Indian Institute of Technology Delhi', 'IIT Delhi', 'institute', 'government', 'New Delhi', [1, 6, 2]],
  ['Indian Institute of Management Ahmedabad', 'IIM Ahmedabad', 'institute', 'government', 'Ahmedabad', [2]],
  ['Indian Institute of Management Bangalore', 'IIM Bangalore', 'institute', 'government', 'Bengaluru', [2]],
  ['All India Institute of Medical Sciences', 'AIIMS Delhi', 'institute', 'government', 'New Delhi', [3]],
  ['National Law School of India University', 'NLSIU', 'university', 'government', 'Bengaluru', [4]],
  ['Vellore Institute of Technology', 'VIT Vellore', 'university', 'deemed', 'Vellore', [1, 2, 6, 9]],
  ['Manipal Academy of Higher Education', 'MAHE', 'university', 'deemed', 'Manipal', [1, 3, 2, 10, 8]],
  ['Birla Institute of Technology and Science', 'BITS Pilani', 'university', 'deemed', 'Pilani', [1, 6, 10]],
  ['Symbiosis International University', 'SIU Pune', 'university', 'deemed', 'Pune', [2, 4, 8, 7, 9]],
  ['Amity University Noida', 'Amity Noida', 'university', 'private', 'Noida', [1, 2, 4, 5, 7, 9]],
  ['Lovely Professional University', 'LPU', 'university', 'private', 'Phagwara', [1, 2, 5, 9, 10, 8]],
  ['SRM Institute of Science and Technology', 'SRM Chennai', 'university', 'deemed', 'Chennai', [1, 3, 2, 9]],
  ['Christ University', 'Christ', 'university', 'deemed', 'Bengaluru', [2, 5, 7, 6, 4]],
  ['Jadavpur University', 'JU', 'university', 'government', 'Kolkata', [1, 7, 6]],
  ['Indian Institute of Technology Kharagpur', 'IIT Kharagpur', 'institute', 'government', 'Kharagpur', [1, 2, 4]],
  ['University of Hyderabad', 'UoH', 'university', 'government', 'Hyderabad', [6, 7, 2]],
  ['Chandigarh University', 'CU', 'university', 'private', 'Mohali', [1, 2, 9, 10, 5]],
  ['Sharda University', 'Sharda', 'university', 'private', 'Greater Noida', [1, 3, 2, 4, 9]],
  ['NMIMS University', 'NMIMS Mumbai', 'university', 'deemed', 'Mumbai', [2, 1, 5, 4]],
  ['Delhi Technological University', 'DTU', 'university', 'government', 'New Delhi', [1, 2]],
  ['National Institute of Design', 'NID Ahmedabad', 'institute', 'government', 'Ahmedabad', [8]],
  ['Shri Ram College of Commerce', 'SRCC', 'college', 'government', 'New Delhi', [5, 7]],
  ['St. Xavier\'s College', 'St. Xavier\'s Mumbai', 'college', 'private', 'Mumbai', [5, 6, 7]],
  ['Loyola College', 'Loyola Chennai', 'college', 'private', 'Chennai', [5, 6, 7, 9]],
  ['PSG College of Technology', 'PSG Tech', 'college', 'private', 'Coimbatore', [1, 9]],
  ['MIT World Peace University', 'MIT-WPU', 'university', 'private', 'Pune', [1, 2, 8, 4, 10]],
  ['Jaipur National University', 'JNU Jaipur', 'university', 'private', 'Jaipur', [1, 3, 10, 2]],
  ['Amity University Lucknow', 'Amity Lucknow', 'university', 'private', 'Lucknow', [2, 5, 9]],
  ['Nirma University', 'Nirma', 'university', 'private', 'Ahmedabad', [1, 2, 4, 10]],
  ['RV College of Engineering', 'RVCE', 'college', 'private', 'Bengaluru', [1]],
  ['Institute of Chemical Technology', 'ICT Mumbai', 'institute', 'government', 'Mumbai', [1, 10, 6]],
  ['Osmania University', 'OU', 'university', 'government', 'Hyderabad', [1, 7, 5, 6]],
  ['Banasthali Vidyapith', 'Banasthali', 'university', 'deemed', 'Jaipur', [6, 7, 9]],
  ['Thapar Institute of Engineering and Technology', 'Thapar', 'university', 'deemed', 'Mohali', [1, 2]],
  ['Visvesvaraya National Institute of Technology', 'VNIT', 'institute', 'government', 'Nagpur', [1]],
];

const colors = ['#fa0000', '#1f5eff', '#0f766e', '#7c3aed', '#c2410c', '#0369a1', '#be123c', '#15803d', '#a16207', '#4338ca'];
const sectionHtml = (inst: string, title: string) => `<p>${inst} follows a transparent ${title.toLowerCase()} process. The details below are indicative and updated every academic year.</p><h3>Key highlights</h3><ul><li>Online application through the official portal</li><li>Merit list published on the college website</li><li>Document verification at the campus</li></ul><p>For any queries students can reach the admission cell between 10 AM and 5 PM on working days.</p>`;

export const institutes: Institute[] = instSpec.map(([name, shortName, type, ownership, cityName, streamIds], i) => {
  const city = cities.find((c) => c.name === cityName)!;
  const govt = ownership === 'government';
  const minFee = govt ? int(20, 120) * 1000 : int(150, 400) * 1000;
  const id = i + 1;
  const est = govt ? int(1940, 1995) : int(1985, 2015);
  const statusPool: Institute['status'][] = ['published', 'published', 'published', 'published', 'draft', 'in_review'];
  return {
    id, name, shortName, slug: slugify(shortName), type, ownership,
    status: i < 30 ? 'published' : pick(statusPool),
    establishedYear: est,
    isAutonomous: rnd() > 0.4,
    isPartner: !govt && rnd() > 0.35,
    onlineCourses: !govt && rnd() > 0.5,
    authorityIds: streamIds.includes(3) ? [1, 3] : streamIds.includes(1) ? [1, 2] : [1],
    accreditation: pick(['NAAC A++', 'NAAC A+', 'NAAC A', 'NBA Accredited', 'NAAC B++']),
    email: `admissions@${slugify(shortName)}.edu.in`,
    phone: `+91 ${int(70000, 99999)} ${int(10000, 99999)}`,
    website: `https://www.${slugify(shortName)}.edu.in`,
    stateId: city.stateId, cityId: city.id,
    campusAddress: `${int(1, 200)}, ${pick(['University Road', 'Knowledge Park', 'Main Campus Road', 'Education Hub'])}, ${cityName}`,
    pincode: String(int(110001, 799999)),
    latitude: 12 + rnd() * 16, longitude: 72 + rnd() * 16,
    campusSize: `${int(20, 600)} acres`,
    streamIds, amenityIds: pickN(amenities.map((a) => a.id), int(5, 10)),
    rankings: rankingBodies.slice(0, 3).map((b) => ({ bodyId: b.id, year: 2026, rank: Math.max(1, i + int(-2, 8)), category: streams[streamIds[0] - 1].name })),
    rating: Math.round((3.6 + rnd() * 1.3) * 10) / 10,
    reviewCount: int(40, 900),
    minFee, maxFee: minFee * int(3, 8),
    avgPackageLpa: Math.round((govt ? 12 + rnd() * 18 : 5 + rnd() * 8) * 10) / 10,
    highestPackageLpa: Math.round((govt ? 45 + rnd() * 120 : 20 + rnd() * 40) * 10) / 10,
    placementPercent: int(72, 99),
    topRecruiterIds: pickN(companies.map((c) => c.id), 8),
    brandColor: colors[i % colors.length],
    logo: shortName.replace(/[^A-Z]/g, '').slice(0, 3) || shortName.slice(0, 2).toUpperCase(),
    cover: img(`campus-${id}`),
    gallery: Array.from({ length: 8 }, (_, g) => ({ id: g + 1, url: img(`inst-${id}-${g}`, 800, 600), caption: pick(['Main building', 'Library', 'Hostel', 'Sports ground', 'Convocation', 'Labs', 'Cafeteria', 'Auditorium']), album: pick(['Campus', 'Events', 'Infrastructure']) })),
    about: `<p><strong>${name}</strong> (${shortName}), established in ${est}, is a ${ownership.replace('_', '-')} ${type} located in ${cityName}. It is recognised by ${streamIds.includes(3) ? 'UGC and NMC' : 'UGC and AICTE'} and is known for its academic rigour, research output and strong industry connect.</p><p>The campus spreads across a green, well-connected campus with modern labs, residential facilities and an active student community with 40+ clubs.</p><h3>Why choose ${shortName}?</h3><ul><li>Consistently ranked among the top institutions in India</li><li>Excellent placement record with leading recruiters</li><li>Industry-aligned curriculum and international exchange programmes</li></ul>`,
    sections: ['Admission', 'Scholarship', 'How to reach', 'Cut-off', 'Placement', 'Counsellor', 'Ranking', 'Fees'].map((t) => ({ key: slugify(t), title: `${shortName} ${t} 2026`, content: t === 'Counsellor' ? `<p>Internal notes for counsellors: ${shortName} prefers students with 70%+ in 12th. Hostel seats fill fast — push early applications.</p>` : sectionHtml(shortName, t) })),
    placementData: [2022, 2023, 2024, 2025].map((year) => { const total = int(300, 1500); return { year, total, placed: Math.round(total * (0.75 + rnd() * 0.22)), median: Math.round((govt ? 14 : 6) + rnd() * 8), highest: Math.round((govt ? 60 : 25) + rnd() * 60) }; }),
    cutoffData: [],
    seo: { title: `${shortName}: Courses, Fees, Admission 2026, Placements, Ranking`, description: `${name} — check courses, fees, cut-off, placements, rankings and admission process for 2026.`, keywords: `${shortName}, ${shortName} fees, ${shortName} admission` },
    views: int(2000, 250000),
    authorId: int(1, 5),
    updatedAt: daysAgo(int(0, 60)),
    publishedAt: daysAgo(int(60, 400)),
    score: int(55, 98),
  };
});

let courseId = 0;
export const courses: Course[] = institutes.flatMap((inst) => {
  const bcs = baseCourses.filter((b) => inst.streamIds.includes(b.streamId));
  return bcs.flatMap((b) => {
    const specs = specializations.filter((sp) => sp.baseCourseId === b.id);
    const chosen = specs.length ? pickN(specs, Math.min(specs.length, int(1, 3))) : [null];
    return chosen.map((sp) => {
      const yearly = Math.round((inst.minFee + rnd() * (inst.maxFee - inst.minFee) / 3) / 1000) * 1000;
      const total = yearly * b.durationYears;
      const name = sp ? `${b.shortName} in ${sp.name}` : b.shortName;
      return {
        id: ++courseId, instituteId: inst.id, baseCourseId: b.id, specializationId: sp?.id ?? null, name, slug: slugify(name),
        description: `${name} at ${inst.shortName} is a ${b.durationYears}-year programme with a strong focus on practical learning, internships and industry projects.`,
        streamId: b.streamId, modeId: inst.onlineCourses && rnd() > 0.7 ? 3 : 1, courseTypeId: 1,
        durationValue: b.durationYears, durationUnit: 'years' as const, totalSeats: int(30, 240),
        fees: total, tuitionFees: Math.round(total * 0.8), hostelFees: int(60, 160) * 1000, oneTimeFees: int(10, 50) * 1000,
        feeForCommission: yearly,
        feeSchedule: Array.from({ length: b.durationYears }, (_, y) => ({ label: `Year ${y + 1}`, amount: yearly })),
        feeDiscountPercent: rnd() > 0.7 ? int(5, 20) : 0,
        tenthPercentage: b.levelId === 1 ? int(50, 75) : null, twelfthPercentage: b.levelId === 1 ? int(50, 80) : null, ugPercentage: b.levelId === 2 ? int(50, 60) : null,
        examIds: [],
        averageSalaryLpa: Math.round(inst.avgPackageLpa * (0.8 + rnd() * 0.4) * 10) / 10,
        highestSalaryLpa: Math.round(inst.highestPackageLpa * (0.6 + rnd() * 0.4) * 10) / 10,
        status: pick(['published', 'published', 'published', 'draft', 'pending']) as Course['status'],
        updatedAt: daysAgo(int(0, 90)),
      };
    });
  });
});

const segKeys = ['overview', 'registration', 'syllabus', 'exam-pattern', 'dates', 'results', 'cut-offs', 'admit-card', 'answer-key', 'question-papers', 'fees', 'books'];
const segTitle = (k: string) => k.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const examSpec: [string, string, string, Exam['level'], number[], number, number][] = [
  ['JEE Main', 'Joint Entrance Examination Main', 'National Testing Agency', 'national', [1], 300, 1400000],
  ['JEE Advanced', 'Joint Entrance Examination Advanced', 'IIT Roorkee', 'national', [1], 360, 180000],
  ['NEET UG', 'National Eligibility cum Entrance Test (UG)', 'National Testing Agency', 'national', [3], 720, 2300000],
  ['CAT', 'Common Admission Test', 'IIM Kozhikode', 'national', [2], 198, 330000],
  ['CLAT', 'Common Law Admission Test', 'Consortium of NLUs', 'national', [4], 120, 70000],
  ['CUET UG', 'Common University Entrance Test (UG)', 'National Testing Agency', 'national', [5, 6, 7], 800, 1400000],
  ['GATE', 'Graduate Aptitude Test in Engineering', 'IISc Bangalore', 'national', [1], 100, 800000],
  ['MHT CET', 'Maharashtra Common Entrance Test', 'State CET Cell Maharashtra', 'state', [1, 10], 200, 600000],
  ['XAT', 'Xavier Aptitude Test', 'XLRI Jamshedpur', 'national', [2], 100, 100000],
  ['NID DAT', 'NID Design Aptitude Test', 'National Institute of Design', 'national', [8], 100, 30000],
  ['VITEEE', 'VIT Engineering Entrance Exam', 'VIT University', 'university', [1], 125, 250000],
  ['KCET', 'Karnataka Common Entrance Test', 'Karnataka Examinations Authority', 'state', [1, 10], 180, 300000],
];
export const exams: Exam[] = examSpec.map(([shortName, fullName, body, level, streamIds, maxScore, totalCandidates], i) => ({
  id: i + 1, name: shortName, shortName, slug: slugify(shortName), fullName, conductingBody: body, level,
  mode: pick(['online', 'online', 'offline', 'hybrid']) as Exam['mode'], streamIds, frequency: pick(['Once a year', 'Twice a year']),
  applicationFee: pick([500, 1000, 1500, 2400, 3500]), participatingColleges: int(20, 1500), registrations: totalCandidates,
  status: i < 10 ? 'published' : 'draft', logo: shortName.replace(/\s/g, '').slice(0, 4).toUpperCase(),
  summary: `${shortName} (${fullName}) is a ${level}-level entrance exam conducted by ${body} for admission to ${streams[streamIds[0] - 1].name.toLowerCase()} programmes.`,
  pages: segKeys.map((k): ExamPageSegment => ({
    key: k, title: `${shortName} ${segTitle(k)} 2027`, status: k === 'books' && i % 2 ? 'draft' : 'published',
    content: k === 'exam-pattern'
      ? `<p>The ${shortName} 2027 exam pattern is given below.</p><table><tr><th>Section</th><th>Questions</th><th>Marks</th></tr><tr><td>Section A</td><td>${int(20, 40)}</td><td>${int(60, 120)}</td></tr><tr><td>Section B</td><td>${int(20, 40)}</td><td>${int(60, 120)}</td></tr><tr><td>Section C</td><td>${int(20, 40)}</td><td>${int(60, 120)}</td></tr></table><p>Negative marking of 1 mark applies for every wrong answer.</p>`
      : `<p>${shortName} 2027 ${segTitle(k).toLowerCase()}: everything candidates need to know. ${fullName} is conducted by ${body}.</p><h3>Important points</h3><ul><li>Check the official notification before applying</li><li>Keep your documents ready in the prescribed format</li><li>Follow updates on this page — we refresh it as soon as the authority announces changes</li></ul>`,
  })),
  dates: [['Application form release', 10, 0], ['Last date to apply', 40, 0], ['Admit card', 70, 0], ['Exam date', 85, 2], ['Answer key', 95, 0], ['Result', 110, 0]].map(([event, d, len], k) => ({
    id: k + 1, event: event as string, start: daysAhead((d as number) + i * 3), end: len ? daysAhead((d as number) + i * 3 + (len as number)) : null, tentative: k > 2,
  })),
  questionPapers: [2025, 2024, 2023].map((year, q) => ({ id: q + 1, year, title: `${shortName} ${year} Question Paper with Solutions`, url: '#' })),
  hasCollegePredictor: i < 8, hasPercentilePredictor: [0, 3, 5, 7].includes(i), hasRankPredictor: [0, 2, 6].includes(i),
  maxScore, totalCandidates, updatedAt: daysAgo(int(0, 30)),
}));

// Course → accepted exams, and cut-off rows for predictors.
for (const c of courses) {
  const ex = exams.filter((e) => e.streamIds.includes(c.streamId));
  c.examIds = pickN(ex.map((e) => e.id), Math.min(ex.length, 2));
}
for (const inst of institutes) {
  const ex = exams.filter((e) => e.streamIds.some((sid) => inst.streamIds.includes(sid)) && e.hasCollegePredictor);
  for (const e of ex.slice(0, 2)) {
    const instCourses = courses.filter((c) => c.instituteId === inst.id && c.examIds.includes(e.id)).slice(0, 3);
    for (const c of instCourses) for (const cat of ['General', 'OBC', 'SC']) for (const year of [2025, 2024]) {
      const base = Math.max(50, Math.round(inst.score * 1000 * (1 - inst.score / 110) + rnd() * 3000));
      const mult = cat === 'General' ? 1 : cat === 'OBC' ? 2.2 : 6;
      const closing = Math.round(base * mult);
      inst.cutoffData.push({ examId: e.id, year, course: c.name, category: cat, round: 1, opening: Math.max(1, Math.round(closing * 0.4)), closing });
    }
  }
}

export const authors: Author[] = [
  ['Ananya Sharma', 'Senior Education Editor'], ['Rohit Verma', 'Exam Expert'], ['Priya Nair', 'Content Writer'], ['Karan Mehta', 'Career Counsellor'], ['Sneha Iyer', 'Admissions Analyst'],
].map(([name, designation], i) => ({ id: i + 1, name, designation, slug: slugify(name), bio: `${name} is a ${designation.toLowerCase()} at MSM Unify with ${int(4, 12)} years of experience helping students make informed choices about colleges, exams and careers.`, avatar: `https://i.pravatar.cc/200?img=${i + 11}`, email: `${slugify(name).split('-')[0]}@msmunify.com`, linkedin: '#' }));

export const tags: Tag[] = ['Admission 2026', 'Engineering', 'MBA', 'Medical', 'Scholarships', 'Study Tips', 'Results', 'Placements', 'Career Guidance', 'Rankings', 'Counselling', 'Law']
  .map((name, i) => ({ id: i + 1, name, slug: slugify(name), color: colors[i % colors.length] }));

const articleTitles = [
  'JEE Main 2027 Registration Begins: Steps to Apply, Fees and Documents', 'Top 10 MBA Colleges in India Accepting CAT Scores', 'NEET UG 2027 Syllabus: Chapter-wise Weightage and Preparation Tips',
  'How to Choose Between B.Tech CSE and AI & Data Science', 'IIT Bombay Placements 2026: Highest Package Crosses 3 Crore', 'CUET UG 2027: Complete Guide for Delhi University Admissions',
  'Scholarships for Engineering Students in India: Full List 2026', 'CLAT 2027 Exam Pattern Changes Explained', 'Best Colleges for BBA in Bengaluru: Fees and Placements',
  'GATE 2027 Admit Card Release Date and Download Steps', 'Study Plan for CAT 2027: 6 Months to 99 Percentile', 'MBBS Abroad vs India: Cost, Quality and Career',
  'NIRF Ranking 2026: Top Universities, Colleges and Institutes', 'What Is a Good Percentile in JEE Main?', 'Career Options After 12th Commerce Without Maths',
  'VITEEE 2027 Slot Booking and Counselling Process', 'Design Careers: How to Crack NID DAT', 'Education Loans: Interest Rates and Eligibility 2026',
  'MHT CET 2027 Cut-off for Top Pune Colleges', 'Is an Online MBA Worth It in 2026?', 'XAT vs CAT: Which Exam Should You Take?', 'Hostel Life Survival Guide for Freshers',
  'Chandigarh University Admission 2026 Open: Dates and Process', 'Top Law Colleges in India Without CLAT', 'KCET 2027 Rank Predictor: How It Works',
  'Amity University Noida Fees Structure 2026', 'Symbiosis SET 2027: Eligibility and Pattern', 'B.Pharm vs Pharm.D: Differences and Scope',
];
export const articles: Article[] = articleTitles.map((title, i) => {
  const exam = exams.find((e) => title.includes(e.shortName));
  const inst = institutes.find((n) => title.includes(n.shortName.split(' ')[0]) && n.shortName.length > 3);
  const status: Article['status'] = i < 22 ? 'published' : pick(['draft', 'in_review', 'published']);
  return {
    id: i + 1, title, slug: slugify(title),
    excerpt: `${title.split(':')[0]} — read our detailed, updated guide with dates, eligibility and expert tips from MSM Unify.`,
    body: `<p>${title}. This article covers everything students and parents need to know, written and verified by our editorial team.</p><h2>Overview</h2><p>Every year lakhs of students look for reliable information. Below we break down the most important facts in simple language.</p><h2>Key dates</h2><table><tr><th>Event</th><th>Date</th></tr><tr><td>Notification</td><td>${daysAhead(5)}</td></tr><tr><td>Last date</td><td>${daysAhead(40)}</td></tr><tr><td>Result</td><td>${daysAhead(110)}</td></tr></table><h2>Expert tips</h2><ul><li>Start early and make a realistic timetable</li><li>Use official sources for notifications</li><li>Talk to a counsellor before finalising your shortlist</li></ul><p>Have questions? Use the <a href="#/talk-to-counsellor">Talk to Counsellor</a> option to get free guidance.</p>`,
    cover: img(`article-${i}`), authorId: (i % 5) + 1, tagIds: pickN(tags.map((t) => t.id), int(1, 3)),
    category: exam ? 'exam-news' : inst ? 'college-news' : pick(['blog', 'guide', 'news']),
    instituteId: inst?.id ?? null, examId: exam?.id ?? null, status, featured: i < 4,
    views: int(500, 90000), readMinutes: int(3, 12), publishedAt: status === 'published' ? daysAgo(i * 3 + int(0, 2)) : null, updatedAt: daysAgo(i * 2),
    seo: { title: title.slice(0, 60), description: `${title}. Updated guide by MSM Unify.` },
  };
});

const faqSeed: [string, string][] = [
  ['What is MSM Unify?', 'MSM Unify is a student-first platform to discover colleges, compare courses and fees, check exams and get free counselling.'],
  ['Is counselling on MSM Unify free?', 'Yes, counselling is completely free for students.'],
  ['How accurate is the college predictor?', 'The predictor uses previous years\' cut-off data. Treat results as indicative, not guaranteed.'],
  ['Can I apply to colleges directly from MSM Unify?', 'Yes. Use the Apply Now button on a college page and our team will help you complete the application.'],
  ['How do I compare colleges?', 'Add up to 4 colleges to compare from any college card, then open the Compare page.'],
  ['Are the fees shown final?', 'Fees are taken from official sources and may change. Always confirm with the college.'],
];
export const faqs: Faq[] = [
  ...faqSeed.map(([question, answer], i) => ({ id: i + 1, question, answer, entityType: 'global' as const, entityId: null, order: i + 1, status: 'published' as const })),
  ...institutes.slice(0, 20).flatMap((inst, k) => [
    { q: `What is the fee of ${inst.shortName}?`, a: `Fees at ${inst.shortName} range from ₹${(inst.minFee / 100000).toFixed(1)} L to ₹${(inst.maxFee / 100000).toFixed(1)} L depending on the course.` },
    { q: `Is ${inst.shortName} good for placements?`, a: `${inst.shortName} has a ${inst.placementPercent}% placement rate with an average package of ₹${inst.avgPackageLpa} LPA.` },
    { q: `Does ${inst.shortName} provide hostel?`, a: `Yes, separate hostels are available for boys and girls.` },
  ].map((f, j) => ({ id: 100 + k * 3 + j, question: f.q, answer: f.a, entityType: 'institute' as const, entityId: inst.id, order: j + 1, status: 'published' as const }))),
  ...exams.flatMap((e, k) => [
    { q: `When is ${e.shortName} 2027?`, a: `${e.shortName} 2027 is expected on ${e.dates[3].start}. Official dates are announced by ${e.conductingBody}.` },
    { q: `What is the application fee of ${e.shortName}?`, a: `The application fee is ₹${e.applicationFee} for general category candidates.` },
  ].map((f, j) => ({ id: 300 + k * 2 + j, question: f.q, answer: f.a, entityType: 'exam' as const, entityId: e.id, order: j + 1, status: 'published' as const }))),
];

export const landingPages: LandingPage[] = [
  ['ranking', 'Top Engineering Colleges in India 2026', 1, null, null, 1], ['ranking', 'Top MBA Colleges in India 2026', 2, null, null, 1],
  ['ranking', 'Top Medical Colleges in India 2026', 3, null, null, 1], ['ranking', 'Top Law Colleges in India 2026', 4, null, null, 1],
  ['category', 'Engineering Colleges in India', 1, null, null, null], ['category', 'MBA Colleges in India', 2, null, null, null],
  ['category', 'Colleges in Bengaluru', null, 3, null, null], ['category', 'Private Colleges in Maharashtra', null, null, 1, null],
  ['category', 'B.Tech Colleges in India', 1, null, null, null], ['category', 'Colleges in Delhi NCR', null, null, 2, null],
  ['category', 'Commerce Colleges in India', 5, null, null, null], ['ranking', 'Top Design Colleges in India 2026', 8, null, null, 1],
].map(([kind, title, streamId, cityId, stateId, rankingBodyId], i) => ({
  id: i + 1, kind: kind as LandingPage['kind'], title: title as string, slug: slugify((title as string).replace(/ 2026$/, '')),
  intro: `<p>Explore the ${(title as string).toLowerCase()} with fees, rankings, placements, cut-offs and reviews — all in one place. The list is updated for the 2026 admission cycle.</p>`,
  streamId: streamId as number | null, baseCourseId: title === 'B.Tech Colleges in India' ? 1 : null, stateId: stateId as number | null, cityId: cityId as number | null,
  rankingBodyId: rankingBodyId as number | null, ownership: title === 'Private Colleges in Maharashtra' ? 'private' : null, pinnedInstituteIds: [],
  status: i < 11 ? 'published' : 'draft', seo: { title: title as string, description: `${title}: fees, rankings, placements and admission.` }, updatedAt: daysAgo(int(0, 40)),
}));

export const examListings: ExamListing[] = [
  ['Engineering Entrance Exams in India', 1, null], ['Management Entrance Exams', 2, null], ['Medical Entrance Exams', 3, null], ['National Level Entrance Exams', null, 'national'], ['State Level Entrance Exams', null, 'state'],
].map(([title, streamId, level], i) => ({
  id: i + 1, title: title as string, slug: slugify(title as string), intro: `<p>Complete list of ${(title as string).toLowerCase()} 2027 with dates, eligibility and application details.</p>`,
  streamId: streamId as number | null, level: level as Exam['level'] | null,
  examIds: exams.filter((e) => (streamId ? e.streamIds.includes(streamId as number) : true) && (level ? e.level === level : true)).map((e) => e.id),
  status: 'published', updatedAt: daysAgo(int(0, 20)),
}));

export const events: EventItem[] = [
  ...exams.slice(0, 8).map((e, i) => ({ id: i + 1, title: `${e.shortName} 2027 — Last date to apply`, instituteId: null, examId: e.id, date: e.dates[1].start, endDate: null, type: 'deadline' as const, link: `#/exams/${e.slug}`, status: 'published' as const })),
  ...institutes.slice(0, 8).map((n, i) => ({ id: 20 + i, title: `${n.shortName} Admission Open House`, instituteId: n.id, examId: null, date: daysAhead(int(3, 45)), endDate: null, type: pick(['admission', 'webinar', 'fair']) as EventItem['type'], link: `#/college/${n.slug}`, status: 'published' as const })),
];
export const updates: UpdateItem[] = [
  ...exams.slice(0, 6).map((e, i) => ({ id: i + 1, title: `${e.shortName} 2027 application window opens`, body: `${e.conductingBody} has opened applications for ${e.shortName} 2027.`, instituteId: null, examId: e.id, pinned: i === 0, status: 'published' as const, createdAt: daysAgo(i) })),
  ...institutes.slice(0, 10).map((n, i) => ({ id: 20 + i, title: `${n.shortName} admissions 2026 open for ${pick(['B.Tech', 'MBA', 'BBA', 'B.Sc', 'MBBS'])}`, body: `${n.name} has released its admission notification for the 2026–27 session.`, instituteId: n.id, examId: null, pinned: false, status: 'published' as const, createdAt: daysAgo(i * 2) })),
];

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Diya', 'Ishaan', 'Saanvi', 'Arjun', 'Ananya', 'Kabir', 'Myra', 'Reyansh', 'Aadhya', 'Vihaan', 'Kiara', 'Rohan', 'Meera', 'Krish', 'Riya', 'Aryan', 'Navya'];
const lastNames = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Reddy', 'Iyer', 'Khan', 'Das', 'Joshi', 'Nair', 'Mehta', 'Rao'];
const sources: Lead['source'][] = ['talk-to-counsellor', 'apply-now', 'brochure', 'predictor', 'contact', 'signup', 'compare'];
export const leads: Lead[] = Array.from({ length: 80 }, (_, i) => {
  const fn = pick(firstNames); const ln = pick(lastNames); const inst = rnd() > 0.3 ? pick(institutes) : null; const city = pick(cities);
  return {
    id: i + 1, name: `${fn} ${ln}`, email: `${fn.toLowerCase()}.${ln.toLowerCase()}${int(1, 99)}@gmail.com`, phone: `+91 9${int(100000000, 999999999)}`,
    stateId: city.stateId, cityId: city.id, courseInterest: pick(baseCourses).shortName, instituteId: inst?.id ?? null,
    source: pick(sources), page: inst ? `/college/${inst.slug}` : pick(['/', '/colleges/engineering-colleges-in-india', '/exams/jee-main']),
    status: pick(['new', 'new', 'contacted', 'interested', 'not-interested', 'converted']) as Lead['status'], pushedToCrm: rnd() > 0.4, notes: '', createdAt: daysAgo(i * 0.4),
  };
});
export const predictorLeads: PredictorLead[] = Array.from({ length: 30 }, (_, i) => {
  const e = pick(exams.filter((x) => x.hasCollegePredictor));
  return { id: i + 1, name: `${pick(firstNames)} ${pick(lastNames)}`, phone: `+91 9${int(100000000, 999999999)}`, examId: e.id, predictor: pick(['college', 'percentile', 'rank']) as PredictorLead['predictor'], input: `Score ${int(40, e.maxScore)}`, result: `${int(3, 40)} colleges`, createdAt: daysAgo(i * 0.7) };
});
export const students: Student[] = Array.from({ length: 40 }, (_, i) => {
  const fn = pick(firstNames); const ln = pick(lastNames);
  return {
    id: i + 1, name: `${fn} ${ln}`, email: `${fn.toLowerCase()}${i}@gmail.com`, phone: `+91 9${int(100000000, 999999999)}`, cityId: pick(cities).id, preferredStreamId: pick(streams).id,
    qualification: pick(['12th Pass', '12th Appearing', 'Graduate', 'Diploma']), bookmarks: pickN(institutes.map((n) => n.id), int(0, 5)), compared: [],
    activity: Array.from({ length: int(3, 10) }, (_, k) => { const n = pick(institutes); return { at: daysAgo(k * 0.5 + i * 0.1), action: pick(['Viewed college', 'Bookmarked', 'Downloaded brochure', 'Used predictor', 'Compared colleges', 'Viewed exam']), target: n.shortName }; }),
    verified: rnd() > 0.3, createdAt: daysAgo(int(1, 200)), lastSeenAt: daysAgo(int(0, 20)),
  };
});

export const roles = [
  { id: 1, name: 'Super Admin', description: 'Full access to everything', permissions: ['*'], system: true },
  { id: 2, name: 'Content Manager', description: 'Manage institutes, courses, exams, articles and pages', permissions: ['institutes.*', 'courses.*', 'exams.*', 'articles.*', 'landing_pages.*', 'faqs.*', 'media.*', 'tags.*', 'authors.*'], system: false },
  { id: 3, name: 'Content Writer', description: 'Create and edit drafts; cannot publish', permissions: ['institutes.view', 'institutes.edit', 'articles.view', 'articles.create', 'articles.edit', 'exams.view', 'exams.edit', 'media.*'], system: false },
  { id: 4, name: 'Lead Manager', description: 'View and export enquiries', permissions: ['leads.*', 'students.view'], system: false },
  { id: 5, name: 'SEO Manager', description: 'SEO fields, templates and link status', permissions: ['seo.*', 'institutes.view', 'articles.view', 'landing_pages.*', 'link_status.view'], system: false },
];
export const PERMISSION_MODULES = ['institutes', 'courses', 'base_courses', 'exams', 'articles', 'landing_pages', 'exam_listings', 'events', 'updates', 'uploads', 'partner_institutes', 'press_releases', 'careers', 'leads', 'students', 'faqs', 'tags', 'authors', 'media', 'users', 'roles', 'config', 'seo', 'link_status', 'mcp'];
export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'publish', 'delete'];

export const users = [
  ['Naman Admin', 'admin@msmunify.com', 1], ['Ananya Sharma', 'ananya@msmunify.com', 2], ['Rohit Verma', 'rohit@msmunify.com', 3], ['Priya Nair', 'priya@msmunify.com', 3],
  ['Vikram Lead', 'vikram@msmunify.com', 4], ['Sana SEO', 'sana@msmunify.com', 5], ['New Writer', 'writer@msmunify.com', 3],
].map(([name, email, roleId], i) => ({ id: i + 1, name: name as string, email: email as string, roleId: roleId as number, status: (i === 6 ? 'invited' : 'active') as 'invited' | 'active', lastLoginAt: i === 6 ? null : daysAgo(i), instituteIds: [] as number[] }));

export const media: Media[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1, name: i % 6 === 5 ? `brochure-${i}.pdf` : `image-${i + 1}.jpg`, url: i % 6 === 5 ? '#' : img(`media-${i}`, 600, 400), type: i % 6 === 5 ? 'pdf' : 'image',
  sizeKb: int(80, 2400), folder: pick(['institutes', 'articles', 'banners', 'brochures']), alt: `Media ${i + 1}`, uploadedAt: daysAgo(i),
}));
export const pressReleases: PressRelease[] = ['Times of India', 'Hindustan Times', 'The Economic Times', 'India Today', 'NDTV Education', 'Business Standard']
  .map((publication, i) => ({ id: i + 1, title: pick(['MSM Unify crosses 1 million student sessions', 'MSM Unify launches AI college predictor', 'MSM Unify partners with 200+ colleges', 'How MSM Unify is changing college discovery in India']), publication, url: '#', logo: publication.split(' ').map((w) => w[0]).join(''), date: daysAgo(i * 25).slice(0, 10), status: 'published' }));
export const careers: Career[] = [
  ['Senior Content Writer — Education', 'Content', 'Noida'], ['Admission Counsellor', 'Counselling', 'Mumbai'], ['Frontend Engineer (React)', 'Engineering', 'Remote'],
  ['SEO Specialist', 'Marketing', 'Noida'], ['Data Analyst Intern', 'Data', 'Bengaluru'],
].map(([title, department, location], i) => ({ id: i + 1, title, department, location, type: i === 4 ? 'internship' : 'full-time', experience: i === 4 ? '0–1 years' : `${int(1, 3)}–${int(4, 7)} years`, description: `<p>We are hiring a ${title} to join our ${department} team in ${location}.</p><ul><li>Own outcomes end to end</li><li>Work closely with product and editorial</li></ul>`, status: i === 3 ? 'closed' : 'open', applicants: int(3, 120), postedAt: daysAgo(i * 6) }));
export const partnerInstitutes: PartnerInstitute[] = institutes.filter((n) => n.isPartner).map((n, i) => ({
  id: i + 1, instituteId: n.id, partnerSince: daysAgo(int(60, 700)).slice(0, 10), commissionPercent: int(8, 20), contactPerson: `${pick(firstNames)} ${pick(lastNames)}`,
  contactEmail: `partners@${n.slug}.edu.in`, mouStatus: pick(['active', 'active', 'expired', 'pending']) as PartnerInstitute['mouStatus'], onlinePartner: n.onlineCourses,
}));
export const seoTemplates = [
  ['College home', '{name}: Courses, Fees, Admission {year}, Placements, Ranking', 'Check {name} courses, fees, cut-off, placements and admission {year}.', '{name}'],
  ['College courses', '{name} Courses & Fees {year}', 'List of all courses offered by {name} with fees and eligibility.', '{name} Courses {year}'],
  ['College placements', '{name} Placements {year}: Highest & Average Package', '{name} placement statistics, top recruiters and packages.', '{name} Placements'],
  ['Exam overview', '{exam} {year}: Dates, Registration, Syllabus, Pattern', 'Everything about {exam} {year}.', '{exam} {year}'],
  ['Category listing', '{count}+ {title}: Fees, Ranking, Admission {year}', 'Explore {count} {title} with fees and placements.', '{title}'],
].map(([pageType, titleTemplate, descriptionTemplate, h1Template], i) => ({ id: i + 1, pageType, titleTemplate, descriptionTemplate, h1Template }));
export const uploads: UploadJob[] = [
  { id: 1, kind: 'institutes', fileName: 'institutes-batch-oct.xlsx', rows: 48, success: 46, failed: 2, status: 'done', errors: [{ row: 12, message: 'City "Gurgaon" not found' }, { row: 31, message: 'Duplicate slug "amity-noida"' }], createdAt: daysAgo(12), by: 'Ananya Sharma' },
  { id: 2, kind: 'courses_fees', fileName: 'course-fees-2026.csv', rows: 310, success: 310, failed: 0, status: 'done', errors: [], createdAt: daysAgo(5), by: 'Naman Admin' },
  { id: 3, kind: 'faqs', fileName: 'faqs.xlsx', rows: 90, success: 84, failed: 6, status: 'done', errors: [{ row: 4, message: 'Answer is empty' }], createdAt: daysAgo(2), by: 'Priya Nair' },
];
export const linkChecks = Array.from({ length: 14 }, (_, i) => ({ id: i + 1, url: pick(['https://nta.ac.in/old-notice', 'https://example.edu/brochure.pdf', 'https://josaa.nic.in', 'https://cetcell.mahacet.org', 'https://www.iitb.ac.in/admissions']), foundOn: pick(articles).title, status: pick([200, 200, 301, 404, 404, 500]), checkedAt: daysAgo(i * 0.3) }));
export const mcpClients = [
  { id: 1, name: 'Claude Desktop', user: 'Naman Admin', scopes: ['institutes:read', 'articles:write'], connectedAt: daysAgo(20), lastUsedAt: daysAgo(1) },
  { id: 2, name: 'Cursor', user: 'Rohit Verma', scopes: ['exams:read'], connectedAt: daysAgo(8), lastUsedAt: daysAgo(3) },
];
export const reviews: Review[] = institutes.slice(0, 30).flatMap((n) => Array.from({ length: 4 }, (_, k) => ({
  id: n.id * 10 + k, instituteId: n.id, author: `${pick(firstNames)} ${pick(lastNames)[0]}.`, course: pick(courses.filter((c) => c.instituteId === n.id))?.name ?? 'B.Tech', year: pick([2023, 2024, 2025]),
  rating: Math.min(5, Math.max(2, Math.round(n.rating + (rnd() - 0.5) * 2))), title: pick(['Great faculty and campus', 'Good placements, average hostel', 'Worth the fees', 'Strong peer group', 'Could improve infrastructure']),
  body: 'Faculty is supportive and the curriculum is updated. Placement cell is active from the 3rd year. Hostel food can be better but overall a great experience.', status: (k === 3 ? 'pending' : 'approved') as Review['status'], createdAt: daysAgo(int(1, 300)),
})));
export const activity: ActivityLog[] = Array.from({ length: 25 }, (_, i) => {
  const n = pick(institutes);
  return { id: i + 1, at: daysAgo(i * 0.25), user: pick(users).name, action: pick(['updated', 'published', 'created', 'edited fees of', 'uploaded gallery for']), entity: n.shortName, entityId: n.id };
});

export const defaultConfig: SiteConfig = {
  siteName: 'MSM Unify', supportPhone: '+91 1800 123 4567', supportEmail: 'support@msmunify.com',
  promoBanner: { enabled: true, text: 'Admissions 2026 are open — get free counselling from experts', link: '#/talk-to-counsellor' },
  heroTitle: 'Find the right college for your future',
  heroSubtitle: 'Explore 25,000+ colleges, 500+ exams and get free expert counselling.',
  stats: [{ label: 'Colleges', value: 25000, suffix: '+' }, { label: 'Students guided', value: 1200000, suffix: '+' }, { label: 'Exams covered', value: 500, suffix: '+' }, { label: 'Partner institutes', value: 450, suffix: '+' }],
  testimonials: [
    { name: 'Riya Sharma', course: 'B.Tech, VIT Vellore', quote: 'The counsellor helped me shortlist colleges based on my JEE score. I got into my dream branch!' },
    { name: 'Arjun Mehta', course: 'MBA, NMIMS Mumbai', quote: 'Comparing fees and placements side by side saved me weeks of research.' },
    { name: 'Saanvi Reddy', course: 'BBA, Christ University', quote: 'Very easy to use. The predictor was surprisingly accurate.' },
  ],
  crmPushEnabled: true, maintenanceMode: false,
};

export function buildSeed(): DB {
  return structuredClone({
    streams, states, cities, courseLevels: levels, modes, courseTypes, baseCourses, specializations, rankingBodies, authorities, amenities, companies,
    institutes, courses, reviews, exams, articles, authors, tags, faqs, landingPages, examListings, events, updates, leads, predictorLeads, students,
    users, roles, media, pressReleases, careers, partnerInstitutes, seoTemplates, uploads, linkChecks, mcpClients, activity,
  }) as DB;
}
