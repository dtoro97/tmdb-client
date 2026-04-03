import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RepeatPipe } from '../../pipes';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
    selector: 'app-photos-browser-skeleton',
    imports: [RepeatPipe, SkeletonComponent],
    templateUrl: './photos-browser-skeleton.component.html',
    styleUrl: './photos-browser-skeleton.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotosBrowserSkeletonComponent {
    @Input() skeletonCount = 9;
}
