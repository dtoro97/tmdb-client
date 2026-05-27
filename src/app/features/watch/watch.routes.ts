import { Routes } from '@angular/router';

import { StreamingHubPageComponent } from './streaming-hub/streaming-hub-page.component';
import { StreamingListPageComponent } from './streaming-list/streaming-list-page.component';

export const watchRoutes: Routes = [
    {
        path: 'streaming',
        component: StreamingHubPageComponent,
        title: "What's on TV & Streaming",
    },
    {
        path: 'streaming/provider/:providerId',
        component: StreamingListPageComponent,
        data: { streamingListKind: 'provider' },
        title: 'Streaming Provider',
    },
    {
        path: 'streaming/list/:listSlug',
        component: StreamingListPageComponent,
        data: { streamingListKind: 'editorial' },
        title: 'Streaming List',
    },
];
