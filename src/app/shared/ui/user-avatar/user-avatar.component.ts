import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ImageComponent } from '../image/image.component';

export type UserAvatarSize = 'sm' | 'lg';

@Component({
    selector: 'app-user-avatar',
    imports: [ImageComponent],
    templateUrl: './user-avatar.component.html',
    styleUrl: './user-avatar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAvatarComponent {
    readonly name = input('Member');
    readonly avatarPath = input<string | null>(null);
    readonly size = input<UserAvatarSize>('sm');

    readonly initials = computed(() => getInitials(this.name()));
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
