import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

import { ImageComponent } from '../image/image.component';

export type UserAvatarSize = 'sm' | 'lg';

@Component({
    selector: 'app-user-avatar',
    imports: [ImageComponent],
    templateUrl: './user-avatar.component.html',
    styleUrl: './user-avatar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent implements OnChanges {
    @Input({ required: true }) name = 'TMDb Member';
    @Input() avatarPath: string | null = null;
    @Input() size: UserAvatarSize = 'sm';

    initial = 'T';

    ngOnChanges(): void {
        this.initial = this.name.trim().charAt(0).toUpperCase() || 'T';
    }
}
