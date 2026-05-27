import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import {
    EmptyStateComponent,
    ImageComponent,
    MediaCarouselPanelComponent,
    PageSectionComponent,
    PersonCarouselPanelComponent,
    PillToggleComponent,
    RatingComponent,
    SkeletonComponent,
} from '../../../shared';
import { MatButtonModule } from '@angular/material/button';

import { HomeTopPicksComponent } from '../home-top-picks/home-top-picks.component';
import { HomeStoreService } from '../home-store.service';
import { HeroSpotlightComponent } from '../hero-spotlight/hero-spotlight.component';

@Component({
    selector: 'app-home',
    imports: [
        PageSectionComponent,
        MediaCarouselPanelComponent,
        PersonCarouselPanelComponent,
        PillToggleComponent,
        AsyncPipe,
        RouterLink,
        HeroSpotlightComponent,
        MatButtonModule,
        HomeTopPicksComponent,
        ImageComponent,
        RatingComponent,
        EmptyStateComponent,
        SkeletonComponent,
    ],
    providers: [HomeStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomePageComponent {
    readonly tonightSkeletonItems = Array.from(
        { length: 6 },
        (_, index) => index,
    );
    readonly streamingPreviewSkeletonItems = Array.from(
        { length: 3 },
        (_, index) => index,
    );
    readonly homeVM$ = this.homeStoreService.homeVM$;

    constructor(private readonly homeStoreService: HomeStoreService) {
        this.homeStoreService.loadAllSections$().pipe(takeUntilDestroyed()).subscribe();
    }

    onWhatToWatchMediaTypeSelected(value: unknown): void {
        if (value === 'movie' || value === 'tv') {
            this.homeStoreService.setWhatToWatchMediaType(value);
        }
    }
}
