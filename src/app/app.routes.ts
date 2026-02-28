import { Routes } from '@angular/router';

import { MediaListPageComponent } from './features/media-list/media-list-page/media-list.component';
import { mediaListGuard } from './features/media-list/media-list.guard';
import { NotFoundComponent } from './shared';

export const routes: Routes = [
    {
        path: 'name',
        loadChildren: () =>
            import('./features/person-detail/person-detail.routes').then(
                (m) => m.personDetailRoutes,
            ),
    },
    {
        path: 'title',
        loadChildren: () =>
            import('./features/media-detail/media.routes').then(
                (m) => m.mediaRoutes,
            ),
    },
    {
        path: 'collection',
        loadChildren: () =>
            import('./features/collection-detail/collection.routes').then(
                (m) => m.collectionRoutes,
            ),
    },
    {
        path: 'discover',
        component: MediaListPageComponent,
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        canActivate: [mediaListGuard],
    },
    {
        path: '',
        loadChildren: () =>
            import('./features/home/home.routes').then((m) => m.homeRoutes),
        pathMatch: 'full',
        title: 'Browse Movies, TV Shows and People',
    },
    { path: '**', component: NotFoundComponent },
];
