import { Pipe, PipeTransform } from '@angular/core';
import { filter } from 'lodash';
@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(value: unknown[], filterBy: Record<string, unknown>): any[] {
    return filter(value, filterBy);
  }
}
