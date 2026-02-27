import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { switchMap } from 'rxjs';

import { MediaStoreService } from '../media-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewportScroller } from '@angular/common';

@Component({
    selector: 'app-media-wrapper',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    providers: [MediaStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaWrapperComponent {
    constructor(
        public mediaStoreService: MediaStoreService,
        private route: ActivatedRoute,
        private scroller: ViewportScroller,
    ) {
        this.route.paramMap
            .pipe(
                takeUntilDestroyed(),
                switchMap((params) =>
                    this.mediaStoreService.getDetails$(
                        Number(params.get('id'))!,
                        params.get('type')!,
                    ),
                ),
            )
            .subscribe(() => this.scroller.scrollToPosition([0, 0]));
    }
}
