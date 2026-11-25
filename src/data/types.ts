// Shapes mirror the real CMS tables in @msquaremedia/db (src/cms/*), trimmed to
// what the prototype screens use. Every record has a numeric `id`.

export type Id = number;
export type PublishStatus = 'draft' | 'in_review' | 'published' | 'archived';

export interface Named { id: Id; name: string; slug: string }

export interface Stream extends Named { icon: string }
export interface State extends Named { zone: string }
export interface City extends Named { stateId: Id }
export interface CourseLevel extends Named {}
export interface Mode extends Named {}
export interface CourseType extends Named {}
export interface Specialization extends Named { baseCourseId: Id }
export interface BaseCourse extends Named { shortName: string; streamId: Id; levelId: Id; durationYears: number; description: string }
export interface RankingBody extends Named { shortName: string }
export interface Authority extends Named { shortName: string }
export interface Amenity extends Named { icon: string }
export interface Company extends Named {}

export interface Ranking { bodyId: Id; year: number; rank: number; category: string }
export interface Review { id: Id; instituteId: Id; author: string; course: string; year: number; rating: number; title: string; body: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string }

export interface InstituteSection { key: string; title: string; content: string } // markdown-ish HTML

export interface Institute {
  id: Id;
  name: string;
  shortName: string;
  slug: string;
  type: 'university' | 'college' | 'institute';
  ownership: 'government' | 'private' | 'deemed' | 'public_private';
  status: PublishStatus;
  establishedYear: number;
  isAutonomous: boolean;
  isPartner: boolean;
  onlineCourses: boolean;
  authorityIds: Id[];
  accreditation: string; // e.g. "NAAC A++"
  email: string;
  phone: string;
  website: string;
  stateId: Id;
  cityId: Id;
  campusAddress: string;
  pincode: string;
  latitude: number;
  longitude: number;
  campusSize: string;
  streamIds: Id[];
  amenityIds: Id[];
  rankings: Ranking[];
  rating: number;
  reviewCount: number;
  minFee: number;
  maxFee: number;
  avgPackageLpa: number;
  highestPackageLpa: number;
  placementPercent: number;
  topRecruiterIds: Id[];
  brandColor: string;
  logo: string; // initials rendered when no url
  cover: string; // image url
  gallery: { id: Id; url: string; caption: string; album: string }[];
  about: string;
  sections: InstituteSection[]; // admission, scholarship, how-to-reach, cutoff, placement, counsellor...
  placementData: { year: number; placed: number; total: number; median: number; highest: number }[];
  cutoffData: { examId: Id; year: number; course: string; category: string; round: number; opening: number; closing: number }[];
  seo: { title: string; description: string; keywords: string };
  views: number;
  authorId: Id;
  updatedAt: string;
  publishedAt: string | null;
  score: number; // college score 0-100
}

export interface FeeSlab { label: string; amount: number }
export interface Course {
  id: Id;
  instituteId: Id;
  baseCourseId: Id;
  specializationId: Id | null;
  name: string;
  slug: string;
  description: string;
  streamId: Id;
  modeId: Id;
  courseTypeId: Id;
  durationValue: number;
  durationUnit: 'years' | 'months' | 'semesters';
  totalSeats: number;
  fees: number;
  tuitionFees: number;
  hostelFees: number;
  oneTimeFees: number;
  feeForCommission: number;
  feeSchedule: FeeSlab[];
  feeDiscountPercent: number;
  tenthPercentage: number | null;
  twelfthPercentage: number | null;
  ugPercentage: number | null;
  examIds: Id[];
  averageSalaryLpa: number | null;
  highestSalaryLpa: number | null;
  status: 'draft' | 'pending' | 'published';
  updatedAt: string;
}

export interface ExamPageSegment { key: string; title: string; content: string; status: PublishStatus }
export interface ExamDate { id: Id; event: string; start: string; end: string | null; tentative: boolean }
export interface Exam {
  id: Id;
  name: string;
  shortName: string;
  slug: string;
  fullName: string;
  conductingBody: string;
  level: 'national' | 'state' | 'university';
  mode: 'online' | 'offline' | 'hybrid';
  streamIds: Id[];
  frequency: string;
  applicationFee: number;
  participatingColleges: number;
  registrations: number;
  status: PublishStatus;
  logo: string;
  summary: string;
  pages: ExamPageSegment[]; // overview, registration, syllabus, exam-pattern, dates, results, cut-offs, admit-card, answer-key, question-papers, fees, books
  dates: ExamDate[];
  questionPapers: { id: Id; year: number; title: string; url: string }[];
  hasCollegePredictor: boolean;
  hasPercentilePredictor: boolean;
  hasRankPredictor: boolean;
  maxScore: number;
  totalCandidates: number;
  updatedAt: string;
}

export interface Article {
  id: Id;
  title: string;
  slug: string;
  excerpt: string;
  body: string; // simple HTML
  cover: string;
  authorId: Id;
  tagIds: Id[];
  category: 'news' | 'blog' | 'guide' | 'exam-news' | 'college-news';
  instituteId: Id | null;
  examId: Id | null;
  status: PublishStatus;
  featured: boolean;
  views: number;
  readMinutes: number;
  publishedAt: string | null;
  updatedAt: string;
  seo: { title: string; description: string };
}

export interface Author { id: Id; name: string; slug: string; designation: string; bio: string; avatar: string; email: string; linkedin: string }
export interface Tag { id: Id; name: string; slug: string; color: string }
export interface Faq { id: Id; question: string; answer: string; entityType: 'global' | 'institute' | 'exam' | 'course' | 'landing'; entityId: Id | null; order: number; status: PublishStatus }

