import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  MovieVideos200ResponseResultsInner,
  TvSeriesVideos200ResponseResultsInner,
} from '../../api';

@Pipe({
  name: 'yt',
})
export class YoutubeLinkPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(
    video:
      | MovieVideos200ResponseResultsInner
      | TvSeriesVideos200ResponseResultsInner,
  ): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${video.key}`,
    );
  }
}
