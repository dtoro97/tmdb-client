import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'imgSrc',
})
export class ImagePipe implements PipeTransform {
  transform(value: string): string {
    if (value) {
      return `https://image.tmdb.org/t/p/w500${value}`;
    }
    return 'http://placehold.jp/8a8a8a/fcfcfc/500x750.jpg?text=No%20Poster';
  }
}
