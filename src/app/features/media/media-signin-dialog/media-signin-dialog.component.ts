import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-media-signin-dialog',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './media-signin-dialog.component.html',
    styleUrl: './media-signin-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaSigninDialogComponent {
    constructor(
        private readonly dialogRef: MatDialogRef<
            MediaSigninDialogComponent,
            boolean
        >,
    ) {}

    requestLogin(): void {
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
