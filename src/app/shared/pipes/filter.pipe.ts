import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform<T>(value: T[], filterBy: Partial<T>): T[] {
    if (!Array.isArray(value) || !filterBy) return value;

    const keys = Object.keys(filterBy) as (keyof T)[];

    return value.filter((item) =>
      keys.every((key) => item[key] === filterBy[key]),
    );
  }
}
