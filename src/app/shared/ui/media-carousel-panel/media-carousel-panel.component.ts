import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { PAGE_SIZE } from '../../../constants';
import {
    CardDateFormat,
    CardComponent,
    CarouselComponent,
    LoadableItems,
    SkeletonComponent,
    BackdropCardComponent,
} from '../..';
import { CardItem } from '../../models';
import { RepeatPipe } from '../../pipes/repeat.pipe';

export type MediaCarouselPanelVariant = 'card' | 'backdrop';

@Component({
    selector: 'app-media-carousel-panel',
    imports: [
        CardComponent,
        CarouselComponent,
        SkeletonComponent,
        RepeatPipe,
        BackdropCardComponent,
    ],
    templateUrl: './media-carousel-panel.component.html',
    styleUrl: './media-carousel-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaCarouselPanelComponent {
    @Input({ required: true }) state!: LoadableItems<CardItem>;
    @Input() dateFormat: CardDateFormat = 'year';
    @Input() showRating = true;
    @Input() showDate = false;
    @Input() variant: MediaCarouselPanelVariant = 'card';
    @Input() columns: number | null = null;
    readonly skeletonCount = PAGE_SIZE;
}
