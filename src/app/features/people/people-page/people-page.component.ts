import { PaginatorModule, PaginatorState } from 'primeng/paginator';

import { AsyncPipe, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { AppStoreService } from '../../../core/app-store.service';
import { PeopleListStoreService } from '../people-store.service';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-people-page',
  imports: [PaginatorModule, AsyncPipe, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './people-page.component.html',
  styleUrl: './people-page.component.scss',
})
export class PeoplePageComponent implements OnInit {
  isMobile: Signal<boolean>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private appStore: AppStoreService,
    private titleService: Title,
    public peopleStore: PeopleListStoreService,
  ) {}

  ngOnInit(): void {
    this.isMobile = this.appStore.isMobile;
    this.titleService.setTitle('Popular People');
  }

  onPageChange(change: PaginatorState): void {
    this.peopleStore.updatePage(change.page! + 1);
    this.router.navigate(['/people'], {
      queryParams: { page: change.page! + 1 },
    });
    this.scroller.scrollToPosition([0, 0]);
  }
}
