import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-not-found',
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.scss',
    imports: [MatButtonModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
