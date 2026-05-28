import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import {
    BrowseToolbarComponent,
    EmptyStateComponent,
    PageScrollService,
    PersonListComponent,
} from '../../../shared';
import { PopularPeopleStoreService } from './popular-people-store.service';

@Component({
    selector: 'app-popular-people-page',
    imports: [
        AsyncPipe,
        BrowseToolbarComponent,
        EmptyStateComponent,
        MatPaginatorModule,
        PersonListComponent,
    ],
    providers: [PopularPeopleStoreService],
    templateUrl: './popular-people-page.component.html',
    styleUrl: './popular-people-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopularPeoplePageComponent {
    readonly vm$ = this.store.vm$;

    constructor(
        private readonly pageScroll: PageScrollService,
        private readonly store: PopularPeopleStoreService,
    ) {}

    onPageChange(event: PageEvent): void {
        this.pageScroll.scrollToTop();
        this.store.updatePage(event.pageIndex);
    }
}
