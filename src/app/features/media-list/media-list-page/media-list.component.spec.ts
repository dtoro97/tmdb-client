import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaListPageComponent } from './media-list.component';

describe('MediaListComponent', () => {
  let component: MediaListPageComponent;
  let fixture: ComponentFixture<MediaListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MediaListPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
