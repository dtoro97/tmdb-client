import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatChipsModule } from '@angular/material/chips';

import { KeywordListItem } from '../../../api';

@Component({
    selector: 'app-keywords-list',
    imports: [MatChipsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './keywords-list.component.html',
    styleUrl: './keywords-list.component.scss',
})
export class KeywordsListComponent {
    @Input() keywords: KeywordListItem[] = [];
    @Input() mediaType: 'movie' | 'tv' = 'movie';
}
