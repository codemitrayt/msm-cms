import { Route } from 'react-router-dom';
import { ExamsPage, ExamListPage } from './Exams';
import { ExamDetailPage } from './ExamDetail';
import { CollegePredictorPage, PercentilePredictorPage, RankPredictorPage } from './Predictors';
import { BlogPage, ArticlePage, AuthorPage } from './Blog';
import { AboutPage, ContactPage, PrivacyPage, TermsPage, CareersPage, PressPage } from './Company';

export const exploreRoutes = (
  <>
    <Route path="/exams" element={<ExamsPage />} />
    <Route path="/exam-list/:slug" element={<ExamListPage />} />
    <Route path="/exams/:slug" element={<ExamDetailPage />} />
    <Route path="/exams/:slug/college-predictor" element={<CollegePredictorPage />} />
    <Route path="/exams/:slug/percentile-predictor" element={<PercentilePredictorPage />} />
    <Route path="/exams/:slug/percentile-predictor/saved" element={<PercentilePredictorPage />} />
    <Route path="/exams/:slug/rank-predictor" element={<RankPredictorPage />} />
    <Route path="/exams/:slug/:page" element={<ExamDetailPage />} />
    <Route path="/blog" element={<BlogPage />} />
    <Route path="/blogs" element={<BlogPage />} />
    <Route path="/blog/:slug" element={<ArticlePage />} />
    <Route path="/author/:slug" element={<AuthorPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/privacy-policy" element={<PrivacyPage />} />
    <Route path="/terms-and-conditions" element={<TermsPage />} />
    <Route path="/careers" element={<CareersPage />} />
    <Route path="/press" element={<PressPage />} />
  </>
);
