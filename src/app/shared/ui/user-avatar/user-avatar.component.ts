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
    @Input({ required: true }) name = 'Member';
    @Input() avatarPath: string | null = null;
    @Input() size: UserAvatarSize = 'sm';

    initials = 'ME';

    ngOnChanges(): void {
        this.initials = getInitials(this.name);
    }
}

function getInitials(name: string): string {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length > 1) {
        return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
    }

    return (parts[0] ?? 'ME').slice(0, 2).toUpperCase();
}
