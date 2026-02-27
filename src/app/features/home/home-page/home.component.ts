import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
    HomeStoreService,
    PopularType,
    TimeWindow,
} from '../home-store.service';
import {
    CardComponent,
    CarouselComponent,
    PillToggleComponent,
} from '../../../shared';
import { CAROUSEL_BREAKPOINTS } from '../../../constants';

@Component({
    selector: 'app-home',
    imports: [
        FormsModule,
        CardComponent,
        CarouselComponent,
        AsyncPipe,
        PillToggleComponent,
    ],
    providers: [HomeStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomePageComponent {
    trendingOptions = [
        { label: 'Today', value: 'day' },
        { label: 'This Week', value: 'week' },
    ];
    popularOptions = [
        {
            label: 'TV Shows',
            value: 'tv',
        },
        {
            label: 'Movies',
            value: 'movie',
        },
    ];
    homeVM$ = this.homeStoreService.homeVM$;
    constructor(private homeStoreService: HomeStoreService) {}

    changeTrending(timeWindow: TimeWindow) {
        this.homeStoreService.updateTrendingTime(timeWindow);
    }
    changePopular(mediaType: PopularType) {
        this.homeStoreService.updatePopularType(mediaType);
    }
}
