import { Routes } from '@angular/router';

import { CollectionDetailComponent } from './collection-detail-page/collection-detail.component';
import { CollectionStoreService } from './collection-store.service';

export const collectionRoutes: Routes = [
    {
        path: ':collectionId',
        component: CollectionDetailComponent,
        providers: [CollectionStoreService],
    },
];
