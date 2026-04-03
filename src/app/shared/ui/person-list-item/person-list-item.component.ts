import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { PersonListItem } from '../../models';
import { ImageComponent } from '../image/image.component';
import { BadgeComponent } from '../badge/badge.component';

@Component({
    selector: 'app-person-list-item',
    templateUrl: './person-list-item.component.html',
    styleUrl: './person-list-item.component.scss',
    imports: [RouterLink, ImageComponent, BadgeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonListItemComponent {
    constructor(private readonly router: Router) {}

    @Input({ required: true }) person!: PersonListItem;
    @Input() index: number | null = null;

    onRowClick(event: MouseEvent): void {
        if (this.isNestedInteractiveEvent(event)) {
            return;
        }

        this.router.navigate(['/name', this.person.id]);
    }

    onRowKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();

        this.router.navigate(['/name', this.person.id]);
    }

    private isNestedInteractiveEvent(event: MouseEvent): boolean {
        const target = event.target;

        if (!(target instanceof HTMLElement)) {
            return false;
        }

        return !!target.closest('a, button, input, select, textarea');
    }
}
