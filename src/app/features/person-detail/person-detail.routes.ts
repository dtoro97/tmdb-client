import { Routes } from '@angular/router';
import { PersonDetailsComponent } from './person-detail-page/person-details.component';
import { PersonPhotosPageComponent } from './photos-page/person-photos-page.component';

export const personDetailRoutes: Routes = [
  {
    path: ':personId/photos',
    component: PersonPhotosPageComponent,
  },
  {
    path: ':personId',
    component: PersonDetailsComponent,
  },
];
