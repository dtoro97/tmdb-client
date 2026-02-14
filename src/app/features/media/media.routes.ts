import { Routes } from '@angular/router';

import { MediaDetailPageComponent } from './media-detail-page/media-detail-page.component';
import { mediaTabGuard } from './media-tab.guard';
import { mediaResolver } from './media.resolver';

export const MEDIA_ROUTES: Routes = [
  {
    path: ':type/:id/:tab',
    component: MediaDetailPageComponent,
    resolve: { data: mediaResolver },
    canActivate: [mediaTabGuard],
    runGuardsAndResolvers: (from, to) =>
      from.paramMap.get('id') !== to.paramMap.get('id'),
  },
];
