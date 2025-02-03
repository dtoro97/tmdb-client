import { ProgressBarModule } from 'primeng/progressbar';

import { ChangeDetectionStrategy, Component, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { StateQuery } from './state/state.query';
import { StateService } from './state/state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [FooterComponent, HeaderComponent, RouterOutlet, ProgressBarModule],
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  isLoading: Signal<boolean>;
  constructor(
    private stateQuery: StateQuery,
    private stateService: StateService
  ) {
    this.isLoading = toSignal(this.stateQuery.loading$, { initialValue: true });
    this.stateService.loadSession();
  }
}
