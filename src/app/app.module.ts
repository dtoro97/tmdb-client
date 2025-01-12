import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { ChipModule } from 'primeng/chip';
import { providePrimeNG } from 'primeng/config';
import { MenubarModule } from 'primeng/menubar';
import { ProgressBarModule } from 'primeng/progressbar';
import { RatingModule } from 'primeng/rating';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SelectModule } from 'primeng/select';
import { PaginatorModule } from 'primeng/paginator';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { SliderModule } from 'primeng/slider';

import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ActorCardComponent } from './components/actor-card/actor-card.component';
import { ActorDetailsComponent } from './components/actor-details/actor-details.component';
import { CardComponent } from './components/card/card.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { MediaDetailsComponent } from './components/media-details/media-details.component';
import { MediaListComponent } from './components/media-list/media-list.component';
import { ImagePipe } from './pipes/image.pipe';
import { sortPipe } from './pipes/sort.pipe';
import { MinutesToHours } from './pipes/time.pipe';
import { YoutubeLinkPipe } from './pipes/youtube-link.pipe';
import { tmdbPreset } from './tmdb-preset';
import { ExternalIdsComponent } from './components/external-ids/external-ids.component';

const components = [
  HeaderComponent,
  CardComponent,
  HomeComponent,
  FooterComponent,
  MediaDetailsComponent,
  ActorCardComponent,
  ActorDetailsComponent,
  MediaListComponent,
  ExternalIdsComponent,
];
const pipes = [ImagePipe, MinutesToHours, YoutubeLinkPipe, sortPipe];

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
    HttpClientModule,
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
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
