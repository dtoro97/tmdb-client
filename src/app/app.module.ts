import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ToggleButtonModule } from 'primeng/togglebutton';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { tmdbPreset } from './tmdb-preset';
import { HeaderComponent } from './components/header/header.component';
import { FormsModule } from '@angular/forms';
import { CardComponent } from './components/card/card.component';
import { ImagePipe } from './pipes/image.pipe';
import { CarouselModule } from 'primeng/carousel';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './components/home/home.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProgressBarModule } from 'primeng/progressbar';

const components = [HeaderComponent, CardComponent, HomeComponent];
const pipes = [ImagePipe];

@NgModule({
  declarations: [AppComponent, ...components],
  imports: [
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