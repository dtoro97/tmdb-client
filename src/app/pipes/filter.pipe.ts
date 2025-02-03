import { Pipe, PipeTransform } from '@angular/core';
import { filter, orderBy } from 'lodash';
@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(value: any[], filterBy: any): any[] {
    return filter(value, filterBy);
  }
}
