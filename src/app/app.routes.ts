import { Routes } from '@angular/router';
import { PersonDetailsComponent } from './components/person-details/person-details.component';
import {
  MediaCreditsResolver,
  MediaDetailsResolver,
  MediaExternalIdsResolver,
  MediaImagesResolver,
  RecommendationsResolver,
  VideosResolver,
} from './shared/resolvers';
import { MediaDetailsComponent } from './components/media-details/media-details.component';
import { MediaListComponent } from './components/media-list/media-list.component';
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { mediaListGuard } from './core/guards/media-list.guard';
import { PersonResolver } from './shared/resolvers/peron.resolver';

export const routes: Routes = [
  {
    path: 'details/person/:id',
    component: PersonDetailsComponent,
    resolve: { data: PersonResolver },
    pathMatch: 'full',
  },
  {
    path: 'details/:type/:id',
    component: MediaDetailsComponent,
    resolve: {
      item: MediaDetailsResolver,
      credits: MediaCreditsResolver,
      videos: VideosResolver,
      recommendations: RecommendationsResolver,
      externalIds: MediaExternalIdsResolver,
      images: MediaImagesResolver,
    },
  },
  {
    path: 'list/:type',
    component: MediaListComponent,
    canActivate: [mediaListGuard],
  },
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    title: 'Browse Movies, TV Shows and People',
  },
  { path: '**', component: NotFoundComponent },
];
