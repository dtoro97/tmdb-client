import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MEDIUM_LIST_COUNT } from '../../../constants';
import { CarouselComponent, LoadableItems, PersonCardComponent } from '../..';
import { PersonCardItem } from '../../models';
import { RepeatPipe } from '../../pipes/repeat.pipe';

@Component({
    selector: 'app-person-carousel-panel',
    imports: [CarouselComponent, PersonCardComponent, RepeatPipe],
    templateUrl: './person-carousel-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonCarouselPanelComponent {
    @Input({ required: true }) state!: LoadableItems<PersonCardItem>;
    @Input() showRank = true;
    @Input() skeletonCount = MEDIUM_LIST_COUNT;
}
