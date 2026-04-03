import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'voteCount',
})
export class VoteCountPipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value == null || !Number.isFinite(value)) {
            return '0';
        }

        const abs = Math.abs(value);
        const sign = value < 0 ? '-' : '';

        if (abs < 1000) {
            return `${Math.round(value)}`;
        }

        if (abs < 1_000_000) {
            return `${sign}${this.format(abs / 1000)}K`;
        }

        return `${sign}${this.format(abs / 1_000_000)}M`;
    }

    private format(value: number): string {
        const rounded =
            value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
        return Number.isInteger(rounded)
            ? rounded.toFixed(0)
            : rounded.toFixed(1);
    }
}
