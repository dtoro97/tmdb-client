import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MediaThumbComponent } from '../media-thumb/media-thumb.component';

export interface KnownForLink {
    id: number;
    title: string;
    mediaType: string;
}

export interface PersonListItem {
    id: number;
    thumb: string | null;
    title: string;
    department: string;
    knownForLinks: KnownForLink[];
}

@Component({
    selector: 'app-person-list-item',
    templateUrl: './person-list-item.component.html',
    styleUrl: './person-list-item.component.scss',
    imports: [RouterLink, MediaThumbComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonListItemComponent {
    @Input({ required: true }) person!: PersonListItem;
    @Input() index: number | null = null;
}
