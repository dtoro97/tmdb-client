import { Routes } from '@angular/router';

import { MediaDetailsComponent } from './media-detail-page/media-details.component';
import { mediaTabGuard } from './media-tab.guard';

export const mediaRoutes: Routes = [
  {
    path: ':id/:type/:tab',
    component: MediaDetailsComponent,
    canActivate: [mediaTabGuard],
    runGuardsAndResolvers: (from, to) =>
      from.paramMap.get('id') !== to.paramMap.get('id'),
  },
];
