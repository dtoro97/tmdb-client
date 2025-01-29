import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MediaDetailsComponent } from './components/media-details/media-details.component';
import { VideosResolver } from './resolvers/media/videos.resolver';
import { RecommendationsResolver } from './resolvers/media/recommendations.resolver';
import { PersonDetailsComponent } from './components/person-details/person-details.component';
import { MediaListComponent } from './components/media-list/media-list.component';
import { MediaListGuard } from './guards/media-list.guard';
import {
  MediaCreditsResolver,
  MediaDetailsResolver,
  MediaExternalIdsResolver,
  MediaImagesResolver,
  PersonCreditsResolver,
  PersonDetailsResolver,
  PersonExternalIdsResolver,
  PersonImagesResolver,
} from './resolvers';
import { NotFoundComponent } from './components/not-found/not-found.component';

const routes: Routes = [
  {
    path: 'details/person/:id',
    component: PersonDetailsComponent,
    resolve: {
      item: PersonDetailsResolver,
      credits: PersonCreditsResolver,
      socialLinks: PersonExternalIdsResolver,
      images: PersonImagesResolver,
    },
    title: 'Popular Person',
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
    canActivate: [MediaListGuard],
  },
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    title: 'Browse Movies, TV Shows and People',
  },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
