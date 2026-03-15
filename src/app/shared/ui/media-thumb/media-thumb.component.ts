import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ImagePipe } from '../../pipes';

@Component({
    selector: 'app-media-thumb',
    imports: [ImagePipe],
    templateUrl: './media-thumb.component.html',
    styleUrl: './media-thumb.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaThumbComponent {
    @Input() src: string | null = null;
    @Input() type: 'media' | 'person' = 'media';
    @Input() alt = '';
    @Input() params?: string;
}
