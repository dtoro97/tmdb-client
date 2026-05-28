import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PersonListItem } from '../../models';
import { ImageComponent } from '../image/image.component';

@Component({
    selector: 'app-person-list-item',
    templateUrl: './person-list-item.component.html',
    styleUrl: './person-list-item.component.scss',
    imports: [RouterLink, ImageComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonListItemComponent {
    @Input({ required: true }) person!: PersonListItem;
    @Input({ required: true }) index!: number;
}
