import { Routes } from "@angular/router";
import { HomePageComponent } from "./home-page/home.component";


export const homeRoutes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    pathMatch: 'full',
    title: 'Browse Movies, TV Shows and People'
  }
];