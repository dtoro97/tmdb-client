import { Routes } from '@angular/router';

import { MediaDetailPageComponent } from './media-detail-page/media-detail-page.component';
import { mediaResolver } from './media.resolver';

export const MEDIA_ROUTES: Routes = [
  {
    path: ':type/:id',
    component: MediaDetailPageComponent,
    resolve: { data: mediaResolver },
    runGuardsAndResolvers: (from, to) =>
      from.paramMap.get('id') !== to.paramMap.get('id'),
  },
  { path: ':type/:id/:tab', redirectTo: ':type/:id' },
];
