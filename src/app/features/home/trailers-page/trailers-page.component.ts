import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

import {
    SkeletonComponent,
    SubPageBannerComponent,
    VideoCardComponent,
} from '../../../shared';
import { TrailersPageStoreService } from './trailers-page-store.service';

@Component({
    selector: 'app-trailers-page',
    imports: [
        AsyncPipe,
        MatTabsModule,
        MatButtonModule,
        SubPageBannerComponent,
        VideoCardComponent,
        SkeletonComponent,
    ],
    providers: [TrailersPageStoreService],
    templateUrl: './trailers-page.component.html',
    styleUrl: './trailers-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailersPageComponent {
    readonly vm$ = this.store.vm$;
    readonly skeletonRows = Array.from({ length: 12 }, (_, i) => i);
    readonly pageSize = 20;
    trendingVisibleCount = this.pageSize;
    popularVisibleCount = this.pageSize;

    constructor(private store: TrailersPageStoreService) {}

    showMoreTrending(): void {
        this.trendingVisibleCount += this.pageSize;
    }

    showMorePopular(): void {
        this.popularVisibleCount += this.pageSize;
    }
}
