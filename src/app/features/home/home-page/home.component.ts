import { AsyncPipe, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import {
    ImageComponent,
    MediaCarouselPanelComponent,
    PageSectionComponent,
    PersonCarouselPanelComponent,
    PillToggleComponent,
    RatingComponent,
} from '../../../shared';
import { HomeTopPicksComponent } from '../home-top-picks/home-top-picks.component';
import { HomeStoreService } from '../home-store.service';
import { HomeSpotlightComponent } from '../home-spotlight/home-spotlight.component';

@Component({
    selector: 'app-home',
    imports: [
        PageSectionComponent,
        MediaCarouselPanelComponent,
        PersonCarouselPanelComponent,
        PillToggleComponent,
        AsyncPipe,
        DatePipe,
        SlicePipe,
        RouterLink,
        HomeSpotlightComponent,
        HomeTopPicksComponent,
        ImageComponent,
        RatingComponent,
        DecimalPipe,
    ],
    providers: [HomeStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomePageComponent {
    readonly homeVM$ = this.homeStoreService.homeVM$;

    constructor(private readonly homeStoreService: HomeStoreService) {
        this.homeStoreService
            .loadAllSections$()
            .pipe(takeUntilDestroyed())
            .subscribe();
    }

    onStreamingProviderSelected(providerId: number): void {
        this.homeStoreService.setStreamingProvider(providerId);
    }
}
