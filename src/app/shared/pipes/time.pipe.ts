import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'm2h',
})
export class MinutesToHours implements PipeTransform {
    transform(value: number): string {
        const hours = Math.floor(value / 60);
        const minutes = Math.floor(value % 60);

        if (hours && minutes) {
            return `${hours}h ${minutes}min`;
        }

        if (hours) {
            return `${hours}h`;
        }

        return `${minutes}min`;
    }
}
