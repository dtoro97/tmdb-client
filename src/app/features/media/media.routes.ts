import { Routes } from '@angular/router';
import { MediaDetailsComponent } from './media-detail-page/media-detail-page.component';
import { EpisodeDetailComponent } from './episode-detail-page/episode-detail.component';
import { EpisodesPageComponent } from './episodes-page/episodes-page.component';
import { MediaWrapperComponent } from './media-wrapper/media-wrapper.component';
import { VideosPageComponent } from './videos-page/videos-page.component';
import { MediaCastPageComponent } from './media-cast-page/media-cast-page.component';
import { MediaPhotosPageComponent } from './photos-page/media-photos-page.component';
import { MediaReviewsPageComponent } from './reviews-page/reviews-page.component';
import { VideoDetailPageComponent } from './video-detail-page/video-detail-page.component';

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
                component: MediaCastPageComponent,
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
            {
                path: 'videos/:videoId',
                component: VideoDetailPageComponent,
            },
            {
                path: 'photos',
                component: MediaPhotosPageComponent,
            },
            {
                path: 'reviews',
                component: MediaReviewsPageComponent,
            },
        ],
    },
];
