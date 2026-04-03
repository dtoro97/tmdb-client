import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
} from '@angular/core';

import {
    MAX_VISIBLE_PHOTOS,
    PHOTOS_GRID_FIRST_ROW,
    GRID_COUNT,
} from '../../../constants';
import { LoadableItems } from '../../types';
import type { ViewerImage } from '../../models';
import { ImagePipe } from '../../pipes/image.pipe';
import { RepeatPipe } from '../../pipes/repeat.pipe';
import { SkeletonComponent } from '../skeleton/skeleton.component';

interface PhotosGridItem {
    image: ViewerImage;
    clickIndex: number;
    aspectRatio: number;
    moreCount: number | null;
}

@Component({
    selector: 'app-photos-grid',
    imports: [ImagePipe, SkeletonComponent, RepeatPipe],
    templateUrl: './photos-grid.component.html',
    styleUrl: './photos-grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotosGridComponent implements OnChanges {
    @Input() state: LoadableItems<ViewerImage> = { type: 'idle' };
    @Input() totalCount = 0;
    @Input() maxVisible = MAX_VISIBLE_PHOTOS;
    @Input() firstRowCount = PHOTOS_GRID_FIRST_ROW;
    @Input() skeletonSecondRowCount = GRID_COUNT;
    @Output() photoClick = new EventEmitter<number>();

    isLoading = true;
    gridItems: PhotosGridItem[] = [];

    ngOnChanges(): void {
        this.updateViewModel();
    }

    private updateViewModel(): void {
        this.isLoading =
            this.state.type === 'idle' || this.state.type === 'loading';

        if (this.state.type !== 'loaded' || !this.state.value.length) {
            this.gridItems = [];
            return;
        }

        const visibleImages = this.state.value.slice(0, this.maxVisible);
        const hasMorePhotos = this.totalCount > visibleImages.length;
        const moreCount = hasMorePhotos
            ? this.totalCount - visibleImages.length + 1
            : null;

        this.gridItems = visibleImages.map((image, index, items) =>
            this.toGridItem(image, index, {
                moreCount: index === items.length - 1 ? moreCount : null,
            }),
        );
    }

    private toGridItem(
        image: ViewerImage,
        clickIndex: number,
        options: Partial<PhotosGridItem> = {},
    ): PhotosGridItem {
        return {
            image,
            clickIndex,
            aspectRatio: image.aspect_ratio ?? 1.5,
            moreCount: null,
            ...options,
        };
    }
}
