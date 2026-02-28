import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EventType, Router, RouterOutlet } from '@angular/router';

import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { FooterComponent, HeaderComponent } from './shared';
import { MatIconRegistry } from '@angular/material/icon';
import { filter, tap } from 'rxjs';
import { ViewportScroller } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    imports: [
        FooterComponent,
        HeaderComponent,
        RouterOutlet,
        NgxUiLoaderModule,
    ],
    styleUrl: './app.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    constructor(
        private matIconRegistry: MatIconRegistry,
        private router: Router,
        private scroller: ViewportScroller,
    ) {
        this.matIconRegistry.registerFontClassAlias('fa');
        this.router.events
            .pipe(
                takeUntilDestroyed(),
                filter((event) => event.type === EventType.NavigationEnd),
                tap(() => this.scroller.scrollToPosition([0, 0])),
            )
            .subscribe();
    }
}
