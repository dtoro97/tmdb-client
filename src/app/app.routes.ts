import { Routes } from '@angular/router';
import { NotFoundComponent, v4AccountAccessGuard } from './shared';

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
        path: 'movies',
        loadChildren: () =>
            import('./features/discover/discover.routes').then(
                (m) => m.movieBrowseRoutes,
            ),
    },
    {
        path: 'tv',
        loadChildren: () =>
            import('./features/discover/discover.routes').then(
                (m) => m.tvBrowseRoutes,
            ),
    },
    {
        path: 'people',
        loadChildren: () =>
            import('./features/discover/discover.routes').then(
                (m) => m.peopleBrowseRoutes,
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
            import('./features/user/user.routes').then(
                (m) => m.userRoutes,
            ),
    },
    {
        path: 'lists/:listId',
        canActivate: [v4AccountAccessGuard],
        loadComponent: () =>
            import(
                './features/user/user-list-detail-page/user-list-detail-page.component'
            ).then((m) => m.UserListDetailPageComponent),
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
    { path: 'not-found', component: NotFoundComponent },
    { path: '**', component: NotFoundComponent },
];
