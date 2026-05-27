import { AsyncPipe, DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { distinctUntilChanged, map, take, tap } from 'rxjs';

import {
    AgePipe,
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosPreviewComponent,
    ExternalLinksComponent,
    MediaCarouselPanelComponent,
    RecentlyViewedStoreService,
    SkeletonComponent,
} from '../../../shared';
import {
    PersonDetailStoreService,
    PersonCreditsMediaType,
    PersonCreditsSortBy,
} from '../person-detail-store.service';
import { PersonCreditsComponent } from '../person-credits/person-credits.component';

@Component({
    selector: 'app-person-details',
    imports: [
        AsyncPipe,
        DatePipe,
        SlicePipe,
        RouterLink,
        MatDialogModule,
        ImageComponent,
        PhotosPreviewComponent,
        ExternalLinksComponent,
        AgePipe,
        PageSectionComponent,
        PersonCreditsComponent,
        MediaCarouselPanelComponent,
        SkeletonComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './person-details.component.html',
    styleUrl: './person-details.component.scss',
})
export class PersonDetailsComponent {
    readonly aliasPreviewCount = 3;
    readonly bioPreviewThreshold = 300;
    bioExpanded = false;

    constructor(
        public personDetailStore: PersonDetailStoreService,
        private titleService: Title,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        private recentlyViewedStore: RecentlyViewedStoreService,
        private router: Router,
        private destroyRef: DestroyRef,
    ) {
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.bioExpanded = false;
        });

        this.personDetailStore.personDetailVm$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((vm) => (vm.person.type === 'loaded' ? vm.person.value : null)),
                distinctUntilChanged((previous, current) => previous?.id === current?.id),
                tap((person) => {
                    if (!person || typeof person.id !== 'number') {
                        return;
                    }

                    this.titleService.setTitle(`${person.name} | People`);
                    this.recentlyViewedStore.addItem({
                        kind: 'person',
                        id: person.id,
                        name: person.name ?? '',
                        imagePath: person.profile_path ?? null,
                        subtitle: person.known_for_department ?? '',
                    });
                }),
            )
            .subscribe();
    }

    openPhotoViewer(index: number): void {
        this.personDetailStore.personDetailVm$.pipe(take(1)).subscribe((vm) => {
            if (vm.person.type !== 'loaded' || !vm.person.value || vm.photos.type !== 'loaded') {
                return;
            }

            const person = vm.person.value;
            const allPhotos = vm.photos.value;

            this.dialog.open(PhotoViewerComponent, {
                data: {
                    images: allPhotos,
                    activeIndex: index,
                    photosLink: ['/name', person.id, 'photos'],
                },
                panelClass: 'photo-viewer-panel',
                maxWidth: '100vw',
                maxHeight: '100vh',
                width: '100vw',
                height: '100vh',
                autoFocus: false,
            });
        });
    }

    openPhotosPage(): void {
        this.personDetailStore.personDetailVm$.pipe(take(1)).subscribe((vm) => {
            if (vm.person.type !== 'loaded' || !vm.person.value) {
                return;
            }

            this.router.navigate(['/name', vm.person.value.id, 'photos']);
        });
    }

    toggleBio(): void {
        this.bioExpanded = !this.bioExpanded;
    }

    onCreditsMediaTypeChange(value: PersonCreditsMediaType): void {
        this.personDetailStore.setCreditsMediaType(value);
    }

    onCreditsSortByChange(value: PersonCreditsSortBy): void {
        this.personDetailStore.setCreditsSortBy(value);
    }

    resetCreditsFilters(): void {
        this.personDetailStore.resetCreditsFilters();
    }

    toggleCreditsSortDirection(): void {
        this.personDetailStore.toggleCreditsSortDirection();
    }

    toggleActingCredits(): void {
        this.personDetailStore.toggleActingCredits();
    }

    toggleProductionCredits(): void {
        this.personDetailStore.toggleProductionCredits();
    }
}
