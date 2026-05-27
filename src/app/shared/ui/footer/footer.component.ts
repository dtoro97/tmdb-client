import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RecentlyViewedComponent } from '../recently-viewed/recently-viewed.component';

@Component({
    selector: 'app-footer',
    imports: [RecentlyViewedComponent, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss',
})
export class FooterComponent {}
