import { NgxUiLoaderModule } from 'ngx-ui-loader';

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './shared/ui/footer/footer.component';
import { HeaderComponent } from './shared/ui/header/header.component';
import { AppStoreService } from './core/app-store.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [FooterComponent, HeaderComponent, RouterOutlet, NgxUiLoaderModule],
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(private appStore: AppStoreService) {
    this.appStore.loadSession();
  }
}
