import { Routes } from '@angular/router';
import { MediaDetailsComponent } from './media-detail-page/media-details.component';
import { EpisodeDetailComponent } from './episode-detail-page/episode-detail.component';
import { EpisodesPageComponent } from './episodes-page/episodes-page.component';
import { MediaWrapperComponent } from './media-wrapper/media-wrapper.component';
import { VideosPageComponent } from './videos-page/videos-page.component';
import { MediaCastCrewComponent } from './cast-crew-page/media-cast-crew.component';

export const mediaRoutes: Routes = [
    {
        path: ':id/:type',
        component: MediaWrapperComponent,
        children: [
            {
                path: '',
                component: MediaDetailsComponent,
            },
            {
                path: 'cast',
                component: MediaCastCrewComponent,
            },
            {
                path: 'episodes',
                component: EpisodesPageComponent,
            },
            {
                path: 'episodes/:seasonNumber/:episodeNumber',
                component: EpisodeDetailComponent,
            },
            {
                path: 'videos',
                component: VideosPageComponent,
            },
        ],
    },
];
