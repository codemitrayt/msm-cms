// D2 — publishing routes (relative to /admin).
import { Route } from 'react-router-dom';
import { ExamNew, ExamWorkspace, ExamsList } from './exams';
import { ArticleEditor, ArticlePreview, ArticleView, ArticlesList } from './articles';
import { ExamListingEditor, ExamListingPreview, ExamListingsList, LandingEditor, LandingList, LandingPreview } from './landing';
import { EventsPage, UpdatesPage } from './events';
import { UploadDetail, UploadsPage } from './uploads';
import { CareersPage, PressReleasesPage } from './pressCareers';

export const publishingRoutes = (
  <>
    <Route path="exams" element={<ExamsList />} />
    <Route path="exams/new" element={<ExamNew />} />
    <Route path="exams/:id" element={<ExamWorkspace />} />
    <Route path="exams/:id/:segment" element={<ExamWorkspace />} />
    <Route path="exam-listings" element={<ExamListingsList />} />
    <Route path="exam-listings/new" element={<ExamListingEditor />} />
    <Route path="exam-listings/:id/edit" element={<ExamListingEditor />} />
    <Route path="exam-listings/:id/preview" element={<ExamListingPreview />} />
    <Route path="articles" element={<ArticlesList />} />
    <Route path="articles/new" element={<ArticleEditor />} />
    <Route path="articles/:id" element={<ArticleView />} />
    <Route path="articles/:id/edit" element={<ArticleEditor />} />
    <Route path="articles/:id/preview" element={<ArticlePreview />} />
    <Route path="landing-pages" element={<LandingList />} />
    <Route path="landing-pages/new" element={<LandingEditor />} />
    <Route path="landing-pages/:id/edit" element={<LandingEditor />} />
    <Route path="landing-pages/:id/preview" element={<LandingPreview />} />
    <Route path="events" element={<EventsPage />} />
    <Route path="updates" element={<UpdatesPage />} />
    <Route path="uploads" element={<UploadsPage />} />
    <Route path="uploads/:id" element={<UploadDetail />} />
    <Route path="press-releases" element={<PressReleasesPage />} />
    <Route path="careers" element={<CareersPage />} />
  </>
);
