import { Image } from '../../api';

export interface ViewerImage extends Image {
    caption?: string;
    photoType?: string;
}

export interface PhotoViewerData {
    images: readonly ViewerImage[];
    activeIndex: number;
    photosLink?: string | readonly (string | number)[];
}

export interface PhotosBrowserSelection {
    images: ViewerImage[];
    index: number;
}
