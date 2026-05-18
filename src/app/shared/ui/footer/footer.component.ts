import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RecentlyViewedComponent } from '../recently-viewed/recently-viewed.component';

@Component({
    selector: 'app-footer',
    imports: [RecentlyViewedComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss',
})
export class FooterComponent {}
