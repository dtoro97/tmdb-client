import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { MatTooltipModule } from '@angular/material/tooltip';

import { BackdropCardComponent } from '../../../shared';
import { CardItem } from '../../../shared/models';

export interface UserListDetailCardItem extends CardItem {
    readonly key: string;
}

@Component({
    selector: 'app-user-list-detail-item-card',
    imports: [BackdropCardComponent, MatTooltipModule],
    templateUrl: './user-list-detail-item-card.component.html',
    styleUrl: './user-list-detail-item-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListDetailItemCardComponent {
    @Input({ required: true }) item!: UserListDetailCardItem;
    @Input() showRemove = true;

    @Output() readonly remove = new EventEmitter<UserListDetailCardItem>();
}
