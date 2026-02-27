import { definePreset } from '@primeng/themes';
import Material from '@primeng/themes/material';

export const MAX_LIST_PAGE_SIZE = 20;
export const MAX_PAGES = 500;
export const MATERIAL = definePreset(Material, {
    semantic: {
        primary: {
            50: '{red.50}',
            100: '{red.100}',
            200: '{red.200}',
            300: '{red.300}',
            400: '{red.400}',
            500: '{red.500}',
            600: '{red.600}',
            700: '{red.700}',
            800: '{red.800}',
            900: '{red.900}',
            950: '{red.950}',
        },
    },
});
export const CAROUSEL_BREAKPOINTS = [
    {
        breakpoint: '2000px',
        numVisible: 6,
        numScroll: 6,
    },
    {
        breakpoint: '1600px',
        numVisible: 5,
        numScroll: 5,
    },
    {
        breakpoint: '1500px',
        numVisible: 4,
        numScroll: 4,
    },
    {
        breakpoint: '1400px',
        numVisible: 4,
        numScroll: 4,
    },
    {
        breakpoint: '920px',
        numVisible: 3,
        numScroll: 3,
    },
];
