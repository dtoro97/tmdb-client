import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';

import { KeywordListItem } from '../../../api';

@Component({
    selector: 'app-keywords-list',
    imports: [MatChipsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (keywords.length) {
            <div class="keywords-list">
                <div class="keywords-wrap">
                    @for (keyword of keywords; track keyword.id) {
                        <mat-chip
                            class="keyword-chip"
                            [routerLink]="['/keyword', keyword.id]"
                        >
                            {{ keyword.name }}
                        </mat-chip>
                    }
                </div>
            </div>
        }
    `,
    styleUrl: './keywords-list.component.scss',
})
export class KeywordsListComponent {
    @Input() keywords: KeywordListItem[] = [];
}
