import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';

import { take, switchMap, tap } from 'rxjs';

import type { ViewerImage } from '../../../shared';
import {
    AgePipe,
    CardComponent,
    CarouselComponent,
    MediaThumbComponent,
    PhotoViewerComponent,
    PhotosGridComponent,
    PillToggleComponent,
    RatingComponent,
    SocialLinksComponent,
} from '../../../shared';
import { PersonDetailStoreService } from '../person-detail-store.service';

@Component({
    selector: 'app-person-details',
    imports: [
        AsyncPipe,
        DatePipe,
        RouterLink,
        MatChipsModule,
        MatDialogModule,
        MatExpansionModule,
        MatPaginatorModule,
        CarouselComponent,
        CardComponent,
        MediaThumbComponent,
        PhotosGridComponent,
        PillToggleComponent,
        RatingComponent,
        SocialLinksComponent,
        AgePipe,
    ],
    providers: [PersonDetailStoreService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './person-details.component.html',
    styleUrl: './person-details.component.scss',
})
export class PersonDetailsComponent {
    bioExpanded = false;

    constructor(
        public personDetailStore: PersonDetailStoreService,
        private titleService: Title,
        private route: ActivatedRoute,
        private dialog: MatDialog,
    ) {
        this.route.paramMap
            .pipe(
                switchMap((paramMap) => {
                    this.bioExpanded = false;
                    return this.personDetailStore.getPersonDetails$(
                        Number(paramMap.get('personId')!),
                    );
                }),
            )
            .subscribe();

        this.personDetailStore.person$
            .pipe(
                tap((person) => {
                    this.titleService.setTitle(`${person.name} | People`);
                }),
            )
            .subscribe();
    }

    openPhotoViewer(index: number): void {
        this.personDetailStore.allPhotos$
            .pipe(take(1))
            .subscribe((images: ViewerImage[]) => {
                this.dialog.open(PhotoViewerComponent, {
                    data: { images, activeIndex: index },
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

    isBioLong(bio: string): boolean {
        return bio.length > 300;
    }

    changeVisibleCredits(value: string): void {
        this.personDetailStore.updateVisibleCredits(value as 'cast' | 'crew');
    }
}
