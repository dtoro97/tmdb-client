import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'repeat', standalone: true })
export class RepeatPipe implements PipeTransform {
    private cache: { count: number; result: number[] } = { count: 0, result: [] };

    transform(count: number): number[] {
        if (count === this.cache.count) {
            return this.cache.result;
        }
        const result = Array.from({ length: count }, (_, i) => i);
        this.cache = { count, result };
        return result;
    }
}
