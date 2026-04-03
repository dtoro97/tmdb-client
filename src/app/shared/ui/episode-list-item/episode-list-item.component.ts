import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { ImageComponent } from '../image/image.component';
import { RatingComponent } from '../rating/rating.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export interface EpisodeListItemData {
    readonly name: string;
    readonly subtitle: string | null;
    readonly overview: string;
    readonly stillPath: string | null;
    readonly seasonNumber: number | null;
    readonly episodeNumber: number | null;
    readonly airDate: string | null;
    readonly runtime: number | null;
    readonly voteAverage: number | null;
    readonly routeCommands: readonly (string | number)[] | null;
}

@Component({
    selector: 'app-episode-list-item',
    imports: [DatePipe, ImageComponent, RatingComponent, SkeletonComponent],
    templateUrl: './episode-list-item.component.html',
    styleUrl: './episode-list-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeListItemComponent {
    @Input() item: EpisodeListItemData | null = null;
    @Input() loading = false;

    constructor(private readonly router: Router) {}

    onRowClick(event: MouseEvent): void {
        if (this.isNestedInteractiveTarget(event.target)) {
            return;
        }

        this.navigateToItem();
    }

    onRowKeydown(event: KeyboardEvent): void {
        if (this.isNestedInteractiveTarget(event.target)) {
            return;
        }

        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        this.navigateToItem();
    }

    private navigateToItem(): void {
        if (!this.item?.routeCommands?.length) {
            return;
        }

        this.router.navigate([...this.item.routeCommands]);
    }

    private isNestedInteractiveTarget(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        return !!target.closest('a, button, input, select, textarea');
    }
}
