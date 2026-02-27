import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { ImagePipe } from '../../pipes/image.pipe';
import type { ViewerImage } from '../photo-viewer/photo-viewer.component';

@Component({
    selector: 'app-photos-grid',
    imports: [ImagePipe],
    templateUrl: './photos-grid.component.html',
    styleUrl: './photos-grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotosGridComponent {
    @Input() images: ViewerImage[] = [];
    @Input() totalCount = 0;
    @Input() aspectRatio = '16 / 9';
    @Output() photoClick = new EventEmitter<number>();
}
