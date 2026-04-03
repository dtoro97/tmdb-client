import { AsyncPipe, DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { take, tap } from 'rxjs';

import {
    AgePipe,
    HeroSurfaceComponent,
    ImageComponent,
    PageSectionComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    ExternalLinksComponent,
    MediaCarouselPanelComponent,
} from '../../../shared';
import { MAX_VISIBLE_PHOTOS } from '../../../constants';
import {
    PersonDetailStoreService,
    PersonCreditsMediaType,
    PersonCreditsSection,
    PersonCreditsSortBy,
} from '../person-detail-store.service';
import { PersonCreditsComponent } from '../person-credits/person-credits.component';

@Component({
    selector: 'app-person-details',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MatDialogModule,
        HeroSurfaceComponent,
        ImageComponent,
        PhotosGridComponent,
        ExternalLinksComponent,
        AgePipe,
        PageSectionComponent,
        PersonCreditsComponent,
        MediaCarouselPanelComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './person-details.component.html',
    styleUrl: './person-details.component.scss',
})
export class PersonDetailsComponent {
    private readonly maxVisiblePhotos = MAX_VISIBLE_PHOTOS;
    readonly knownForSkeletonCount = [1, 2, 3, 4];

    readonly bioPreviewThreshold = 300;
    bioExpanded = false;

    constructor(
        public personDetailStore: PersonDetailStoreService,
        private titleService: Title,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        private router: Router,
        private destroyRef: DestroyRef,
    ) {
        this.route.paramMap
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.bioExpanded = false;
            });

        this.personDetailStore.personDetailVm$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((vm) => {
                    if (vm.person.type === 'loaded' && vm.person.value) {
                        this.titleService.setTitle(
                            `${vm.person.value.name} | People`,
                        );
                    }
                }),
            )
            .subscribe();
    }

    openPhotoViewer(index: number): void {
        this.personDetailStore.personDetailVm$.pipe(take(1)).subscribe((vm) => {
            if (
                vm.person.type !== 'loaded' ||
                !vm.person.value ||
                vm.photos.type !== 'loaded'
            ) {
                return;
            }

            const person = vm.person.value;
            const allPhotos = vm.photos.value;
            const totalCount = allPhotos.length;
            const visibleCount = Math.min(totalCount, this.maxVisiblePhotos);
            const isShowMoreTile =
                index === visibleCount - 1 &&
                totalCount > this.maxVisiblePhotos;
            if (isShowMoreTile) {
                this.router.navigate(['/name', person.id, 'photos']);
                return;
            }

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

    toggleBio(): void {
        this.bioExpanded = !this.bioExpanded;
    }

    onCreditsSectionChange(value: PersonCreditsSection): void {
        this.personDetailStore.setCreditsSection(value);
    }

    onCreditsMediaTypeChange(value: PersonCreditsMediaType): void {
        this.personDetailStore.setCreditsMediaType(value);
    }

    onCreditsSortByChange(value: PersonCreditsSortBy): void {
        this.personDetailStore.setCreditsSortBy(value);
    }

    toggleCreditsSortDirection(): void {
        this.personDetailStore.toggleCreditsSortDirection();
    }
}
