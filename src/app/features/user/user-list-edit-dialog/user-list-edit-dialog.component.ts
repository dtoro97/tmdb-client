import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
    FormControl,
    NonNullableFormBuilder,
    FormGroup,
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

export interface UserListEditDialogData {
    readonly name: string;
    readonly description: string | null;
    readonly maxNameLength?: number;
    readonly maxDescriptionLength?: number;
}

export interface UserListEditDialogResult {
    readonly name: string;
    readonly description: string;
}

@Component({
    selector: 'app-user-list-edit-dialog',
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
    ],
    templateUrl: './user-list-edit-dialog.component.html',
    styleUrl: './user-list-edit-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListEditDialogComponent {
    readonly form: FormGroup<{
        name: FormControl<string>;
        description: FormControl<string>;
    }>;

    constructor(
        @Inject(MAT_DIALOG_DATA)
        public readonly data: UserListEditDialogData,
        private readonly dialogRef: MatDialogRef<
            UserListEditDialogComponent,
            UserListEditDialogResult
        >,
        private readonly formBuilder: NonNullableFormBuilder,
    ) {
        this.form = this.formBuilder.group({
            name: [
                this.data.name,
                [
                    Validators.required,
                    Validators.maxLength(this.data.maxNameLength ?? 100),
                ],
            ],
            description: [
                this.data.description ?? '',
                [Validators.maxLength(this.data.maxDescriptionLength ?? 280)],
            ],
        });
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const { name, description } = this.form.getRawValue();

        this.dialogRef.close({
            name: name.trim(),
            description: description.trim(),
        });
    }
}
