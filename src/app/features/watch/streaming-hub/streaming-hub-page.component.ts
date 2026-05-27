import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImagePipe, RepeatPipe, SkeletonComponent } from '../../../shared';
import { StreamingHubStoreService } from './streaming-hub-store.service';

@Component({
    selector: 'app-streaming-hub-page',
    imports: [AsyncPipe, ImagePipe, RouterLink, RepeatPipe, SkeletonComponent],
    providers: [StreamingHubStoreService],
    templateUrl: './streaming-hub-page.component.html',
    styleUrl: './streaming-hub-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamingHubPageComponent {
    readonly vm$ = this.store.vm$;
    readonly previewSlots = 3;

    constructor(private readonly store: StreamingHubStoreService) {}
}
