import { Routes } from '@angular/router';
import { PersonDetailsComponent } from './person-detail-page/person-details.component';

export const personDetailRoutes: Routes = [
  {
    path: ':personId',
    component: PersonDetailsComponent,
  },
];
