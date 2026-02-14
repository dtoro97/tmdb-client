import { Routes } from '@angular/router';

import { discoverGuard } from './discover.guard';
import { discoverResolver } from './discover.resolver';
import { DiscoverPageComponent } from './discover-page/discover-page.component';

export const DISCOVER_ROUTES: Routes = [
  {
    path: ':type',
    component: DiscoverPageComponent,
    resolve: { data: discoverResolver },
    canActivate: [discoverGuard],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
  },
];
