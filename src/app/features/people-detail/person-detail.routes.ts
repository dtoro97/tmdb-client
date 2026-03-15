import { Routes } from '@angular/router';
import { PersonDetailsComponent } from './person-detail-page/person-details.component';
import { personTabGuard } from './person-tab.guard';

export const personDetailRoutes: Routes = [
  {
    path: ':personId/:tabId',
    component: PersonDetailsComponent,
    canActivate: [personTabGuard],
    runGuardsAndResolvers: (from, to) =>
      from.paramMap.get('personId') !== to.paramMap.get('personId'),
  },
];
