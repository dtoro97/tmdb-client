import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { MediaDetailsComponent } from './components/media-details/media-details.component';
import { MediaListComponent } from './components/media-list/media-list.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { PersonDetailsComponent } from './components/person-details/person-details.component';
import { mediaListGuard } from './core/guards/media-list.guard';

import { MediaResolver } from './shared/resolvers/media.resolver';
import { PersonResolver } from './shared/resolvers/peron.resolver';
import { mediaTabGuard, personTabGuard } from './core';
import { ListResolver } from './shared';

export const routes: Routes = [
  {
    path: 'details/person/:id/:tab',
    component: PersonDetailsComponent,
    resolve: { data: PersonResolver },
    pathMatch: 'full',
    canActivate: [personTabGuard],
    runGuardsAndResolvers: (from, to) =>
      from.paramMap.get('id') !== to.paramMap.get('id'),
  },
  {
    path: 'details/:type/:id/:tab',
    component: MediaDetailsComponent,
    resolve: {
      data: MediaResolver,
    },
    canActivate: [mediaTabGuard],
    runGuardsAndResolvers: (from, to) =>
      from.paramMap.get('id') !== to.paramMap.get('id'),
  },
  {
    path: 'list/:type',
    component: MediaListComponent,
    resolve: { data: ListResolver },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    canActivate: [mediaListGuard],
  },
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    title: 'Browse Movies, TV Shows and People',
  },
  { path: '**', component: NotFoundComponent },
];
