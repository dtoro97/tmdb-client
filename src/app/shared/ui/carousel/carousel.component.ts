import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ElementRef,
    Input,
    OnDestroy,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CAROUSEL_BREAKPOINTS } from '../../../constants';

export interface CarouselBreakpoint {
    breakpoint: string;
    numVisible: number;
    numScroll: number;
}

@Component({
    selector: 'app-carousel',
    imports: [NgTemplateOutlet],
    templateUrl: './carousel.component.html',
    styleUrl: './carousel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarouselComponent implements AfterViewInit, OnDestroy {
    @Input() items: unknown[] = [];
    @Input() numVisible = 5;
    @Input() numScroll = 5;

    @ContentChild(TemplateRef) itemTemplate!: TemplateRef<HTMLElement>;
    @ViewChild('viewport') viewportEl!: ElementRef<HTMLElement>;

    currentIndex = 0;
    activeNumVisible = 5;
    activeNumScroll = 5;
    readonly breakpoints = CAROUSEL_BREAKPOINTS;

    private resizeObserver: ResizeObserver | null = null;

    constructor(private cdr: ChangeDetectorRef) {}

    ngAfterViewInit(): void {
        this.activeNumVisible = this.numVisible;
        this.activeNumScroll = this.numScroll;
        this.applyBreakpoint(window.innerWidth);

        this.resizeObserver = new ResizeObserver(() => {
            this.applyBreakpoint(window.innerWidth);
            this.cdr.markForCheck();
        });
        this.resizeObserver.observe(document.body);
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
    }

    get canPrev(): boolean {
        return this.currentIndex > 0;
    }

    get canNext(): boolean {
        return this.currentIndex + this.activeNumVisible < this.items.length;
    }

    prev(): void {
        this.currentIndex = Math.max(
            0,
            this.currentIndex - this.activeNumScroll,
        );
        this.scrollToIndex();
    }

    next(): void {
        const maxIndex = this.items.length - this.activeNumVisible;
        this.currentIndex = Math.min(
            maxIndex,
            this.currentIndex + this.activeNumScroll,
        );
        this.scrollToIndex();
    }

    private scrollToIndex(): void {
        const el = this.viewportEl.nativeElement;
        const itemWidth = el.scrollWidth / this.items.length;
        el.scrollTo({
            left: this.currentIndex * itemWidth,
            behavior: 'smooth',
        });
        this.cdr.markForCheck();
    }

    private applyBreakpoint(width: number): void {
        if (!this.breakpoints.length) {
            this.activeNumVisible = this.numVisible;
            this.activeNumScroll = this.numScroll;
            return;
        }

        const sorted = [...this.breakpoints].sort(
            (a, b) => this.parsePx(a.breakpoint) - this.parsePx(b.breakpoint),
        );

        let matched: CarouselBreakpoint | null = null;
        for (const option of sorted) {
            if (width <= this.parsePx(option.breakpoint)) {
                matched = option;
                break;
            }
        }

        if (matched) {
            this.activeNumVisible = matched.numVisible;
            this.activeNumScroll = matched.numScroll;
        } else {
            this.activeNumVisible = this.numVisible;
            this.activeNumScroll = this.numScroll;
        }

        const maxIndex = Math.max(0, this.items.length - this.activeNumVisible);
        if (this.currentIndex > maxIndex) {
            this.currentIndex = maxIndex;
            this.scrollToIndex();
        }
    }

    private parsePx(value: string): number {
        return parseInt(value.replace('px', ''), 10);
    }
}
