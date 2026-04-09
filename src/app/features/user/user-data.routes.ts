import { Routes } from '@angular/router';

import { authenticatedGuard } from '../../shared';
import { UserDataPageComponent } from './user-data-page/user-data-page.component';
import { UserListDetailPageComponent } from './user-list-detail-page/user-list-detail-page.component';

export const userDataRoutes: Routes = [
    {
        path: '',
        canActivate: [authenticatedGuard],
        children: [
            {
                path: '',
                component: UserDataPageComponent,
                pathMatch: 'full',
                title: 'Your TMDb Profile',
                data: {
                    section: 'profile',
                },
            },
            {
                path: 'watchlists',
                component: UserDataPageComponent,
                title: 'Your TMDb Watchlists',
                data: {
                    section: 'watchlists',
                },
            },
            {
                path: 'favorites',
                component: UserDataPageComponent,
                title: 'Your TMDb Favorites',
                data: {
                    section: 'favorites',
                },
            },
            {
                path: 'ratings',
                component: UserDataPageComponent,
                title: 'Your TMDb Ratings',
                data: {
                    section: 'ratings',
                },
            },
            {
                path: 'lists',
                component: UserDataPageComponent,
                title: 'Your TMDb Lists',
                data: {
                    section: 'lists',
                },
            },
            {
                path: 'lists/:listId',
                component: UserListDetailPageComponent,
                title: 'Your TMDb List',
            },
        ],
    },
];
