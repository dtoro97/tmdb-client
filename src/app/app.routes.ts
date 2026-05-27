import { Routes } from '@angular/router';
import { NotFoundComponent } from './shared';

export const routes: Routes = [
    {
        path: 'name',
        loadChildren: () =>
            import('./features/person/person-detail.routes').then(
                (m) => m.personDetailRoutes,
            ),
    },
    {
        path: 'title',
        loadChildren: () =>
            import('./features/media/media.routes').then(
                (m) => m.mediaRoutes,
            ),
    },
    {
        path: 'collection',
        loadChildren: () =>
            import('./features/collection/collection.routes').then(
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
        path: 'me',
        loadChildren: () =>
            import('./features/user/user-data.routes').then(
                (m) => m.userDataRoutes,
            ),
    },
    {
        path: 'watch',
        loadChildren: () =>
            import('./features/watch/watch.routes').then((m) => m.watchRoutes),
    },
    {
        path: '',
        loadChildren: () =>
            import('./features/home/home.routes').then((m) => m.homeRoutes),
    },
    { path: '**', component: NotFoundComponent },
];
