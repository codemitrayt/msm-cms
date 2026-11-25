// Each group owns its own routes file. Paths are relative to /admin.
import { contentRoutes } from './content/routes';
import { publishingRoutes } from './publishing/routes';
import { systemRoutes } from './system/routes';

export const dashboardRoutes = (
  <>
    {contentRoutes}
    {publishingRoutes}
    {systemRoutes}
  </>
);
