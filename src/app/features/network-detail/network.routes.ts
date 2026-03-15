import { Routes } from '@angular/router';

import { NetworkDetailComponent } from './network-detail-page/network-detail.component';

export const networkRoutes: Routes = [
    {
        path: ':id',
        component: NetworkDetailComponent,
    },
];
