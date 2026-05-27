import { ViewportScroller } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class PageScrollService {
    constructor(private readonly viewportScroller: ViewportScroller) {}

    scrollToTop(): void {
        this.viewportScroller.scrollToPosition([0, 0]);
    }
}
