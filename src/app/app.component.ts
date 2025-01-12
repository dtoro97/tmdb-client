import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LoaderService } from './services';
import { SessionService } from './state/session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  isLoading$: Observable<boolean>;
  constructor(
    private loader: LoaderService,
    private sessionService: SessionService
  ) {}
  ngOnInit(): void {
    this.isLoading$ = this.loader.isLoading$;

    this.sessionService.loadSession();
  }
}
