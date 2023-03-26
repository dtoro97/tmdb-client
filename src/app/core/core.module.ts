import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { SkeletonModule } from 'primeng/skeleton';
import { SpinnerModule } from 'primeng/spinner';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MovieLengthPipe } from './pipes/movie-length.pipe';
import { NavbarComponent, ThemeSwitcherComponent } from './components';
import { InputSwitchModule } from 'primeng/inputswitch';

const modules = [
  CommonModule,
  FormsModule,
  BrowserModule,
  BrowserAnimationsModule,
  LazyLoadImageModule,
  ButtonModule,
  DropdownModule,
  CarouselModule,
  InputTextModule,
  SkeletonModule,
  SpinnerModule,
  MenubarModule,
  InputSwitchModule,
];

const pipes = [MovieLengthPipe];

const components = [NavbarComponent, ThemeSwitcherComponent];

@NgModule({
  imports: [...modules],
  declarations: [...pipes, ...components],
  exports: [...modules, ...pipes, ...components],
})
export class CoreModule {}
