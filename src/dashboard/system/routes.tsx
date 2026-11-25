import { Route } from 'react-router-dom';
import Overview from './Overview';
import Leads from './Leads';
import { StudentDetail, StudentsList } from './Students';
import Faqs from './Faqs';
import { AuthorsPage, MediaPage, TagsPage } from './Library';
import { RolesPage, UsersPage } from './Users';
import ConfigPage from './Config';
import { LinkStatusPage, McpAccessPage, SeoTemplatesPage } from './Misc';

export const systemRoutes = (
  <>
    <Route path="overview" element={<Overview />} />
    <Route path="leads" element={<Leads />} />
    <Route path="leads/predictor" element={<Leads />} />
    <Route path="students" element={<StudentsList />} />
    <Route path="students/:id" element={<StudentDetail />} />
    <Route path="faqs" element={<Faqs />} />
    <Route path="tags" element={<TagsPage />} />
    <Route path="authors" element={<AuthorsPage />} />
    <Route path="media" element={<MediaPage />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="roles" element={<RolesPage />} />
    <Route path="config" element={<ConfigPage />} />
    <Route path="seo-templates" element={<SeoTemplatesPage />} />
    <Route path="link-status" element={<LinkStatusPage />} />
    <Route path="mcp-access" element={<McpAccessPage />} />
    <Route path="connected-mcp-clients" element={<McpAccessPage />} />
  </>
);
