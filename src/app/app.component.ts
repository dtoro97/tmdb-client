import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StateService } from './state/state.service';
import { StateQuery } from './state/state.query';

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
    private stateQuery: StateQuery,
    private stateService: StateService
  ) {}
  ngOnInit(): void {
    this.isLoading$ = this.stateQuery.loading$;

    this.stateService.loadSession();
  }
}
