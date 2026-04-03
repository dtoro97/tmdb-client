import {
    ChangeDetectionStrategy,
    Component,
    Input,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { DatePipe, DecimalPipe } from '@angular/common';

import { MediaListItem } from '../../models';
import { ImageComponent } from '../image/image.component';
import { BadgeComponent } from '../badge/badge.component';
import { RatingComponent } from '../rating/rating.component';

@Component({
    selector: 'app-media-list-item',
    templateUrl: './media-list-item.component.html',
    styleUrl: './media-list-item.component.scss',
    imports: [
        RouterLink,
        DecimalPipe,
        DatePipe,
        ImageComponent,
        RatingComponent,
        BadgeComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListItemComponent {
    constructor(private readonly router: Router) {}

    @Input({ required: true }) item!: MediaListItem;
    @Input({ required: true }) routerLink!: (string | number)[];
    @Input() index: number | null = null;
    @Input() genreNames: string[] = [];
    @Input() userRating: number | null = null;

    onRowClick(event: MouseEvent) {
        if (this.isNestedInteractiveEvent(event)) {
            return;
        }

        this.router.navigate(this.routerLink);
    }

    onRowKeydown(event: KeyboardEvent) {
        if (this.isNestedInteractiveTarget(event.target)) {
            return;
        }

        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();

        this.router.navigate(this.routerLink);
    }

    private isNestedInteractiveEvent(event: MouseEvent): boolean {
        return this.isNestedInteractiveTarget(event.target);
    }

    private isNestedInteractiveTarget(target: EventTarget | null): boolean {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        return !!target.closest('a, button, input, select, textarea');
    }
}
