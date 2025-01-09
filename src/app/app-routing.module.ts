import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MediaDetailsComponent } from './components/media-details/media-details.component';
import { MediaDetailsResolver } from './resolvers/media-details.resolver';
import { CreditsResolver } from './resolvers/credits.resolver';
import { VideosResolver } from './resolvers/videos.resolver';
import { RecommendationsResolver } from './resolvers/recommendations.resolver';

const routes: Routes = [
  {
    path: 'details/:type/:id',
    component: MediaDetailsComponent,
    resolve: {
      item: MediaDetailsResolver,
      credits: CreditsResolver,
      videos: VideosResolver,
      recommendations: RecommendationsResolver,
    },
  },
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: '**', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
