import { Pipe, PipeTransform } from '@angular/core';
import { PersonDetails200Response } from '../../api/model/personDetails200Response';
@Pipe({
  name: 'age',
})
export class AgePipe implements PipeTransform {
  transform(person: PersonDetails200Response): number {
    const difference =
      ((person.deathday ? new Date(person.deathday) : new Date()).getTime() -
        new Date(person.birthday!).getTime()) /
      1000 /
      (60 * 60 * 24);
    return Math.abs(Math.round(difference / 365.25));
  }
}
