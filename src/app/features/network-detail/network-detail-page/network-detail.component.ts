import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { switchMap, tap } from 'rxjs';

import {
    ImagePipe,
    MediaListItemComponent,
    SortButtonComponent,
} from '../../../shared';
import {
    NetworkStoreService,
} from '../network-store.service';

@Component({
    selector: 'app-network-detail',
    imports: [
        AsyncPipe,
        RouterLink,
        MatButtonModule,
        MatChipsModule,
        SortButtonComponent,
        MediaListItemComponent,
        ImagePipe,
    ],
    templateUrl: './network-detail.component.html',
    styleUrl: './network-detail.component.scss',
    providers: [NetworkStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkDetailComponent {
    constructor(
        public store: NetworkStoreService,
        private route: ActivatedRoute,
        private titleService: Title,
    ) {
        this.route.paramMap
            .pipe(
                switchMap((params) =>
                    this.store.loadNetwork$(Number(params.get('id'))),
                ),
                takeUntilDestroyed(),
            )
            .subscribe();

        this.store.network$
            .pipe(
                tap((network) => {
                    if (network?.name) {
                        this.titleService.setTitle(`${network.name} | Network`);
                    }
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }

    onSortChange(sortField: unknown): void {
        this.store.updateSort(sortField as string).subscribe();
    }

    toggleSortDirection(): void {
        this.store.toggleSortDirection().subscribe();
    }

    loadMore(): void {
        this.store.loadMore$().subscribe();
    }
}
