import { map, Observable } from 'rxjs';
import { Injectable, Signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';

export interface AppState {
  isDarkMode: boolean;
}

@Injectable({ providedIn: 'root' })
export class GlobalStore extends ComponentStore<AppState> {
  readonly isDarkMode$: Observable<boolean> = this.select(
    (state) => state.isDarkMode,
  );
  readonly isMobile: Signal<boolean>;

  constructor(private breakpointObserver: BreakpointObserver) {
    super({
      isDarkMode: true,
    });
    this.isMobile = toSignal(
      this.breakpointObserver
        .observe('(max-width: 768px)')
        .pipe(map((state) => state.matches)),
      { initialValue: false },
    );
  }

  toggleDarkMode(): void {
    this.patchState((state) => ({ isDarkMode: !state.isDarkMode }));
  }
}
