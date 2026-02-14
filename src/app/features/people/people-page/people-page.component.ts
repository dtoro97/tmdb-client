import { PaginatorModule, PaginatorState } from 'primeng/paginator';

import { AsyncPipe, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { GlobalStore } from '../../../core/global.store';
import { PeopleListStoreService } from '../people-store.service';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-people-page',
  imports: [PaginatorModule, AsyncPipe, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './people-page.component.html',
  styleUrl: './people-page.component.scss',
})
export class PeoplePageComponent{
  isMobile: Signal<boolean>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scroller: ViewportScroller,
    private globalStore: GlobalStore,
    private titleService: Title,
    public peopleStore: PeopleListStoreService,
  ) {
    
    this.isMobile = this.globalStore.isMobile;
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
