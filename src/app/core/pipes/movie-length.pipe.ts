import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'movieLength',
})
export class MovieLengthPipe implements PipeTransform {
  transform(value: number): string {
    let hours = Math.floor(value / 60);
    let minutes = Math.floor(value % 60);
    return hours + 'h ' + minutes + 'min';
  }
}
