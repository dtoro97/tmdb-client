import { Routes } from '@angular/router';
import { MediaListPageComponent } from './media-list-page/media-list.component';
import { mediaListGuard } from './media-list.guard';

export const mediaListRoutes: Routes = [
  {
    path: 'list/:type',
    component: MediaListPageComponent,
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    canActivate: [mediaListGuard],
  },
];
