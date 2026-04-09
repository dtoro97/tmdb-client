import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UserDataListItem } from '../user-data.models';

@Component({
    selector: 'app-user-list-card',
    imports: [RouterLink],
    templateUrl: './user-list-card.component.html',
    styleUrl: './user-list-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListCardComponent {
    @Input({ required: true }) item!: UserDataListItem;
}
