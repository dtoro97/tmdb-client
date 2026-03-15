import { Routes } from '@angular/router';

import { KeywordDetailComponent } from './keyword-detail-page/keyword-detail.component';

export const keywordRoutes: Routes = [
    {
        path: ':id',
        component: KeywordDetailComponent,
    },
];
