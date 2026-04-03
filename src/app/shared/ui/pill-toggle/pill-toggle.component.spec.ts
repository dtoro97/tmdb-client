import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PillToggleComponent } from './pill-toggle.component';

describe('PillToggleComponent', () => {
    let component: PillToggleComponent;
    let fixture: ComponentFixture<PillToggleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PillToggleComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PillToggleComponent);
        component = fixture.componentInstance;
        component.options = [
            { label: 'All', value: 'all' },
            { label: 'Movies', value: 'movie' },
            { label: 'TV Series', value: 'tv' },
        ];
    });

    it('marks only the selected single-choice option as pressed', () => {
        component.selectedValue = 'movie';
        fixture.detectChanges();

        const buttons = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
        );

        expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
            'false',
            'true',
            'false',
        ]);
    });

    it('marks selected options as pressed in multi-select mode', () => {
        component.multiple = true;
        component.selectedValues = ['all', 'tv'];
        fixture.detectChanges();

        const buttons = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
        );

        expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
            'true',
            'false',
            'true',
        ]);
    });
});
