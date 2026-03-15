import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { switchMap, tap } from 'rxjs';

import { MediaListItemComponent, SortButtonComponent } from '../../../shared';
import { KeywordStoreService } from '../keyword-store.service';

@Component({
    selector: 'app-keyword-detail',
    imports: [
        AsyncPipe,
        MatButtonModule,
        MatChipsModule,
        MediaListItemComponent,
        SortButtonComponent,
    ],
    templateUrl: './keyword-detail.component.html',
    styleUrl: './keyword-detail.component.scss',
    providers: [KeywordStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeywordDetailComponent {
    constructor(
        public store: KeywordStoreService,
        private route: ActivatedRoute,
        private titleService: Title,
    ) {
        this.route.paramMap
            .pipe(
                switchMap((params) =>
                    this.store.loadKeyword$(Number(params.get('id'))),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.store.keyword$
            .pipe(
                tap((keyword) => {
                    if (keyword?.name) {
                        this.titleService.setTitle(
                            `"${keyword.name}" | Keyword`,
                        );
                    }
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    setType(type: 'movie' | 'tv'): void {
        this.store.setSelectedType(type);
    }

    loadMore(): void {
        this.store.loadMore$().subscribe();
    }

    onSortChange(sortField: unknown): void {
        this.store.updateSort(sortField as string).subscribe();
    }

    toggleSortDirection(): void {
        this.store.toggleSortDirection().subscribe();
    }
}
