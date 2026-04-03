import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { EMPTY, map, switchMap } from 'rxjs';

import { PersonDetailStoreService } from './person-detail-store.service';

@Component({
    selector: 'app-person-detail-wrapper',
    template: '<router-outlet />',
    imports: [RouterOutlet],
    providers: [PersonDetailStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonDetailWrapperComponent {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private personDetailStore: PersonDetailStoreService,
    ) {
        this.route.paramMap
            .pipe(
                map((params) => Number(params.get('personId'))),
                switchMap((personId) => {
                    if (!Number.isFinite(personId) || personId <= 0) {
                        this.router.navigate(['not-found']);
                        return EMPTY;
                    }

                    return this.personDetailStore.getPersonDetails$(personId);
                }),
                takeUntilDestroyed(),
            )
            .subscribe();
    }
}
