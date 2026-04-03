import { Routes } from '@angular/router';
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
        loadChildren: () =>
            import('./features/discover/discover.routes').then(
                (m) => m.discoverRoutes,
            ),
    },
    {
        path: 'search',
        loadChildren: () =>
            import('./features/search/search.routes').then(
                (m) => m.searchRoutes,
            ),
    },
    {
        path: '',
        loadChildren: () =>
            import('./features/home/home.routes').then((m) => m.homeRoutes),
    },
    { path: '**', component: NotFoundComponent },
];
