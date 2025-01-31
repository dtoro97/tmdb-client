import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { providePrimeNG } from 'primeng/config';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressBarModule } from 'primeng/progressbar';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SliderModule } from 'primeng/slider';
import { TabsModule } from 'primeng/tabs';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { provideHttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CardComponent } from './components/card/card.component';
import { CreditsListComponent } from './components/credits-list/credits-list.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { MediaDetailsComponent } from './components/media-details/media-details.component';
import { MediaListComponent } from './components/media-list/media-list.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { PersonCardComponent } from './components/person-card/person-card.component';
import { PersonDetailsComponent } from './components/person-details/person-details.component';
import { SocialLinksComponent } from './components/social-links/social-links.component';
import { filterPipe } from './pipes/filter.pipe';
import { ImagePipe } from './pipes/image.pipe';
import { sortPipe } from './pipes/sort.pipe';
import { MinutesToHours } from './pipes/time.pipe';
import { YoutubeLinkPipe } from './pipes/youtube-link.pipe';
import { tmdbPreset } from './tmdb-preset';

const components = [
  HeaderComponent,
  CardComponent,
  HomeComponent,
  FooterComponent,
  MediaDetailsComponent,
  PersonCardComponent,
  PersonDetailsComponent,
  MediaListComponent,
  SocialLinksComponent,
  CreditsListComponent,
  NotFoundComponent,
];
const pipes = [
  ImagePipe,
  MinutesToHours,
  YoutubeLinkPipe,
  sortPipe,
  filterPipe,
];

@NgModule({
  declarations: [AppComponent, ...components],
  imports: [
    RatingModule,
    AutoCompleteModule,
    BrowserModule,
    ProgressBarModule,
    AppRoutingModule,
    ButtonModule,
    MenubarModule,
    ToggleButtonModule,
    FormsModule,
    CarouselModule,
    SelectButtonModule,
    ChipModule,
    AccordionModule,
    SelectModule,
    PaginatorModule,
    DatePickerModule,
    DividerModule,
    InputTextModule,
    SliderModule,
    TabsModule,
    ...pipes,
  ],
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: tmdbPreset,
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
