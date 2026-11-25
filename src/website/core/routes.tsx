import { Route } from 'react-router-dom';
import { Home } from './Home';
import { SearchPage } from './Search';
import { CategoryPage } from './Listing';
import { CollegePage } from './College';
import { BookmarksPage, ComparePage, CounsellorPage, ProfilePage } from './StudentPages';

// Website core routes (W1). Absolute paths.
export const coreRoutes = (
  <>
    <Route path="/" element={<Home />} />
    <Route path="/search" element={<SearchPage />} />
    <Route path="/colleges/:slug" element={<CategoryPage kind="category" />} />
    <Route path="/rankings/:slug" element={<CategoryPage kind="ranking" />} />
    <Route path="/college/:slug" element={<CollegePage />} />
    <Route path="/college/:slug/courses/:courseSlug" element={<CollegePage />} />
    <Route path="/college/:slug/:tab" element={<CollegePage />} />
    <Route path="/compare" element={<ComparePage />} />
    <Route path="/bookmarks" element={<BookmarksPage />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/talk-to-counsellor" element={<CounsellorPage />} />
  </>
);
