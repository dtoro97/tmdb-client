import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ConfigStoreService, FooterComponent, HeaderComponent } from './shared';
import { MatIconRegistry } from '@angular/material/icon';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    imports: [FooterComponent, HeaderComponent, RouterOutlet],
    styleUrl: './app.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    constructor(
        private matIconRegistry: MatIconRegistry,
        private config: ConfigStoreService,
    ) {
        this.matIconRegistry.registerFontClassAlias('fa');
        this.config.languages$.subscribe();
    }
}
