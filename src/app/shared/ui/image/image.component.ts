import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ImagePipe } from '../../pipes';

export type ImageType = 'media' | 'person';

@Component({
    selector: 'app-image',
    imports: [ImagePipe],
    templateUrl: './image.component.html',
    styleUrl: './image.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent {
    @Input() src: string | null = null;
    @Input() type: ImageType = 'media';
    @Input() alt = '';
    @Input() params?: string;
}
