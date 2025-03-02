import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';
@Pipe({
  name: 'sort',
})
export class SortPipe implements PipeTransform {
  transform(value: any[], sortBy: string): any[] {
    return orderBy(value, sortBy, 'desc');
  }
}
