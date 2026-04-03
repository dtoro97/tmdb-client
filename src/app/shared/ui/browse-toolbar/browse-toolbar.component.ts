import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-browse-toolbar',
    standalone: true,
    templateUrl: './browse-toolbar.component.html',
    styleUrl: './browse-toolbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowseToolbarComponent {}
