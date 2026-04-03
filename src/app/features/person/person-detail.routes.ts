import { Routes } from '@angular/router';
import { PersonDetailsComponent } from './person-detail-page/person-details.component';
import { PersonPhotosPageComponent } from './photos-page/person-photos-page.component';
import { PersonDetailWrapperComponent } from './person-detail-wrapper.component';

export const personDetailRoutes: Routes = [
    {
        path: ':personId',
        component: PersonDetailWrapperComponent,
        children: [
            {
                path: '',
                component: PersonDetailsComponent,
            },
            {
                path: 'photos',
                component: PersonPhotosPageComponent,
            },
        ],
    },
];