export interface LandingPage {
  id: Id;
  kind: 'ranking' | 'category';
  title: string;
  slug: string; // e.g. top-mba-colleges-in-india
  intro: string;
  streamId: Id | null;
  baseCourseId: Id | null;
  stateId: Id | null;
  cityId: Id | null;
  rankingBodyId: Id | null;
  ownership: Institute['ownership'] | null;
  pinnedInstituteIds: Id[];
  status: PublishStatus;
  seo: { title: string; description: string };
  updatedAt: string;
}

export interface ExamListing { id: Id; title: string; slug: string; intro: string; streamId: Id | null; level: Exam['level'] | null; examIds: Id[]; status: PublishStatus; updatedAt: string }

export interface EventItem { id: Id; title: string; instituteId: Id | null; examId: Id | null; date: string; endDate: string | null; type: 'admission' | 'exam' | 'webinar' | 'fair' | 'deadline'; link: string; status: PublishStatus }
export interface UpdateItem { id: Id; title: string; body: string; instituteId: Id | null; examId: Id | null; pinned: boolean; status: PublishStatus; createdAt: string }

export interface Lead {
  id: Id;
  name: string;
  email: string;
  phone: string;
  stateId: Id | null;
  cityId: Id | null;
  courseInterest: string;
  instituteId: Id | null;
  source: 'talk-to-counsellor' | 'apply-now' | 'brochure' | 'predictor' | 'contact' | 'signup' | 'compare';
  page: string;
  status: 'new' | 'contacted' | 'interested' | 'not-interested' | 'converted';
  pushedToCrm: boolean;
  notes: string;
  createdAt: string;
}

export interface PredictorLead { id: Id; name: string; phone: string; examId: Id; predictor: 'college' | 'percentile' | 'rank'; input: string; result: string; createdAt: string }

export interface Student {
  id: Id;
  name: string;
  email: string;
  phone: string;
  cityId: Id | null;
  preferredStreamId: Id | null;
  qualification: string;
  bookmarks: Id[]; // institute ids
  compared: Id[][];
  activity: { at: string; action: string; target: string }[];
  verified: boolean;
  createdAt: string;
  lastSeenAt: string;
}

export interface AdminUser { id: Id; name: string; email: string; roleId: Id; status: 'active' | 'invited' | 'disabled'; lastLoginAt: string | null; instituteIds: Id[] }
export interface Role { id: Id; name: string; description: string; permissions: string[]; system: boolean }

export interface Media { id: Id; name: string; url: string; type: 'image' | 'pdf' | 'video'; sizeKb: number; folder: string; alt: string; uploadedAt: string }
export interface PressRelease { id: Id; title: string; publication: string; url: string; logo: string; date: string; status: PublishStatus }
export interface Career { id: Id; title: string; department: string; location: string; type: 'full-time' | 'internship' | 'contract'; experience: string; description: string; status: 'open' | 'closed'; applicants: number; postedAt: string }
export interface PartnerInstitute { id: Id; instituteId: Id; partnerSince: string; commissionPercent: number; contactPerson: string; contactEmail: string; mouStatus: 'active' | 'expired' | 'pending'; onlinePartner: boolean }
export interface SeoTemplate { id: Id; pageType: string; titleTemplate: string; descriptionTemplate: string; h1Template: string }
export interface UploadJob { id: Id; kind: 'institutes' | 'courses' | 'courses_fees' | 'exams' | 'faqs' | 'articles'; fileName: string; rows: number; success: number; failed: number; status: 'queued' | 'processing' | 'done' | 'failed'; errors: { row: number; message: string }[]; createdAt: string; by: string }
export interface LinkCheck { id: Id; url: string; foundOn: string; status: number; checkedAt: string }
export interface McpClient { id: Id; name: string; user: string; scopes: string[]; connectedAt: string; lastUsedAt: string }
export interface ActivityLog { id: Id; at: string; user: string; action: string; entity: string; entityId: Id | null }

export interface SiteConfig {
  siteName: string;
  supportPhone: string;
  supportEmail: string;
  promoBanner: { enabled: boolean; text: string; link: string };
  heroTitle: string;
  heroSubtitle: string;
  stats: { label: string; value: number; suffix: string }[];
  testimonials: { name: string; course: string; quote: string }[];
  crmPushEnabled: boolean;
  maintenanceMode: boolean;
}

export interface DB {
  streams: Stream[];
  states: State[];
  cities: City[];
  courseLevels: CourseLevel[];
  modes: Mode[];
  courseTypes: CourseType[];
  baseCourses: BaseCourse[];
  specializations: Specialization[];
  rankingBodies: RankingBody[];
  authorities: Authority[];
  amenities: Amenity[];
  companies: Company[];
  institutes: Institute[];
  courses: Course[];
  reviews: Review[];
  exams: Exam[];
  articles: Article[];
  authors: Author[];
  tags: Tag[];
  faqs: Faq[];
  landingPages: LandingPage[];
  examListings: ExamListing[];
  events: EventItem[];
  updates: UpdateItem[];
  leads: Lead[];
  predictorLeads: PredictorLead[];
  students: Student[];
  users: AdminUser[];
  roles: Role[];
  media: Media[];
  pressReleases: PressRelease[];
  careers: Career[];
  partnerInstitutes: PartnerInstitute[];
  seoTemplates: SeoTemplate[];
  uploads: UploadJob[];
  linkChecks: LinkCheck[];
  mcpClients: McpClient[];
  activity: ActivityLog[];
}

export type CollectionKey = keyof DB;
