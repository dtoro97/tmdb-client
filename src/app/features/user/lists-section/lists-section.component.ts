import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import {
    EmptyStateComponent,
    SkeletonComponent,
    SubPageHeaderComponent,
    RepeatPipe,
} from '../../../shared';
import { UserListCardComponent } from '../user-list-card/user-list-card.component';
import { UserListCardSkeletonComponent } from '../user-list-card-skeleton/user-list-card-skeleton.component';
import { UserListsStore } from '../user-lists-store.service';

@Component({
    selector: 'app-lists-section',
    imports: [
        AsyncPipe,
        MatButtonModule,
        EmptyStateComponent,
        SkeletonComponent,
        SubPageHeaderComponent,
        UserListCardComponent,
        UserListCardSkeletonComponent,
        RepeatPipe,
    ],
    templateUrl: './lists-section.component.html',
    styleUrl: './lists-section.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListsSectionComponent {
    readonly vm$ = this.store.vm$;

    constructor(private readonly store: UserListsStore) {}

    onShowMore(): void {
        this.store.loadMoreLists$().subscribe();
    }
}
