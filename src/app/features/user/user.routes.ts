import { Routes } from '@angular/router';

import { authenticatedGuard, v4AccountAccessGuard } from '../../shared';
import { UserListsStore } from './user-lists-store.service';
import { UserFavouritesPageComponent } from './user-favourites-page/user-favourites-page.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserListCreatePageComponent } from './user-list-create-page/user-list-create-page.component';
import { UserRatingsPageComponent } from './user-ratings-page/user-ratings-page.component';
import { UserWatchlistPageComponent } from './user-watchlist-page/user-watchlist-page.component';
import { UserListsComponent } from './user-lists/user-lists.component';

export const userRoutes: Routes = [
    {
        path: '',
        canActivate: [authenticatedGuard, v4AccountAccessGuard],
        providers: [UserListsStore],
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: UserProfileComponent,
                title: 'Profile',
            },
            {
                path: 'lists/new',
                component: UserListCreatePageComponent,
                title: 'Create list',
            },
            {
                path: 'watchlists',
                component: UserWatchlistPageComponent,
                title: 'Watchlist',
            },
            {
                path: 'favorites',
                component: UserFavouritesPageComponent,
                title: 'Favorites',
            },
            {
                path: 'ratings',
                component: UserRatingsPageComponent,
                title: 'Ratings',
            },
            {
                path: 'lists/:listId',
                redirectTo: '/lists/:listId',
            },
            {
                path: 'lists',
                component: UserListsComponent,
                title: 'Lists',
            },
        ],
    },
];
