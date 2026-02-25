import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  ExternalIds,
  Image,
  Person,
  PersonCombinedCredits,
  PersonRestControllerService,
} from '../../api';
import { combineLatest, filter, iif, map, of, tap } from 'rxjs';
import { isDefined } from '../../shared';

export interface PersonDetailStoreState {
  combinedCredits: PersonCombinedCredits | undefined;
  socialLinks: ExternalIds | undefined;
  person: Person | undefined;
  images: Image[] | undefined;
}

@Injectable()
export class PersonDetailStoreService extends ComponentStore<PersonDetailStoreState> {
  person$ = this.select((state) => state.person).pipe(filter(isDefined));
  images$ = this.select((state) => state.images);
  credits$ = this.select((state) => state.combinedCredits).pipe(
    filter(isDefined),
  );
  links$ = this.select((state) => state.socialLinks);
  hasCredits$ = this.credits$.pipe(
    map(
      (credits) =>
        (credits?.cast && credits?.cast?.length > 0) ||
        (credits?.crew && credits.crew.length > 0),
    ),
  );
  constructor(
    private personRestControllerService: PersonRestControllerService,
  ) {
    super({
      combinedCredits: undefined,
      socialLinks: undefined,
      person: undefined,
      images: undefined,
    });
  }

  getPersonDetails$(id: number) {
    const state = this.get();
    return iif(
      () => !!state.person && state.person.id === id,
      of(state),
      combineLatest([
        this.personRestControllerService
          .personDetails(id, undefined, undefined, undefined, undefined, {
            httpHeaderAccept: 'application/json',
          })
          .pipe(tap((person) => this.updateDetails(person))),
        this.personRestControllerService
          .personCombinedCredits(String(id), undefined, undefined, undefined, {
            httpHeaderAccept: 'application/json',
          })
          .pipe(
            tap((combinedCredits) =>
              this.updateCombinedCredits(combinedCredits),
            ),
          ),
        this.personRestControllerService
          .personExternalIds(id, undefined, undefined, {
            httpHeaderAccept: 'application/json',
          })
          .pipe(tap((socialLinks) => this.updateSocialLinks(socialLinks))),
        this.personRestControllerService
          .personImages(id, undefined, undefined, {
            httpHeaderAccept: 'application/json',
          })
          .pipe(tap((images) => this.updateImages(images.profiles!))),
      ]),
    );
  }

  updateCombinedCredits(combinedCredits: PersonCombinedCredits) {
    this.patchState({ combinedCredits });
  }

  updateSocialLinks(socialLinks: ExternalIds) {
    this.patchState({ socialLinks });
  }

  updateDetails(person: Person) {
    this.patchState({ person });
  }

  updateImages(images: Image[]) {
    this.patchState({ images });
  }
}
