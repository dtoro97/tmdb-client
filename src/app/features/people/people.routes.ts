import { Routes } from '@angular/router';

import { PeoplePageComponent } from './people-page/people-page.component';
import { PersonDetailPageComponent } from './person-detail-page/person-detail-page.component';
import { personResolver } from './person.resolver';
import { peopleListResolver } from './people.resolver';

export const PEOPLE_ROUTES: Routes = [
  {
    path: '',
    component: PeoplePageComponent,
    resolve: { data: peopleListResolver },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
  },
  {
    path: ':id',
    component: PersonDetailPageComponent,
    resolve: { data: personResolver },
    runGuardsAndResolvers: (from, to) =>
      from.paramMap.get('id') !== to.paramMap.get('id'),
  },
  { path: ':id/:tab', redirectTo: ':id' },
];
