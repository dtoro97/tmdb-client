import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { switchMap } from 'rxjs';

import { MediaDetailStoreService } from '../media-detail-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
    selector: 'app-media-wrapper',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    providers: [MediaDetailStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaWrapperComponent {
    constructor(
        public mediaStoreService: MediaDetailStoreService,
        private route: ActivatedRoute,
    ) {
        this.route.paramMap
            .pipe(
                switchMap((params) =>
                    this.mediaStoreService.getDetails$(
                        Number(params.get('id'))!,
                        params.get('type')!,
                    ),
                ),
            )

            .pipe(takeUntilDestroyed())
            .subscribe();
    }
}
