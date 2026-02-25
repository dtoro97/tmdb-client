import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { FooterComponent, HeaderComponent } from './shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [FooterComponent, HeaderComponent, RouterOutlet, NgxUiLoaderModule],
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
