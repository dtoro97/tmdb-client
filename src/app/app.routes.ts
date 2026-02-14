import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: 'discover',
    loadChildren: () =>
      import('./features/discover/discover.routes').then(
        (m) => m.DISCOVER_ROUTES,
      ),
  },
  {
    path: 'details',
    loadChildren: () =>
      import('./features/media/media.routes').then((m) => m.MEDIA_ROUTES),
  },
  {
    path: 'people',
    loadChildren: () =>
      import('./features/people/people.routes').then((m) => m.PEOPLE_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/ui/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
