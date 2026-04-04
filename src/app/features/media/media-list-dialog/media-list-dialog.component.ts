import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MediaUserListSummary } from '../../../shared';

export type MediaListDialogMode = 'lists' | 'sign-in';

export interface MediaListDialogData {
    title: string;
    mode: MediaListDialogMode;
    customLists: MediaUserListSummary[];
}

export type MediaListDialogResult =
    | 'login'
    | { kind: 'select-list'; listId: number }
    | { kind: 'create-list'; name: string; description: string };

@Component({
    selector: 'app-media-list-dialog',
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
    ],
    templateUrl: './media-list-dialog.component.html',
    styleUrl: './media-list-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaListDialogComponent {
    readonly createListForm = this.formBuilder.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        description: ['', [Validators.maxLength(280)]],
    });

    createMode = false;

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public readonly data: MediaListDialogData,
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<
            MediaListDialogComponent,
            MediaListDialogResult
        >,
    ) {
        if (data.mode === 'lists' && data.customLists.length === 0) {
            this.createMode = true;
        }
    }

    selectList(listId: number): void {
        this.dialogRef.close({ kind: 'select-list', listId });
    }

    openCreateMode(): void {
        this.createMode = true;
    }

    cancelCreateMode(): void {
        this.createMode = false;
        this.createListForm.reset({
            name: '',
            description: '',
        });
    }

    submitCreateList(): void {
        if (this.createListForm.invalid) {
            this.createListForm.markAllAsTouched();
            return;
        }

        const { name, description } = this.createListForm.getRawValue();

        this.dialogRef.close({
            kind: 'create-list',
            name: name.trim(),
            description: description.trim(),
        });
    }

    requestLogin(): void {
        this.dialogRef.close('login');
    }

    cancel(): void {
        this.dialogRef.close(undefined);
    }
}
