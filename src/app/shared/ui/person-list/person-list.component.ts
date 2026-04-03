import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { SMALL_LIST_COUNT } from '../../../constants';
import { LoadableItems } from '../../types';
import { PersonListItem } from '../../models';
import { RepeatPipe } from '../../pipes/repeat.pipe';
import { PersonListItemComponent } from '../person-list-item/person-list-item.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
    selector: 'app-person-list',
    imports: [NgTemplateOutlet, PersonListItemComponent, SkeletonComponent, RepeatPipe],
    templateUrl: './person-list.component.html',
    styleUrl: './person-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonListComponent {
    @Input({ required: true }) state!: LoadableItems<PersonListItem>;
    @Input() skeletonCount = SMALL_LIST_COUNT;
    @Input() showIndex = false;
    @Input() indexStart = 1;
}

