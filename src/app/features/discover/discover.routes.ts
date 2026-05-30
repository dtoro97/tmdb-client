import { Routes } from '@angular/router';

import { DiscoverPageComponent } from './discover-page/discover-page.component';
import { PopularPeoplePageComponent } from './popular-people-page/popular-people-page.component';

export const discoverRoutes: Routes = [
    {
        path: '',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'advanced' },
        title: 'Discover',
    },
];

export const movieBrowseRoutes: Routes = [
    {
        path: '',
        redirectTo: 'popular',
        pathMatch: 'full',
    },
    {
        path: 'popular',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'movie-popular' },
        title: 'Popular Movies',
    },
    {
        path: 'top-rated',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'movie-top-rated' },
        title: 'Top Rated Movies',
    },
    {
        path: 'now-playing',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'movie-now-playing' },
        title: 'Now Playing Movies',
    },
    {
        path: 'upcoming',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'movie-upcoming' },
        title: 'Upcoming Movies',
    },
];

export const tvBrowseRoutes: Routes = [
    {
        path: '',
        redirectTo: 'popular',
        pathMatch: 'full',
    },
    {
        path: 'popular',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'tv-popular' },
        title: 'Popular TV Series',
    },
    {
        path: 'top-rated',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'tv-top-rated' },
        title: 'Top Rated TV Series',
    },
    {
        path: 'airing-today',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'tv-airing-today' },
        title: 'TV Series Airing Today',
    },
    {
        path: 'on-the-air',
        component: DiscoverPageComponent,
        data: { discoverPageKey: 'tv-on-the-air' },
        title: 'TV Series Airing This Week',
    },
];

export const peopleBrowseRoutes: Routes = [
    {
        path: '',
        redirectTo: 'popular',
        pathMatch: 'full',
    },
    {
        path: 'popular',
        component: PopularPeoplePageComponent,
        title: 'Popular People',
    },
];
