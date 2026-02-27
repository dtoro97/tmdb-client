import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'm2h',
})
export class MinutesToHours implements PipeTransform {
    transform(value: number): string {
        let hours = Math.floor(value / 60);
        let minutes = Math.floor(value % 60);
        return hours ? hours + 'h ' : '' + minutes + 'min';
    }
}
