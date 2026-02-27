import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-rating',
    imports: [MatIconModule, DecimalPipe],
    template: `
        <span class="rating">
            <mat-icon>star</mat-icon>{{ value | number: '1.1-1' }}
        </span>
    `,
    styles: [
        `
            .rating {
                display: inline-flex;
                align-items: center;
                gap: 0.2rem;
                font-weight: 500;
                color: var(--mat-sys-on-surface-variant);

                mat-icon {
                    font-size: 1rem;
                    width: 1rem;
                    height: 1rem;
                    color: var(--primary-color);
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingComponent {
    @Input({ required: true }) value!: number;
}
