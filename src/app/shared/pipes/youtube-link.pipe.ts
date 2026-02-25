import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Video } from '../../api';

@Pipe({
  name: 'yt',
})
export class YoutubeLinkPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(video: Video): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${video.key}`,
    );
  }
}
