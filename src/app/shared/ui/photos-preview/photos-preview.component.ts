import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { LoadableItems } from '../../types';
import type { ViewerImage } from '../../models';
import { LocaleStoreService } from '../../services/locale-store.service';
import { ImageComponent, type ImageType } from '../image/image.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

type PhotosPreviewMode = 'media' | 'person';

interface PhotosPreviewEntry {
    image: ViewerImage;
    clickIndex: number;
}

interface PhotosPreviewTile extends PhotosPreviewEntry {
    imageType: ImageType;
    imageParams: string;
    layoutAspectRatio: number;
    moreCount: number | null;
    ariaLabel: string;
}

const MAX_MEDIA_PREVIEW_PHOTOS = 9;
const MAX_PERSON_PREVIEW_PHOTOS = 7;
const PERSON_PROFILE_COUNT = 3;
const SKELETON_TILE_COUNT = 9;

@Component({
    selector: 'app-photos-preview',
    imports: [ImageComponent, SkeletonComponent],
    templateUrl: './photos-preview.component.html',
    styleUrl: './photos-preview.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotosPreviewComponent implements OnChanges {
    @Input() state: LoadableItems<ViewerImage> = { type: 'idle' };
    @Input() totalCount = 0;
    @Input() maxVisible: number | null = null;
    @Input() mode: PhotosPreviewMode = 'media';
    @Input() showMoreTile = true;
    @Output() photoClick = new EventEmitter<number>();
    @Output() moreClick = new EventEmitter<void>();

    readonly skeletonTiles = Array.from({ length: SKELETON_TILE_COUNT }, (_, index) => index);
    tiles: PhotosPreviewTile[] = [];

    constructor(private readonly localeStore: LocaleStoreService) {}

    ngOnChanges(): void {
        this.updateViewModel();
    }

    private updateViewModel(): void {
        if (this.state.type !== 'loaded' || !this.state.value.length) {
            this.tiles = [];
            return;
        }

        const visibleCount = this.getVisibleCount();
        const selectedEntries = this.selectEntries(this.state.value, visibleCount);
        const sourceCount = this.totalCount || this.state.value.length;
        const moreCount = this.showMoreTile && sourceCount > selectedEntries.length ? sourceCount - selectedEntries.length + 1 : null;

        this.tiles = selectedEntries.map((entry, index) =>
            this.toPreviewTile(entry, index === selectedEntries.length - 1 ? moreCount : null),
        );
    }

    private getVisibleCount(): number {
        const defaultCount = this.mode === 'person' ? MAX_PERSON_PREVIEW_PHOTOS : MAX_MEDIA_PREVIEW_PHOTOS;
        const maxVisible = this.maxVisible ?? defaultCount;

        return Math.min(Math.max(maxVisible, 0), MAX_MEDIA_PREVIEW_PHOTOS);
    }

    private selectEntries(images: readonly ViewerImage[], visibleCount: number): PhotosPreviewEntry[] {
        const entries = images.map((image, clickIndex) => ({ image, clickIndex }));

        if (this.mode === 'person') {
            return this.selectPersonEntries(entries, visibleCount);
        }

        return this.selectMediaEntries(entries, visibleCount);
    }

    private selectMediaEntries(entries: readonly PhotosPreviewEntry[], visibleCount: number): PhotosPreviewEntry[] {
        const groups = [...this.groupByPhotoType(entries).values()].map((group) => this.preferCurrentLanguage(group));

        return this.mixEntries(groups, visibleCount);
    }

    private selectPersonEntries(entries: readonly PhotosPreviewEntry[], visibleCount: number): PhotosPreviewEntry[] {
        const profiles = entries.filter((entry) => entry.image.photoType === 'profile').slice(0, PERSON_PROFILE_COUNT);
        const tagged = this.preferCurrentLanguage(entries.filter((entry) => entry.image.photoType === 'tagged'));
        const mixed = this.mixEntries([profiles, tagged], visibleCount);

        return mixed.length ? mixed : entries.slice(0, visibleCount);
    }

    private groupByPhotoType(entries: readonly PhotosPreviewEntry[]): Map<string, PhotosPreviewEntry[]> {
        const groups = new Map<string, PhotosPreviewEntry[]>();

        for (const entry of entries) {
            const key = entry.image.photoType ?? 'photo';
            groups.set(key, [...(groups.get(key) ?? []), entry]);
        }

        return groups;
    }

    private preferCurrentLanguage(entries: readonly PhotosPreviewEntry[]): PhotosPreviewEntry[] {
        const language = this.localeStore.language();
        const matches = entries.filter((entry) => entry.image.iso_639_1 === language || entry.image.iso_639_1 === 'en');

        return matches.length ? matches : [...entries];
    }

    private mixEntries(groups: readonly PhotosPreviewEntry[][], count: number): PhotosPreviewEntry[] {
        const selected: PhotosPreviewEntry[] = [];
        const queues = groups.map((group) => [...group]).filter((group) => group.length);

        while (selected.length < count && queues.length) {
            const queue = queues.shift()!;
            const next = queue.shift()!;

            selected.push(next);

            if (queue.length) {
                queues.push(queue);
            }
        }

        return selected;
    }

    private toPreviewTile(entry: PhotosPreviewEntry, moreCount: number | null): PhotosPreviewTile {
        const imageType: ImageType = entry.image.photoType === 'profile' ? 'person' : 'media';

        return {
            ...entry,
            imageType,
            imageParams: entry.image.aspect_ratio && entry.image.aspect_ratio > 1.9 ? 'w780' : 'w500',
            layoutAspectRatio: this.getLayoutAspectRatio(entry.image),
            moreCount,
            ariaLabel: moreCount ? `Browse all photos, ${moreCount} more` : `Open photo ${entry.clickIndex + 1}`,
        };
    }

    private getLayoutAspectRatio(image: ViewerImage): number {
        if (image.photoType === 'profile' || image.photoType === 'poster') {
            return 0.75;
        }

        if (!image.aspect_ratio) {
            return 1.5;
        }

        return Math.min(Math.max(image.aspect_ratio, 0.75), 2.35);
    }
}
