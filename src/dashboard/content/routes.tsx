import { Route } from 'react-router-dom';
import { InstitutesList } from './InstitutesList';
import { InstituteNew } from './InstituteNew';
import { InstituteWorkspace } from './InstituteWorkspace';
import { CourseEditor, CoursesHome, InstituteCourseTree } from './Courses';
import { BaseCoursesList, InstituteBaseCourses } from './BaseCourses';
import { PartnersPage } from './Partners';

export const contentRoutes = (
  <>
    <Route index element={<InstitutesList />} />
    <Route path="institutes" element={<InstitutesList />} />
    <Route path="institutes/new" element={<InstituteNew />} />
    <Route path="institutes/:id" element={<InstituteWorkspace />} />
    <Route path="institutes/:id/:tab" element={<InstituteWorkspace />} />
    <Route path="courses" element={<CoursesHome />} />
    <Route path="courses/:instituteId" element={<InstituteCourseTree />} />
    <Route path="courses/:instituteId/:courseId" element={<CourseEditor />} />
    <Route path="base-courses" element={<BaseCoursesList />} />
    <Route path="base-courses/:instituteId" element={<InstituteBaseCourses />} />
    <Route path="base-courses/:instituteId/:baseCourseId" element={<InstituteBaseCourses />} />
    <Route path="partner-institutes" element={<PartnersPage />} />
  </>
);
