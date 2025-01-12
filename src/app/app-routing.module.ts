import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MediaDetailsComponent } from './components/media-details/media-details.component';
import { MediaDetailsResolver } from './resolvers/media-details.resolver';
import { CreditsResolver } from './resolvers/credits.resolver';
import { VideosResolver } from './resolvers/videos.resolver';
import { RecommendationsResolver } from './resolvers/recommendations.resolver';
import { ActorDetailsComponent } from './components/actor-details/actor-details.component';
import { PersonDetailsResolver } from './resolvers/person-details.resolver';
import { PersonCreditsResolver } from './resolvers/person-credits.resolver';
import { MediaListComponent } from './components/media-list/media-list.component';
import { MediaListGuard } from './guards/media-list.guard';
import { MediaExternalIdResolver } from './resolvers/media-external-id.resolver';
import { PersonExternalIdResolver } from './resolvers/person-external-id.resolver';

const routes: Routes = [
  {
    path: 'details/person/:id',
    component: ActorDetailsComponent,
    resolve: {
      item: PersonDetailsResolver,
      credits: PersonCreditsResolver,
      externalIds: PersonExternalIdResolver,
    },
    data: {
      title: 'Popular Person',
    },
    pathMatch: 'full',
  },
  {
    path: 'details/:type/:id',
    component: MediaDetailsComponent,
    resolve: {
      item: MediaDetailsResolver,
      credits: CreditsResolver,
      videos: VideosResolver,
      recommendations: RecommendationsResolver,
      externalIds: MediaExternalIdResolver,
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
  { path: '**', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
