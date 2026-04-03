import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MEDIUM_LIST_COUNT } from '../../../constants';
import { CarouselComponent, LoadableItems, PersonCardComponent } from '../..';
import { PersonCardItem } from '../../models';
import { RepeatPipe } from '../../pipes/repeat.pipe';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
    selector: 'app-person-carousel-panel',
    imports: [
        CarouselComponent,
        PersonCardComponent,
        SkeletonComponent,
        RepeatPipe,
    ],
    templateUrl: './person-carousel-panel.component.html',
    styleUrl: './person-carousel-panel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonCarouselPanelComponent {
    @Input({ required: true }) state!: LoadableItems<PersonCardItem>;
    @Input() showRank = true;
    @Input() skeletonCount = MEDIUM_LIST_COUNT;
}
