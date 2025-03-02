import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';
@Pipe({
  name: 'sort',
})
export class SortPipe implements PipeTransform {
  transform(value: unknown[], sortBy: string): unknown[] {
    return orderBy(value, sortBy, 'desc');
  }
}
