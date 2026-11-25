// Each group owns its own routes file. Paths are absolute website paths.
import { coreRoutes } from './core/routes';
import { exploreRoutes } from './explore/routes';

export const websiteRoutes = (
  <>
    {coreRoutes}
    {exploreRoutes}
  </>
);
