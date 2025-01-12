import { Component, Input, OnInit } from '@angular/core';
import { SessionQuery } from '../../state/session.query';
import { Observable } from 'rxjs';
import { IPerson } from '../../interfaces';

@Component({
  selector: 'app-actor-card',
  standalone: false,

  templateUrl: './actor-card.component.html',
  styleUrl: './actor-card.component.scss',
})
export class ActorCardComponent implements OnInit {
  @Input() actor: IPerson;
  isMobile$: Observable<boolean>;

  constructor(private sessionQuery: SessionQuery) {}

  ngOnInit(): void {
    this.isMobile$ = this.sessionQuery.isMobile$;
  }
}
