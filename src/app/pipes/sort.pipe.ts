import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'sort',
})
export class sortPipe implements PipeTransform {
  transform(value: any[], sortBy: string): any[] {
    return value.sort((a: any, b: any) => b[sortBy] - a[sortBy]);
  }
}
