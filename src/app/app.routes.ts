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
        path: 'network',
        loadChildren: () =>
            import('./features/network-detail/network.routes').then(
                (m) => m.networkRoutes,
            ),
    },
    {
        path: 'keyword',
        loadChildren: () =>
            import('./features/keyword-detail/keyword.routes').then(
                (m) => m.keywordRoutes,
            ),
    },
    {
        path: '',
        loadChildren: () =>
            import('./features/home/home.routes').then((m) => m.homeRoutes),
    },
    { path: '**', component: NotFoundComponent },
];
