import { NgxUiLoaderModule } from 'ngx-ui-loader';

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './shared/components';
import { HeaderComponent } from './shared/components';
import { HomeService, StateService } from './core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [FooterComponent, HeaderComponent, RouterOutlet, NgxUiLoaderModule],
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(
    private stateService: StateService,
    private homeService: HomeService,
  ) {
    this.stateService.loadSession();
    this.homeService.init();
  }
}
