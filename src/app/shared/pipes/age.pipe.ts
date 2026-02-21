import { Pipe, PipeTransform } from '@angular/core';
import { PersonDetails } from 'tmdb-ts';
@Pipe({
  name: 'age',
})
export class AgePipe implements PipeTransform {
  transform(person: PersonDetails): number {
    const difference =
      ((person.deathday ? new Date(person.deathday) : new Date()).getTime() -
        new Date(person.birthday).getTime()) /
      1000 /
      (60 * 60 * 24);
    return Math.abs(Math.round(difference / 365.25));
  }
}
