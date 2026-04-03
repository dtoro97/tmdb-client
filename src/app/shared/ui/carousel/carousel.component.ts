import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
    selector: 'app-carousel',
    imports: [NgTemplateOutlet, IconButtonComponent],
    templateUrl: './carousel.component.html',
    styleUrl: './carousel.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarouselComponent
    implements AfterViewInit, OnChanges, OnDestroy
{
    @Input() items: unknown[] = [];
    @Input() ariaLabel = 'Carousel';
    @Input() columns: number | null = null;

    @HostBinding('attr.data-columns')
    get hostColumns(): number | null {
        return this.columns;
    }

    @ContentChild(TemplateRef) itemTemplate!: TemplateRef<HTMLElement>;
    @ViewChild('viewport') viewportEl!: ElementRef<HTMLElement>;
    @ViewChild('track') trackEl!: ElementRef<HTMLElement>;

    private viewportElRef: HTMLElement | null = null;
    private trackElRef: HTMLElement | null = null;
    private pendingSyncFrame: number | null = null;

    private resizeObserver: ResizeObserver | null = null;
    private removeScrollListener: (() => void) | null = null;

    hasOverflow = false;
    canPrev = false;
    canNext = false;

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnChanges(): void {
        this.scheduleSyncState();
    }

    ngAfterViewInit(): void {
        const viewport = this.viewportEl.nativeElement;
        this.viewportElRef = viewport;
        this.trackElRef = this.trackEl.nativeElement;

        const onScroll = (): void => {
            this.syncState();
        };

        viewport.addEventListener('scroll', onScroll, { passive: true });
        this.removeScrollListener = () =>
            viewport.removeEventListener('scroll', onScroll);

        this.scheduleSyncState();

        this.resizeObserver = new ResizeObserver(() => {
            this.scheduleSyncState();
        });
        this.resizeObserver.observe(viewport);

        if (this.trackElRef) {
            this.resizeObserver.observe(this.trackElRef);
        }
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.removeScrollListener?.();

        if (this.pendingSyncFrame !== null) {
            cancelAnimationFrame(this.pendingSyncFrame);
        }
    }

    prev(): void {
        this.scrollByPage(-1);
    }

    next(): void {
        this.scrollByPage(1);
    }

    onViewportKeydown(event: KeyboardEvent): void {
        const el = this.viewportElRef;
        if (!el) {
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.prev();
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.next();
        }
    }

    private scrollByPage(direction: 1 | -1): void {
        const el = this.viewportElRef;
        if (!el) {
            return;
        }

        const delta = Math.max(el.clientWidth - 48, 1) * direction;

        el.scrollTo({
            left: el.scrollLeft + delta,
            behavior: 'smooth',
        });
    }

    private scheduleSyncState(): void {
        if (!this.viewportElRef) {
            return;
        }

        if (this.pendingSyncFrame !== null) {
            cancelAnimationFrame(this.pendingSyncFrame);
        }

        this.pendingSyncFrame = requestAnimationFrame(() => {
            this.pendingSyncFrame = null;
            this.syncState();
        });
    }

    private syncState(): void {
        const el = this.viewportElRef;
        if (!el) {
            return;
        }

        const maxScrollLeft = Math.max(el.scrollWidth - el.clientWidth, 0);
        this.hasOverflow = maxScrollLeft > 1;
        this.canPrev = el.scrollLeft > 1;
        this.canNext = el.scrollLeft < maxScrollLeft - 1;
        this.cdr.markForCheck();
    }
}
