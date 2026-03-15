import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home.component';
import { TrailersPageComponent } from './trailers-page/trailers-page.component';

export const homeRoutes: Routes = [
    {
        path: '',
        component: HomePageComponent,
        pathMatch: 'full',
        title: 'Browse Movies, TV Shows and People',
    },
    {
        path: 'trailers',
        component: TrailersPageComponent,
        title: 'Watch Movie & TV Trailers',
    },
];
