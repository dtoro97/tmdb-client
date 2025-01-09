import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
@Pipe({
  name: 'yt',
})
export class YoutubeLinkPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(video: any): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${video.key}`
    );
  }
}
