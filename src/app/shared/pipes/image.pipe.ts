import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'imgSrc',
})
export class ImagePipe implements PipeTransform {
    transform(value?: string | null, options = 'w300'): string {
        if (!value) {
            return 'https://placehold.jp/8a8a8a/fcfcfc/500x750.jpg?text=No%20Poster';
        }

        if (value.startsWith('/http://') || value.startsWith('/https://')) {
            return value.slice(1);
        }

        if (value.startsWith('http://') || value.startsWith('https://')) {
            return value;
        }

        const normalizedValue = value.startsWith('/') ? value : `/${value}`;
        return `https://image.tmdb.org/t/p/${options}${normalizedValue}`;
    }
}
